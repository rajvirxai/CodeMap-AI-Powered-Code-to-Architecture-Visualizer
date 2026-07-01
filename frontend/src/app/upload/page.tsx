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
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 bg-[#F0EDE4] text-[#1E1F22] min-h-[calc(100vh-4rem)]">
      <div className="w-full max-w-lg p-6 sm:p-8 border border-[#E5E0D5] bg-white rounded-[24px] shadow-sm select-none">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-center font-sans mb-8 text-[#1E1F22]">
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
                ? 'border-[#1E1F22] bg-[#F0EDE4]/50' 
                : file 
                  ? 'border-neutral-400 bg-[#F0EDE4]/30' 
                  : 'border-[#E5E0D5] hover:border-[#D2CBB8] bg-[#F0EDE4]/10'
            }`}
          >
            <FolderUp className={`w-12 h-12 mb-4 transition-colors ${file ? 'text-[#1E1F22]' : 'text-neutral-400'}`} />
            
            <p className="text-sm font-medium text-neutral-600 text-center mb-1">
              {file ? file.name : "Drag & Drop your project folder here"}
            </p>
            
            <p className="text-xs text-neutral-400 text-center mb-4">
              (Must be compressed as a .zip file)
            </p>

            <button
              type="button"
              onClick={onBrowseClick}
              className="px-4 py-2 border border-[#E5E0D5] bg-white hover:bg-[#F0EDE4] hover:border-neutral-400 text-[#1E1F22] rounded-xl text-xs font-mono font-bold tracking-wide transition-all shadow-sm cursor-pointer"
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
            <div className="h-px flex-1 bg-[#E5E0D5]" />
            <span className="text-xs font-mono font-bold text-neutral-400 tracking-wider">—OR—</span>
            <div className="h-px flex-1 bg-[#E5E0D5]" />
          </div>

          {/* Element C: Input URL */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-neutral-400 tracking-wider block">
              REPOSITORIES LINK
            </label>
            <div className="flex items-center gap-3 px-4 py-3 border border-[#E5E0D5] bg-[#F0EDE4]/10 rounded-lg focus-within:border-neutral-400 transition-colors">
              <LinkIcon className="w-4 h-4 text-neutral-400" />
              <input
                type="url"
                placeholder="[https://github.com/username/repo]"
                value={repoUrl}
                onChange={(e) => {
                  setRepoUrl(e.target.value);
                  setFile(null); // Clear file if URL is typed
                  setError(null);
                }}
                className="flex-1 bg-transparent text-sm font-mono text-[#1E1F22] placeholder-neutral-300 outline-none"
              />
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-3 p-3.5 border border-[#FF7563]/30 bg-[#FF7563]/10 rounded-lg text-xs text-[#FF7563] font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#1E1F22] hover:bg-[#2C2E33] text-white font-bold font-mono tracking-wide rounded-full shadow-sm hover:shadow hover:scale-[1.01] active:scale-95 disabled:opacity-50 transition-all duration-200 cursor-pointer"
          >
            {loading ? 'Processing...' : 'Generate CodeMap'}
          </button>
        </form>
      </div>
    </div>
  );
}
