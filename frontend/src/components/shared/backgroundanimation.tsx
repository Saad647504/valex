'use client';

import { motion } from 'framer-motion';

export default function BackgroundAnimation() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Base Gradient - Much Darker */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-950 to-black" />
      
      {/* Dynamic Cyan/Lime Gradient Waves */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 20% 80%, rgba(6, 182, 212, 0.08) 0%, transparent 60%),
            radial-gradient(circle at 80% 20%, rgba(132, 204, 22, 0.08) 0%, transparent 60%),
            radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.05) 0%, transparent 60%)
          `
        }}
        animate={{
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Moving Grid Pattern */}
      <motion.div 
        className="absolute inset-0 opacity-[0.08]"
        animate={{ 
          backgroundPosition: ['0% 0%', '100% 100%']
        }}
        transition={{ 
          duration: 120, 
          repeat: Infinity, 
          ease: "linear" 
        }}
        style={{
          backgroundImage: `
            linear-gradient(rgba(6, 182, 212, 0.4) 1px, transparent 1px), 
            linear-gradient(90deg, rgba(132, 204, 22, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px'
        }}
      />
      
      {/* Floating Orbs */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`orb-${i}`}
          className="absolute rounded-full blur-xl"
          style={{
            width: `${100 + i * 50}px`,
            height: `${100 + i * 50}px`,
            background: i % 3 === 0 
              ? 'radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, rgba(6, 182, 212, 0.05) 70%, transparent 100%)'
              : i % 3 === 1 
              ? 'radial-gradient(circle, rgba(132, 204, 22, 0.2) 0%, rgba(132, 204, 22, 0.05) 70%, transparent 100%)'
              : 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.03) 70%, transparent 100%)',
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          animate={{
            x: [0, (Math.random() - 0.5) * 400],
            y: [0, (Math.random() - 0.5) * 300],
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.8, 0.3]
          }}
          transition={{
            duration: 15 + Math.random() * 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 3
          }}
        />
      ))}
      
      {/* Animated Particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className={`absolute w-1 h-1 rounded-full ${
            i % 4 === 0 ? 'bg-cyan-400/40' : 
            i % 4 === 1 ? 'bg-lime-400/40' : 
            i % 4 === 2 ? 'bg-emerald-400/40' : 'bg-teal-400/40'
          }`}
          animate={{
            x: [-50, typeof window !== 'undefined' ? window.innerWidth + 50 : 1300],
            y: [Math.random() * window.innerHeight, Math.random() * window.innerHeight],
            opacity: [0, 1, 1, 0],
            scale: [0, 1, 1, 0]
          }}
          transition={{
            duration: Math.random() * 20 + 15,
            repeat: Infinity,
            ease: "linear",
            delay: Math.random() * 10
          }}
          style={{ 
            top: `${Math.random() * 100}%`,
            boxShadow: i % 2 === 0 ? '0 0 6px currentColor' : 'none'
          }}
        />
      ))}
      
      {/* Pulsing Corner Accents */}
      <motion.div
        className="absolute top-0 left-0 w-64 h-64 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%)'
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.4, 0.8, 0.4]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div
        className="absolute bottom-0 right-0 w-64 h-64 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(132, 204, 22, 0.1) 0%, transparent 70%)'
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.4, 0.8, 0.4]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3
        }}
      />
    </div>
  );
}