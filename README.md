# Product Horse

Product Horse is a research-to-video workflow for turning interview or call recordings into searchable transcripts and short video clips.

It combines:

- a React/Vite frontend for authentication, contacts, uploads, and video browsing
- a FastAPI + Strawberry GraphQL backend
- PostgreSQL/SQLModel storage with vector search for transcript retrieval
- AssemblyAI for transcription
- a separate GPU worker for video rendering on Fly.io

## What It Does

- creates company-scoped accounts and JWT-based sessions
- stores contacts and uploaded research assets per company
- uploads large audio and video files directly to object storage with presigned URLs
- transcribes recordings into utterances and word-level timestamps
- retrieves relevant transcript passages for a text query
- creates rendered videos from selected utterance segments
- serves the built SPA and GraphQL API from the same backend app

## Architecture

- `frontend/`: React + TypeScript + Vite client
- `product_horse/graphql.py`: FastAPI app, Strawberry schema, auth, upload, transcription, and video mutations
- `product_horse/db.py`: SQLModel models and database access layer
- `product_horse/audio.py`: AssemblyAI upload and transcription integration
- `product_horse/search.py`: transcript chunking, embeddings, retrieval, and pgvector integration
- `product_horse/run_modal.py`: render worker API used by the GPU service
- `gpu_app/`: Fly.io GPU deployment and FFmpeg/NVIDIA runtime image
- `db/` and `sql_files/`: schema, migrations, and database setup helpers
- `nbs/`: nbdev notebooks that generate parts of the Python package and docs

## Current State

Product Horse is an active work-in-progress. The upload, transcription, storage, and render pipeline are wired into the backend, and the frontend covers authentication, contacts, uploads, and video browsing. The repository also includes some experimental UI and notebook-driven development artifacts, especially around transcript search and clip editing.

## Local Development

### Prerequisites

- Python 3.10.12+
- Node.js 18.18+
- `rye`
- PostgreSQL
- object storage credentials compatible with the current S3/Tigris setup
- an AssemblyAI API key

### Install

```bash
rye sync
npm install --prefix frontend
```

### Environment

The repo keeps encrypted `.env.local`, `.env.ci`, and `.env.production` files in git. Those files require external `dotenvx` private keys that are intentionally not committed.

At minimum, the backend expects:

- `DATABASE_URL`
- `DATABASE_SUPERUSER_URL`
- `SECRET`
- `ASSEMBLYAI_API_KEY`
- `FLY_BUCKET_NAME`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

The frontend can optionally use:

- `VITE_API_URL` (defaults to `http://127.0.0.1:8000/graphql`)

### Run Locally

Start the API server:

```bash
dotenvx run -f .env.local -- rye run dev
```

Start the frontend:

```bash
dotenvx run -f .env.local -- npm run dev --prefix frontend
```

By default:

- frontend: `http://localhost:5173`
- GraphQL API: `http://127.0.0.1:8000/graphql`

### Build

```bash
dotenvx run -f .env.production -- npm run build --prefix frontend
hatch build
```

## Deployment

The project is split into two Fly.io apps:

- `fly.toml` deploys the main FastAPI + frontend app
- `gpu_app/fly.toml` deploys the GPU-backed render worker

The main deploy flow in `deploy.sh`:

1. syncs Python dependencies
2. builds the frontend
3. exports nbdev notebooks
4. builds Python artifacts
5. deploys the main app and GPU app

## Security Notes

- Checked-in env files are encrypted `dotenvx` payloads, not plaintext secrets.
- Decryption keys are intentionally not stored in the repository.
- If you fork or redeploy this project, create your own credentials and `dotenvx` keys instead of reusing old ones.

## License

Apache 2.0
