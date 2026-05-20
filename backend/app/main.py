import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app import models
from app.database import engine
from app.routers import memories, archive, ai, exhibition, category, users, resume

# Create uploads directory if it doesn't exist
os.makedirs("uploads", exist_ok=True)

# Automatically create database tables on startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Remembery API",
    description=(
        "Backend API for Remembery — The Eternal Digital Library of Human Legacies.\n\n"
        "**Core Endpoints:**\n"
        "- `/api/archive` — Upload, search, and manage digital archive items\n"
        "- `/api/ai` — RAG-powered Q&A with the archived legacy\n"
        "- `/api/exhibition` — AI-curated online exhibition generation\n"
        "- `/api/memories` — Legacy memory board (backward compatibility)\n"
    ),
    version="2.0.0"
)

# Mount StaticFiles for uploaded materials
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# CORS Configuration for local frontend environments
origins = [
    "http://localhost:5173",      # Vite default local development URL
    "http://127.0.0.1:5173",
    "http://localhost:3000",      # React Create App default
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(archive.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(exhibition.router, prefix="/api")
app.include_router(category.router, prefix="/api")
app.include_router(memories.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(resume.router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app": "Remembery API",
        "version": "2.0.0",
        "docs_url": "/docs",
        "endpoints": {
            "archive": "/api/archive",
            "ai_query": "/api/ai/query",
            "exhibition": "/api/exhibition/curate",
            "memories": "/api/memories",
        },
    }

