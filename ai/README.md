# CodeMap: AI-Powered Code-to-Architecture Visualizer

A Node.js + Express backend integrated with Google Gemini and Groq APIs to analyze repository structures and automatically map them into interactive architecture diagrams.

---

## 👥 How CodeMap Works (Team Collaboration Model)

CodeMap's development pipeline is split across three engineering teams:

```
[Team 1: Frontend]   ===> Captures file upload & renders React Flow UI
       │▲
       ││ (HTTP requests & responses)
       ▼│
[Team 2: Backend]    ===> Receives code, runs scanner, outputs JSON Tree representation
       │▲
       ││ (Structured JSON mapping)
       ▼│
[Team 3: AI Team]    ===> Ingests JSON Tree, processes prompts, returns validated Nodes/Edges
```

* **Team 1 (Frontend)**: Integrates the Next.js visualizer and binds our nodes and edges JSON into interactive canvas elements using **React Flow**.
* **Team 2 (Backend)**: Implements file upload handlers (`POST /upload`) and folder scanners to structure repositories into recursive JSON trees.
* **Team 3 (AI Team - Us)**: Ingests the scanned project tree, prompts the LLM engines, extracts output, executes validation routines, and returns clean React Flow schema graphs.

---

## 🧠 AI Team (Team 3) Deep-Dive & Architecture

Our service layer translates Backend-scanned directories into Frontend-ready React Flow graphs. It is designed to be **modular, reusable, and resilient**.

```
                       ┌──────────────────────┐
                       │  repositoryStructure │ (Scanned JSON Tree)
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

### 1. Ingestion Capabilities (Task 3)
The analyzer is compatible with two tree structures:
- **Flat Trees (Day 2 Legacy)**: Key-value representations, e.g., `{ "src": { "components": ["Navbar.jsx"] } }`.
- **Recursive Node Trees (Day 3 Backend Standard)**: Hierarchical arrays containing `name`, `type` ("folder"/"file"), and `children`, matching [repo-tree.json](file:///c:/Users/user/OneDrive/Desktop/ai/repo-tree.json).

### 2. Systemic Prompt Templates (Task 1)
Prompts are loaded as system instructions instructing LLMs to act as senior software architects:
- **Rule Limits**: Nodes must only have type: `[frontend, backend, database, api, service, utility, config, auth, storage, other]`.
- **Relationship Resolution**: Edges must define relations (`"imports"`, `"contains"`, `"calls"`) between source and target node IDs.

### 3. Reusable Services (Task 2)
The core AI modules inside `backend/services/` are decoupled from Express, letting you import them in any JS script:
- 📄 [llmService.js](file:///c:/Users/user/OneDrive/Desktop/ai/backend/services/llmService.js): The entry-point facade routing queries dynamically using headers (`x-provider`), body configs, or query parameters.
- 📄 [geminiService.js](file:///c:/Users/user/OneDrive/Desktop/ai/backend/services/geminiService.js): Integrates the `@google/genai` client, uses SDK-level schemas, and hosts the programmatic fallback and validation routines.
- 📄 [groqService.js](file:///c:/Users/user/OneDrive/Desktop/ai/backend/services/groqService.js): Uses fetch completions for ultra-low latency Groq processing in JSON mode.

### 4. Resilient Fallbacks & Sanitization (Task 2 & 4)
- **Programmatic Fallback**: If LLM API keys hit quota limits (`RESOURCE_EXHAUSTED`), `generateFallbackResponse` parses the tree directory programmatically to ensure a 100% success rate.
- **Sanitizer Engine**: `validateArchitecture(output)` filters duplicate node IDs and strips dangling edges that reference non-existent targets to prevent canvas visual bugs.

---

## 🔌 API Integration

### Endpoint
`POST /api/analyze`

### Request Headers
- `Content-Type: application/json`
- `x-provider: groq` (Optional: `"gemini"` or `"groq"`. Defaults to `"gemini"`)
- `x-model: llama-3.3-70b-versatile` (Optional: Custom model override)

### Request Body (Ingesting `repo-tree.json`)
```json
{
  "repositoryStructure": {
    "name": "my-project",
    "type": "folder",
    "children": [
      {
        "name": "index.js",
        "type": "file"
      },
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

### Response Body (React Flow Nodes/Edges Format)
```json
{
  "nodes": [
    { "id": "my_project", "label": "my-project", "type": "other" },
    { "id": "my_project_index_js", "label": "index.js", "type": "other" },
    { "id": "my_project_src", "label": "src", "type": "frontend" },
    { "id": "my_project_src_app_js", "label": "app.js", "type": "frontend" }
  ],
  "edges": [
    { "source": "my_project", "target": "my_project_index_js", "relationship": "contains" },
    { "source": "my_project", "target": "my_project_src", "relationship": "contains" },
    { "source": "my_project_src", "target": "my_project_src_app_js", "relationship": "contains" }
  ]
}
```

---

## 🧪 Quick Start & Testing

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Configure Environment Variables**:
   Create a `.env` file in the root:
   ```env
   PORT=3000
   GEMINI_API_KEY=your_gemini_api_key_here
   GROQ_API_KEY=your_groq_api_key_here
   ```
3. **Start the server**:
   ```bash
   npm run dev
   ```
4. **Execute the API Test cases**:
   Simulates requests against all structures (including `repo-tree.json`) and prints responses:
   ```bash
   node test-cases.js
   ```
5. **Isolated Module Tests**:
   - Gemini Layer: `node backend/services/geminiService.js`
   - Groq Layer: `node backend/services/groqService.js`
   - Facade Router: `node backend/services/llmService.js`
