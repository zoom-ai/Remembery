# Remembery 🌌
### *The Eternal Digital Library of Human Legacies*

<p align="center">
  <img src="frontend/src/assets/react.svg" alt="Remembery Logo" width="120" style="margin-bottom: 20px;" />
</p>

<p align="center">
  🌐 <b>Read this in:</b> <a href="README.ko.md"><b>한국어 (Korean)</b></a>
</p>

---

## ✨ 1. Project Concept & Vision

> *"Every human life is like a massive, unique library. We illuminate a guiding light so that this library never fades into dust."*

### 🌿 Etymology: Remember + Library
**Remembery** is a portmanteau of **Remember** and **Library**, embodying the concept of **'The Eternal Digital Library of Human Legacies'**. 

When a person passes away, a quiet tragedy unfolds: the vast accumulation of their specialized knowledge, the wisdom carved from their life experiences, and the small yet invaluable memories they hoped to share with their loved ones vanish into thin air.

**Remembery changes this paradigm:**
- **Alive**: It serves as an intellectual and emotional sanctuary where individuals peacefully share their valuable knowledge, artistic creations, and daily journals with others during their lifetime.
- **Legacy**: After they pass, their records do not gather dust in folders. Instead, they remain eternally as a **'Living Monument'** and a digital library, inspiring their family, community, and the generations to come.

Remembery transcends a mere database; it is a **warm technological bridge between generations**, safeguarding the book of a human life so that posterity can always return to it and feel its warmth.

---

## 🚀 2. Key Features

Remembery aims to preserve, curate, and pass down human legacies through three core pillars of technology.

### 📂 ① High-Fidelity Digital Archiving
- Preserves text journals, high-resolution images, voice notes, documents, and historical tokens in an intuitive format.
- Uses metadata-driven management (dates, tags, categories) to allow visitors to search and find memory fragments effortlessly.
- Built on a modern and emotional Glassmorphic web dashboard to elevate the dignity of memories.

### 🤖 ② AI Docent RAG Q&A
- Indexes archived memories (letters, journals, diaries, books) into a structured Vector Database.
- Leverages a **Retrieval-Augmented Generation (RAG)** engine, allowing descendants to "talk" with the individual’s compiled wisdom. The AI answers questions using only actual, verified records written by the individual.

### 🏛️ ③ AI Auto-Curated Exhibition Hall
- The AI engine reads life highlights and timeline records to dynamically curate a biographical outline.
- Automatically generates and publishes an immersive virtual timeline museum online, allowing visitors to walk through the individual's milestones and wisdom as if walking through an art gallery.

---

## 🛠️ 3. Tech Stack

Selected to ensure long-term preservation capability, extreme performance, and portability.

### 🎨 Frontend
- **Framework**: `React 19` + `TypeScript` + `Vite` (Ultra-fast Hot Module Replacement)
- **Styling**: `Tailwind CSS v4` (CSS-first engine for beautiful, fluid styling out-of-the-box)
- **Icons**: `Lucide React` (Clean, precise, vector icon system)

### ⚙️ Backend & Database
- **Framework**: `FastAPI` (ASGI-based asynchronous high-performance Python framework)
- **ORM**: `SQLAlchemy 2.0` (Robust, object-oriented declarative database schema mapper)
- **Database**: `SQLite` (In-process, zero-config relational database for high portability and local ease)
- **Validation**: `Pydantic v2` (Strict type-safety and JSON parsing)

### 🧠 AI Components (Conceptual Roadmap)
- **RAG Engine**: `Gemini API` & `LlamaIndex` / `LangChain` integration
- **Vector Storage**: `ChromaDB` / `FAISS` for semantic memory retrieval

---

## 💻 4. System Architecture

Remembery is built with a strictly decoupled frontend-backend architecture:

```text
                                  +---------------------------------------+
                                  |            CLIENT BROWSER             |
                                  |   (React 19 + Tailwind CSS v4 SPA)    |
                                  +-------------------+-------------------+
                                                      |
                                           HTTPS      | Fetch APIs
                                    (JSON Payload)    | (Port 8000)
                                                      v
                                  +-------------------+-------------------+
                                  |          FASTAPI BACKEND SYSTEM       |
                                  |   (ASGI / CORSMiddleware Allowed)     |
                                  +---------+-------------------+---------+
                                            |                   |
                                            |                   |
                                     SQLAlchemy ORM             | Semantic RAG Search
                                     (Local Queries)            | (Conceptual)
                                            |                   |
                                            v                   v
                                  +---------+-------+   +-------+---------+
                                  | SQLite Database |   |   Gemini /      |
                                  | (remembery.db)  |   | Vector Database |
                                  +-----------------+   +-----------------+
```

---

## 🏃‍♂️ 5. Getting Started

Follow these steps to spin up both the backend API and frontend SPA locally.

### 🔌 1) Backend API Setup (FastAPI)

1. **Navigate to the backend folder**:
   ```bash
   cd backend
   ```

2. **Create and activate a Python virtual environment**:
   - **macOS / Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
   - **Windows**:
     ```cmd
     python -m venv venv
     venv\Scripts\activate.bat
     ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Launch the development server**:
   ```bash
   uvicorn app.main:app --reload
   ```

> [!TIP]
> - The API server starts on **`http://127.0.0.1:8000`**.
> - The `remembery.db` SQLite file is automatically generated inside the `backend/` folder on startup.
> - Access the live interactive API documentation (Swagger UI) at **`http://127.0.0.1:8000/docs`**.

---

### 🎨 2) Frontend SPA Setup (React + Vite)

1. **Open a new terminal and navigate to the frontend folder**:
   ```bash
   cd frontend
   ```

2. **Install Node packages**:
   ```bash
   npm install
   ```

3. **Launch the Vite dev server**:
   ```bash
   npm run dev
   ```

> [!NOTE]
> - The dev server will launch at **`http://localhost:5173`**.
> - Open the URL to view the dark glassmorphic Remembery dashboard.

---

## 📜 6. License & Roadmap

- **License**: MIT License - Free for open-source contributions.
- **Roadmap**:
  - [x] React 19 + Tailwind v4 Responsive Glassmorphism Dashboard
  - [x] FastAPI + SQLAlchemy + SQLite Boilerplate
  - [x] GitHub repository setup and initial push
  - [ ] Gemini API / LlamaIndex Vector Integration for AI Docent
  - [ ] Three.js web-based AI-curated 3D museum walkthroughs

---

<p align="center">
  <b>Remembery</b> honors and preserves the unique footsteps of human lives. <br />
  Your stars, issues, and contributions are warmly welcome! ⭐
</p>
