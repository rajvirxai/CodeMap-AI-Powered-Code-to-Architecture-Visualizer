# CodeMap: AI-Powered Code-to-Architecture Visualizer

CodeMap automatically analyzes directory structures and file dependencies, generating beautiful, interactive architecture visualizations using Google Gemini and Groq AI engines.

---

## 📅 Chronological Development Roadmap (Day 1 - Day 5)

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
  * Built the core [geminiService.js](file:///C:/Users/user/Desktop/ai/backend/services/geminiService.js) client mapping repo nodes.
  * Added [groqService.js](file:///C:/Users/user/Desktop/ai/backend/services/groqService.js) and [llmService.js](file:///C:/Users/user/Desktop/ai/backend/services/llmService.js) facade to support dual AI models (Gemini & Groq) with route-level configuration.
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
  * Refined prompts in [architectureprompt.txt](file:///C:/Users/user/Desktop/ai/ai/architectureprompt.txt) to output clean node-link relationships, discarding duplicates or orphaned pointers.
  * Added diagnostic testing suite ([test-cases.js](file:///C:/Users/user/Desktop/ai/ai/test-cases.js)).

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
  * **Database Summary Persistence (Completed by Vaibhav)**: Migrated backend storage from SQLite to MongoDB using Mongoose (updating [db.js](file:///C:/Users/user/Desktop/ai/backend/utils/db.js)) and mapped the schema to save the generated project summary.
  * **Frontend Panel Integration**: Enhanced visualizer dashboard in [page.tsx](file:///C:/Users/user/Desktop/ai/frontend/src/app/dashboard/page.tsx) to capture the `summary` string and display it inside the Left Sidebar panel card.
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

### 🤖 Day 5: File-Level Explanations, Prompts Improvement, & Routing-Level Fallbacks
* **Goal**: Deliver precise file explanations, map dependencies/assets on the canvas, automate documentation generation, and implement routing-level LLM fallbacks.
* **Tasks**:
  * **Improve Gemini Prompts**: Configured specific output formatting for single file analysis to return `purpose`, `inputs`, `outputs`, `dependencies`, and `role` strictly as schema-validated JSON.
  * **Generate File-Level Explanations**: Implemented local helper endpoints (`POST /explain`) and client-side details side panels to explain files on click.
  * **Generate Dependency Relationships**: Scanned files using regular expressions to locate imports/exports and draw real canvas link edges.
  * **Dual-Layer Fallback Chain**: Programmed LLM routing layers (`llmService.js`) to automatically redirect failing Gemini requests to the Groq API, degrading to programmatic fallbacks only if both are unavailable.
  * **Stretch Goals (Completed)**: Added auto README.md compilation, stack detection filters, and PNG architecture diagram downloads.

#### ✅ Day 5 Criteria — Full Verification (AI Team, Team 3)

| # | Success Criteria | Status | How It's Done |
|---|---|---|---|
| 1 | **Upload a repository** | ✅ Done | ZIP file upload and Git cloning are fully operational. |
| 2 | **View architecture graph** | ✅ Done | Displays entry point, core modules, and nested child files. |
| 3 | **Click any node** | ✅ Done | Launching side panel showing detailed AI Layer assessment metadata. |
| 4 | **Understand what that file does** | ✅ Done | Explanations detail purpose, inputs, outputs, dependencies, and role. |
| 5 | **View project summary** | ✅ Done | Sidebar explorer displays overall project summary and detected tech stack. |
| 6 | **See actual file relationships** | ✅ Done | Renders curved-path lines linking imports, exports, and active files. |

**Day 5 criteria: 6/6 ✅ — Fully satisfied.**

### 🤖 Day 6: Prompt Optimization, Target Metadata Detection, & Multi-Repo Verification
* **Goal**: Enhance LLM prompt quality to extract key workspace traits (Framework, Database, Auth, External APIs, and Entry Point), implement structural schemas, build heuristic fallbacks, and render visual badges on the Next.js visualizer side panel.
* **Tasks**:
  * **System Prompt Optimization**: Upgraded system instructions and output guidelines to request structured architecture metadata under Gemini & Groq.
  * **Metadata Extraction**: Extracted and separated five crucial architectural attributes: Entry Point, Framework, Database, External APIs, and Authentication.
  * **Concise Project Summaries**: Instructed the models to generate natural, codebase-specific project summaries under 100 words.
  * **Frontend UI Enhancements**: Expanded Next.js interfaces and rendered custom card layouts and tag clouds for metadata properties on the dashboard.
  * **Multi-Repo Verification**: Created a programmatic verification suite to test the pipeline across 5 different repository architectures.

#### ✅ Day 6 Criteria — Full Verification (AI Team, Team 3)

| # | Success Criteria | Status | How It's Done |
|---|---|---|---|
| 1 | **Improve prompt quality** | ✅ Done | Expanded prompts and configured strict schema-validated JSON outputs. |
| 2 | **Detect 5 target metadata fields** | ✅ Done | Exposes `entryPoint`, `framework`, `database`, `externalAPIs`, and `authentication` from the analysis. |
| 3 | **Generate concise project summaries** | ✅ Done | Generates highly readable 2-3 sentence summaries under 100 words. |
| 4 | **Test 5 different repos** | ✅ Done | Verified the pipeline against Express, Next.js, Django, React, and Spring Boot models. |
| 5 | **Render metadata badges in UI** | ✅ Done | Sidebar displays framework, database, auth, and external APIs badges. |

**Day 6 criteria: 5/5 ✅ — Fully satisfied.**

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

### Running from the Root Workspace Directory (`C:\Users\user\Desktop\ai`)

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

### Running from the AI Sandbox Directory (`C:\Users\user\Desktop\ai\ai`)

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

### ✅ Day 5 Test — File Explanations, Relationships & Auto README

This verifies the completed integration of Day 5 features:

#### Test A: File Details & Explanations (Clicking Nodes)
1. Open the dashboard and click any file in the Sidebar Explorer or on the Visual Canvas.
2. Verify that the side panel opens and successfully renders:
   * **Purpose**: Meaningful AI-generated purpose of the file.
   * **Inputs Parsed**: Inputs, parameter structures, or props consumed.
   * **Outputs Generated**: Exported functions, endpoints, or returned objects.
   * **Dependencies**: External packages or internal helpers imported.
   * **Architectural Role**: E.g., Controller, Router, View / Component, Database Model.

#### Test B: Curved-Path File Relationships
1. Select a file in the sidebar to activate it.
2. Verify that the visualizer transitions to the file dependency visualizer.
3. Confirm that curved relationship lines are drawn between:
   * Left side imports/dependencies cards pointing to the center active card.
   * Center active card pointing to right side exports cards.

#### Test C: Auto README Generation
1. In the sidebar, click the **"Generate README.md"** button.
2. Verify that the loading indicator spins, a request is made to `/generate-readme` (or `/api/generate-readme` in sandbox), and a compiled markdown README is returned.

#### Test D: Dual LLM Fallback (Gemini -> Groq -> Programmatic)
1. In backend logs, simulate a Gemini outage (e.g. by temporarily clearing `GEMINI_API_KEY` in `.env`).
2. Execute a file click.
3. Verify the logs output: `Gemini explanation failed... Trying Groq fallback...`
4. Verify the panel displays the fallback Groq-generated details successfully.

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

---

## ✅ Day 5 End-of-Day Checklist

Use this checklist to confirm the Day 5 task is fully complete:

- [x] All sandbox files (`geminiService.js`, `groqService.js`, `llmService.js`, `server.js`) are updated with Day 5 capabilities.
- [x] Clicking any folder/file node in the Explorer tree or canvas queries `/explain` correctly.
- [x] Node Details Panel parses and displays file `purpose`, `inputs`, `outputs`, `dependencies`, and `role`.
- [x] Tech Stack summary dynamically scans and prints detected technologies (Next.js, Express, MongoDB).
- [x] Curved link paths are rendered on the canvas connecting active files with their dependencies.
- [x] Export Map creates and downloads a PNG graphic of the dependency graph.
- [x] `node ai/test-cases.js` executes and passes all test scenarios under both Gemini and Groq engines on port 3001.
- [x] `.env` remains ignored by Git to preserve API keys.
- [x] Root `.gitignore` ignores task doc and node_modules backup folders cleanly.

---

### ✅ Day 6 Test — Prompts Optimization, 5-Field Detection & Sidebar Badges

This verifies that the Day 6 tasks are fully complete:

#### Test A: Programmatic Verification Suite
1. Run the test suite:
   ```bash
   node ai/test-5-repos.js
   ```
   **Expected**: Command completes successfully and outputs exact metadata fields (Framework, Database, Authentication, External APIs, Entry Point) and summaries for all 5 tested repository models.

#### Test B: Integrated UI Check
1. Start the integrated dev server:
   ```bash
   npm run dev
   ```
2. Open the browser and visit `http://localhost:3000/upload`.
3. Upload or clone any code repository (e.g. standard Node.js/Mongoose REST API).
4. Verify that:
   * ✅ **SIDEBAR** shows the concise **Project Summary** paragraph.
   * ✅ **SIDEBAR** displays **Framework** and **Database** metadata cards.
   * ✅ **SIDEBAR** displays **Authentication** details.
   * ✅ **SIDEBAR** displays **External APIs** as tags.

---

## 📈 Day 6 Step-by-Step Workflow

We followed this step-by-step workflow during the Day 6 implementation:

1. **Schema & Prompts Definition**: Updated the `analyzeRepository` instructions and output schema under Gemini (`geminiService.js`) and Groq (`groqService.js`) to extract the 5 target fields.
2. **Programmatic Fallbacks**: Enhanced local parser code (`generateFallbackResponse`) to extract frameworks, databases, auth systems, and external APIs programmatically via regex file scanners if LLM engines are throttled.
3. **Analyzer Sync**: Copied prompts and fallback routines to the production `backend/utils/geminiAnalyzer.js` engine.
4. **Integration Verification**: Ran `test-cases.js` to ensure the Express endpoints on port `3001` parse the expanded schemas correctly.
5. **Multi-Repo Test Script**: Created and executed `test-5-repos.js` simulating 5 repository formats.
6. **Frontend UI Rendering**: Updated Next.js `page.tsx` interfaces and rendered responsive cards and tag clouds for metadata on the visualizer sidebar.

---

## 📊 Verification Test Results

Below are the console results from running the test script `node ai/test-5-repos.js`:

```text
=======================================================
🚀 STARTING MULTI-REPO VERIFICATION (5 CODESPACE SCENARIOS)
=======================================================

-------------------------------------------------------
Testing: Repo 1: Node.js/Express + MongoDB REST API
-------------------------------------------------------
✅ Success! Metadata Detected:
   - 🚀 Summary: This is an Express.js-based REST API designed for user management, interacting with a MongoDB database. It features distinct architectural layers for routing, controllers, data modeling, and authentication middleware. The application provides a clear separation of concerns for robust backend development.
   - 📌 Entry Point: server.js
   - 💻 Framework: Express.js
   - 💾 Database: MongoDB
   - 🔒 Authentication: JWT
   - 🌐 External APIs: []
   - 🛠️ Tech Stack: [Node.js, Express.js, MongoDB, Mongoose]
   - 📁 Modules Count: 5
   - 🔵 Nodes Count: 3
   - 🔗 Edges Count: 3

-------------------------------------------------------
Testing: Repo 2: Next.js/React Fullstack (TypeScript) + Prisma + Stripe
-------------------------------------------------------
✅ Success! Metadata Detected:
   - 🚀 Summary: This is a full-stack web application built with Next.js, leveraging its App Router for both frontend UI and API routes. It uses Prisma as an ORM to interact with a database and integrates NextAuth.js for robust authentication. Payments are handled via Stripe, providing a complete e-commerce or subscription platform.
   - 📌 Entry Point: app/page.tsx
   - 💻 Framework: Next.js
   - 💾 Database: Prisma
   - 🔒 Authentication: NextAuth.js
   - 🌐 External APIs: [Stripe]
   - 🛠️ Tech Stack: [Next.js, React, TypeScript, Prisma, NextAuth.js, Stripe]
   - 📁 Modules Count: 5
   - 🔵 Nodes Count: 6
   - 🔗 Edges Count: 6

-------------------------------------------------------
Testing: Repo 3: Python/Django Backend (Postgres + JWT)
-------------------------------------------------------
✅ Success! Metadata Detected:
   - 🚀 Summary: This is a Django REST API project designed to expose data via a web interface. It uses Django's ORM for data modeling with PostgreSQL and Django REST Framework for building robust API endpoints.
   - 📌 Entry Point: manage.py
   - 💻 Framework: Django, Django REST Framework
   - 💾 Database: PostgreSQL
   - 🔒 Authentication: Django Authentication
   - 🌐 External APIs: []
   - 🛠️ Tech Stack: [Python, Django, Django REST Framework, PostgreSQL]
   - 📁 Modules Count: 4
   - 🔵 Nodes Count: 5
   - 🔗 Edges Count: 5

-------------------------------------------------------
Testing: Repo 4: Vite/React SPA + Tailwind (No Backend/DB)
-------------------------------------------------------
✅ Success! Metadata Detected:
   - 🚀 Summary: This project is a frontend Single Page Application (SPA) built with React and Vite. It utilizes a component-based architecture for its user interface and Tailwind CSS for styling.
   - 📌 Entry Point: src/main.jsx
   - 💻 Framework: React, Vite
   - 💾 Database: None
   - 🔒 Authentication: None
   - 🌐 External APIs: []
   - 🛠️ Tech Stack: [JavaScript, React, Vite, Tailwind CSS]
   - 📁 Modules Count: 3
   - 🔵 Nodes Count: 3
   - 🔗 Edges Count: 2

-------------------------------------------------------
Testing: Repo 5: Java/Spring Boot Backend (MySQL + Spring Security)
-------------------------------------------------------
✅ Success! Metadata Detected:
   - 🚀 Summary: This is a Java Spring Boot application designed for user management, exposing RESTful APIs. It follows a layered architecture with dedicated modules for controllers, data models, and configurations. The application utilizes Spring Security for authentication and connects to a MySQL database for data persistence.
   - 📌 Entry Point: src/main/java/com/example/demo/DemoApplication.java
   - 💻 Framework: Spring Boot
   - 💾 Database: MySQL
   - 🔒 Authentication: Spring Security
   - 🌐 External APIs: []
   - 🛠️ Tech Stack: [Java, Spring Boot, Maven, MySQL, Spring Security]
   - 📁 Modules Count: 4
   - 🔵 Nodes Count: 5
   - 🔗 Edges Count: 4
```

---

## ✅ Day 6 End-of-Day Checklist

Use this checklist to confirm the Day 6 task is fully complete:

- [x] Improved prompts configured under Gemini (`geminiService.js`) and Groq (`groqService.js`).
- [x] The AI analyzer extracts entryPoint, framework, database, externalAPIs, and authentication.
- [x] Programmatic fallback parses and populates all 5 fields under offline conditions.
- [x] Main backend analyzer (`geminiAnalyzer.js`) synced with prompt and fallback logic.
- [x] Frontend dashboard interface updated to declare and render the new metadata fields.
- [x] Run `node ai/test-5-repos.js` and confirmed all 5 repo types pass successfully.
- [x] System starts up cleanly with `npm run dev` on ports 3000 and 5000.


