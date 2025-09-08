'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from 'framer-motion';
import { BarChart3, Activity, Target, Zap, Users, Github, Cpu, ArrowRight } from 'lucide-react';
import { Josefin_Sans } from 'next/font/google';
import { usePerformanceIntersection } from '@/hooks/useperformanceintersection';

const josefinSans = Josefin_Sans({ subsets: ['latin'] });

// VALEX Analytics Dashboard
const ExplosiveAnalyticsDashboard = ({ hasBeenVisible }: { hasBeenVisible: boolean }) => {
  const [animatedValues, setAnimatedValues] = useState<{[key: string]: number}>({});
  
  const kpiData = [
    { 
      id: 'completion', 
      label: 'Task Completion', 
      value: 94, 
      unit: '%', 
      subtitle: 'Redis cached',
      icon: Target
    },
    { 
      id: 'velocity', 
      label: 'AI Accuracy', 
      value: 92, 
      unit: '%', 
      subtitle: 'OpenAI powered',
      icon: Cpu
    },
    { 
      id: 'tasks', 
      label: 'GitHub Repos', 
      value: 8, 
      unit: '', 
      subtitle: 'Live webhooks',
      icon: Github
    },
    { 
      id: 'members', 
      label: 'Team Online', 
      value: 12, 
      unit: '', 
      subtitle: 'Socket.io',
      icon: Users
    }
  ];

  const weeklyData = [
    { week: 'W1', tasks: 23, commits: 45 },
    { week: 'W2', tasks: 31, commits: 52 },
    { week: 'W3', tasks: 28, commits: 38 },
    { week: 'W4', tasks: 35, commits: 61 },
    { week: 'W5', tasks: 38, commits: 55 }
  ];

  useEffect(() => {
    // Animate number counters
    kpiData.forEach((kpi, index) => {
      const start = 0;
      const end = typeof kpi.value === 'number' ? kpi.value : parseFloat(String(kpi.value));
      const duration = 2000;
      const startTime = Date.now() + (index * 200); // Stagger animations
      
      const animate = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        
        if (elapsed < 0) {
          requestAnimationFrame(animate);
          return;
        }
        
        const progress = Math.min(elapsed / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = start + (end - start) * easeOutQuart;
        
        setAnimatedValues(prev => ({
          ...prev,
          [kpi.id]: current
        }));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    });
  }, []);

  return (
    <div className="space-y-8">
      {/* Professional Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi) => {
          const animatedValue = animatedValues[kpi.id] || 0;
          const displayValue = typeof kpi.value === 'number' && kpi.value % 1 !== 0 
            ? animatedValue.toFixed(1) 
            : Math.round(animatedValue);
            
          return (
            <div
              key={kpi.id}
              className="relative p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl group hover:border-slate-600/70 hover:bg-slate-800/60 transition-all duration-500 shadow-lg"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-slate-700/50 rounded-lg flex items-center justify-center border border-slate-600/30">
                  <kpi.icon className="w-5 h-5 text-slate-300" />
                </div>
              </div>
              
              <div className="mb-4">
                <div className="text-3xl font-light text-white mb-2 tracking-tight">
                  {displayValue}{kpi.unit}
                </div>
                <div className="text-base font-medium text-slate-200 mb-2">
                  {kpi.label}
                </div>
                <div className="text-sm text-slate-500">
                  {kpi.subtitle}
                </div>
              </div>
              
              <div className="h-px bg-slate-600/40"></div>
            </div>
          );
        })}
      </div>

      {/* Main Chart Panel */}
      <div className="relative p-6 bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-medium text-white mb-1">Team Performance</h3>
              <p className="text-xs text-slate-400">Last 30 days</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-slate-300">Live</span>
            </div>
          </div>

          {/* Simple Clean Chart */}
          <div className="relative h-32 flex items-end justify-between mb-6 w-full max-w-lg mx-auto">
            {weeklyData.map((week, index) => {
              const maxValue = Math.max(...weeklyData.map(w => Math.max(w.tasks, w.commits)));
              const taskHeight = (week.tasks / maxValue) * 100;
              const commitHeight = (week.commits / maxValue) * 100;
              
              return (
                <motion.div 
                  key={week.week} 
                  className="flex flex-col items-center gap-2 flex-1"
                  initial={{ opacity: 0, y: 20 }}
                  animate={hasBeenVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ delay: index * 0.15 + 0.5, duration: 0.4 }}
                >
                  <div className="flex items-end gap-1.5 w-full max-w-12 h-24 mx-auto">
                    {/* Tasks Bar */}
                    <motion.div
                      className="flex-1 bg-gradient-to-t from-cyan-600/80 to-cyan-400/90 rounded-t-sm relative shadow-sm"
                      style={{
                        boxShadow: '0 0 8px rgba(6, 182, 212, 0.3)'
                      }}
                      initial={{ height: 0, opacity: 0 }}
                      animate={hasBeenVisible ? { 
                        height: `${taskHeight}%`, 
                        opacity: 1 
                      } : { 
                        height: 0, 
                        opacity: 0 
                      }}
                      transition={{ 
                        delay: index * 0.15 + 0.8, 
                        duration: 0.6,
                        ease: "easeOut"
                      }}
                    />
                    {/* Commits Bar */}
                    <motion.div
                      className="flex-1 bg-gradient-to-t from-green-600/80 to-green-400/90 rounded-t-sm relative shadow-sm"
                      style={{
                        boxShadow: '0 0 8px rgba(34, 197, 94, 0.3)'
                      }}
                      initial={{ height: 0, opacity: 0 }}
                      animate={hasBeenVisible ? { 
                        height: `${commitHeight}%`, 
                        opacity: 1 
                      } : { 
                        height: 0, 
                        opacity: 0 
                      }}
                      transition={{ 
                        delay: index * 0.15 + 1.0, 
                        duration: 0.6,
                        ease: "easeOut"
                      }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 font-medium">{week.week}</span>
                </motion.div>
              );
            })}
          </div>
          
          {/* Chart Legend */}
          <div className="flex items-center justify-center gap-8 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-t from-cyan-600 to-cyan-400 rounded shadow-sm" style={{ boxShadow: '0 0 6px rgba(6, 182, 212, 0.4)' }}></div>
              <span className="text-xs text-slate-400">Tasks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-t from-green-600 to-green-400 rounded shadow-sm" style={{ boxShadow: '0 0 6px rgba(34, 197, 94, 0.4)' }}></div>
              <span className="text-xs text-slate-400">Commits</span>
            </div>
          </div>

          {/* Bottom Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
            <div className="text-center">
              <div className="text-lg font-light text-green-400 mb-1">156%</div>
              <div className="text-xs text-slate-400">Growth</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-light text-cyan-400 mb-1">99.9%</div>
              <div className="text-xs text-slate-400">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-light text-green-400 mb-1">&lt;50ms</div>
              <div className="text-xs text-slate-400">Response</div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default function AnalyticsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  
  const { ref: intersectionRef, hasBeenVisible } = usePerformanceIntersection({
    threshold: 0.1,
    rootMargin: '100px',
  });
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "5%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 1]);
  
  const smoothY = useSpring(y, { damping: 50, stiffness: 100 });
  const smoothOpacity = useSpring(opacity, { damping: 30, stiffness: 80 });
  
  const combinedRef = useCallback((node: HTMLElement | null) => {
    if (node) {
      (sectionRef as React.MutableRefObject<HTMLElement | null>).current = node;
      intersectionRef(node);
    }
  }, [intersectionRef]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const }
    }
  };
  
  return (
    <motion.section 
      ref={combinedRef}
      className={`landing-section min-h-screen flex ${josefinSans.className}`}
      style={{ 
        opacity: reducedMotion ? 1 : smoothOpacity,
        y: reducedMotion ? 0 : smoothY,
      }}
    >
      <div className="relative max-w-7xl mx-auto px-8 lg:px-12 z-10 flex-1">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={hasBeenVisible ? "visible" : "hidden"}
          className="space-y-8 min-h-full flex flex-col justify-center"
        >
          {/* Top Row - Split Header */}
          <div className="grid lg:grid-cols-2 gap-8 items-end">
            {/* Left - Title */}
            <motion.div variants={itemVariants}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg mb-6">
                <BarChart3 className="w-3 h-3 text-cyan-400" />
                <span className="text-xs text-cyan-300 font-medium">ANALYTICS</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-light mb-4 leading-tight text-white">
                Data-driven
                <span className="text-transparent bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text font-normal"> insights</span>
              </h2>
            </motion.div>
            
            {/* Right - Quick Stats */}
            <motion.div variants={itemVariants} className="grid grid-cols-3 gap-6">
              {[
                { value: '99.9%', label: 'Uptime', color: 'green' },
                { value: '2.1s', label: 'Load Time', color: 'cyan' },
                { value: '94%', label: 'Accuracy', color: 'green' }
              ].map((stat, index) => (
                <div key={index} className="text-right">
                  <div className={`text-2xl font-light mb-1 ${
                    stat.color === 'green' ? 'text-green-400' : 'text-cyan-400'
                  }`}>
                    {stat.value}
                  </div>
                  <div className="text-xs text-slate-400">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
          
          {/* Middle Row - Full Width Dashboard */}
          <motion.div variants={itemVariants}>
            <ExplosiveAnalyticsDashboard hasBeenVisible={hasBeenVisible} />
          </motion.div>
          
          {/* Bottom Row - Compact Features */}
          <motion.div variants={itemVariants} className="grid lg:grid-cols-4 gap-6">
            {[
              { icon: Activity, label: 'Real-time' },
              { icon: Target, label: 'Metrics' },
              { icon: Zap, label: 'Predictive' },
              { icon: Users, label: 'Reports' }
            ].map((feature, index) => (
              <motion.div 
                key={index}
                className="flex items-center gap-3 group"
                variants={itemVariants}
              >
                <div className="w-8 h-8 bg-cyan-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <feature.icon className="w-4 h-4 text-cyan-400" />
                </div>
                <span className="text-sm font-medium text-white">{feature.label}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div variants={itemVariants}>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('navigate', { detail: 'login' }));
                }
              }}
              className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-green-600 rounded-lg text-white text-sm font-medium transition-all hover:shadow-lg hover:shadow-cyan-500/20 hover:scale-[1.02]"
            >
              <span>Explore Analytics</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
}
