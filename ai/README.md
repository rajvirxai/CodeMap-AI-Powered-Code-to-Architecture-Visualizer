# CodeMap: AI-Powered Code-to-Architecture Visualizer

CodeMap automatically analyzes directory structures and file dependencies, generating beautiful, interactive architecture visualizations using Google Gemini and Groq AI engines.

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

## 🛠️ AI Team Integration & Process Workflows

We migrated and integrated our AI Engine directly into the primary application stack to enable seamless, production-ready local hosting:

### 1. Unified CommonJS Service Layer (`backend/services/`)
To support the main backend's module system, we implemented all AI client services as robust CommonJS modules:
* **[geminiService.js](file:///c:/Users/user/OneDrive/Desktop/ai/backend/services/geminiService.js)**: Configures the official `@google/genai` client, reads environment variables locally/globally, validates LLM output structures, and falls back programmatically if keys are missing or throttled.
* **[groqService.js](file:///c:/Users/user/OneDrive/Desktop/ai/backend/services/groqService.js)**: Integrates the Groq API completion endpoint in JSON Mode for high-speed secondary predictions.
* **[llmService.js](file:///c:/Users/user/OneDrive/Desktop/ai/backend/services/llmService.js)**: Acts as a unified router facade routing requests between providers dynamically based on headers or configuration objects.

### 2. End-to-End API Integration (`backend/controllers/repoController.js`)
We modified the backend route controller's `/analyze` endpoint to run a combined analysis task:
1. Ingests the `folderId` of an extracted zip.
2. Recursively scans the directories using the backend scanner to construct a JSON tree.
3. Passes the JSON tree to our unified `analyzeRepository` AI service.
4. Returns both the original directory tree (`repoTree`) and the validated AI graph layout (`architecture`) in a single payload.

### 3. Dynamic Visualizer Canvas (`frontend/src/app/dashboard/page.tsx`)
We built a dynamic rendering engine for the UI dashboard:
* **Layered Column Layout**: Groups nodes into distinct layout layers:
  * **Client & Auth** (UI screens, Auth wrappers)
  * **API & Config** (Gateway routes, env files)
  * **Services & Utils** (Business logic layers, helper APIs)
  * **Database & Other** (Databases, schemas, local assets)
* **Smooth Bezier Connectors**: Automatically draws curved SVG connections between nodes with dependency direction arrows and relationship labels.
* **Interactive Highlights**: Hovering over a node or clicking a file in the sidebar explorer highlights its direct dependencies and dims the rest of the canvas.

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
                       │   Validated Graph    │ ({ nodes: [], edges: [] })
                       └──────────────────────┘
```

* **SDK-Level Structured Output**: Generates strictly validated JSON arrays utilizing model schemas where possible.
* **Robust Fallback Engine**: If the LLM call hits a quota limit (`RESOURCE_EXHAUSTED`) or fails, a backup programmatic parser scans the directory tree to reconstruct a functional component graph, maintaining a 100% request success rate.
* **Dangling Link Sanitizer**: Discards duplicate node IDs and strips target relationships that refer to deleted or missing components to prevent canvas rendering loops.

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
