'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FolderUp, Link as LinkIcon, AlertCircle } from 'lucide-react';

export default function UploadPage() {
  const router = useRouter();
  
  // File state
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  // URL input state
  const [repoUrl, setRepoUrl] = useState('');
  
  // Loading and Error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection via browse button
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.zip')) {
        setFile(selectedFile);
        setRepoUrl(''); // Clear URL if file is chosen
      } else {
        setError('Only ZIP files are supported by the backend scanner.');
      }
    }
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      if (selectedFile.name.endsWith('.zip')) {
        setFile(selectedFile);
        setRepoUrl(''); // Clear URL if file is chosen
      } else {
        setError('Only ZIP files are supported by the backend scanner.');
      }
    }
  };

  const onBrowseClick = () => {
    fileInputRef.current?.click();
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!file && !repoUrl) {
      setError('Please select a ZIP file or enter a repository URL.');
      return;
    }

    setLoading(true);

    try {
      if (file) {
        // --- 1. ZIP File Upload Path ---
        const formData = new FormData();
        formData.append('file', file);

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
        
        const response = await fetch(`${backendUrl}/upload`, {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to upload repository');
        }

        // Navigate to the loading state page with the folderId
        router.push(`/loading-state?folderId=${data.folderId}`);
      } else {
        // --- 2. GitHub URL Path ---
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
        
        const response = await fetch(`${backendUrl}/clone`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ repoUrl }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to clone repository');
        }

        // Navigate to the loading state page with the real folderId
        router.push(`/loading-state?folderId=${data.folderId}`);
      }
    } catch (err: unknown) {
      console.error('Upload error:', err);
      const errMsg = err instanceof Error ? err.message : 'An error occurred while connecting to the backend server. Make sure the backend server is running on http://localhost:5000.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-zinc-950 text-white">
      <div className="w-full max-w-lg p-8 border border-zinc-800 bg-zinc-900/40 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.4)] backdrop-blur-md">
        <h2 className="text-2xl font-bold tracking-tight text-center font-sans mb-8">
          Connect Your Repository
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Element A: Drag & Drop container */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all ${
              dragActive 
                ? 'border-white bg-zinc-800/40' 
                : file 
                  ? 'border-zinc-500 bg-zinc-900/60' 
                  : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/20'
            }`}
          >
            <FolderUp className={`w-12 h-12 mb-4 transition-colors ${file ? 'text-white' : 'text-zinc-500'}`} />
            
            <p className="text-sm font-medium text-zinc-300 text-center mb-1">
              {file ? file.name : "Drag & Drop your project folder here"}
            </p>
            
            <p className="text-xs text-zinc-500 text-center mb-4">
              (Must be compressed as a .zip file)
            </p>

            <button
              type="button"
              onClick={onBrowseClick}
              className="px-4 py-2 border border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 hover:border-zinc-600 rounded text-xs font-mono font-bold tracking-wide transition-all"
            >
              Browse File
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".zip"
              className="hidden"
            />
          </div>

          {/* Element B: Divider */}
          <div className="flex items-center justify-center gap-4 py-2">
            <div className="h-px flex-1 bg-zinc-800" />
            <span className="text-xs font-mono font-bold text-zinc-500 tracking-wider">—OR—</span>
            <div className="h-px flex-1 bg-zinc-800" />
          </div>

          {/* Element C: Input URL */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-zinc-500 tracking-wider block">
              REPOSITORIES LINK
            </label>
            <div className="flex items-center gap-3 px-4 py-3 border border-zinc-800 bg-zinc-950/40 rounded-lg focus-within:border-zinc-600 transition-colors">
              <LinkIcon className="w-4 h-4 text-zinc-500" />
              <input
                type="url"
                placeholder="[https://github.com/username/repo]"
                value={repoUrl}
                onChange={(e) => {
                  setRepoUrl(e.target.value);
                  setFile(null); // Clear file if URL is typed
                  setError(null);
                }}
                className="flex-1 bg-transparent text-sm font-mono text-white placeholder-zinc-700 outline-none"
              />
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-3 p-3.5 border border-red-900/40 bg-red-950/20 rounded-lg text-xs text-red-400 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 border-2 border-white bg-white hover:bg-zinc-200 text-black font-bold font-mono tracking-wide rounded shadow-[4px_4px_0px_rgba(255,255,255,0.2)] hover:shadow-[2px_2px_0px_rgba(255,255,255,0.2)] hover:translate-x-0.5 hover:translate-y-0.5 disabled:opacity-50 transition-all duration-200"
          >
            {loading ? 'Processing...' : 'Generate CodeMap'}
          </button>

          <button
            type="button"
            onClick={() => router.push('/loading-state?folderId=mock-app')}
            className="w-full py-3.5 border border-zinc-800 bg-zinc-950/45 hover:bg-zinc-900/60 text-zinc-300 font-bold font-mono tracking-wide rounded transition-all duration-200 mt-2"
          >
            Or Try Demo Mode (Offline)
          </button>

          <div className="text-center pt-2">
            <a 
              href="/demo-project.zip" 
              download
              className="text-xs font-mono text-zinc-500 hover:text-zinc-300 underline underline-offset-4 transition-colors"
            >
              Download Demo Codebase ZIP
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
