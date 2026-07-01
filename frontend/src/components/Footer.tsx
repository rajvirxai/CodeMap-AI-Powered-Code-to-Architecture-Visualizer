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

  // Determine if this is a light-themed page
  const isLightPage = pathname === '/contributors' || 
                      pathname === '/privacy' || 
                      pathname === '/terms';

  const footerClass = isLightPage
    ? 'w-full border-t border-[#E5E0D5] bg-[#F0EDE4] text-neutral-500 py-8 px-6 mt-auto shrink-0 z-10 transition-colors duration-300'
    : 'w-full border-t border-zinc-900 bg-zinc-950 text-zinc-500 py-8 px-6 mt-auto shrink-0 z-10 transition-colors duration-300';

  const sepClass = isLightPage ? 'text-[#E5E0D5]' : 'text-zinc-800';
  const linkClass = isLightPage ? 'hover:text-[#1E1F22] transition-colors' : 'hover:text-white transition-colors';

  return (
    <footer className={footerClass}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Branding & Copyright */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span>&copy; {currentYear} CodeMap.</span>
          <span className={sepClass}>|</span>
          <span>AI-Powered Code-to-Architecture</span>
        </div>

        {/* Right: Routes & Legal Links */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-mono">
          <Link href="/contributors" className={linkClass}>
            Contributors
          </Link>
          <Link href="/privacy" className={linkClass}>
            Privacy Policy
          </Link>
          <Link href="/terms" className={linkClass}>
            Terms & Conditions
          </Link>
        </div>
      </div>
    </footer>
  );
}
