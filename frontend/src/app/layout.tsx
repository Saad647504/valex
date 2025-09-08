import type { Metadata } from "next";
import { Inter, Kalam } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/authcontext";
import { PerformanceProvider } from "@/contexts/performancecontext";
import { ProjectProvider } from "@/contexts/projectcontext";
import { TimerProvider } from "@/contexts/timercontext";
import { NotificationProvider } from "@/contexts/notificationcontext";

const inter = Inter({ subsets: ["latin"] });
const kalam = Kalam({ 
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-handwriting"
});

export const metadata: Metadata = {
  title: {
    default: 'Valex – Task Management',
    template: '%s – Valex',
  },
  description: 'Professional task management for development teams',
  icons: {
    icon: ['/favicon.ico', '/favicon.svg', { url: '/favicon.png', type: 'image/png' }],
  },
  openGraph: {
    title: 'Valex – Task Management',
    description: 'Professional task management for development teams',
    url: '/',
    siteName: 'Valex',
    type: 'website',
    images: ['/og.svg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${kalam.variable}`}>
        {/* Epic Animated Background System */}
        <div className="fixed inset-0 -z-50 bg-black overflow-hidden">
          {/* Base gradient layers */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-black to-emerald-900/20" />
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-900/10 via-transparent to-green-900/20" />
          
          {/* Dynamic gradient orbs */}
          <div 
            className="absolute top-10 -left-20 w-96 h-96 bg-gradient-to-r from-green-500/30 to-cyan-500/30 rounded-full blur-3xl opacity-70"
            style={{ animation: 'orb1 20s ease-in-out infinite' }}
          />
          <div 
            className="absolute top-1/2 -right-32 w-80 h-80 bg-gradient-to-l from-cyan-400/20 to-green-400/30 rounded-full blur-3xl opacity-60"
            style={{ animation: 'orb2 25s ease-in-out infinite reverse' }}
          />
          <div 
            className="absolute bottom-20 left-1/3 w-72 h-72 bg-gradient-to-t from-emerald-500/25 to-cyan-500/25 rounded-full blur-3xl opacity-50"
            style={{ animation: 'orb3 30s ease-in-out infinite' }}
          />
          
          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 50 }, (_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-cyan-400/30 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animation: `particle${(i % 3) + 1} ${15 + Math.random() * 10}s linear infinite`,
                  animationDelay: `${Math.random() * 15}s`,
                }}
              />
            ))}
          </div>
          
          {/* Dynamic grid overlay */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(6, 182, 212, 0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(34, 197, 94, 0.3) 1px, transparent 1px)
              `,
              backgroundSize: '100px 100px',
              animation: 'gridMove 40s linear infinite',
            }}
          />
          
          {/* Radial pulse effects */}
          <div 
            className="absolute top-1/4 left-1/4 w-4 h-4 bg-green-400/40 rounded-full"
            style={{ animation: 'pulse1 4s ease-in-out infinite' }}
          />
          <div 
            className="absolute top-3/4 right-1/3 w-3 h-3 bg-cyan-400/40 rounded-full"
            style={{ animation: 'pulse2 6s ease-in-out infinite' }}
          />
          <div 
            className="absolute top-1/2 left-3/4 w-2 h-2 bg-emerald-400/50 rounded-full"
            style={{ animation: 'pulse3 5s ease-in-out infinite' }}
          />
        </div>
        
        <PerformanceProvider>
          <AuthProvider>
            <ProjectProvider>
              <TimerProvider>
                <NotificationProvider>
                  <div className="relative z-10">
                    {children}
                  </div>
                </NotificationProvider>
              </TimerProvider>
            </ProjectProvider>
          </AuthProvider>
        </PerformanceProvider>
      </body>
    </html>
  );
}
