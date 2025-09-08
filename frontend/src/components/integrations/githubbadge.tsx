'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Josefin_Sans } from 'next/font/google';
const josefinSans = Josefin_Sans({ subsets: ['latin'] });
import { Github, CheckCircle2, Info, ExternalLink } from 'lucide-react';
import { githubAPI } from '@/lib/api';

export default function GithubBadge() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [webhookPath, setWebhookPath] = useState<string>('/api/github/webhook');
  const [open, setOpen] = useState(false);
  const pillRef = useRef<HTMLButtonElement | null>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    githubAPI.getStatus().then((res) => {
      if (!mounted) return;
      setConnected(!!res.connected);
      if (res.webhookPath) setWebhookPath(res.webhookPath);
    }).catch(() => {
      if (!mounted) return;
      setConnected(false);
    });
    return () => { mounted = false; };
  }, []);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const payloadUrl = `${origin}${webhookPath}`;

  useEffect(() => {
    if (!open) return;
    const update = () => {
      const el = pillRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setCoords({ top: rect.bottom + 8, left: rect.right });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    const handleClickOutside = (e: MouseEvent) => {
      const pill = pillRef.current;
      const dd = dropdownRef.current;
      if (!pill || !dd) return;
      const target = e.target as Node;
      if (!pill.contains(target) && !dd.contains(target)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const Pill = (
    <button
      ref={pillRef}
      onClick={() => setOpen((v) => !v)}
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs border transition-all whitespace-nowrap ${
        connected ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-slate-700/50 text-slate-300 border-slate-600/40'
      }`}
      title={connected ? 'GitHub Webhook Connected' : 'Connect GitHub'}
    >
      <Github className="w-3.5 h-3.5" />
      {connected ? 'GitHub Connected' : 'Connect GitHub'}
    </button>
  );

  return (
    <div className="relative inline-block">
      {Pill}
      {open && coords && createPortal(
        <div
          ref={dropdownRef}
          className={`z-[9999] w-[min(92vw,28rem)] bg-[#0b0f1a] border border-slate-700 rounded-xl shadow-2xl p-4 text-white ${josefinSans.className}`}
          style={{ position: 'fixed', top: coords.top, left: coords.left, transform: 'translateX(-100%)', maxHeight: '24rem', overflow: 'auto' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Github className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium">GitHub Integration</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
          </div>

          {connected && (
            <div className="inline-flex items-center gap-1 text-emerald-300 text-[11px] mb-2">
              <CheckCircle2 className="w-3.5 h-3.5" /> Status: Connected
            </div>
          )}
          <p className="text-[11px] text-slate-300 mb-2">
            Connect GitHub to see commits and pull requests on your board.
          </p>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-2.5">
              <div className="text-[10px] text-slate-400 mb-1">Webhook URL</div>
              <div className="flex items-center gap-2">
                <input readOnly value={payloadUrl} className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[11px] font-mono text-cyan-300 overflow-hidden text-ellipsis" />
                <button onClick={() => navigator.clipboard.writeText(payloadUrl)} className="px-2 py-1 text-[11px] bg-slate-700 rounded border border-slate-600 hover:bg-slate-600">Copy</button>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-lg p-2.5">
              <div className="text-[10px] text-slate-400 mb-1">Webhook Secret</div>
              <div className="text-[11px] text-slate-400">Ask your teammate/server admin for the secret (GITHUB_WEBHOOK_SECRET).</div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-lg p-2.5 space-y-2">
              <div className="flex items-start gap-2 text-slate-300">
                <Info className="w-4 h-4 mt-0.5 text-blue-400" />
                <div className="text-[11px] leading-relaxed">
                  <div className="font-medium text-slate-200 mb-1">What it does</div>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Commits/PRs show up on your project activity.</li>
                    <li>Include a task key (e.g., <span className="text-cyan-300">PROJ-12</span>) in a commit/PR title to link it to that task.</li>
                    <li>Tasks stay tasks — commits don’t create tasks, they attach to them.</li>
                  </ul>
                  <div className="mt-2 text-slate-400">
                    <span className="text-slate-300">Example:</span> fix validation <span className="text-cyan-300">[PROJ-12]</span> or feat: <span className="text-cyan-300">PROJ-12</span> add auth flow
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-slate-400">
                Quick setup: Repo → Settings → Webhooks → Add webhook → paste URL → type <span className="text-slate-200">application/json</span> → secret <span className="text-slate-200">GITHUB_WEBHOOK_SECRET</span> → events <span className="text-slate-200">push</span> + <span className="text-slate-200">pull_request</span>.
              </div>
            </div>
            <div className="flex items-center justify-end">
              <a href="https://docs.github.com/en/developers/webhooks-and-events/webhooks/about-webhooks" target="_blank" className="inline-flex items-center gap-1 text-[11px] text-cyan-300 hover:text-cyan-200">
                Learn more <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>, document.body)
      }
    </div>
  );
}
