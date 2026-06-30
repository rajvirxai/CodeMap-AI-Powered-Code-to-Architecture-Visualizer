import Link from 'next/link';
import { User } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="w-full border-b border-zinc-800 bg-zinc-950/70 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left Side: Brand Logo box placeholder [L] containing text "CodeMap" */}
        <Link href="/" className="flex items-center gap-3 group select-none">
          {/* Logo Emblem SVG */}
          <svg 
            width="44" 
            height="25" 
            viewBox="0 0 88 50" 
            fill="none" 
            className="text-zinc-500 group-hover:text-zinc-300 transition-colors duration-200"
          >
            {/* Edge Connections */}
            <path 
              d="M 15 25 L 28 12 L 38 22 L 48 12 L 60 26 L 72 12 L 72 38 M 28 38 L 38 22 L 48 38 M 15 25 L 28 38 M 48 12 L 48 38" 
              stroke="currentColor" 
              strokeWidth="4" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
            {/* Nodes */}
            <circle cx="15" cy="25" r="4.5" fill="#EBB19E" stroke="currentColor" strokeWidth="2.5" />
            <circle cx="28" cy="12" r="4.5" fill="#4FA8A8" stroke="currentColor" strokeWidth="2.5" />
            <circle cx="28" cy="38" r="4.5" fill="#4FA8A8" stroke="currentColor" strokeWidth="2.5" />
            <circle cx="48" cy="12" r="4.5" fill="#EBB19E" stroke="currentColor" strokeWidth="2.5" />
            <circle cx="48" cy="38" r="4.5" fill="#A297B0" stroke="currentColor" strokeWidth="2.5" />
            <circle cx="60" cy="26" r="4.5" fill="#EBB19E" stroke="currentColor" strokeWidth="2.5" />
            <circle cx="72" cy="12" r="4.5" fill="#A297B0" stroke="currentColor" strokeWidth="2.5" />
            <circle cx="72" cy="38" r="4.5" fill="#4FA8A8" stroke="currentColor" strokeWidth="2.5" />
          </svg>
          
          {/* Logo Typography */}
          <div className="flex flex-col">
            <span className="font-mono text-base font-bold tracking-tight text-white leading-none">
              CodeMap
            </span>
            <span className="text-[7px] font-sans tracking-[0.2em] font-extrabold text-zinc-500 uppercase leading-none mt-1 group-hover:text-zinc-400 transition-colors">
              Project Visualizer
            </span>
          </div>
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
