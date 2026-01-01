from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import json
import logging
import pandas as pd
from sentence_transformers import SentenceTransformer
from main import (
    make_engine,
    get_schema_text,
    get_sample_data,
    generate_sql,
    enforce_select_only,
    run_query,
    generate_report,
    repair_sql,
    MAX_REPAIR_ATTEMPTS
)
from embed_retrieve import (
    build_schema_catalog_from_schema_text,
    build_faiss_index,
    retrieve_relevant_tables,
    EMBED_MODEL_NAME
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="Report Generator API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def get():
    with open("static/index.html") as f:
        return HTMLResponse(f.read())

# =========================================================
# Global state for retriever (initialized on first use)
# =========================================================
_retriever_state = {
    "engine": None,
    "schema_text": None,
    "catalog_df": None,
    "schema_index": None,
    "embedder": None,
    "initialized": False
}


def initialize_retriever():
    """Initialize the embedding model and FAISS index once."""
    if _retriever_state["initialized"]:
        return True
    
    try:
        logger.info("Initializing retriever...")
        engine = make_engine()
        schema_text = get_schema_text(engine)
        
        logger.info("Building schema catalog...")
        catalog_df = build_schema_catalog_from_schema_text(schema_text)
        
        logger.info("Loading embedding model...")
        embedder = SentenceTransformer(EMBED_MODEL_NAME)
        
        logger.info("Building FAISS index...")
        schema_index, _ = build_faiss_index(catalog_df["table_text"].tolist(), embedder)
        
        _retriever_state["engine"] = engine
        _retriever_state["schema_text"] = schema_text
        _retriever_state["catalog_df"] = catalog_df
        _retriever_state["schema_index"] = schema_index
        _retriever_state["embedder"] = embedder
        _retriever_state["initialized"] = True
        
        logger.info("Retriever initialized successfully.")
        return True
    except Exception as e:
        logger.error(f"Failed to initialize retriever: {e}")
        return False


# =========================================================
# Pydantic Models for Request/Response
# =========================================================
class PromptRequest(BaseModel):
    prompt: str


class StatusResponse(BaseModel):
    status: str
    message: str


class InitializeResponse(BaseModel):
    success: bool
    message: str


class ReportResponse(BaseModel):
    success: bool
    sql: str
    data: List[Dict[str, Any]]
    report: str
    total_rows: int
    preview_rows: int
    error: Optional[str] = None


# =========================================================
# API Endpoints
# =========================================================

@app.get("/api/initialize", response_model=InitializeResponse)
async def initialize():
    """Initialize the retriever system."""
    try:
        if not _retriever_state["initialized"]:
            success = initialize_retriever()
            if not success:
                raise HTTPException(status_code=500, detail="Failed to initialize retriever")
        
        return InitializeResponse(
            success=True,
            message="Database connected. Ready for query."
        )
    except Exception as e:
        logger.error(f"Initialization error: {e}")
        raise HTTPException(status_code=500, detail=f"Initialization failed: {str(e)}")


@app.post("/api/generate-report", response_model=ReportResponse)
async def generate_report_endpoint(request: PromptRequest):
    """
    Handle user prompts with retrieval and auto-repair.
    Returns SQL, data preview, and generated report.
    """
    user_text = request.prompt.strip()
    
    if not user_text:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    try:
        # Ensure retriever is initialized
        if not _retriever_state["initialized"]:
            success = initialize_retriever()
            if not success:
                raise HTTPException(status_code=500, detail="Server not initialized. Please initialize first.")

        engine = _retriever_state["engine"]
        catalog_df = _retriever_state["catalog_df"]
        schema_index = _retriever_state["schema_index"]
        embedder = _retriever_state["embedder"]

        # 1. Retrieve relevant tables
        logger.info(f"Retrieving tables for: {user_text[:50]}...")
        relevant_tables = retrieve_relevant_tables(user_text, catalog_df, schema_index, embedder)
        
        # Extract table names for sample data fetching
        table_lines = [line.strip() for line in relevant_tables.strip().split('\n') if line.strip()]
        
        # Fetch sample data
        logger.info(f"Fetching sample data from {len(table_lines)} tables")
        sample_data = get_sample_data(engine, table_lines)

        # 2. Generate SQL
        logger.info("Generating SQL...")
        sql = generate_sql(user_text, relevant_tables, sample_data)
        sql_safe = enforce_select_only(sql)

        # 3. Run Query with auto-repair loop
        logger.info("Running query...")
        df = None
        last_error = None
        final_sql = sql_safe
        
        for attempt in range(MAX_REPAIR_ATTEMPTS + 1):
            try:
                df = run_query(engine, sql_safe)
                break  # Success
            except Exception as db_error:
                last_error = db_error
                error_str = str(db_error)
                
                # Check if it's a repairable error
                if any(keyword in error_str.lower() for keyword in ['undefined', 'column', 'does not exist', 'relation']):
                    if attempt < MAX_REPAIR_ATTEMPTS:
                        logger.warning(f"Repair attempt {attempt + 1}: {error_str}")
                        
                        # Repair the SQL
                        repaired_sql = repair_sql(sql_safe, error_str, relevant_tables)
                        sql_safe = enforce_select_only(repaired_sql)
                        final_sql = sql_safe
                    else:
                        logger.error(f"Repair failed after {MAX_REPAIR_ATTEMPTS} attempts")
                        raise last_error
                else:
                    # Non-repairable error
                    raise db_error
        
        if df is None:
            raise last_error or Exception("Query execution failed")
        
        # Convert DF to JSON for transport
        total_rows = len(df)
        preview_rows = min(total_rows, 30)
        preview_data = json.loads(df.head(preview_rows).to_json(orient="records", date_format="iso"))

        # 4. Generate Report
        logger.info("Generating report...")
        report = generate_report(user_text, final_sql, df)
        
        logger.info("Report generation completed successfully")
        
        return ReportResponse(
            success=True,
            sql=final_sql,
            data=preview_data,
            report=report,
            total_rows=total_rows,
            preview_rows=preview_rows
        )

    except Exception as e:
        logger.error(f"Processing error: {e}")
        return ReportResponse(
            success=False,
            sql="",
            data=[],
            report="",
            total_rows=0,
            preview_rows=0,
            error=str(e)
        )


@app.get("/api/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "initialized": _retriever_state["initialized"]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
