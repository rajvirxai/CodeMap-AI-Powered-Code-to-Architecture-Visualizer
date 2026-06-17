import Link from 'next/link';
import { Folder, GitBranch, ArrowRight, Sparkles } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-between p-6 md:p-12 max-w-4xl mx-auto w-full text-center">
      {/* Spacer/Top Padding */}
      <div className="h-4" />

      {/* Main Content Area */}
      <div className="flex flex-col items-center justify-center space-y-8 my-auto">
        {/* Subtle decorative tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/50 text-xs font-medium text-zinc-400">
          <Sparkles className="w-3.5 h-3.5 text-zinc-500 animate-pulse" />
          <span>Next-generation visualization</span>
        </div>

        {/* Headline & Subheadline */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white font-sans max-w-2xl leading-tight">
            Visualize Your <span className="text-zinc-400">Codebase</span> Instantly
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 font-mono tracking-tight font-medium max-w-md mx-auto">
            AI-Powered Code-to-Architecture
          </p>
        </div>

        {/* Action Button: Get Started */}
        <div className="pt-4">
          <Link 
            href="/upload" 
            className="inline-flex items-center justify-center px-8 py-4 text-base font-bold font-mono tracking-wide text-black bg-white border-2 border-white rounded shadow-[4px_4px_0px_rgba(255,255,255,0.3)] hover:shadow-[2px_2px_0px_rgba(255,255,255,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-zinc-200 transition-all duration-200"
          >
            Get Started
          </Link>
        </div>
      </div>

      {/* Graphic Footer: Abstract visual dashed boundary box showing workflow */}
      <div className="w-full max-w-lg mt-12">
        <div className="border border-dashed border-zinc-800 bg-zinc-950/40 rounded-xl p-8 flex items-center justify-around relative overflow-hidden group shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          {/* Subtle grid background pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />

          {/* Folder Node */}
          <div className="flex flex-col items-center gap-2 z-10 group-hover:scale-105 transition-transform duration-300">
            <div className="w-16 h-16 rounded-lg border border-zinc-700 bg-zinc-900 flex items-center justify-center shadow-lg shadow-black/40">
              <Folder className="w-8 h-8 text-zinc-300" />
            </div>
            <span className="text-xs font-mono text-zinc-500">Source ZIP</span>
          </div>

          {/* Connection / Flow Arrow */}
          <div className="flex flex-col items-center gap-1 z-10 flex-1 px-4 max-w-[150px]">
            <span className="text-[10px] font-mono text-zinc-500 tracking-wider uppercase animate-pulse">
              AI Analysis
            </span>
            <div className="w-full flex items-center justify-center relative">
              <div className="w-full h-[1px] bg-dashed border-t border-dashed border-zinc-700" />
              <ArrowRight className="w-4 h-4 text-zinc-400 absolute right-0" />
            </div>
          </div>

          {/* Network Graph Node */}
          <div className="flex flex-col items-center gap-2 z-10 group-hover:scale-105 transition-transform duration-300">
            <div className="w-16 h-16 rounded-lg border border-zinc-700 bg-zinc-900 flex items-center justify-center shadow-lg shadow-black/40">
              <GitBranch className="w-8 h-8 text-zinc-100 rotate-90" />
            </div>
            <span className="text-xs font-mono text-zinc-500">Architecture</span>
          </div>
        </div>
      </div>
    </div>
  );
}
