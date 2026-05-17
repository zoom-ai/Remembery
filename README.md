# Remembery 🌌
### *The Eternal Digital Library of Human Legacies*

<p align="center">
  <img src="frontend/src/assets/react.svg" alt="Remembery Logo" width="120" style="margin-bottom: 20px;" />
</p>

---

## ✨ 1. Project Concept & Vision

> *"모든 인간의 삶은 하나의 거대한 도서관과 같다. 그 도서관이 먼지 속에 잊히지 않도록, 영원히 흐르는 등불을 밝히는 곳."*

### 🌿 어원: Remember(기억하다) + Library(도서관)
**Remembery**는 **기억(Remember)**과 **도서관(Library)**을 융합하여 탄생한 단어로, **'인간의 삶과 유산을 보관하는 영원한 디지털 도서관'**을 뜻합니다. 

우리는 사람이 세상을 떠나면 그가 가졌던 방대한 지식, 삶의 지혜, 그리고 사랑하는 이들에게 남기고 싶었던 사소하지만 소중한 기록들이 함께 사라지는 비극을 목도합니다. 

**Remembery는 이 지점에서 출발합니다.**
- **생전(Alive)**에는 자신이 치열하게 일구어낸 소중한 지식, 예술적 결과물, 일상의 기록들을 타인과 평화롭게 공유하는 지적·감성적 공간이 됩니다.
- **사후(Legacy)**에는 그 기록들이 먼지 속에 묻히지 않고, 남겨진 가족과 사회, 그리고 다음 세대에게 끊임없이 영감을 주는 **'살아 숨 쉬는 기념비(Living Monument)'**이자 디지털 도서관으로 영원히 남게 됩니다.

Remembery는 단순한 데이터 저장소를 넘어, 한 사람의 인생이라는 소중한 책을 보관하고 후세가 언제든 찾아와 그 온기를 느낄 수 있는 **세대를 잇는 따뜻한 기술적 다리**입니다.

---

## 🚀 2. Key Features (핵심 기능)

Remembery는 소중한 추억과 지식을 다각도로 보존하고 복원하기 위한 세 가지 핵심 혁신 기술을 지향합니다.

### 📂 ① High-Fidelity Digital Archiving (고정밀 디지털 아카이빙)
- 텍스트 저널, 이미지, 음성 파일, 도서 및 역사적 문서 등을 직관적으로 보존합니다.
- 메타데이터(날짜, 태그, 카테고리) 기반의 체계적인 관리를 통해 누구나 쉽게 추억의 조각을 찾을 수 있습니다.
- 현대적이고 감성적인 글래스모피즘(Glassmorphism) 웹 대시보드로 기억의 격을 높입니다.

### 🤖 ② AI Docent RAG Q&A (AI 도슨트 RAG 질의응답)
- 아카이빙된 고인의 편지, 일기장, 기록물 데이터를 벡터 데이터베이스(Vector DB)에 구조화합니다.
- **Retrieval-Augmented Generation (RAG)** 엔진을 기반으로, 후세가 고인의 사상이나 삶에 관해 질문하면 고인이 작성했던 실제 기록에 근거하여 대답해 주는 감동적인 **'인공지능 도슨트 대화'** 환경을 제공합니다.

### 🏛️ ③ AI Auto-Curated Exhibition (AI 자동 큐레이션 온라인 전시회)
- 입력된 삶의 이력과 하이라이트 데이터를 AI가 스스로 연대별, 테마별로 재구성합니다.
- 마치 오프라인 미술관을 걷는 듯한 감성적이고 몰입감 넘치는 가상 연대기 타임라인 전시 공간을 웹상에 자동으로 디자인하고 퍼블리싱합니다.

---

## 🛠️ 3. Tech Stack (기술 스택)

보존의 지속성과 현대적인 성능을 모두 확보하기 위해 검증된 최첨단 풀스택 기술들을 결합하여 구축되었습니다.

### 🎨 Frontend
- **Framework**: `React 19` + `TypeScript` + `Vite` (고성능 HMR 지원)
- **Styling**: `Tailwind CSS v4` (CSS-first 컴파일러 기반의 세련되고 유연한 디자인 엔진)
- **Icons**: `Lucide React` (정밀하고 우아한 벡터 아이콘 세트)

### ⚙️ Backend & Database
- **Framework**: `FastAPI` (Asynchronous ASGI 기반 초고속 Python 웹 프레임워크)
- **ORM**: `SQLAlchemy 2.0` (강력하고 객체지향적인 선언적 데이터베이스 설계)
- **Database**: `SQLite` (로컬 프로토타입 및 이식성을 극대화한 파일 기반 내장형 RDBMS)
- **Validation**: `Pydantic v2` (형변환 및 타입 세이프티 보장 데이터 모델 검증)

### 🧠 AI Components (Conceptual)
- **RAG Framework**: `Gemini API` & `LlamaIndex` / `LangChain` 활용 예정
- **Vector DB**: `ChromaDB` / `FAISS` 기반의 고속 의미론적(Semantic) 기억 검색 솔루션

---

## 💻 4. System Architecture

Remembery는 프론트엔드와 백엔드가 완전히 디커플링된 구조로 설계되어 확장성과 배포 유연성이 뛰어납니다.

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

## 🏃‍♂️ 5. Getting Started (설치 및 로컬 구동)

로컬 개발 환경에서 빠르게 서비스를 셋업하고 구동하는 방법입니다.

### 🔌 1) Backend Server 실행 (FastAPI)

1. **백엔드 폴더로 이동합니다:**
   ```bash
   cd backend
   ```

2. **가상환경을 생성하고 활성화합니다:**
   - **macOS / Linux:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
   - **Windows:**
     ```cmd
     python -m venv venv
     venv\Scripts\activate.bat
     ```

3. **필수 라이브러리들을 설치합니다:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Uvicorn 개발 서버를 구동합니다:**
   ```bash
   uvicorn app.main:app --reload
   ```

> [!TIP]
> - 백엔드는 기본적으로 **`http://127.0.0.1:8000`** 포트에서 기동합니다.
> - 서버가 실행되면 로컬 경로에 `remembery.db` SQLite 파일이 자동 생성됩니다.
> - 웹 브라우저를 열고 **`http://127.0.0.1:8000/docs`**에 접속하면 FastAPI가 자동 생성한 대화형 인터랙티브 API 문서(Swagger UI)를 확인할 수 있습니다.

---

### 🎨 2) Frontend Server 실행 (React + Vite)

1. **새로운 터미널을 열고 프론트엔드 폴더로 이동합니다:**
   ```bash
   cd frontend
   ```

2. **필수 패키지 모듈을 다운로드합니다:**
   ```bash
   npm install
   ```

3. **Vite 로컬 개발 서버를 실행합니다:**
   ```bash
   npm run dev
   ```

> [!NOTE]
> - 프론트엔드 서버는 기본적으로 **`http://localhost:5173`**에서 구동됩니다.
> - 해당 주소로 접속하면 고품격 다크 글래스모피즘 기반의 아름다운 Remembery 메모 보관소 웹 대시보드가 브라우저에 표시됩니다.

---

## 📜 6. License & Roadmap

- **License**: MIT License로 배포되는 완전한 오픈소스 프로젝트입니다.
- **Roadmap**:
  - [x] React 19 + Tailwind v4 기반 대시보드 UI 개발
  - [x] FastAPI + SQLite 기반 백엔드 CRUD 설계 및 API 연동
  - [x] 로컬 통합 환경 패키징 및 GitHub 원격 업로드 완료
  - [ ] LlamaIndex / Gemini API 연동 RAG 시스템 개발 (Q&A 봇)
  - [ ] Three.js 활용 AI 큐레이팅 기반 3D 가상 전시관 구현

---

<p align="center">
  <b>Remembery</b>는 인간이 남긴 소중한 흔적을 영원히 기억하고 계승합니다. <br />
  이 의미 깊은 여정에 여러분의 소중한 기여(Contribution)와 별(Star)을 환영합니다! ⭐
</p>
