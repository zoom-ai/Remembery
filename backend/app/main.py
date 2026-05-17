from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app import models
from app.database import engine
from app.routers import memories

# Automatically create database tables on startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Remembery API",
    description="Backend API for Remembery, a beautiful full-stack digital memory box application",
    version="1.0.0"
)

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
app.include_router(memories.router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app": "Remembery API",
        "docs_url": "/docs"
    }
