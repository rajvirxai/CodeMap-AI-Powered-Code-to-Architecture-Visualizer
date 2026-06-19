# CodeMap Repository Explorer - Collapsible Tree Logic & UI Polish Guide

This step-by-step guide details how to implement a collapsible folder tree with smooth micro-animations, rotating chevrons, vertical indentation guidelines, and high visual contrast in the **CodeMap** repository.

---

## 📋 Prerequisites & Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/rajvirxai/CodeMap-AI-Powered-Code-to-Architecture-Visualizer.git
   cd CodeMap-AI-Powered-Code-to-Architecture-Visualizer
   ```

2. **Install Dependencies**:
   Install root dependencies, then navigate to the frontend directory and install frontend dependencies:
   ```bash
   npm install
   cd frontend
   npm install
   ```

---

## 🛠️ Step-by-Step Implementation

### Step 1: Locating the Sidebar Explorer Component
All sidebar directory navigation logic is implemented in the dashboard page component located at:
`frontend/src/app/dashboard/page.tsx`

Open this file in your editor and locate the `DirectoryNode` component (around line 267).

---

### Step 2: Refactor the `DirectoryNode` Component
Replace the existing `DirectoryNode` component with the code below. This refactoring implements:
1. **rotating chevrons**: A single `ChevronRight` icon is rotated dynamically via CSS when the folder state changes.
2. **smooth transitions**: The child list transitions its `maxHeight` and `opacity` smoothly, avoiding abrupt layout jumps.
3. **vertical guides**: A thin, semi-transparent left border is added to indented child containers, making deep nesting visually trackable.

```tsx
  // Directory Node renderer component
  const DirectoryNode = ({ node, depth = 0 }: { node: FileNode; depth: number }) => {
    const [isOpen, setIsOpen] = useState(true);
    const isFolder = node.type === 'folder';

    const handleClick = () => {
      if (isFolder) {
        setIsOpen(!isOpen);
      } else {
        setActiveFile(node.name);
        setSelectedNode(null); // Clear manual visualizer selection to prioritize explorer
      }
    };

    return (
      <div className="select-none">
        <div 
          onClick={handleClick}
          className={`flex items-center gap-2 py-1 px-2.5 rounded-md cursor-pointer transition-all duration-150 border border-transparent ${
            activeFile === node.name 
              ? 'bg-zinc-800/80 text-white font-medium shadow-sm border-zinc-700/40' 
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30'
          }`}
        >
          {isFolder ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <ChevronRight 
                className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${
                  isOpen ? 'rotate-90 text-zinc-400' : ''
                }`} 
              />
              <span className="text-blue-400/90">
                {isOpen ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-3.5" /> {/* Spacer to align with chevron */}
              <span className="text-zinc-500">
                <File className="w-4 h-4" />
              </span>
            </div>
          )}
          <span className="text-xs font-mono truncate">{node.name}</span>
        </div>

        {isFolder && node.children && (
          <div 
            className="ml-3 pl-3.5 border-l border-zinc-800/40 space-y-0.5 transition-all duration-300 ease-in-out overflow-hidden"
            style={{ 
              maxHeight: isOpen ? '5000px' : '0px', 
              opacity: isOpen ? 1 : 0,
              pointerEvents: isOpen ? 'auto' : 'none'
            }}
          >
            {node.children.map((child, idx) => (
              <DirectoryNode key={idx} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };
```

---

### Step 3: Polish the Sidebar Container Style
To make the directory explorer box sleeker and less visually bulky, locate the enclosing container div in the dashboard layout (around line 574):

**Before:**
```tsx
          <div className="flex-1 overflow-y-auto px-3 py-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
              {treeData ? (
                <DirectoryNode node={treeData} depth={0} />
              ) : (
                ...
```

**After:**
```tsx
          <div className="flex-1 overflow-y-auto px-3 py-4">
            <div className="rounded-xl border border-white/[0.06] bg-[#090d16]/30 p-2.5 shadow-lg">
              {treeData ? (
                <DirectoryNode node={treeData} depth={0} />
              ) : (
                ...
```

---

## ⚡ Verification & Testing

1. **Verify Compilation**:
   Run a test build to ensure TypeScript types match and everything compiles without errors:
   ```bash
   npm run build
   ```

2. **Start Dev Server**:
   Start the application locally:
   ```bash
   npm run dev
   ```

3. **Verify Features**:
   - Navigate to `/dashboard` (or start in demo mode).
   - Click a folder (e.g., `components`) and ensure it collapses/expands with a smooth vertical slide.
   - Verify the folder's chevron icon rotates smoothly.
   - Observe the vertical gray indentation lines (`border-l border-zinc-800/40`) helping trace folder levels.
   - Click files (e.g., `ProductCard.tsx`) and verify they highlight with high-contrast text and a subtle border.
