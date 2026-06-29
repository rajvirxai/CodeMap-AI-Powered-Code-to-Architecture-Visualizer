import Link from 'next/link';
import { User } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="w-full border-b border-zinc-800 bg-zinc-950/70 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left Side: Brand Logo box placeholder [L] containing text "CodeMap" */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex items-center justify-center w-8 h-8 rounded border-2 border-white bg-black font-mono font-bold text-sm tracking-tighter text-white shadow-[2px_2px_0px_rgba(255,255,255,1)] group-hover:translate-x-[1px] group-hover:translate-y-[1px] group-hover:shadow-[1px_1px_0px_rgba(255,255,255,1)] transition-all">
            L
          </div>
          <span className="font-mono text-lg font-bold tracking-tight text-white group-hover:text-zinc-300 transition-colors">
            CodeMap
          </span>
        </Link>

        {/* Right Side: Navigation links for 'About', 'Docs', and a circular User Profile icon */}
        <div className="flex items-center gap-6">
          <Link 
            href="/#about" 
            className="text-zinc-400 text-sm hover:text-white transition-colors"
          >
            About
          </Link>
          <Link 
            href="/#docs" 
            className="text-zinc-400 text-sm hover:text-white transition-colors"
          >
            Docs
          </Link>
          
          <button 
            type="button"
            className="flex items-center justify-center w-8 h-8 rounded-full border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-500 transition-all text-zinc-300 hover:text-white"
            aria-label="User Profile"
          >
            <User className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
