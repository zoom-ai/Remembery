# Remembery — A Digital Heritage Archive & Art Gallery for Your Legacy

> **Remember + Library**
> *“Preserving the most brilliant moments of your life, and sharing your wisdom in your own voice for generations to come.”*

---

## Ⅰ. Philosophy

Throughout our lives, we leave behind countless footprints. Yet, as time flows, records scatter and memories fade. **Remembery** is far more than a standard cloud storage service. It is a premium **Digital Heritage Archive** designed to consolidate your life chronicle, intellectual pursuits, and everyday emotional reflections—facilitating active **legacy knowledge sharing** during your life and providing a **dignified memorial gallery** thereafter. 

We help digitize your unique wisdom and voice, preserving it as an everlasting beacon of warmth and guidance for the people you cherish most.

---

## Ⅱ. Core Features

### 1. Cinematic Life Chronicle
Visualize your life's journey as it unfolds gracefully along a river of time.
* **Chronological Sorting**: Automatically maps and arranges your archives based on their historic `Original Date`, placing your memories precisely onto the timeline.
* **Smart Age Mapping**: Dynamically calculates and displays your exact age at the time of each event based on your birth year. (e.g., `2026 (Age 48)`)
* **Native ScrollReveal Engine**: Utilizes a highly optimized, native IntersectionObserver to trigger elegant fade-in-up animations as memories scroll into view, maximizing performance and visual flow.

### 2. Adaptive Custom Library
Experience a smart dynamic form schema that morphs automatically according to the type of record being preserved.
* **Hybrid JSON Schema**: Validates and handles common metadata fields (such as title, description, and files) securely, while seamlessly absorbing category-specific parameters using SQLite/PostgreSQL `JSON` storage.
* **Category-Specific Dynamic Fields**:
  * **Academic Papers**: Interactive fields for **Authors** and **Journal/Publisher** utilizing elegant research iconography.
  * **Sensory Diaries**: Warm fields for **Weather** and **Daily Emotion** mapping your inner reflections.
  * **Photos/Memories**: Dedicated coordinates for **Capture Location** and **Physical Source** with smart map-pin binding.

### 3. AI Intelligent Support
Save time with Gemini AI suggestions and automated hardware-level metadata parsing.
* **Gemini Field Suggestions ("AI 추천 필드 받기")**: When creating a custom category (e.g. *“Golf Scorecards”, “Military Letters”*), get immediate key-value attribute recommendations from Gemini API and register them to your active form with a single check.
* **On-the-fly Image EXIF Extraction & Auto-fill**:
  * The second you select a photo, the backend automatically parses its hidden hardware EXIF metadata.
  * Displays a beautiful, minimal preview container listing **Capture Device** (Make & Model), **Capture Date** (DateTimeOriginal), and **GPS Coordinates** (Latitude/Longitude).
  * Automatically **auto-fills** these coordinates into your custom location field and maps the capture date directly into your timeline's "Original Date" input.

### 4. Personal Conversational AI Docent (RAG)
Let your legacy speak for itself through a personalized conversational AI that trains directly on your papers, diaries, and logs.
* **Attribute Synthesis**: The vector indexer synthesizes custom attributes into organic descriptive prose (e.g., *“This paper was authored by [name] and published in [journal].”*) to maximize LLM retrieval accuracy.
* **Legacy-Voiced Chat**: Speak directly with your archives through an advanced Retrieval-Augmented Generation (RAG) interface that answers questions in your own tone, bridging the past and present.

### 5. Multi-Layout Virtual Exhibition Hall
Curate a beautiful personal art gallery automatically using our AI-driven spatial museum planner.
* **5 Spatial Color Themes**:
  * `Classic Museum` (Warm, comforting classic ivory and tan)
  * `Burgundy Classic` (Sophisticated and regal deep crimson)
  * `Forest Heritage` (Refreshing and lush botanic green)
  * `Ocean Deep` (Calm, contemplative deep navy blue)
  * `Charcoal Midnight` (High-contrast, theatrical dark-room gallery)
* **4 Curated Room Layouts**:
  * `Docent Flow` (A serene vertical walkthrough telling a chronological story)
  * `Golden Frame Grid` (A symmetrical gallery grid housing items within physical gilded frames)
  * `Cinematic Spotlight` (An elegant theatrical slideshow carousel that highlights large serif quotes and one focus piece at a time)
  * `Bento Collage` (A modern, asymmetrical collage displaying items in dynamic masonry ratios)

### 6. Secure Multi-User Space Isolation (JWT)
Manage your digital library privately and securely away from other guests.
* **JWT-Based Session Security**: Encrypted JSON Web Tokens (JWT) manage active authentication sessions securely. Register and log in via sleek interactive portals.
* **Axios Request Interceptor**: Every outbound API call automatically injects the active token (`Authorization: Bearer {token}`), ensuring all requests are authenticated.
* **Strict Database Scoping**: All database operations (Category listings, Timeline queries, File uploads, and AI virtual galleries) are strictly scoped and bound using user authentication filters (`user_id == current_user.id`).
* **Vector RAG Isolation**: Semantic search queries to the AI Docent retrieve exclusively the authenticated user's chunk data, guaranteeing no cross-user information leakage.

---

## Ⅲ. Technology Stack

Remembery is built upon a high-performance modern web stack ensuring visual excellence, speed, and safety.

| Layer | Technologies | Role & Purpose |
| :--- | :--- | :--- |
| **Frontend Core** | React 19, TypeScript 6.0 | Fast, type-safe interactive single-page application framework. |
| **Styling** | Vanilla CSS, Tailwind CSS | Deluxe museum aesthetic (Warm Parchment, Ivory, and Linen) with fluid micro-animations and micro-interactions. |
| **Backend API** | FastAPI, Uvicorn | High-throughput asynchronous RESTful API framework in Python. |
| **Database** | SQLite, SQLAlchemy | Lightweight database layer utilizing custom JSON serialization columns for dynamic properties. |
| **AI Engine** | Gemini API | Powers RAG semantic context queries, metadata suggestions, and spatial docent curation. |
| **Metadata Parsing** | Pillow (PIL) | Decodes binary EXIF headers and converts fractional GPS DMS to high-precision decimal floats. |

---

## Ⅳ. Step-by-Step Archiving Guide

Preserve your life story in six simple steps.

### Step 0: Register & Create Your Personal Library
1. When you first visit Remembery, you will be greeted by an elegant, gallery-themed authentication portal.
2. Click `Sign Up` to create your private library using your email, password, and name.
3. Once registered, log in to your personal dashboard. Your dashboard will start as a clean, beautiful blank canvas, completely isolated from other users' records.

### Step 1: Create a Custom Category
1. Click the `Add New Category` button on your dashboard.
2. Enter your category name (e.g., *“Mother's Letters”*).
3. Click **`AI 추천 필드 받기`** (Get AI Fields) to let Gemini recommend tailored metadata categories (sender, weather, emotional tone).
4. Select your preferred fields, pick a warm color tag, and hit **`Create`**.

### Step 2: Upload Files & Preview EXIF
1. Open the upload form by clicking `Upload to Archive`.
2. Drag and drop your family photograph or documents.
3. If it's a photo, watch the **"사진에서 추출된 정보"** (Extracted Photo Info) card slide open, displaying the smartphone camera model, original date, and GPS coordinate chips while automatically pre-filling the date and location forms.
4. Add a title, write your personal backstory/reflection, and click **`Save to Archive`**.

### Step 3: Walk Along the River of Time
1. Select the `Timeline` tab from the top navigation.
2. Scroll to see your memories glide into view along a high-contrast chronological river.
3. Review your calculated age next to each event node and reflect on your growth.

### Step 4: Converse with Your Past
1. Open the AI Docent chat panel on the dashboard.
2. Ask questions naturally: *"Where did I take that photo in 1998?"* or *"What did I write in my diary when I was feeling happiest?"*
3. The AI RAG engine retrieves your EXIF locations, diaries, and custom fields to draft a warm, legacy-voiced response.

### Step 5: Open Your Private Art Exhibition
1. Head over to the `Exhibition` tab.
2. Type in your desired theme (e.g., *“Youthful Summer Days”*, *“My Research Journey”*).
3. Choose your theme color (`Burgundy`, `Forest`, etc.) and spatial layout (`Slideshow`, `Golden Frame Grid`, etc.).
4. Click `Start AI Curation` to open your virtual art gallery curated automatically from your precious milestones.

---

## Ⅴ. Developer & Contributor Guide

### Backend Execution
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend Execution
```bash
cd frontend
npm install
npm run dev
```

### Automatic DB Migrations & Isolation Tests
* **Schema Upgrades**: The backend checks SQLite tables automatically at startup. If missing, it adds `user_id` foreign keys to categories, archives, and exhibitions, backfilling existing records to the default admin user.
* **Testing Isolation**: You can run backend automated multi-user logic and strict authentication verification tests using:
  ```bash
  cd backend
  python test_multi_user.py
  python test_auth_isolation.py
  ```

---

> Remembery is constantly evolving to preserve your precious milestones beautifully and eternally, ensuring not a single memory is lost.
