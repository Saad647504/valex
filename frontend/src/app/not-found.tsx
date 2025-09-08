'use client';

import Link from 'next/link';
import { Josefin_Sans } from 'next/font/google';
import { AlertTriangle } from 'lucide-react';

const josefinSans = Josefin_Sans({ subsets: ['latin'] });

export default function NotFound() {
  return (
    <div className={`min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950 ${josefinSans.className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.1),transparent_50%),radial-gradient(ellipse_at_bottom,rgba(16,185,129,0.08),transparent_50%)]" />
      <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
        <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-black/70 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-8 text-center">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full grid place-items-center bg-gradient-to-br from-cyan-400/25 to-transparent text-cyan-300">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h1 className="text-2xl text-white font-medium mb-2">Page Not Found</h1>
          <p className="text-slate-300 text-sm mb-6">The page you’re looking for doesn’t exist or may have moved.</p>
          <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border border-cyan-500/30">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}

