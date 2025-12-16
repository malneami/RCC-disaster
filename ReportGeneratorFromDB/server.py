from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import json
import logging
import pandas as pd
from main import (
    make_engine,
    get_schema_text,
    generate_sql,
    enforce_select_only,
    run_query,
    generate_report
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Serve static files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def get():
    with open("static/index.html") as f:
        return HTMLResponse(f.read())

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    # Initialize DB connection and schema per connection (or could be global)
    try:
        await websocket.send_json({"type": "status", "message": "Connecting to database..."})
        engine = make_engine()
        schema_text = get_schema_text(engine)
        await websocket.send_json({"type": "status", "message": "Database connected. Ready for query."})
    except Exception as e:
        logger.error(f"Initialization error: {e}")
        await websocket.send_json({"type": "error", "message": f"Initialization failed: {str(e)}"})
        await websocket.close()
        return

    try:
        while True:
            data = await websocket.receive_text()
            user_prompt = data.strip()
            
            if not user_prompt:
                continue

            try:
                # 1. Generate SQL
                await websocket.send_json({"type": "status", "message": "Generating SQL..."})
                sql = generate_sql(user_prompt, schema_text)
                await websocket.send_json({"type": "sql", "content": sql})

                # 2. Run Query
                await websocket.send_json({"type": "status", "message": "Running Query..."})
                sql_safe = enforce_select_only(sql)
                df = run_query(engine, sql_safe)
                
                # Convert DF to dict for JSON serialization (handle NaNs/Dates)
                # Using 'iso' format for dates to make them JSON serializable by default in some libs, 
                # but pandas to_dict might need help with Table preview.
                # A simple way for preview is to convert to string or specific format.
                preview_data = df.head(30).to_dict(orient="records")
                # Handle potential non-serializable types (like timestamps) by converting to string if needed,
                # or relying on standard JSON encoder.
                # Simplest for this demo: convert timestamps in preview_data to strings.
                preview_data_serializable = json.loads(pd.json_normalize(preview_data).to_json(orient="records"))

                await websocket.send_json({"type": "data", "content": preview_data_serializable})

                # 3. Generate Report
                await websocket.send_json({"type": "status", "message": "Generating Report..."})
                report = generate_report(user_prompt, sql, df)
                await websocket.send_json({"type": "report", "content": report})
                
                await websocket.send_json({"type": "status", "message": "Done."})

            except Exception as e:
                logger.error(f"Processing error: {e}")
                await websocket.send_json({"type": "error", "message": str(e)})

    except WebSocketDisconnect:
        logger.info("Client disconnected")
