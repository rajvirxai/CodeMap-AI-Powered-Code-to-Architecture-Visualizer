'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  // Hide footer on dashboard canvas to maximize visual workspace
  if (pathname?.startsWith('/dashboard')) {
    return null;
  }

  return (
    <footer className="w-full border-t border-zinc-900 bg-zinc-950 text-zinc-500 py-8 px-6 mt-auto shrink-0 z-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Branding & Copyright */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span>&copy; {currentYear} CodeMap.</span>
          <span className="text-zinc-800">|</span>
          <span>AI-Powered Code-to-Architecture</span>
        </div>

        {/* Right: Routes & Legal Links */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-mono">
          <Link href="/contributors" className="hover:text-white transition-colors">
            Contributors
          </Link>
          <Link href="/privacy" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-white transition-colors">
            Terms & Conditions
          </Link>
        </div>
      </div>
    </footer>
  );
}
