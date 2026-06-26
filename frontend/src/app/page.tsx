import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-[#F4F4F5] text-[#1E1F22] overflow-hidden font-sans">
      
      {/* Next-generation visualization tag - Pinned near top */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 flex items-center justify-center z-50 w-full max-w-sm">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#1E1F22]/20 bg-white/50 backdrop-blur-sm text-xs font-medium text-[#1E1F22]/70 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF6231] animate-pulse"></span>
          <span>Next-generation visualization</span>
        </div>
      </div>

      {/* Top Navigation / Decorators */}
      {/* (Decorators removed by request) */ }

      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[400px] bg-[#FF6231] rounded-[100%] blur-[90px] opacity-80 mix-blend-multiply"></div>

      {/* Orbit Ring */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <svg width="800" height="600" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-[spin_15s_linear_infinite]">
          <ellipse cx="400" cy="300" rx="360" ry="170" transform="rotate(-20 400 300)" stroke="#1E1F22" strokeWidth="1.5" strokeOpacity="0.8"/>
          {/* Star on the orbit */}
          <path d="M93 385 L100 395 L110 402 L100 409 L93 419 L86 409 L76 402 L86 395 Z" fill="#1E1F22" transform="rotate(-20 93 402)" />
        </svg>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center select-none mt-[-60px]">

        <div className="flex flex-col items-center relative text-center">
          <span className="text-sm md:text-lg tracking-[0.3em] font-medium text-[#1E1F22] mb-[-12px]">
            VISUALIZE YOUR CODEBASE INSTANTLY
          </span>
          <h1 className="text-[100px] md:text-[150px] font-black tracking-tighter text-[#1E1F22] leading-none mix-blend-overlay">
            CODEMAP
          </h1>
          <span className="text-sm md:text-base tracking-[0.2em] font-bold text-[#1E1F22] mt-2 opacity-80 uppercase">
            AI-Powered Code-to-Architecture
          </span>
        </div>
      </div>

      {/* Call to Actions at the bottom */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-5 w-full px-6 z-20">
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link 
            href="/upload" 
            className="inline-flex items-center justify-center px-8 py-3.5 text-xs font-bold tracking-[0.15em] text-[#F4F4F5] bg-[#1E1F22] rounded-full hover:scale-105 transition-transform duration-200 uppercase shadow-xl"
          >
            Get Started
          </Link>
          <Link 
            href="/loading-state?folderId=mock-app" 
            className="inline-flex items-center justify-center px-8 py-3.5 text-xs font-bold tracking-[0.15em] text-[#1E1F22] border-2 border-[#1E1F22] rounded-full hover:bg-[#1E1F22]/5 transition-colors duration-200 uppercase"
          >
            Try Demo Mode
          </Link>
        </div>
        <a 
          href="/demo-project.zip" 
          download
          className="text-[10px] font-mono tracking-widest text-[#1E1F22]/50 hover:text-[#1E1F22] transition-colors uppercase"
        >
          Download Demo Codebase ZIP
        </a>
      </div>
      
    </div>
  );
}
