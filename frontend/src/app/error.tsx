'use client';

import { useEffect } from 'react';
import { Josefin_Sans } from 'next/font/google';
import { XCircle } from 'lucide-react';

const josefinSans = Josefin_Sans({ subsets: ['latin'] });

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void; }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('App error boundary:', error);
  }, [error]);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950 relative overflow-hidden ${josefinSans.className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(239,68,68,0.08),transparent_50%),radial-gradient(ellipse_at_bottom,rgba(59,130,246,0.06),transparent_50%)]" />
      <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
        <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-black/70 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-8 text-center">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full grid place-items-center bg-gradient-to-br from-red-400/25 to-transparent text-red-300">
            <XCircle className="w-6 h-6" />
          </div>
          <h1 className="text-2xl text-white font-medium mb-2">Something went wrong</h1>
          <p className="text-slate-300 text-sm mb-6">An unexpected error occurred. You can try again.</p>
          <button onClick={() => reset()} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10">
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}

