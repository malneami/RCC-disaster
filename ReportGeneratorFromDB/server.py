from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import socketio
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

# Create a Socket.IO server (async mode for ASGI)
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

# Create FastAPI app
app = FastAPI()

# Wrap FastAPI app with Socket.IO ASGI app
# This makes the socket.io endpoint available at /socket.io/
app = socketio.ASGIApp(sio, app)

# Serve static files
# Note: In production or complex setups, you might serve these via nginx or similar.
# When wrapping with ASGIApp, we can attach the static mount to the internal FastAPI app 
# but incoming requests hit the ASGIApp first.
# Access static files via http://host:port/static/...

# We need to access the inner FastAPI app to mount static files if we want them served 
# along with the socketio endpoint on the same port easily. 
# The `app` variable is now the socketio.ASGIApp. 
# The original FastAPI app is `app.other_ASGI_app` (or passed in constructor).
# However, a cleaner pattern often used is:
# app = FastAPI()
# sio_app = socketio.ASGIApp(sio, app)
# code: uvicorn server:sio_app
# But to keep 'uvicorn server:app' working as the entry point, we assign `app = socketio.ASGIApp(sio, fast_api_app)`

fast_api_app = FastAPI()
fast_api_app.mount("/static", StaticFiles(directory="static"), name="static")

@fast_api_app.get("/")
async def get():
    with open("static/index.html") as f:
        return HTMLResponse(f.read())

app = socketio.ASGIApp(sio, fast_api_app)


@sio.event
async def connect(sid, environ):
    logger.info(f"Client connected: {sid}")
    await sio.emit('status', {'message': 'Connecting to database...'}, room=sid)
    try:
        # Pre-check database connection
        engine = make_engine()
        # Just getting schema to verify connection
        get_schema_text(engine) 
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
    Handle incoming user prompts.
    Expects 'data' to be a string or a dict with 'prompt' key.
    """
    user_text = data if isinstance(data, str) else data.get('prompt', '')
    user_text = user_text.strip()
    
    if not user_text:
        return

    try:
        # Re-initialize engine/schema here or cache it. 
        # For simplicity/robustness, we make it fresh or simple cache.
        engine = make_engine()
        schema_text = get_schema_text(engine)

        # 1. Generate SQL
        await sio.emit('status', {'message': 'Generating SQL...'}, room=sid)
        sql = generate_sql(user_text, schema_text)
        await sio.emit('sql', {'content': sql}, room=sid)

        # 2. Run Query
        await sio.emit('status', {'message': 'Running Query...'}, room=sid)
        sql_safe = enforce_select_only(sql)
        df = run_query(engine, sql_safe)
        
        # Convert DF to dict/json for transport
        preview_rows = min(len(df), 30)
        # Using the same fix we applied in main.py for NaT/Dates
        preview_data = json.loads(df.head(preview_rows).to_json(orient="records", date_format="iso"))
        
        await sio.emit('data', {'content': preview_data}, room=sid)

        # 3. Generate Report
        await sio.emit('status', {'message': 'Generating Report...'}, room=sid)
        report = generate_report(user_text, sql, df)
        await sio.emit('report', {'content': report}, room=sid)
        
        await sio.emit('status', {'message': 'Done.'}, room=sid)

    except Exception as e:
        logger.error(f"Processing error: {e}")
        await sio.emit('error', {'message': str(e)}, room=sid)
