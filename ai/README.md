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

You can execute diagnostic scripts directly to run verification tests:

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
