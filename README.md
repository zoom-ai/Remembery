# Remembery 🌌
### *The Eternal Digital Library of Human Legacies*

<p align="center">
  <img src="frontend/src/assets/react.svg" alt="Remembery Logo" width="120" style="margin-bottom: 20px;" />
</p>

<p align="center">
  🌐 <b>Read this in:</b> <a href="README.ko.md"><b>한국어 (Korean)</b></a>
</p>

---

## 💡 1. Why Remembery? (Market Limitations & Our Solution)

> *"Every human life is like a massive, unique library. We illuminate a guiding light so that this library never fades into dust."*

### 🌪️ The Problem
Current digital memorial services and personal note-taking apps have distinct limitations in the market:
- **Limitations of Memorial Services:** While they focus on honoring the deceased, they severely lack technical depth (e.g., knowledge search, complex media organization, AI integration), often remaining at the level of simply listing text and photos.
- **Limitations of Knowledge Management Tools:** Tools like Notion and Obsidian excel at knowledge management, but they lack the emotional approach (commemoration, exhibition, intergenerational connection), making them too dry and sterile to serve as a 'digital memorial' for someone's life.

### 🌟 Our Solution
**Remembery** shatters the limitations of both domains and presents a new paradigm.
Our vision is **"The perfect fusion of a rational knowledge archive and an emotional digital memorial."**
During one's lifetime, it functions as the most elegant and powerful knowledge management platform; after passing, it transitions seamlessly into the warmest and most eternal digital memorial.

---

## 🚀 2. Core Differentiators

Remembery goes beyond a simple note-taking app, offering unique features combining AI with emotional UI/UX.

- 🤖 **True RAG-Based AI Docent**  
  > When a visitor asks a question, the AI answers in the protagonist's tone and manner, strictly based **only on the documents/books/records** they left behind. It provides an intelligent exploration experience that feels like having an intellectual conversation with the deceased, going far beyond simple keyword searches.

- 🏛️ **AI Auto-Curated Exhibition Hall**  
  > We break away from simple folder structures. The AI automatically curates materials by specific themes or years, generating a beautiful **online media exhibition**. Visitors can walk through the gallery of the protagonist's life milestones.

- ⏳ **Seamless Alive-to-Legacy Continuity**  
  > **Alive:** Used as a sophisticated 'portfolio and internal library' to visually beautifully organize and share personal experiences and knowledge.  
  > **Legacy:** Without any extra migration work, the entire archive naturally transitions into a 'digital monument' that connects generations, boasting perfect continuity.

- 📚 **Custom Internal Library**  
  > You are not bound by fixed templates. In addition to default media, Remembery provides the flexibility for users to build and freely expand their own **custom categories** (e.g., research papers, family letters, project logs, recipes).

---

## 🛠️ 3. Tech Stack

Selected to ensure long-term preservation capability, extreme performance, and portability.

### 🎨 Frontend
- **Framework**: `React 19` + `TypeScript` + `Vite` (Ultra-fast HMR)
- **Styling**: `Tailwind CSS v4` (CSS-first engine for beautiful, fluid styling)
- **Icons**: `Lucide React` (Clean, precise, vector icon system)

### ⚙️ Backend & Database
- **Framework**: `FastAPI` (ASGI-based asynchronous high-performance Python framework)
- **ORM**: `SQLAlchemy 2.0` (Robust, object-oriented declarative database schema mapper)
- **Database**: `SQLite` (In-process, zero-config relational database for high portability)
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
  - [x] Onboarding & Dynamic Legacy Profile Expansion
  - [x] Archive Item Rich Previews (AI Summary, Quotes)
  - [ ] AI Docent (RAG) Q&A integration
  - [ ] AI Auto-Curated Exhibition Hall (Virtual 3D Layouts)

---

<p align="center">
  <b>Remembery</b> honors and preserves the unique footsteps of human lives. <br />
  Your stars, issues, and contributions are warmly welcome! ⭐
</p>
