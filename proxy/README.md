# BackWords Proxy

A lightweight FastAPI server that serves mock word-history interpretation responses from seed JSON files. Designed for local iOS development — no real AI provider is called.

## Setup

```bash
cd proxy
python3 -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -e .
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

The server starts at http://localhost:8000.

## Endpoints

### GET /health
```bash
curl http://localhost:8000/health
# {"status":"ok","version":"mock-seed-v1","seedCount":6}
```

### POST /interpret
```bash
curl -X POST http://localhost:8000/interpret \
  -H "Content-Type: application/json" \
  -d '{"query": "silly", "mode": "word"}'
```

With a specific date:
```bash
curl -X POST http://localhost:8000/interpret \
  -H "Content-Type: application/json" \
  -d '{"query": "silly", "mode": "word", "selectedDate": "0900-01-01"}'
```

### POST /explain-source
```bash
curl -X POST http://localhost:8000/explain-source \
  -H "Content-Type: application/json" \
  -d '{"sourceId": "oed_silly_1", "query": "silly", "snapshotId": "silly_old_english"}'
```

## Data Directory

Seed files live in `../data/seed/*.json`. Page files live in `../data/pages/*.json`.

Set `DATA_DIR` environment variable to override:

```bash
DATA_DIR=/custom/path uvicorn app.main:app --reload --port 8000
```

## Adding a Real AI Provider

See the comments marked `# TODO: real provider` in `app/mock_engine.py`. Replace the seed-lookup logic with a call to your chosen LLM API and return a properly structured `InterpretationResult`.
