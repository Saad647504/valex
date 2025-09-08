'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from 'framer-motion';
import { Kanban, Users, Zap, Target, MessageSquare, Paperclip, ArrowRight } from 'lucide-react';
import { Josefin_Sans } from 'next/font/google';
import { usePerformanceIntersection } from '@/hooks/useperformanceintersection';

const josefinSans = Josefin_Sans({ subsets: ['latin'] });

interface Card {
  id: number;
  title: string;
  code: string;
  description: string;
  team: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  color: 'green' | 'cyan' | 'red' | 'blue' | 'purple';
  assignee: string;
  dueDate: string;
  labels: string[];
  progress: number;
  comments: number;
  attachments: number;
}

// VALEX Kanban Card Stacking
const LinearCardStack = ({ shouldAnimate }: { shouldAnimate: boolean }): JSX.Element => {
  const [stackedCards, setStackedCards] = useState<number[]>([]);
  
  const cards: Card[] = [
    { 
      id: 1, 
      title: 'Refactor sonic crawler', 
      code: 'ENG-135',
      description: 'Optimize the sonic crawler implementation for better performance and reliability across all environments',
      team: 'Engineering', 
      priority: 'High', 
      color: 'cyan',
      assignee: 'Sarah Chen',
      dueDate: 'Dec 15',
      labels: ['Backend', 'Performance'],
      progress: 75,
      comments: 8,
      attachments: 3
    },
    { 
      id: 2, 
      title: 'LLM Chatbot integration', 
      code: 'ENG-142',
      description: 'Integrate advanced language model capabilities into the existing chatbot infrastructure',
      team: 'AI Team', 
      priority: 'Critical', 
      color: 'green',
      assignee: 'Mike Rodriguez',
      dueDate: 'Dec 12',
      labels: ['AI', 'Integration'],
      progress: 85,
      comments: 12,
      attachments: 5
    },
    { 
      id: 3, 
      title: 'Error uploading messages via API', 
      code: 'ENG-160',
      description: 'Fix critical bug preventing message uploads through the API endpoint with proper error handling',
      team: 'Backend Team', 
      priority: 'Critical', 
      color: 'cyan',
      assignee: 'Alex Kim',
      dueDate: 'Dec 10',
      labels: ['Bug', 'API'],
      progress: 45,
      comments: 18,
      attachments: 2
    }
  ];

  useEffect(() => {
    const animateStack = (): void => {
      // Only animate if cards aren't already stacked AND we should animate
      if (stackedCards.length === 0 && shouldAnimate) {
        cards.forEach((_, index) => {
          setTimeout(() => {
            setStackedCards(prev => [...prev, index]);
          }, index * 800 + 400); // Slower animation timing
        });
      }
    };
    
    animateStack();
  }, [cards.length, stackedCards.length, shouldAnimate]);


  return (
    <div className="relative w-full h-[60vh] flex items-center justify-center" style={{ perspective: '1200px' }}>
      {/* Kanban Card Container */}
      <div 
        className="relative"
        style={{ 
          transform: 'rotateX(50deg) rotateY(0deg)',
          transformStyle: 'preserve-3d'
        }}
      >
        {cards.map((card, index) => {
          const isStacked = stackedCards.includes(index);
          const stackIndex = stackedCards.indexOf(index);
          
          // Card stacking calculations  
          const yOffset = -stackIndex * 15 + 40; // Pushed up more (was 90, now 40)
          const xOffset = 0;
          const zOffset = stackIndex * 25;
          const rotation = 0;
          const scale = 1;
          
          
          return (
            <motion.div
              key={card.id}
              className="absolute w-[560px] h-[380px] cursor-pointer group"
              style={{
                zIndex: 100 + stackIndex, // 1st card: 100, 2nd card: 101, 3rd card: 102 - ON TOP!
                transformStyle: 'preserve-3d',
                left: '50%',
                top: '50%',
                marginLeft: '-280px', // Center the bigger cards (560px/2)
                marginTop: '-190px', // Center the taller cards (380px/2)
              }}
              initial={{
                y: 150,
                x: 0,
                z: 0,
                scale: 0.8,
                rotateY: 0,
                opacity: 0,
                filter: 'blur(8px)',
              }}
              animate={isStacked ? {
                x: xOffset,
                y: yOffset,
                z: zOffset,
                scale: scale,
                rotateX: -12, // Tilt MORE towards the user
                rotateY: rotation,
                opacity: 1,
                filter: 'blur(0px)',
              } : {}}
              transition={{
                duration: 2.4, // Slower individual card animation
                delay: stackIndex * 0.2, // Longer delay between cards
                ease: [0.16, 1, 0.3, 1],
                type: "spring",
                stiffness: 40, // Less stiff for smoother motion
                damping: 18,
              }}
              whileHover={isStacked ? {
                y: yOffset - 8,
                x: xOffset - 3,
                z: zOffset + 10,
                scale: 1.02, // Slight hover scale
                rotateX: -8, // Less tilt on hover but still strong
                rotateY: 0, // Keep same angle on hover
                transition: { duration: 0.25 }
              } : {}}
            >
              {/* Task Card */}
              <div 
                className="w-full h-full relative overflow-hidden"
                style={{
                  borderRadius: '12px 12px 0 0',
                  background: `
                    linear-gradient(180deg, 
                      rgba(15, 20, 25, 0.95) 0%, 
                      rgba(15, 20, 25, 0.98) 65%, 
                      rgba(12, 16, 21, 0.92) 80%, 
                      rgba(15, 20, 25, 0.7) 92%, 
                      rgba(15, 20, 25, 0.2) 97%, 
                      transparent 100%
                    )
                  `,
                  backdropFilter: 'blur(20px)',
                  borderTop: '1px solid rgba(34, 211, 238, 0.2)',
                  borderLeft: '1px solid rgba(34, 211, 238, 0.08)',
                  borderRight: '1px solid rgba(34, 211, 238, 0.08)',
                  borderBottom: 'none',
                  boxShadow: `
                    0 ${30 + stackIndex * 12}px ${60 + stackIndex * 18}px rgba(0, 0, 0, 0.4),
                    0 ${12 + stackIndex * 6}px ${24 + stackIndex * 10}px rgba(0, 0, 0, 0.2),
                    inset 0 1px 0 rgba(34, 211, 238, 0.1)
                  `,
                }}
              >
                {/* Premium glass overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent" />
                
                {/* Subtle accent glow */}
                <div 
                  className="absolute inset-0 opacity-30"
                  style={{
                    background: `radial-gradient(circle at 20% 20%, rgba(34, 211, 238, 0.03) 0%, transparent 50%)`
                  }}
                />

                {/* COMPACT Professional Content */}
                <div className="relative z-10 p-6 h-full flex flex-col" style={{ paddingBottom: '80px' }}>
                  {/* Clean Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-cyan-400 tracking-wider">{card.code}</span>
                        <div className="w-1 h-1 bg-gray-500 rounded-full" />
                        <span className="text-xs text-gray-400">{card.team}</span>
                      </div>
                      <h3 className="text-base font-semibold text-white mb-2 leading-snug">
                        {card.title}
                      </h3>
                      <p className="text-sm text-gray-400 leading-relaxed">
                        {card.description.substring(0, 85)}...
                      </p>
                    </div>
                    
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      card.priority === 'Critical' ? 'text-red-400' :
                      card.priority === 'High' ? 'text-lime-400' :
                      card.priority === 'Medium' ? 'text-cyan-400' :
                      'text-gray-400'
                    }`}>
                      {card.priority}
                    </div>
                  </div>

                  {/* Compact Details */}
                  <div className="space-y-3 mb-3">
                    {/* Time Tracking */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500">8 pts</span>
                        <span className="text-white">24h logged</span>
                      </div>
                      <span className="text-gray-400">32h est</span>
                    </div>

                    {/* Key Subtasks */}
                    <div className="space-y-1">
                      <div className="flex items-center text-xs">
                        <div className="w-1.5 h-1.5 bg-lime-400 rounded-full mr-2" />
                        <span className="text-gray-300">Schema updated</span>
                      </div>
                      <div className="flex items-center text-xs">
                        <div className="w-1.5 h-1.5 bg-gray-600 rounded-full mr-2" />
                        <span className="text-gray-500">Tests pending</span>
                      </div>
                    </div>
                  </div>

                  {/* Team & Metrics */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-black ${
                        card.color === 'blue' ? 'bg-cyan-400' :
                        card.color === 'purple' ? 'bg-lime-400' :
                        card.color === 'red' ? 'bg-red-400' :
                        card.color === 'green' ? 'bg-lime-400' :
                        'bg-cyan-400'
                      }`}>
                        {card.assignee.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white">{card.assignee}</p>
                        <p className="text-xs text-gray-500">{card.dueDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        <span>{card.comments}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Paperclip className="w-3 h-3" />
                        <span>{card.attachments}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>3</span>
                      </div>
                    </div>
                  </div>

                  {/* Compact Progress */}
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      {card.labels.slice(0, 2).map((label, labelIndex) => (
                        <span
                          key={labelIndex}
                          className="px-2 py-0.5 rounded text-xs bg-gray-800/60 text-gray-300"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-white font-medium">{card.progress}%</span>
                    </div>
                    <div className="relative w-full bg-slate-700/30 rounded-sm h-1 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-sm ${
                          card.color === 'blue' ? 'bg-slate-300' :
                          card.color === 'purple' ? 'bg-slate-300' :
                          card.color === 'red' ? 'bg-slate-300' :
                          card.color === 'green' ? 'bg-slate-300' :
                          'bg-slate-300'
                        }`}
                        initial={{ width: '0%' }}
                        animate={isStacked ? { width: `${card.progress}%` } : { width: '0%' }}
                        transition={{ 
                          duration: 1.0, 
                          delay: stackIndex * 0.1 + 0.2,
                          ease: "easeOut"
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default function KanbanSection(): JSX.Element {
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
      className={`landing-section min-h-screen flex ${josefinSans.className} px-8 lg:px-12`}
      style={{ 
        opacity: reducedMotion ? 1 : smoothOpacity,
        y: reducedMotion ? 0 : smoothY,
      }}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={hasBeenVisible ? "visible" : "hidden"}
        className="relative min-h-full flex flex-col justify-center space-y-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg mb-4">
            <Kanban className="w-3 h-3 text-green-400" />
            <span className="text-xs text-green-300 font-medium">PROJECT FLOW</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-light mb-3 leading-tight text-white">
            Visual
            <span className="text-transparent bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text font-normal"> workflow</span>
          </h2>
          
          <p className="text-sm text-slate-300 leading-relaxed">
            Exact Linear.app card stacking with bigger cards and perfect angles
          </p>
        </motion.div>
        
        {/* LINEAR.APP EXACT CARD STACK */}
        <motion.div variants={itemVariants} className="flex-1 flex items-center">
          <LinearCardStack shouldAnimate={hasBeenVisible} />
        </motion.div>
        
        {/* Bottom Features */}
        <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {[
            { icon: Target, label: 'Visual planning' },
            { icon: Users, label: 'Team sync' },
            { icon: Zap, label: 'Smart automation' }
          ].map((feature, index) => (
            <motion.div 
              key={index}
              className="text-center group"
              variants={itemVariants}
            >
              <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                <feature.icon className="w-4 h-4 text-green-400" />
              </div>
              <h4 className="text-sm font-medium text-white">{feature.label}</h4>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div variants={itemVariants} className="text-center">
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('navigate', { detail: 'login' }));
              }
            }}
            className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-cyan-600 rounded-lg text-white text-sm font-medium transition-all hover:shadow-lg hover:shadow-green-500/20 hover:scale-[1.02]"
          >
            <span>Explore Kanban</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
