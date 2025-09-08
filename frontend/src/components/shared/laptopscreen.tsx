'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Brain, Activity, Network, Atom, Layers, Binary } from 'lucide-react';

interface Particle {
    id: number;
    x: number;
    y: number;
    delay: number;
    duration: number;
  }

export default function LaptopScreen() {
  const [currentView, setCurrentView] = useState(-1);
  const [showWelcome, setShowWelcome] = useState(true);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Create floating particles for welcome screen
    const createParticles = () => {
      const newParticles = Array.from({ length: 15 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 3,
        duration: 8 + Math.random() * 4
      }));
      setParticles(newParticles);
    };

    createParticles();

    // Show welcome for 4 seconds, then start cycling
    const welcomeTimer = setTimeout(() => {
      setShowWelcome(false);
      setCurrentView(0);
    }, 4000);

    return () => clearTimeout(welcomeTimer);
  }, []);

  useEffect(() => {
    if (!showWelcome) {
      const interval = setInterval(() => {
        setCurrentView(prev => (prev + 1) % 4);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [showWelcome]);

  const features = [
    {
      title: 'Analytics Intelligence',
      icon: BarChart3,
      subtitle: 'Quantum Insights',
      content: (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-1 text-[7px]">
            <motion.div 
              className="bg-slate-800/40 p-1 rounded border border-cyan-500/30"
              whileHover={{ scale: 1.02, borderColor: 'rgba(6, 182, 212, 0.6)' }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-slate-400">Neural Efficiency</div>
              <motion.div 
                className="text-cyan-300 font-mono text-[8px]"
                animate={{ 
                  textShadow: [
                    '0 0 4px rgba(6, 182, 212, 0.8)',
                    '0 0 8px rgba(6, 182, 212, 1)',
                    '0 0 4px rgba(6, 182, 212, 0.8)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                97.3%
              </motion.div>
            </motion.div>
            <motion.div 
              className="bg-slate-800/40 p-1 rounded border border-cyan-500/30"
              whileHover={{ scale: 1.02, borderColor: 'rgba(6, 182, 212, 0.6)' }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-slate-400">Data Flow</div>
              <motion.div 
                className="text-cyan-300 font-mono text-[8px]"
                animate={{ opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                2.4TB/s
              </motion.div>
            </motion.div>
          </div>
          <div className="h-4 flex gap-px mt-2 items-end bg-slate-900/30 rounded p-0.5">
  {[0.3, 0.7, 0.5, 0.9, 0.6, 0.95, 0.4, 0.8, 0.7, 0.85].map((height, i) => (
    <motion.div
      key={i}
      className="flex-1 rounded-[1px]"
      style={{
        background: 'linear-gradient(to top, rgba(6, 182, 212, 0.8), rgba(59, 130, 246, 0.6))',
        transformOrigin: 'bottom'
      }}
      initial={{ scaleY: 0 }}
      animate={{ 
        scaleY: height,
        opacity: [0.8, 1, 0.8]
      }}
      transition={{ 
        scaleY: { delay: i * 0.05, duration: 0.6 },
        opacity: { duration: 2, repeat: Infinity, delay: i * 0.1 }
      }}
    />
  ))}
</div>
          <motion.div 
            className="text-[6px] text-cyan-400 font-mono text-center"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            Real-time processing active
          </motion.div>
        </div>
      )
    },
    {
      title: 'Neural Core',
      icon: Brain,
      subtitle: 'AI Orchestration',
      content: (
        <div className="space-y-2">
          <div className="flex items-center gap-1 mb-1">
            <motion.div
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                rotate: { duration: 4, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity }
              }}
              className="relative"
            >
              <Atom className="w-2 h-2 text-cyan-400" />
              <motion.div
                className="absolute inset-0 w-2 h-2 border border-cyan-400/30 rounded-full"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
            <span className="text-[7px] text-slate-300">Quantum Processing</span>
            <motion.div
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="text-cyan-400 text-[6px]"
            >
              ●
            </motion.div>
          </div>
          
          <div className="bg-slate-900/50 p-1.5 rounded border border-cyan-500/20 relative overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 h-full w-0.5 bg-cyan-400"
              animate={{ 
                scaleY: [0, 1, 0],
                y: [0, '100%', 0]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="text-[6px] text-slate-300 mb-1">
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Analyzing workflow patterns...
              </motion.span>
            </div>
            <div className="text-[6px] text-cyan-300 font-mono">
              <motion.span
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 3, repeat: Infinity }}
                className="inline-block overflow-hidden whitespace-nowrap"
              >
                Optimizing task distribution vectors
              </motion.span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-[6px] mt-1">
            <span className="text-slate-400">Neural Pathways</span>
            <div className="flex items-center gap-1">
              <div className="w-8 h-0.5 bg-slate-700 rounded-full overflow-hidden relative">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-400 to-cyan-300"
                  animate={{ 
                    x: ['-100%', '100%'],
                    opacity: [0, 1, 0]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                />
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-600/60 to-cyan-400/40 rounded-full"
                  animate={{ width: ['0%', '92%', '0%'] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
              <motion.span 
                className="text-cyan-300 font-mono text-[6px]"
                animate={{ 
                  scale: [1, 1.1, 1],
                  textShadow: [
                    '0 0 2px rgba(6, 182, 212, 0.5)',
                    '0 0 6px rgba(6, 182, 212, 0.8)',
                    '0 0 2px rgba(6, 182, 212, 0.5)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ACTIVE
              </motion.span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Quantum Board',
      icon: Layers,
      subtitle: 'Multi-dimensional Tasks',
      content: (
        <div className="space-y-1">
          <div className="flex gap-1 text-[6px]">
            {[
              { title: 'QUEUE', color: 'slate-700/40', tasks: 2, glow: false },
              { title: 'ACTIVE', color: 'cyan-500/30', tasks: 1, glow: true },
              { title: 'COMPLETE', color: 'slate-600/40', tasks: 4, glow: false }
            ].map((column, colIndex) => (
              <div 
                key={colIndex}
                className={`flex-1 bg-slate-800/30 rounded border border-${column.color} p-1 relative overflow-hidden`}
              >
                {column.glow && (
                  <motion.div
                    className="absolute inset-0 bg-cyan-400/5 rounded"
                    animate={{ opacity: [0, 0.3, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
                <div className={`text-slate-400 mb-1 font-medium ${column.glow ? 'text-cyan-300' : ''}`}>
                  {column.title}
                </div>
                <div className="space-y-0.5">
                  {Array.from({ length: column.tasks }, (_, i) => (
                    <motion.div 
                      key={i}
                      className={`h-1 rounded-sm ${
                        column.glow 
                          ? 'bg-gradient-to-r from-cyan-500 to-cyan-300' 
                          : 'bg-slate-500'
                      }`}
                      initial={{ 
                        x: colIndex === 0 ? -20 : colIndex === 2 ? 20 : 0, 
                        opacity: 0,
                        scale: 0.8
                      }}
                      animate={{ 
                        x: 0, 
                        opacity: 1,
                        scale: 1
                      }}
                      transition={{ 
                        delay: 0.2 + (colIndex * 0.1) + (i * 0.05), 
                        duration: 0.4,
                        type: "spring",
                        stiffness: 200
                      }}
                      whileHover={{ scale: 1.05, y: -1 }}
                    />
                  ))}
                </div>
                
                {column.glow && (
                  <motion.div
                    className="absolute -inset-0.5 border border-cyan-400/20 rounded pointer-events-none"
                    animate={{ 
                      borderColor: [
                        'rgba(6, 182, 212, 0.2)',
                        'rgba(6, 182, 212, 0.6)',
                        'rgba(6, 182, 212, 0.2)'
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </div>
            ))}
          </div>
          
          <div className="flex items-center justify-between text-[6px] mt-1">
            <div className="flex items-center gap-1">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Network className="w-2 h-2 text-slate-400" />
              </motion.div>
              <span className="text-slate-400">Sync Network</span>
            </div>
            <motion.div
              className="flex items-center gap-1"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <motion.div
                className="w-1 h-1 bg-cyan-400 rounded-full"
                animate={{ 
                  boxShadow: [
                    '0 0 2px rgba(6, 182, 212, 0.8)',
                    '0 0 8px rgba(6, 182, 212, 1)',
                    '0 0 2px rgba(6, 182, 212, 0.8)'
                  ]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="text-white font-mono">LIVE</span>
            </motion.div>
          </div>
        </div>
      )
    },
    {
      title: 'Nexus Protocol',
      icon: Binary,
      subtitle: 'Team Synchronization',
      content: (
        <div className="space-y-2">
          <div className="text-[7px] text-slate-300 mb-1 font-medium flex items-center gap-1">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-1 bg-cyan-400 rounded-full"
            />
            Active Connections
          </div>
          
          <div className="space-y-0.5">
            {[
              { id: 'JD', action: 'Code Review', status: 'active', color: 'cyan' },
              { id: 'SM', action: 'Sprint Planning', status: 'idle', color: 'slate' },
              { id: 'AL', action: 'Testing Suite', status: 'active', color: 'cyan' }
            ].map((user, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-1 text-[6px] p-1 bg-slate-800/20 rounded border border-slate-700/30 relative overflow-hidden"
                initial={{ x: -15, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ 
                  delay: i * 0.2, 
                  duration: 0.5,
                  type: "spring",
                  stiffness: 300
                }}
                whileHover={{ 
                  scale: 1.02,
                  backgroundColor: 'rgba(15, 23, 42, 0.4)'
                }}
              >
                {user.status === 'active' && (
                  <motion.div
                    className="absolute left-0 top-0 w-0.5 h-full bg-cyan-400"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
                
                <motion.div 
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    user.color === 'cyan' ? 'bg-cyan-400' : 'bg-slate-500'
                  }`}
                  animate={user.status === 'active' ? { 
                    scale: [1, 1.3, 1],
                    boxShadow: [
                      '0 0 2px rgba(6, 182, 212, 0.6)',
                      '0 0 8px rgba(6, 182, 212, 1)',
                      '0 0 2px rgba(6, 182, 212, 0.6)'
                    ]
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                />
                
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <motion.span 
                    className="text-white font-mono font-semibold"
                    animate={user.status === 'active' ? {
                      textShadow: [
                        '0 0 2px rgba(6, 182, 212, 0.5)',
                        '0 0 4px rgba(6, 182, 212, 0.8)',
                        '0 0 2px rgba(6, 182, 212, 0.5)'
                      ]
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {user.id}
                  </motion.span>
                  <span className="text-slate-400 truncate text-[6px]">{user.action}</span>
                </div>
                
                {user.status === 'active' && (
                  <motion.div
                    className="absolute right-1 top-1 w-0.5 h-0.5 bg-cyan-400 rounded-full"
                    animate={{ 
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0]
                    }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.5 }}
                  />
                )}
              </motion.div>
            ))}
          </div>
          
          <div className="flex items-center justify-between text-[6px] mt-1">
            <span className="text-slate-400">Protocol Status</span>
            <motion.div 
              className="flex items-center gap-1"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            >
              <motion.div 
                className="w-1 h-1 bg-cyan-400 rounded-full"
                animate={{ 
                  scale: [1, 1.3, 1],
                  boxShadow: [
                    '0 0 2px rgba(6, 182, 212, 0.8)',
                    '0 0 6px rgba(6, 182, 212, 1)',
                    '0 0 2px rgba(6, 182, 212, 0.8)'
                  ]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <motion.span 
                className="text-cyan-300 font-mono"
                animate={{
                  textShadow: [
                    '0 0 2px rgba(6, 182, 212, 0.6)',
                    '0 0 4px rgba(6, 182, 212, 0.9)',
                    '0 0 2px rgba(6, 182, 212, 0.6)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                SYNCHRONIZED
              </motion.span>
            </motion.div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div 
      className="w-full h-full relative bg-black overflow-hidden"
      style={{ 
        borderRadius: '1px',
        border: '1px solid rgba(0,0,0,0.95)',
        boxShadow: `
          inset 0 0 30px rgba(0,0,0,0.98),
          inset 0 0 60px rgba(6, 182, 212, 0.03),
          inset 0 1px 3px rgba(0,0,0,0.9),
          0 0 8px rgba(6, 182, 212, 0.08)
        `
      }}>
      
      {/* Professional LCD substrate */}
      <div 
        className="absolute inset-0"
        style={{ 
          background: `
            linear-gradient(135deg, #000000 0%, #0a0a0a 30%, #1a1a1a 70%, #0a0a0a 100%),
            repeating-linear-gradient(90deg, 
              rgba(255,255,255,0.003) 0px, 
              rgba(100,116,139,0.002) 0.33px, 
              rgba(148,163,184,0.003) 0.66px, 
              transparent 1px
            )
          `,
          borderRadius: '1px'
        }}>

        {/* Advanced surface simulation */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 70% 50% at 25% 20%, rgba(255,255,255,0.01) 0%, transparent 40%),
              radial-gradient(ellipse 40% 30% at 75% 80%, rgba(255,255,255,0.006) 0%, transparent 30%),
              linear-gradient(45deg, transparent 48%, rgba(100,116,139,0.008) 50%, transparent 52%)
            `,
            borderRadius: '1px'
          }}
        />

        {/* Premium interface container */}
        <div className="h-full flex flex-col justify-center p-2">
          
          <AnimatePresence mode="wait">
            {showWelcome ? (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, scale: 0.8, rotateY: -10 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 1.1, rotateY: 10 }}
                transition={{ 
                  duration: 1, 
                  ease: [0.23, 1, 0.320, 1],
                  staggerChildren: 0.2
                }}
                className="text-center h-full flex flex-col justify-center relative"
              >
                {/* Floating particles background */}
                {particles.map(particle => (
                  <motion.div
                    key={particle.id}
                    className="absolute w-0.5 h-0.5 bg-cyan-400/60 rounded-full"
                    style={{
                      left: `${particle.x}%`,
                      top: `${particle.y}%`,
                    }}
                    animate={{
                      y: [0, -20, 0],
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0]
                    }}
                    transition={{
                      duration: particle.duration,
                      repeat: Infinity,
                      delay: particle.delay,
                      ease: "easeInOut"
                    }}
                  />
                ))}

                {/* Matrix-style scanning lines */}
                <motion.div 
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: `repeating-linear-gradient(
                      90deg,
                      transparent,
                      transparent 2px,
                      rgba(6, 182, 212, 0.1) 2px,
                      rgba(6, 182, 212, 0.1) 4px
                    )`
                  }}
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />

                {/* Holographic VALEX logo */}
                <motion.div 
                  className="mb-2 relative"
                  initial={{ y: -30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 1, ease: "easeOut" }}
                >
                  <motion.div 
                    className="text-xl font-bold tracking-[0.3em] mb-1 relative z-10"
                    style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #06b6d4 30%, #0891b2 60%, #ffffff 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                    animate={{ 
                      filter: [
                        'drop-shadow(0 0 10px rgba(6, 182, 212, 0.6)) blur(0px)',
                        'drop-shadow(0 0 20px rgba(6, 182, 212, 1)) blur(0px)',
                        'drop-shadow(0 0 10px rgba(6, 182, 212, 0.6)) blur(0px)'
                      ],
                      textShadow: [
                        '0 0 10px rgba(6, 182, 212, 0.8)',
                        '0 0 20px rgba(6, 182, 212, 1)',
                        '0 0 10px rgba(6, 182, 212, 0.8)'
                      ]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    VALEX
                  </motion.div>
                  
                  {/* Holographic outline effect */}
                  <motion.div
                    className="absolute inset-0 text-xl font-bold tracking-[0.3em] text-cyan-400/30 -z-10"
                    animate={{ 
                      scale: [1, 1.02, 1],
                      opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    VALEX
                  </motion.div>
                </motion.div>

                {/* Epic subtitle with glitch effect */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  className="space-y-2 relative"
                >
                  <motion.div 
                    className="text-[8px] text-cyan-400 font-mono tracking-[0.3em] uppercase relative"
                    animate={{ 
                      letterSpacing: ['0.3em', '0.35em', '0.3em'],
                      textShadow: [
                        '0 0 5px rgba(6, 182, 212, 0.8)',
                        '0 0 15px rgba(6, 182, 212, 1)',
                        '0 0 5px rgba(6, 182, 212, 0.8)'
                      ]
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    QUANTUM TASK ORCHESTRATION
                    
                    {/* Glitch overlay */}
                    <motion.div
                      className="absolute inset-0 text-[8px] text-red-400/40 font-mono tracking-[0.3em] uppercase"
                      animate={{ 
                        x: [0, 1, -1, 0],
                        opacity: [0, 1, 0, 0]
                      }}
                      transition={{ 
                        duration: 0.1, 
                        repeat: Infinity, 
                        repeatDelay: 3,
                        times: [0, 0.1, 0.2, 1]
                      }}
                    >
                      QUANTUM TASK ORCHESTRATION
                    </motion.div>
                  </motion.div>
                  
                  <motion.div 
                    className="text-[7px] text-slate-300 leading-relaxed max-w-[85%] mx-auto"
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.4, duration: 0.6 }}
                  >
                    Neural-powered workflow intelligence
                    <br />
                    <motion.span
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      className="text-cyan-300"
                    >
                      beyond human comprehension
                    </motion.span>
                  </motion.div>

                  {/* Quantum loading sequence */}
                  <motion.div 
                    className="flex justify-center mt-3 gap-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.2, duration: 0.4 }}
                  >
                    {[0, 1, 2, 3, 4].map(i => (
                      <motion.div
                        key={i}
                        className="w-1 h-0.5 bg-cyan-400 rounded-full"
                        animate={{ 
                          scaleY: [1, 3, 1],
                          opacity: [0.3, 1, 0.3],
                          boxShadow: [
                            '0 0 2px rgba(6, 182, 212, 0.5)',
                            '0 0 8px rgba(6, 182, 212, 1)',
                            '0 0 2px rgba(6, 182, 212, 0.5)'
                          ]
                        }}
                        transition={{ 
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.1,
                          ease: "easeInOut"
                        }}
                      />
                    ))}
                  </motion.div>

                  {/* System initialization text */}
                  <motion.div
                    className="text-[6px] text-slate-400 font-mono mt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.8, duration: 0.6 }}
                    >
                      <motion.span
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      >
                        Initializing neural pathways...
                      </motion.span>
                    </motion.div>
                  </motion.div>
  
                  {/* Holographic grid overlay */}
                  <motion.div 
                    className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage: `
                        linear-gradient(rgba(6, 182, 212, 0.3) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(6, 182, 212, 0.3) 1px, transparent 1px)
                      `,
                      backgroundSize: '20px 20px'
                    }}
                    animate={{ 
                      backgroundPosition: ['0px 0px', '20px 20px'],
                      opacity: [0.05, 0.15, 0.05]
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="features"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  className="h-full flex flex-col justify-center"
                >
                  {/* Professional feature showcase */}
                  <div className="relative">
                    <motion.div 
                      className="bg-gradient-to-br from-black/80 to-slate-900/60 rounded border border-cyan-500/20 p-2 backdrop-blur-sm relative overflow-hidden"
                      key={currentView}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.8, ease: [0.23, 1, 0.320, 1] }}
                      style={{
                        boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.3), 0 8px 32px rgba(0, 0, 0, 0.2)'
                      }}
                    >
{/* Animated border glow */}
<motion.div
  className="absolute -inset-0.5 rounded-lg"
  animate={{ 
    background: [
      'linear-gradient(90deg, rgba(0, 0, 0, 0.8) 0%, rgba(6, 182, 212, 0.1) 50%, rgba(0, 0, 0, 0.8) 100%)',
      'linear-gradient(90deg, rgba(0, 0, 0, 0.6) 0%, rgba(6, 182, 212, 0.15) 50%, rgba(0, 0, 0, 0.6) 100%)',
      'linear-gradient(90deg, rgba(0, 0, 0, 0.8) 0%, rgba(6, 182, 212, 0.1) 50%, rgba(0, 0, 0, 0.8) 100%)'
    ]
  }}
  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
/>
  
                      {/* Feature header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          {(() => {
                            const IconComponent = features[currentView]?.icon;
                            return IconComponent ? (
                              <motion.div
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              >
                                <IconComponent className="w-3 h-3 text-cyan-400" />
                              </motion.div>
                            ) : null;
                          })()}
                          <div>
                            <motion.div 
                              className="text-[8px] font-semibold text-white tracking-wide"
                              animate={{ 
                                textShadow: [
                                  '0 0 2px rgba(255, 255, 255, 0.5)',
                                  '0 0 4px rgba(255, 255, 255, 0.8)',
                                  '0 0 2px rgba(255, 255, 255, 0.5)'
                                ]
                              }}
                              transition={{ duration: 3, repeat: Infinity }}
                            >
                              {features[currentView]?.title}
                            </motion.div>
                            <div className="text-[6px] text-cyan-400 font-medium">
                              {features[currentView]?.subtitle}
                            </div>
                          </div>
                        </div>
                        <motion.div 
                          className="flex items-center gap-0.5"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <motion.div
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          >
                            <Activity className="w-2 h-2 text-cyan-400" />
                          </motion.div>
                          <motion.div 
                            className="w-1 h-1 bg-cyan-400 rounded-full"
                            animate={{ scale: [1, 1.5, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                        </motion.div>
                      </div>
                      
                      {/* Feature content */}
                      <div className="min-h-[60px]">
                        {features[currentView]?.content}
                      </div>
                    </motion.div>
  
                    {/* Ultra enhanced progress indicators */}
                    <div className="flex justify-center gap-1 mt-2">
                      {features.map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-4 h-0.5 rounded-full bg-slate-700 overflow-hidden relative"
                          animate={{ 
                            backgroundColor: i === currentView ? '#475569' : '#374151',
                            boxShadow: i === currentView ? 
                              '0 0 4px rgba(6, 182, 212, 0.6)' : 'none'
                          }}
                          transition={{ duration: 0.4 }}
                        >
                          {i === currentView && (
                            <motion.div
                              className="h-full bg-gradient-to-r from-cyan-500 via-cyan-300 to-cyan-500 rounded-full relative"
                              initial={{ width: 0 }}
                              animate={{ width: '100%' }}
                              transition={{ duration: 5, ease: "linear" }}
                            >
                              <motion.div
                                className="absolute inset-0 bg-white/30 rounded-full"
                                animate={{ x: ['-100%', '100%'] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                              />
                            </motion.div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
  
                  {/* Ultra enhanced system status */}
                  <div className="flex justify-center gap-4 text-[6px] mt-2">
                    <motion.div 
                      className="flex items-center gap-1"
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <motion.div 
                        className="w-1 h-1 bg-cyan-400 rounded-full relative"
                        animate={{ 
                          scale: [1, 1.3, 1],
                          boxShadow: [
                            '0 0 2px rgba(6, 182, 212, 0.8)',
                            '0 0 6px rgba(6, 182, 212, 1)',
                            '0 0 2px rgba(6, 182, 212, 0.8)'
                          ]
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <motion.div
                          className="absolute inset-0 w-1 h-1 border border-cyan-400/40 rounded-full"
                          animate={{ scale: [1, 2, 1], opacity: [1, 0, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </motion.div>
                      <motion.span 
                        className="text-slate-300 font-medium tracking-wide"
                        animate={{
                          textShadow: [
                            '0 0 2px rgba(148, 163, 184, 0.5)',
                            '0 0 4px rgba(148, 163, 184, 0.8)',
                            '0 0 2px rgba(148, 163, 184, 0.5)'
                          ]
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        QUANTUM-ACTIVE
                      </motion.span>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
  
          {/* Professional edge treatment */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                radial-gradient(ellipse 88% 80% at center, transparent 0%, rgba(0,0,0,0.08) 100%),
                linear-gradient(to bottom, rgba(0,0,0,0.03) 0%, transparent 10%, transparent 90%, rgba(0,0,0,0.03) 100%)
              `,
              borderRadius: '1px'
            }}
          />
  
          {/* Subtle screen reflection */}
          <motion.div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(125deg, transparent 0%, rgba(255,255,255,0.004) 20%, transparent 25%, transparent 75%, rgba(255,255,255,0.002) 80%, transparent 100%)`,
              borderRadius: '1px'
            }}
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
        </div>
      </div>
    );
  }