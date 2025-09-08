'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from 'framer-motion';
import { Clock, ArrowRight, Target, TrendingUp, Zap } from 'lucide-react';
import { Josefin_Sans } from 'next/font/google';
import { usePerformanceIntersection } from '@/hooks/useperformanceintersection';

const josefinSans = Josefin_Sans({ subsets: ['latin'] });

// VALEX Focus Timer Interface
const HolographicTimerInterface = () => {
  // Start with 3 minutes (faster demo but more realistic) - counting down
  const [remainingSeconds, setRemainingSeconds] = useState(180); // 3 minutes
  const [isCompleted, setIsCompleted] = useState(false);
  
  useEffect(() => {
    if (isCompleted) return; // Don't run timer if completed
    
    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 0) {
          setIsCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 150); // Even faster demo - ~7x speed
    
    return () => clearInterval(interval);
  }, [isCompleted]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const totalDuration = 180; // 3 minutes total
  const progress = isCompleted ? 100 : ((totalDuration - remainingSeconds) / totalDuration) * 100;

  return (
    <div className="relative p-6 bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden group">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br from-green-500 to-cyan-400" />
        
        {/* Subtle background grid */}
        <motion.div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '30px 30px'
          }}
        />
        

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-medium text-white mb-1">Focus Timer</h3>
            <p className="text-xs text-slate-400">Productivity session</p>
          </div>
          <div className="w-2 h-2 bg-white/40 rounded-full" />
        </div>

        {/* Main Content - Better Organization */}
        <div className="relative z-10 space-y-6">
          {/* Top Row - Timer and Controls */}
          <div className="grid lg:grid-cols-3 gap-6 items-center">
            {/* Timer Display */}
            <div className="text-center lg:text-left">
              <motion.div
                initial={false}
                animate={{
                  scale: isCompleted ? [1, 1.05, 1] : 1,
                  opacity: 1
                }}
                transition={{
                  duration: 0.6,
                  ease: "easeInOut"
                }}
              >
                {!isCompleted ? (
                  <motion.div
                    key="timer"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className={`text-4xl font-light text-white mb-1 ${josefinSans.className}`}>
                      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                    </div>
                    <div className="text-sm text-slate-400 mb-3">Focus Session Active</div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="complete"
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      duration: 0.5,
                      ease: "easeOut",
                      delay: 0.1
                    }}
                  >
                    <div className={`text-3xl font-light text-green-400 mb-1 ${josefinSans.className}`}>
                      Session Complete
                    </div>
                    <div className="text-sm text-slate-300 mb-3">Great work! Take a well-deserved break.</div>
                  </motion.div>
                )}
              </motion.div>
              
              {/* Simple Progress Bar */}
              <div className="space-y-3">
                <div className="w-full max-w-sm mx-auto lg:mx-0 bg-white/5 rounded-full h-2 overflow-hidden">
                  <motion.div 
                    className={`h-full rounded-full ${
                      isCompleted 
                        ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
                        : 'bg-gradient-to-r from-green-500 to-cyan-500'
                    }`}
                    animate={{
                      width: `${progress}%`,
                      boxShadow: [
                        '0 0 8px rgba(34, 197, 94, 0.4)',
                        '0 0 16px rgba(34, 197, 94, 0.6)',
                        '0 0 8px rgba(34, 197, 94, 0.4)'
                      ]
                    }}
                    transition={{ 
                      width: { duration: 0.3, ease: "easeOut" },
                      boxShadow: { duration: 2, repeat: Infinity }
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className={`px-2 py-1 rounded ${
                    isCompleted 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-green-500/20 text-green-400'
                  }`}>
                    {isCompleted ? '✓ Completed' : 'Deep Focus'}
                  </span>
                  <span className="text-slate-400">
                    {isCompleted ? 'Task accomplished!' : `${Math.round(progress)}% complete`}
                  </span>
                </div>
              </div>
            </div>

            {/* Current Task - Center */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-xs text-slate-400">Active Task</span>
              </div>
              <div className="text-sm text-white font-medium mb-2">Fix payment integration bug</div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-cyan-400">Alex Rodriguez</span>
                <span className="text-slate-400">Session #3</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5">
                <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-cyan-500 w-4/5" />
              </div>
            </div>

            {/* Today's Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: '6h 45m', label: 'Focused Today', color: 'text-green-400' },
                { value: '12/15', label: 'Pomodoros', color: 'text-cyan-400' },
                { value: '94%', label: 'Efficiency', color: 'text-green-400' }
              ].map((stat, index) => (
                <div key={index} className="text-center bg-white/5 rounded-lg p-3">
                  <div className={`text-sm font-medium ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Row - Team Activity */}
          <div className="border-t border-white/5 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm text-white font-medium">Team Focus Sessions</h4>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-slate-400">3 active</span>
              </div>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-3">
              {[
                { name: 'Sarah Chen', task: 'Auth system design', time: '23:45', status: 'active' },
                { name: 'Mike Johnson', task: 'UI component library', time: '05:30', status: 'break' },
                { name: 'Alex Rodriguez', task: 'Payment integration bug', time: '18:22', status: 'active' }
              ].map((session, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        session.status === 'active' ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'
                      }`} />
                      <span className="text-sm text-white font-medium">{session.name}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      session.status === 'active' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {session.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 mb-1">{session.task}</div>
                  <div className="text-xs text-slate-500">{session.time} elapsed</div>
                </div>
              ))}
            </div>
          </div>
        </div>
    </div>
  );
};

export default function FocusTimerSection() {
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
      className={`landing-section ${josefinSans.className}`}
      style={{ 
        opacity: reducedMotion ? 1 : smoothOpacity,
        y: reducedMotion ? 0 : smoothY,
      }}
    >
      <div className="relative max-w-7xl mx-auto px-8 lg:px-12 z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={hasBeenVisible ? "visible" : "hidden"}
          className="text-center min-h-[80vh] flex flex-col justify-center"
        >
          {/* Centered Header */}
          <motion.div variants={itemVariants} className="mb-8">
            {/* Premium Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg mb-6">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span className="text-xs text-cyan-300 font-medium">FOCUS TIMER</span>
            </div>
            
            {/* Title */}
            <h2 className="text-3xl md:text-4xl font-light mb-4 leading-tight text-white">
              Deep
              <span className="block text-transparent bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text font-normal">
                focus
              </span>
            </h2>
            
            <p className="text-sm text-slate-300 leading-relaxed max-w-lg mx-auto">
              Premium Pomodoro technique with intelligent break intervals.
            </p>
          </motion.div>
          
          {/* Timer Interface */}
          <motion.div variants={itemVariants} className="mb-8">
            <HolographicTimerInterface />
          </motion.div>
          
          {/* Bottom Features Row */}
          <motion.div variants={itemVariants} className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            {[
              { icon: Target, label: 'Smart Goals' },
              { icon: TrendingUp, label: 'Progress' },
              { icon: Zap, label: 'Focus Boost' }
            ].map((feature, index) => (
              <motion.div 
                key={index} 
                className="text-center group"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform">
                  <feature.icon className="w-5 h-5 text-cyan-400" />
                </div>
                <h4 className="text-sm font-medium text-white">{feature.label}</h4>
              </motion.div>
            ))}
          </motion.div>
          
          {/* CTA */}
          <motion.div variants={itemVariants} className="mt-8">
            <motion.button 
              className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-green-600 rounded-lg text-white text-sm font-medium transition-all hover:shadow-lg hover:shadow-cyan-500/20"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>Start Focus Session</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
}