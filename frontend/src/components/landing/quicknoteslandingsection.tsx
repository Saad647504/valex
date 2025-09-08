'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from 'framer-motion';
import { FileText, ArrowRight, Plus, Search, Star, Edit3, Hash } from 'lucide-react';
import { Josefin_Sans } from 'next/font/google';
import { usePerformanceIntersection } from '@/hooks/useperformanceintersection';

const josefinSans = Josefin_Sans({ subsets: ['latin'] });

// VALEX Quick Notes Interface
const ExplosiveNotesInterface = () => {
  const [notes] = useState([
    { 
      id: 1, 
      title: 'GitHub Integration Notes', 
      content: 'Auto-sync with main repository. PR #124 merged - tasks auto-created. Webhooks working perfectly for real-time updates.',
      tags: ['github', 'integration'], 
      starred: true,
      lastEdited: '2 hours ago'
    },
    { 
      id: 2, 
      title: 'AI Task Analysis', 
      content: 'OpenAI suggestions: Sarah Chen best for auth tasks (92% accuracy). Smart assignment working great for sprint planning.',
      tags: ['ai', 'assignments'], 
      starred: false,
      lastEdited: '1 day ago'
    },
    { 
      id: 3, 
      title: 'Team Collaboration', 
      content: 'Socket.io live updates - 4 members online. Real-time comments and status changes syncing across all devices.',
      tags: ['realtime', 'team'], 
      starred: true,
      lastEdited: '3 hours ago'
    },
    { 
      id: 4, 
      title: 'Performance Stats', 
      content: 'Redis caching improved response time by 85%. Analytics dashboard loading in <100ms. Team velocity up 15%.',
      tags: ['performance', 'redis'], 
      starred: false,
      lastEdited: '30 min ago'
    }
  ]);

  return (
    <div className="relative bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden group space-y-6 p-6">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br from-cyan-500 to-green-400" />
        
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
        
        {/* Header with search */}
        <div className="relative z-10 bg-black/20 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-cyan-400 rounded-full" />
              <h3 className="text-sm font-medium text-white">Quick Notes</h3>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500/20 w-40"
                />
              </div>
              
              {/* Add button */}
              <button className="w-8 h-8 bg-green-500/20 hover:bg-green-500/30 rounded-lg flex items-center justify-center transition-colors">
                <Plus className="w-4 h-4 text-green-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Clean Notes Grid */}
        <div className="relative z-10 grid grid-cols-2 gap-4">
          {notes.map((note, index) => (
            <motion.div
              key={note.id}
              className="bg-white/5 border border-white/10 rounded-lg p-4 cursor-pointer hover:bg-white/10 transition-colors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
                {/* Note header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-1">
                    <FileText className="w-4 h-4 text-white/60 flex-shrink-0" />
                    <h4 className="text-sm font-medium text-white truncate">{note.title}</h4>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {note.starred && (
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    )}
                  </div>
                </div>
                
                {/* Note content */}
                <p className="text-xs text-slate-300 mb-4 leading-relaxed line-clamp-3">
                  {note.content}
                </p>
                
                {/* Footer with tags */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    {note.tags.slice(0, 2).map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="inline-flex items-center gap-1.5 px-2 py-1 bg-white/10 rounded text-xs text-white/60"
                      >
                        <Hash className="w-2 h-2" />
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-slate-500 flex-shrink-0">{note.lastEdited}</span>
                </div>
              </motion.div>
            ))}
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-4 pt-6 border-t border-white/5 text-center">
          <div>
            <div className="text-sm font-light text-white mb-1">47</div>
            <div className="text-xs text-slate-400">Total Notes</div>
          </div>
          <div>
            <div className="text-sm font-light text-white mb-1">12</div>
            <div className="text-xs text-slate-400">This Week</div>
          </div>
          <div>
            <div className="text-sm font-light text-white mb-1">8</div>
            <div className="text-xs text-slate-400">Starred</div>
          </div>
        </div>
    </div>
  );
};

export default function QuickNotesSection() {
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
          className="min-h-[80vh] flex items-center"
        >
          {/* Single Row - Notes Interface Left, Content Right */}
          <div className="grid lg:grid-cols-2 gap-12 items-center h-[70vh]">
            {/* Left - Notes Interface */}
            <motion.div variants={itemVariants}>
              <ExplosiveNotesInterface />
            </motion.div>
            
            {/* Right - Header + Content */}
            <motion.div variants={itemVariants} className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                <FileText className="w-3 h-3 text-cyan-400" />
                <span className="text-xs text-cyan-300 font-medium">QUICK NOTES</span>
              </div>
              
              <div>
                <h2 className="text-3xl md:text-4xl font-light mb-4 leading-tight text-white">
                  Capture
                  <span className="block text-transparent bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text font-normal">
                    ideas instantly
                  </span>
                </h2>
                
                <p className="text-sm text-slate-300 leading-relaxed mb-8">
                  Lightning-fast note taking with smart organization, search, and tagging. Never lose a brilliant idea again.
                </p>
              </div>
              
              {/* Features in compact 2x2 */}
              <div className="grid grid-cols-2 gap-6">
                {[
                  { icon: Edit3, label: 'Instant capture' },
                  { icon: Search, label: 'Smart search' },
                  { icon: Hash, label: 'Auto-tagging' },
                  { icon: Star, label: 'Favorites' }
                ].map((feature, index) => (
                  <motion.div 
                    key={index}
                    className="flex items-center gap-3"
                    variants={itemVariants}
                  >
                    <div className="w-8 h-8 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                      <feature.icon className="w-4 h-4 text-cyan-400" />
                    </div>
                    <span className="text-sm font-medium text-white">{feature.label}</span>
                  </motion.div>
                ))}
              </div>
              
              {/* CTA */}
              <motion.div variants={itemVariants}>
                <button className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-green-600 rounded-lg text-white text-sm font-medium transition-all hover:shadow-lg hover:shadow-cyan-500/20 hover:scale-[1.02]">
                  <Plus className="w-4 h-4" />
                  <span>Create First Note</span>
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