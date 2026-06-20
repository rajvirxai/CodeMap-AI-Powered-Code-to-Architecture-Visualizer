# CodeMap: AI-Powered Code-to-Architecture Visualizer

CodeMap automatically analyzes directory structures and file dependencies, generating beautiful, interactive architecture visualizations using Google Gemini and Groq AI engines.

---

## 📅 Chronological Development Roadmap (Day 1 - Day 4)

### 📁 Day 1: AI API Integration & Backend Setup
* **Goal**: Establish a baseline Node.js + Express backend integrated with the Gemini API.
* **Tasks**:
  * Set up a basic Node.js + Express project structure.
  * Create a simple API endpoint to test connectivity.
  * Integrate the Google Gemini API (with fallback if keys are missing).
  * Send a test prompt and return the response through an API route.
  * Push the code to GitHub with proper README instructions.
* **Accomplishments & Deliverable**:
  * Created the local `ai/` directory sandbox to run standalone tests.
  * Implemented initial routing endpoints and verified raw LLM response deliveries.

### 🤖 Day 2: Gemini Integration Enhancement
* **Goal**: Upgrade Gemini API usage to accept codebase structures and generate structured JSON outputs.
* **Tasks**:
  * Create a reusable, modular Gemini service.
  * Ingest repository trees as input data structures.
  * Generate structured JSON output mapping component types:
    ```json
    {
      "components": [],
      "relationships": []
    }
    ```
* **Accomplishments & Deliverable**:
  * Built the core [geminiService.js](file:///c:/Users/user/OneDrive/Desktop/ai/backend/services/geminiService.js) client mapping repo nodes.
  * Added [groqService.js](file:///c:/Users/user/OneDrive/Desktop/ai/backend/services/groqService.js) and [llmService.js](file:///c:/Users/user/OneDrive/Desktop/ai/backend/services/llmService.js) facade to support dual AI models (Gemini & Groq) with route-level configuration.
  * Delivered the `/analyze` route accepting structure objects and returning mapped files as typed node structures.

### 💾 Day 3: Gemini Prompt Finalization & End-to-End Pipeline
* **Goal**: Refine model prompts for high-fidelity graphs, cache results, and build the live SSE progress system.
* **Tasks (Vaibhav, Oitrika)**:
  * Finalize systemic Gemini prompts for accurate repository parsing.
  * Create the dedicated Gemini integration service layer.
  * Ingest the repository JSON tree structured by the backend.
  * Generate structured architecture JSON output containing nodes and edges:
    ```json
    {
      "nodes": [],
      "edges": []
    }
    ```
  * Build an end-to-end prompt workflow mapping: **Repository Structure JSON → Gemini Engine → Validated Architecture JSON**.
  * Integrate SQLite database caching to save and retrieve generated maps.
* **Milestone 1 Goal**: Complete functional demonstration of the end-to-end flow. The data pipeline resolves sequentially:
  $$\text{Repository Upload} \rightarrow \text{Backend Scans Files} \rightarrow \text{JSON Structure Generated} \rightarrow \text{Gemini Analyzes Structure} \rightarrow \text{Architecture JSON Returned}$$
* **Accomplishments & Deliverables**:
  * Created the Server-Sent Events (SSE) `/analyze-stream` pipeline to push real-time terminal logs to the loading screen.
  * Refined prompts in [architectureprompt.txt](file:///c:/Users/user/OneDrive/Desktop/ai/ai/architectureprompt.txt) to output clean node-link relationships, discarding duplicates or orphaned pointers.
  * Added diagnostic testing suite ([test-cases.js](file:///c:/Users/user/OneDrive/Desktop/ai/ai/test-cases.js)).

### 🏆 Day 4: Prompt Improvement, Summary & End-to-End MVP
* **Goal**: Switch to MongoDB database schema persistence, support codebase project summaries, and complete full visual rendering.
* **Members**: Vaibhav Shaw (@Vaibhav Shaw), Oitrika (@~oitrika!)
* **Tasks**:
  * **Improve AI Model Prompts (Completed by Oitrika)**: Optimized prompts to generate `summary`, `nodes`, and `edges` inside a unified request:
    ```json
    {
      "summary": "",
      "nodes": [],
      "edges": []
    }
    ```
  * **Database Summary Persistence (Completed by Vaibhav)**: Migrated backend storage from SQLite to MongoDB using Mongoose (updating [db.js](file:///c:/Users/user/OneDrive/Desktop/ai/backend/utils/db.js)) and mapped the schema to save the generated project summary.
  * **Frontend Panel Integration**: Enhanced visualizer dashboard in [page.tsx](file:///c:/Users/user/OneDrive/Desktop/ai/frontend/src/app/dashboard/page.tsx) to capture the `summary` string and display it inside the Left Sidebar panel card.
  * **Repository Verification**: Tested the integrated visualizer pipeline with at least 3 different repositories.
* **End-of-Day Success Criteria**:
  * [x] **Upload a repository**: Multipart ZIP files successfully uploaded to `/upload`.
  * [x] **Scan its structure**: Backend scanner parses ZIP files to map tree objects recursively.
  * [x] **Send structure to Gemini**: Scanner tree passed through LLM client router to Gemini models.
  * [x] **Receive architecture JSON**: Validated JSON matches target output structure containing project summary.
  * [x] **Display the result on the frontend**: Visualizes nodes and edges on the Next.js canvas, and renders the project summary card in the sidebar.

#### ✅ Day 4 Criteria — Full Verification (AI Team, Team 3)

| # | Success Criteria | Status | How It's Done |
|---|---|---|---|
| 1 | **Upload a repository** | ✅ Done | Upload page accepts ZIP files AND GitHub URLs (clone). Backend auto-sanitizes browser URLs (strips `/tree/`, `/blob/`, etc.) before cloning. |
| 2 | **Scan its structure** | ✅ Done | `repoController.js` recursively walks the extracted directory and builds a `fileTree` JSON object. |
| 3 | **Send the structure to Gemini** | ✅ Done | `geminiAnalyzer.js` sends the file tree + sampled code content to the Gemini API via REST. |
| 4 | **Receive architecture JSON** | ✅ Done | Gemini returns structured JSON with `entryPoint`, `modules`, `summary`, `nodes`, and `edges` — Groq serves as automatic fallback if Gemini is throttled. |
| 5 | **Display result on frontend** | ✅ Done | Dashboard page renders the architecture canvas with nodes/edges, the file tree in the sidebar, and the AI-generated project summary card. |

**Day 4 criteria: 5/5 ✅ — Fully satisfied.**

#### 🏅 Bonus — Beyond the Minimum Day 4 Requirements

The AI Team delivered additional features beyond the baseline success criteria:

| Bonus Feature | Description |
|---|---|
| 🔄 **Groq Fallback** | If Gemini is unavailable or rate-limited, Groq (`llama-3.3-70b`) automatically takes over — zero downtime for the user. |
| 🛡️ **Programmatic Fallback** | If both AI APIs fail, a heuristic directory parser reconstructs a functional architecture graph — 100% request success rate. |
| 💾 **MongoDB Persistence** | Generated architecture results are saved to MongoDB via Mongoose. Degrades gracefully to in-memory mode if the database is offline. |
| 🔗 **GitHub URL Cloning** | Users can input any GitHub URL (including browser URLs with `/tree/main`) — backend sanitizes and clones the correct base repository. |
| ⚡ **Loading State Page** | Proper UX feedback page (`/loading-state`) with animated progress while the AI pipeline processes the repository. |

---

## 👥 Team Collaboration Model

CodeMap is developed across three specialized engineering teams:

```
┌────────────────────┐      API Requests / Responses      ┌────────────────────┐
│ Team 1: Frontend   │ <────────────────────────────────> │  Team 2: Backend   │
│ (Next.js Dashboard)│                                    │ (Express.js Core)  │
└─────────┬──────────┘                                    └─────────┬──────────┘
          │                                                         │
          │ Cache & Render JSON Graph                               │ Scan & Parse Codebase
          ▼                                                         ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                              Team 3: AI Team (Us)                            │
│           • Directory Analyzer & Prompt Engineering Core Pipeline            │
│           • Dual LLM Engines Facade Layer (Gemini & Groq)                    │
│           • Codebase-to-ReactFlow Graph Parser & Validation Engine           │
└──────────────────────────────────────────────────────────────────────────────┘
```

* **Team 1 (Frontend)**: Implements UI uploads, maps nodes and edges from storage into interactive React Flow/layered canvas visualizations with active styling and relationship lines.
* **Team 2 (Backend)**: Orchestrates startup runs, accepts ZIP file uploads, parses them via `adm-zip`, and maps directories recursively into clean tree models.
* **Team 3 (AI Team - Us)**: Interfaces with the LLM engines, runs code-to-architecture semantic mapping, validates connections to eliminate orphans, and runs fallback parsers if APIs are throttled.

---

## 🧠 Core AI Architecture & Resiliency

```
                       ┌──────────────────────┐
                       │  repositoryStructure │ (Scanned Directory Tree)
                       └──────────────────────┘
                                  │
                                  ▼
                       ┌──────────────────────┐
                       │   llmService Facade  │ (Routes provider: gemini/groq)
                       └──────────────────────┘
                                  │
                  ┌───────────────┴───────────────┐
                  ▼                               ▼
       ┌────────────────────┐          ┌────────────────────┐
       │   geminiService    │          │    groqService     │
       └────────────────────┘          └────────────────────┘
                  │                               │
                  ▼                               ▼
       ┌────────────────────┐          ┌────────────────────┐
       │ Google Gemini API  │          │      Groq API      │
       │ (gemini-2.5-flash) │          │ (llama-3.3-70b...) │
       └────────────────────┘          └────────────────────┘
                  │                               │
                  └───────────────┬───────────────┘
                                  │ (Raw LLM output or programmatic fallback)
                                  ▼
                       ┌──────────────────────┐
                       │ validateArchitecture │ (Sanitizes nodes, strips dangling edges)
                       └──────────────────────┘
                                  │
                                  ▼
                       ┌──────────────────────┐
                       │   Validated Graph    │ ({ summary, nodes, edges })
                       └──────────────────────┘
```

* **SDK-Level Structured Output**: Generates strictly validated JSON arrays utilizing model schemas where possible.
* **Robust Fallback Engine**: If the LLM call hits a quota limit or fails, a backup programmatic parser scans the directory tree to reconstruct a functional component graph and summary, maintaining a 100% request success rate.
* **Dangling Link Sanitizer**: Discards duplicate node IDs and strips target relationships that refer to deleted or missing components to prevent canvas rendering loops.

---

## 🔌 API Details

### `POST /api/analyze`

Analyzes repository structure trees and outputs React Flow compatible graphs.

* **Headers**:
  * `Content-Type: application/json`
  * `x-provider`: (Optional: `"gemini"` or `"groq"`. Defaults to `"gemini"`)
  * `x-model`: (Optional: Custom model override)

* **Request Body**:
```json
{
  "repositoryStructure": {
    "name": "project-root",
    "type": "folder",
    "children": [
      { "name": "index.js", "type": "file" },
      {
        "name": "src",
        "type": "folder",
        "children": [
          { "name": "app.js", "type": "file" }
        ]
      }
    ]
  }
}
```

* **Response Body**:
```json
{
  "repoTree": { ... },
  "architecture": {
    "summary": "This project is a web server detailing API paths and client layers.",
    "nodes": [
      { "id": "project-root", "label": "project-root", "type": "other" },
      { "id": "project-root_index_js", "label": "index.js", "type": "other" },
      { "id": "project-root_src", "label": "src", "type": "frontend" },
      { "id": "project-root_src_app_js", "label": "app.js", "type": "frontend" }
    ],
    "edges": [
      { "source": "project-root", "target": "project-root_index_js", "relationship": "contains" },
      { "source": "project-root", "target": "project-root_src", "relationship": "contains" },
      { "source": "project-root_src", "target": "project-root_src_app_js", "relationship": "contains" }
    ]
  }
}
```

---

## 🧪 Isolated Service Verification

You can execute diagnostic scripts directly to run verification tests. Depending on your current working directory, run the commands from the root workspace or the `ai/` directory.

### Running from the Root Workspace Directory (`c:\Users\user\OneDrive\Desktop\ai`)

1. **Verify All Mock Tests**:
   ```bash
   node ai/test-cases.js
   ```
2. **Test Gemini Layer**:
   ```bash
   node ai/backend/services/geminiService.js
   ```
3. **Test Groq Layer**:
   ```bash
   node ai/backend/services/groqService.js
   ```
4. **Test Unified Router**:
   ```bash
   node ai/backend/services/llmService.js
   ```

### Running from the AI Sandbox Directory (`c:\Users\user\OneDrive\Desktop\ai\ai`)

1. **Verify All Mock Tests**:
   ```bash
   node test-cases.js
   ```
2. **Test Gemini Layer**:
   ```bash
   node backend/services/geminiService.js
   ```
3. **Test Groq Layer**:
   ```bash
   node backend/services/groqService.js
   ```
4. **Test Unified Router**:
   ```bash
   node backend/services/llmService.js
   ```

---

## 🌟 Future Roadmap: CodeMap AI Bonus Features

To expand CodeMap's visualization capabilities, the following AI features are planned:

### 📊 Advanced Diagramming & Schematics
* [ ] **Dependency Graph Analysis**: Deep-dive analysis of imports inside files (ESM/CommonJS/Python imports) to generate high-fidelity physical dependency lines.
* [ ] **Database Schema Visualization**: Read and parse SQL DDLs, Prisma schemas, or Mongoose models to auto-generate interactive database entity-relationship (ER) diagrams on the canvas.
* [ ] **Sequence Diagram Generation**: Programmatically generate flow sequences mapping out API request-to-database-response cycles across services.
* [ ] **Mermaid Diagram Generation**: Support one-click exports of the generated architecture into standard Mermaid.js sequence, state, or class flowchart code.

### 🔍 System Architecture Classification
* [ ] **Microservice Detection**: Analyze cross-repository API paths and service calls to automatically detect boundary configurations of isolated microservices.
* [ ] **Technology Stack Detection**: Dynamically inspect code syntax, file extensions, and lock files (`package.json`, `requirements.txt`, `Cargo.toml`) to create accurate technology-stack blueprints.
* [ ] **Architecture Pattern Detection**: Inspect application structures to identify layout patterns (e.g., MVC, Hexagonal Architecture, Clean Architecture, Serverless).

### 📈 Code Quality & Context Insights
* [ ] **AI Project Summary**: Generate natural language READMEs, code documentation blocks, and high-level architectural walkthroughs based on parsed codebase patterns.
* [ ] **Technology Detection & Quality Insights**: Identify deprecated dependencies, security risks, or code smell hot-spots on the architecture map.
* [ ] **Confidence Score**: Display a reliability rating showing the AI's accuracy confidence when generating layout nodes and identifying hidden connections.

---

## 🚀 Getting Started — Full Setup Guide

### Prerequisites

Before running CodeMap, ensure you have the following installed:

| Tool | Minimum Version | Check Command |
|---|---|---|
| Node.js | v18+ | `node --version` |
| npm | v9+ | `npm --version` |
| Git | any | `git --version` |

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/rajvirxai/CodeMap-AI-Powered-Code-to-Architecture-Visualizer
cd CodeMap-AI-Powered-Code-to-Architecture-Visualizer
```

---

### Step 2: Configure Environment Variables

Create a `.env` file in the **root workspace directory** (`c:\...\ai\`):

```env
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
PORT=5000
```

> **Where to get API keys:**
> - Gemini: https://aistudio.google.com/app/apikey
> - Groq: https://console.groq.com/keys

---

### Step 3: Install All Dependencies

Run this single command from the **root workspace directory** to install dependencies for all three services at once:

```bash
npm run install-all
```

This is equivalent to running `npm install` inside root, `backend/`, and `frontend/` separately.

---

### Step 4: Start All Services

```bash
npm run dev
```

This starts **both** the backend and frontend simultaneously using `concurrently`.

---

## 🌐 Accessing the Application

Once `npm run dev` is running successfully, access each service at:

| Service | URL | Description |
|---|---|---|
| **Frontend (UI)** | `http://localhost:3000` | Main CodeMap web application |
| **Upload Page** | `http://localhost:3000/upload` | Upload ZIP or clone GitHub repo |
| **Dashboard** | `http://localhost:3000/dashboard?folderId=<id>` | Architecture visualization canvas |
| **Backend API** | `http://localhost:5000` | Express.js REST API server |
| **Health Check** | `http://localhost:5000/health` | Verify backend is running |
| **AI Sandbox** | `http://localhost:3001` | Standalone AI microservice (optional) |

---

### Running Services Individually (Optional)

If you want to run each service separately:

**Backend only:**
```bash
npm run backend
# or from backend directory:
node backend/index.js
```

**Frontend only:**
```bash
npm run frontend
# or from frontend directory:
npm run dev --prefix frontend
```

**AI Sandbox only (optional microservice):**
```bash
node ai/server.js
```

---

## 🧪 Day-by-Day Testing Guide (Day 1 → Day 4)

### ✅ Day 1 Test — API Connectivity

Verify the backend is running and Gemini API is reachable:

```bash
# 1. Check backend health
curl http://localhost:5000/health

# 2. Run the AI sandbox test (tests raw Gemini API call)
node ai/server.js
```

**Expected:** Backend responds `{ status: "ok" }`. AI sandbox starts on port 3001.

---

### ✅ Day 2 Test — Structured JSON Output from AI

Test that the AI service returns properly structured architecture JSON:

```bash
# From root workspace directory
node ai/test-cases.js
```

**Expected output:**
```
✅ Test 1 passed: analyzeRepository returns nodes and edges
✅ Test 2 passed: generateContent returns string output
✅ All tests passed.
```

You can also test individual AI service layers:
```bash
node ai/backend/services/geminiService.js   # Test Gemini layer
node ai/backend/services/groqService.js     # Test Groq layer
node ai/backend/services/llmService.js      # Test unified router (Gemini → Groq fallback)
```

---

### ✅ Day 3 Test — End-to-End Pipeline (Upload → Analyze → Visualize)

1. Open the browser and go to: **`http://localhost:3000/upload`**
2. Select **"Upload ZIP"** tab
3. Upload any ZIP of a code repository (e.g. a Node.js or React project)
4. Click **"Generate CodeMap"**
5. You will be redirected to the loading state page (`/loading-state`)
6. After processing, you will be redirected to the **Dashboard** (`/dashboard`)

**Expected:** Architecture canvas renders with nodes and connecting edges.

---

### ✅ Day 4 Test — AI Summary + Full MVP Verification

This is the complete end-to-end MVP test:

#### Test A: ZIP Upload Flow
1. Go to **`http://localhost:3000/upload`**
2. Upload a ZIP file of any GitHub repository
3. Wait for processing (loading screen)
4. On the Dashboard:
   - ✅ **LEFT SIDEBAR** shows file tree explorer
   - ✅ **LEFT SIDEBAR** shows **"PROJECT SUMMARY"** card with an AI-generated description
   - ✅ **CANVAS** shows architecture nodes (Entry Point + Module nodes)
   - ✅ **CANVAS** shows connecting edges between nodes

#### Test B: GitHub URL Clone Flow
1. Go to **`http://localhost:3000/upload`**
2. Select **"Clone GitHub Repo"** tab
3. Paste any GitHub URL (browser URL is fine, e.g. `https://github.com/user/repo/tree/main`)
4. Click **"Generate CodeMap"**
5. Same dashboard output expected as Test A ✅

#### Test C: AI Summary Uniqueness Check
Run two uploads with **different repositories** and confirm:
- Summary 1 ≠ Summary 2
- Each summary describes the specific repo's architecture

#### Test D: Fallback Chain Verification
Watch the backend terminal logs during an upload. You should see ONE of:
```bash
# Best case — Gemini working:
🔮 GEMINI ANALYZER: Calling Gemini API for architecture analysis...

# Gemini quota exceeded — Groq takes over:
⚡ GEMINI ANALYZER: Calling Groq API as fallback for architecture analysis...

# Both AIs unavailable — still works:
ℹ️ GEMINI ANALYZER: Using programmatic fallback.
```
All three cases produce a working dashboard. ✅

#### Test E: Backend API Direct Test (Optional)
```bash
curl -X POST http://localhost:5000/analyze \
  -H "Content-Type: application/json" \
  -d "{\"folderId\": \"<your-folder-id>\"}"
```

---

## ✅ Day 4 End-of-Day Checklist

Use this checklist to confirm the MVP is complete:

- [ ] `npm run dev` starts without errors
- [ ] `http://localhost:3000/upload` loads the upload page
- [ ] ZIP upload redirects to loading state then dashboard
- [ ] GitHub URL cloning works (any GitHub browser URL accepted)
- [ ] Dashboard canvas renders architecture nodes and edges
- [ ] Dashboard sidebar shows **PROJECT SUMMARY** with AI-generated text
- [ ] Backend logs show which AI engine was used (Gemini / Groq / Programmatic)
- [ ] `node ai/test-cases.js` passes all tests
- [ ] `http://localhost:5000/health` returns status ok

