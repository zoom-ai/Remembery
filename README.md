# Remembery 🌌

Remembery is a beautiful, premium, full-stack digital memory box application built to store and categorize moments of your life. 

This repository is split into two cleanly separated folders:
- **`frontend/`**: React + Vite + TypeScript + Tailwind CSS v4
- **`backend/`**: FastAPI + SQLAlchemy + SQLite + Pydantic v2

---

## 🏗️ Project Architecture

```text
Remembery/
├── README.md               # Unified setup guide (this file)
├── frontend/               # React (Vite) + Tailwind CSS v4 SPA
│   ├── src/
│   │   ├── App.tsx         # Premium dashboard UI with state management
│   │   ├── index.css       # Tailwind & customized glassmorphism CSS
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
└── backend/                # FastAPI + SQLAlchemy API server
    ├── app/
    │   ├── main.py         # App entrypoint, database initialization & CORS setup
    │   ├── database.py     # SQLite connection & get_db dependency
    │   ├── models.py       # SQLAlchemy ORM models (Memory)
    │   ├── schemas.py      # Pydantic validation schemas
    │   ├── crud.py         # DB query & transaction operations
    │   └── routers/        # FastAPI sub-routers (memories.py)
    └── requirements.txt
```

---

## ⚡ Quick Start (Local Run Guide)

To run this application locally, you will start the backend FastAPI server and the frontend Vite development server in parallel.

### 🔌 1. Backend Setup & Run (FastAPI)

Ensure you have **Python 3.9+** installed on your machine.

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create a virtual environment**:
   ```bash
   python3 -m venv venv
   ```

3. **Activate the virtual environment**:
   - On macOS/Linux:
     ```bash
     source venv/bin/activate
     ```
   - On Windows (CMD):
     ```cmd
     venv\Scripts\activate.bat
     ```
   - On Windows (PowerShell):
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```

4. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Start the FastAPI application**:
   ```bash
   uvicorn app.main:app --reload
   ```

> [!TIP]
> - The backend will start on **`http://127.0.0.1:8000`**.
> - FastAPI automatically generates a beautiful Swagger UI documentation portal! You can access it directly at **`http://127.0.0.1:8000/docs`** to test endpoints interactively.
> - A SQLite database file (`remembery.db`) will be automatically created inside the `backend/` folder on startup.

---

### 🎨 2. Frontend Setup & Run (React + Vite)

Ensure you have **Node.js (v18+)** and **npm** installed.

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install Node dependencies**:
   ```bash
   npm install
   ```

3. **Start the Vite development server**:
   ```bash
   npm run dev
   ```

> [!NOTE]
> - The frontend will start on **`http://localhost:5173`**.
> - Open this link in your browser to interact with the premium glassmorphic dashboard!

---

## 🔒 CORS Configuration

CORS (Cross-Origin Resource Sharing) is pre-configured inside `backend/app/main.py` using FastAPI's standard middleware:

```python
origins = [
    "http://localhost:5173",    # React (Vite) local development port
    "http://127.0.0.1:5173",
    "http://localhost:3000",    # Create React App default
    "http://127.0.0.1:3000",
]
```

This guarantees that frontend components executing in your browser can fetch, add, and delete memories securely via backend APIs without triggering browser cross-origin blocks.
