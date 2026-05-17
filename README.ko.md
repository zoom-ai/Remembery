# Remembery 🌌
### *The Eternal Digital Library of Human Legacies*

<p align="center">
  <img src="frontend/src/assets/react.svg" alt="Remembery Logo" width="120" style="margin-bottom: 20px;" />
</p>

<p align="center">
  🌐 <b>Read this in:</b> <a href="README.md"><b>English (영어)</b></a>
</p>

---

## 💡 1. Why Remembery? (기존 서비스의 한계와 우리의 솔루션)

> *"모든 인간의 삶은 하나의 거대한 도서관과 같다. 그 도서관이 먼지 속에 잊히지 않도록, 영원히 흐르는 등불을 밝히는 곳."*

### 🌪️ 기존 서비스의 한계
현재 시장에 존재하는 디지털 추모 서비스와 개인 메모 앱들은 뚜렷한 한계를 가지고 있습니다.
- **감성적 추모 서비스의 한계:** 고인을 기리는 데 집중하지만, 기술적 깊이(지식 검색, 복합 미디어 정리, AI 연동 등)가 현저히 부족하여 단순 텍스트와 사진을 나열하는 수준에 머뭅니다.
- **이성적 지식 관리 툴의 한계:** Notion, Obsidian 같은 툴은 지식 관리에 탁월하지만, 감성적 접근(기념, 전시, 세대 간 연결, 추모의 공간)이 결여되어 있어 누군가의 삶을 기리는 '디지털 기념관'으로 쓰기에는 건조합니다.

### 🌟 우리의 솔루션
**Remembery**는 이 두 가지 영역의 한계를 부수고 새로운 패러다임을 제시합니다. 
우리의 비전은 **"이성적 지식 아카이브와 감성적 디지털 기념관의 완벽한 융합"**입니다. 
생전에는 가장 우아하고 강력한 지식 관리 플랫폼으로, 사후에는 가장 따뜻하고 영구적인 디지털 기념관으로 기능합니다.

---

## 🚀 2. Core Differentiators (핵심 차별화 특징)

Remembery는 단순한 기록 앱을 넘어, AI와 감성 UI가 결합된 독보적인 기능을 제공합니다.

- 🤖 **진정한 RAG 기반 AI 도슨트**  
  > 방문자가 질문하면, 주인공이 평생 남긴 **문서/도서/기록만을 기반**으로 AI가 주인공의 톤앤매너로 답변합니다. 단순 검색을 넘어 고인과 지적인 대화를 나누는 듯한 지능형 탐색 경험을 제공합니다.

- 🏛️ **AI 자동 큐레이션 전시회 (Exhibition Hall - 테마 & 레이아웃 커스텀)**  
  > 단순한 폴더식 파일 구조를 벗어납니다. AI가 특정 테마나 연도별 자료를 엮어 한 편의 아름다운 **온라인 미디어 전시회**를 자동 생성합니다. 사용자는 전시관 **색상 테마**(뮤지엄 토프, 버건디 클래식, 포레스트 헤리티지, 오션 딥 블루, 차콜 미드나잇) 및 **전시관 레이아웃**(세로형 도슨트, 대칭형 황금 액자관, 시네마틱 스포트라이트 슬라이드, 현대적 벤토 박스)을 자유롭게 설정하여 나만의 갤러리를 연출할 수 있습니다.

- ⏳ **인생 연대기 타임라인 플로우 (Timeline Flow)**  
  > 보관함의 모든 기록을 시간순으로 자동 정렬하고, 주인공의 출생 연도 `1978`년을 기준으로 기록 당시의 나이(예: `2026년 (48세)`)를 자동으로 추적·계산하여 아름다운 스크롤 감상 인터랙션과 함께 생애 연대기를 보여줍니다.

- 🔄 **유연한 생전/사후 연속성**  
  > **생전(Alive):** 개인의 경험과 지식을 시각적으로 아름답게 정리하고 공유하는 품격 있는 '포트폴리오 및 내부 라이브러리'로 사용됩니다.  
  > **사후(Legacy):** 별도의 작업 없이 아카이브 전체가 자연스럽게 세대를 잇는 '디지털 기념관'으로 전환되는 완벽한 연속성을 자랑합니다.

- 📚 **사용자 정의 내부 라이브러리 (Custom Archive)**  
  > 정해진 틀에 얽매이지 않습니다. 기본 미디어 외에도 사용자가 직접 **커스텀 카테고리**(예: 연구 논문, 가족 편지, 프로젝트 기록, 레시피 등)를 빌드업하고 자유롭게 확장할 수 있는 유연성을 제공합니다.

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
  - [x] 온보딩 시스템 및 프로필 확장 메타데이터 구축
  - [x] 자료 미리보기(Rich Preview) 관련 데이터 필드 추가 (AI 요약, 핵심 인용구, 미리보기 URL)
  - [x] 인생 연대기 타임라인 플로우 (Timeline Flow) 구현
  - [x] 가상 전시관 다중 레이아웃 및 5대 컬러 공간 테마 고도화
  - [ ] LlamaIndex / Gemini API 연동 RAG 시스템 개발 (Q&A 봇)

---

<p align="center">
  <b>Remembery</b>는 인간이 남긴 소중한 흔적을 영원히 기억하고 계승합니다. <br />
  이 의미 깊은 여정에 여러분의 소중한 기여(Contribution)와 별(Star)을 환영합니다! ⭐
</p>
