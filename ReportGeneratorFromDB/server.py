from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import socketio
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

# Create a Socket.IO server (async mode for ASGI)
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

# Create FastAPI app
fast_api_app = FastAPI()
fast_api_app.mount("/static", StaticFiles(directory="static"), name="static")

@fast_api_app.get("/")
async def get():
    with open("static/index.html") as f:
        return HTMLResponse(f.read())

app = socketio.ASGIApp(sio, fast_api_app)

# =========================================================
# Global state for retriever (initialized on first connection)
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


@sio.event
async def connect(sid, environ):
    logger.info(f"Client connected: {sid}")
    await sio.emit('status', {'message': 'Connecting to database...'}, room=sid)
    
    try:
        if not _retriever_state["initialized"]:
            await sio.emit('status', {'message': 'Initializing retriever (first connection)...'}, room=sid)
            success = initialize_retriever()
            if not success:
                await sio.emit('error', {'message': 'Failed to initialize retriever'}, room=sid)
                return
        
        await sio.emit('status', {'message': 'Database connected. Ready for query.'}, room=sid)
    except Exception as e:
        logger.error(f"Initialization error: {e}")
        await sio.emit('error', {'message': f"Initialization failed: {str(e)}"}, room=sid)


@sio.event
async def disconnect(sid):
    logger.info(f"Client disconnected: {sid}")


@sio.event
async def user_prompt(sid, data):
    """
    Handle incoming user prompts with retrieval and auto-repair.
    """
    user_text = data if isinstance(data, str) else data.get('prompt', '')
    user_text = user_text.strip()
    
    if not user_text:
        return

    try:
        engine = _retriever_state["engine"]
        catalog_df = _retriever_state["catalog_df"]
        schema_index = _retriever_state["schema_index"]
        embedder = _retriever_state["embedder"]
        
        if not _retriever_state["initialized"]:
            await sio.emit('error', {'message': 'Server not initialized. Please refresh.'}, room=sid)
            return

        # 1. Retrieve relevant tables
        await sio.emit('status', {'message': 'Retrieving relevant tables...'}, room=sid)
        relevant_tables = retrieve_relevant_tables(user_text, catalog_df, schema_index, embedder)
        logger.info(f"Retrieved tables for: {user_text[:50]}...")
        
        # Extract table names for sample data fetching
        table_lines = [line.strip() for line in relevant_tables.strip().split('\n') if line.strip()]
        
        # Fetch sample data
        await sio.emit('status', {'message': 'Fetching sample data...'}, room=sid)
        sample_data = get_sample_data(engine, table_lines)
        logger.info(f"Fetched sample data from {len(table_lines)} tables")

        # 2. Generate SQL
        await sio.emit('status', {'message': 'Generating SQL...'}, room=sid)
        sql = generate_sql(user_text, relevant_tables, sample_data)
        await sio.emit('sql', {'content': sql}, room=sid)

        # 3. Run Query with auto-repair loop
        await sio.emit('status', {'message': 'Running Query...'}, room=sid)
        sql_safe = enforce_select_only(sql)
        
        df = None
        last_error = None
        
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
                        await sio.emit('status', {
                            'message': f'SQL error detected. Repair attempt {attempt + 1}/{MAX_REPAIR_ATTEMPTS}...'
                        }, room=sid)
                        logger.warning(f"Repair attempt {attempt + 1}: {error_str}")
                        
                        # Repair the SQL
                        repaired_sql = repair_sql(sql_safe, error_str, relevant_tables)
                        sql_safe = enforce_select_only(repaired_sql)
                        
                        # Update client with repaired SQL
                        await sio.emit('sql', {'content': sql_safe}, room=sid)
                    else:
                        logger.error(f"Repair failed after {MAX_REPAIR_ATTEMPTS} attempts")
                        raise last_error
                else:
                    # Non-repairable error
                    raise db_error
        
        if df is None:
            raise last_error
        
        # Convert DF to JSON for transport
        preview_rows = min(len(df), 30)
        preview_data = json.loads(df.head(preview_rows).to_json(orient="records", date_format="iso"))
        
        await sio.emit('data', {'content': preview_data}, room=sid)

        # 4. Generate Report
        await sio.emit('status', {'message': 'Generating Report...'}, room=sid)
        report = generate_report(user_text, sql_safe, df)
        await sio.emit('report', {'content': report}, room=sid)
        
        await sio.emit('status', {'message': 'Done.'}, room=sid)

    except Exception as e:
        logger.error(f"Processing error: {e}")
        await sio.emit('error', {'message': str(e)}, room=sid)
