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

### 🌪️ 기존 서비스의 한계 (The Problem)
현재 시장에 존재하는 디지털 추모 서비스와 개인 메모 앱들은 뚜렷한 한계를 가지고 있습니다.
- **감성적 추모 서비스의 한계:** 고인을 기리는 데 집중하지만, 기술적 깊이(지식 검색, 복합 미디어 정리, AI 연동 등)가 현저히 부족하여 단순 텍스트와 사진을 나열하는 수준에 머뭅니다.
- **이성적 지식 관리 툴의 한계:** Notion, Obsidian 같은 툴은 지식 관리에 탁월하지만, 감성적 접근(기념, 전시, 세대 간 연결, 추모의 공간)이 결여되어 있어 누군가의 삶을 기리는 '디지털 기념관'으로 쓰기에는 건조합니다.

### 🌟 우리의 솔루션 (Our Solution)
**Remembery**는 이 두 가지 영역의 한계를 부수고 새로운 패러다임을 제시합니다. 
우리의 비전은 **"이성적 지식 아카이브와 감성적 디지털 기념관의 완벽한 융합"**입니다. 
생전에는 가장 우아하고 강력한 지식 관리 플랫폼으로, 사후에는 가장 따뜻하고 영구적인 디지털 기념관으로 기능합니다.

---

## 🚀 2. Core Differentiators (핵심 차별화 특징)

Remembery는 단순한 기록 앱을 넘어, AI와 감성 UI가 결합된 독보적인 기능을 제공합니다.

- 🤖 **진정한 RAG 기반 AI 도슨트**  
  > 방문자가 질문하면, 주인공이 평생 남긴 **문서/도서/기록만을 기반**으로 AI가 주인공의 톤앤매너로 답변합니다. 단순 검색을 넘어 고인과 지적인 대화를 나누는 듯한 지능형 탐색 경험을 제공합니다.

- 🏛️ **AI 자동 큐레이션 전시회 (Exhibition Hall)**  
  > 단순한 폴더식 파일 구조를 벗어납니다. AI가 특정 테마나 연도별 자료를 엮어 한 편의 아름다운 **온라인 미디어 전시회**를 자동 생성합니다. 방문자는 갤러리를 걷듯 고인의 삶의 발자취를 감상할 수 있습니다.

- ⏳ **유연한 생전/사후 연속성**  
  > **생전(Alive):** 개인의 경험과 지식을 시각적으로 아름답게 정리하고 공유하는 품격 있는 '포트폴리오 및 내부 라이브러리'로 사용됩니다.  
  > **사후(Legacy):** 별도의 작업 없이 아카이브 전체가 자연스럽게 세대를 잇는 '디지털 기념관'으로 전환되는 완벽한 연속성을 자랑합니다.

- 📚 **사용자 정의 내부 라이브러리 (Custom Archive)**  
  > 정해진 틀에 얽매이지 않습니다. 기본 미디어 외에도 사용자가 직접 **커스텀 카테고리**(예: 연구 논문, 가족 편지, 프로젝트 기록, 레시피 등)를 빌드업하고 자유롭게 확장할 수 있는 유연성을 제공합니다.

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
  - [ ] AI Docent (RAG) Q&A integration
  - [ ] AI Auto-Curated Exhibition Hall (Virtual 3D Layouts)

---

<p align="center">
  <b>Remembery</b> honors and preserves the unique footsteps of human lives. <br />
  Your stars, issues, and contributions are warmly welcome! ⭐
</p>
