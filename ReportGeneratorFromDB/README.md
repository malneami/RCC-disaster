# Report Generator from DB

A database report generator using FastAPI REST API and OpenAI (via NVIDIA API).

## features
- Natural language to SQL generation
- Interactive data preview
- Automated report generation
- REST API-based interface

## Prerequisites
- Python 3.9+
- PostgreSQL database
- NVIDIA API Key (or OpenAI compatible API key)

## Setup

1. **Clone the repository** (if not already done)
   ```bash
   git clone <repository-url>
   cd ReportGeneratorFromDB
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Configuration**
   Create a `.env` file in the root directory with the following variables:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=your_db_name
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password

   # AI Model Configuration
   NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
   NVIDIA_API_KEY=your_api_key_here
   NVIDIA_MODEL=meta/llama-3.1-405b-instruct
   ```

## Running the Server

Start the application using `uvicorn`:

```bash
uvicorn server:app --reload
```

The server will start at `http://127.0.0.1:8000`.

## Usage

1. Open your browser and navigate to `http://127.0.0.1:8000`.
2. Wait for the "Ready" status indicator (the server will initialize automatically).
3. Type your question about the database in the input box (e.g., "Show me the latest stroke cases").
4. Click "Send" or press Enter.
5. The system will:
   - Generate the appropriate SQL query.
   - Execute the query against your local database.
   - Show a preview of the data.
   - Generate a textual report summarizing the findings.

## API Endpoints

- `GET /api/initialize` - Initialize the retriever system
- `POST /api/generate-report` - Generate a report from a natural language prompt
  - Request body: `{"prompt": "your question here"}`
  - Response: JSON with `sql`, `data`, `report`, `total_rows`, `preview_rows`
- `GET /api/health` - Health check endpoint

## Troubleshooting

- **Connection Error**: Ensure your PostgreSQL server is running and the credentials in `.env` are correct.
- **API Error**: Verify your `NVIDIA_API_KEY` and ensure you have access to the specified model.
- **NaT Error**: If you encounter JSON serialization errors, ensure you have the latest version of `main.py` which handles date serialization correctly.
