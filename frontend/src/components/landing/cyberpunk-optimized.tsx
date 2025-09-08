'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from 'framer-motion';
import { Brain, ArrowRight, Cpu, Zap, Eye, MessageSquare, User } from 'lucide-react';
import { Josefin_Sans } from 'next/font/google';
import { usePerformanceIntersection } from '@/hooks/useperformanceintersection';

const josefinSans = Josefin_Sans({ subsets: ['latin'] });

// VALEX AI Assistant Interface
const NeuralAIChatInterface = ({ isVisible }: { isVisible: boolean }) => {
  const [messages, setMessages] = useState<{id: number, type: 'user' | 'ai', text: string, isTyping?: boolean}[]>([]);
  const [currentMessage, setCurrentMessage] = useState(0);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const conversation = [
    { type: 'user' as const, text: 'Assign "Fix payment integration bug" to the best team member' },
    { type: 'ai' as const, text: '**Smart Assignment Complete**\n\n**Assigned to**: Alex Rodriguez (Full-stack)\n**AI Confidence**: 96% match\n**Est. Time**: 4-6 hours\n\n**Why Alex?**\n• 5+ similar payment bugs resolved\n• 94% success rate on financial features\n• Currently has lightest workload\n\n**Auto-linked**: GitHub issue #247\n**Added to**: Sprint analytics\n**Tagged**: bug, payment, priority-high' }
  ];
  
  useEffect(() => {
    if (!isVisible) return;
    
    const processMessage = () => {
      if (currentMessage < conversation.length) {
        const message = conversation[currentMessage];
        
        if (message.type === 'user') {
          // Add user message immediately
          setMessages(prev => [...prev, { 
            id: currentMessage, 
            type: 'user', 
            text: message.text 
          }]);
          setTimeout(() => setCurrentMessage(prev => prev + 1), 1500);
        } else {
          // Add AI message with typing effect
          const aiMessage = { 
            id: currentMessage, 
            type: 'ai' as const, 
            text: '', 
            isTyping: true 
          };
          setMessages(prev => [...prev, aiMessage]);
          
          // Typing animation
          let charIndex = 0;
          const typeInterval = setInterval(() => {
            if (charIndex < message.text.length) {
              setMessages(prev => prev.map(msg => 
                msg.id === currentMessage 
                  ? { ...msg, text: message.text.substring(0, charIndex + 1) }
                  : msg
              ));
              charIndex++;
            } else {
              setMessages(prev => prev.map(msg => 
                msg.id === currentMessage 
                  ? { ...msg, isTyping: false }
                  : msg
              ));
              clearInterval(typeInterval);
              setTimeout(() => setCurrentMessage(prev => prev + 1), 1000);
            }
          }, 30);
          
          return () => clearInterval(typeInterval);
        }
      }
    };
    
    const timeout = setTimeout(processMessage, 100);
    return () => clearTimeout(timeout);
  }, [isVisible, currentMessage]);

  // Auto-scroll when messages update
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  return (
    <div className="relative bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden group">
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
        
        {/* NEURAL Chat Header */}
        <div className="relative z-10 bg-black/70 border-b border-green-500/20 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-8 h-8 bg-gradient-to-br from-green-500 to-cyan-500 rounded-full flex items-center justify-center relative"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              animate={{
                boxShadow: [
                  '0 0 10px rgba(16, 185, 129, 0.4)',
                  '0 0 20px rgba(16, 185, 129, 0.8)',
                  '0 0 10px rgba(16, 185, 129, 0.4)'
                ]
              }}
            >
              <Brain className="w-4 h-4 text-white" />
              
              {/* Neural Activity Ring */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-green-400/30"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 0, 0.5]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity
                }}
              />
            </motion.div>
            <div>
              <motion.h3 
                className="text-sm font-medium text-white"
                animate={{
                  textShadow: ['0 0 5px rgba(16, 185, 129, 0.3)', '0 0 10px rgba(16, 185, 129, 0.6)', '0 0 5px rgba(16, 185, 129, 0.3)']
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity
                }}
              >
                NEURAL AI CORE
              </motion.h3>
              <motion.p 
                className="text-xs text-green-400"
                animate={{
                  opacity: [0.6, 1, 0.6]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity
                }}
              >
                AI SYNC ACTIVE
              </motion.p>
            </div>
          </div>
          
          {/* Advanced Status Indicators */}
          <div className="flex items-center gap-2">
            <motion.div 
              className="w-2 h-2 bg-green-400 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.6, 1, 0.6]
              }}
              transition={{
                duration: 1,
                repeat: Infinity
              }}
            />
            <motion.div 
              className="text-xs text-green-400 font-mono"
              animate={{
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity
              }}
            >
              98.7%
            </motion.div>
          </div>
        </div>
      
      {/* AI CHAT INTERFACE */}
      <div ref={chatContainerRef} className="relative z-10 p-6 h-80 overflow-y-auto">
        {/* Chat Messages */}
        <div className="space-y-4 min-h-full flex flex-col justify-end">
          {/* AI Messages with typing effect */}
          {messages.map((message) => (
            <motion.div
              key={message.id}
              className={`flex items-start gap-3 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className={`w-8 h-8 rounded-full ${
                message.type === 'user' 
                  ? 'bg-cyan-500/20 border-cyan-500/30' 
                  : 'bg-green-500/20 border-green-500/30'
              } border flex items-center justify-center flex-shrink-0`}>
                {message.type === 'user' ? (
                  <User className="w-4 h-4 text-cyan-400" />
                ) : (
                  <Brain className="w-4 h-4 text-green-400" />
                )}
              </div>
              <div className={`max-w-xs px-4 py-3 rounded-2xl text-sm ${
                message.type === 'user'
                  ? 'bg-cyan-500/10 border-cyan-500/20 text-white'
                  : 'bg-green-500/10 border-green-500/20 text-slate-200'
              } border`}>
                <div className="whitespace-pre-wrap leading-relaxed">{message.text}</div>
                {message.isTyping && (
                  <div className="flex gap-1 mt-2">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1 h-1 bg-green-400 rounded-full"
                        animate={{ 
                          scale: [1, 1.5, 1],
                          opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          delay: i * 0.1,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

      </div>
      
      {/* Input Area */}
      <div className="relative z-10 bg-black/20 border-t border-white/5 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm text-slate-400">
            Ask me anything about your project...
          </div>
          <button className="w-8 h-8 bg-gradient-to-r from-green-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function AIAssistantSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  
  const { ref: intersectionRef, isVisible, hasBeenVisible } = usePerformanceIntersection({
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
          className="relative min-h-[80vh] flex items-center"
        >
          {/* Diagonal Layout Container */}
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            {/* Top Left - Badge + Title */}
            <motion.div variants={itemVariants} className="lg:col-span-4 lg:col-start-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg mb-6">
                <Brain className="w-3 h-3 text-green-400" />
                <span className="text-xs text-green-300 font-medium">AI ASSISTANT</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-light mb-4 leading-tight text-white">
                Intelligent
                <span className="block text-transparent bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text font-normal">
                  automation
                </span>
              </h2>
            </motion.div>
            
            {/* Top Right - AI Interface */}
            <motion.div variants={itemVariants} className="lg:col-span-7 lg:col-start-6 lg:row-start-1 lg:row-span-2">
              <NeuralAIChatInterface isVisible={isVisible} />
            </motion.div>
            
            {/* Bottom Left - Description + Features */}
            <motion.div variants={itemVariants} className="lg:col-span-5 lg:col-start-1 lg:row-start-2 space-y-6">
              <p className="text-sm text-slate-300 leading-relaxed">
                AI-powered task management that learns from your workflow patterns and optimizes team productivity automatically.
              </p>
              
              {/* Horizontal Feature Pills */}
              <div className="flex flex-wrap gap-3">
                {[
                  { icon: Cpu, label: 'Smart allocation' },
                  { icon: Zap, label: 'Optimization' },
                  { icon: Eye, label: 'Insights' }
                ].map((capability, index) => (
                  <motion.div 
                    key={index}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                    variants={itemVariants}
                  >
                    <capability.icon className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-white">{capability.label}</span>
                  </motion.div>
                ))}
              </div>
              
              {/* CTA */}
              <motion.div variants={itemVariants}>
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('navigate', { detail: 'login' }));
                    }
                  }}
                  className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-600 to-cyan-600 rounded-xl text-white text-sm font-medium transition-all hover:shadow-lg hover:shadow-green-500/20 hover:scale-[1.02]"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Try AI Assistant</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
