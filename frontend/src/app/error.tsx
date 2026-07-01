'use client';

import { useEffect } from 'react';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled runtime crash:', error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-zinc-950 text-white select-none min-h-[calc(100vh-4rem)]">
      <div className="w-full max-w-md p-6 sm:p-8 border border-zinc-800 bg-zinc-900/40 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] backdrop-blur-md flex flex-col gap-6 text-center">
        
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 mb-2">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">Something went wrong!</h2>
          <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
            An unexpected error occurred in the visualizer client. We apologize for the inconvenience.
          </p>
        </div>

        {error.message && (
          <div className="text-xs font-mono bg-black/60 border border-zinc-850 p-4 rounded-xl text-zinc-400 text-left max-h-36 overflow-y-auto custom-scrollbar leading-relaxed">
            {error.message}
          </div>
        )}

        <div className="flex gap-3 pt-2 border-t border-zinc-800 mt-2">
          <button
            onClick={() => reset()}
            className="flex-1 py-3 bg-white text-black font-bold font-mono tracking-wide text-xs rounded hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
          
          <a
            href="/"
            className="flex-1 py-3 border border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 text-xs font-bold font-mono text-zinc-300 hover:text-white rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Go Home</span>
          </a>
        </div>
      </div>
    </div>
  );
}
