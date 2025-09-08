'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, AlertTriangle, Play, StopCircle } from 'lucide-react';
import { useEffect } from 'react';
import { Josefin_Sans } from 'next/font/google';

const josefinSans = Josefin_Sans({ subsets: ['latin'] });

interface TimerWarningModalProps {
  isOpen: boolean;
  currentTaskTitle: string;
  newTaskTitle: string;
  onContinue: () => void;
  onSwitch: () => void;
  timeLeft: string;
}

export default function TimerWarningModal({
  isOpen,
  currentTaskTitle,
  newTaskTitle,
  onContinue,
  onSwitch,
  timeLeft
}: TimerWarningModalProps) {
  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onContinue();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onContinue]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 bg-black/80 backdrop-blur-xl flex items-start justify-center pt-20 z-[9999] ${josefinSans.className}`}
        onClick={onContinue} // Click outside to continue current task
      >
        <motion.div 
          initial={{ scale: 0.8, opacity: 0, y: -50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: -50 }}
          className="w-full max-w-lg mx-4 mt-8"
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking modal content
        >
          <div className="bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-2xl p-8 rounded-2xl border border-orange-500/40 shadow-2xl shadow-orange-500/20 ring-1 ring-white/10">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-light text-white">Focus Timer Active</h2>
                  <p className="text-orange-400 text-sm font-light">⏰ {timeLeft} remaining</p>
                </div>
              </div>
              <button 
                onClick={onContinue} 
                className="w-8 h-8 rounded-full bg-slate-700/50 hover:bg-slate-600/50 flex items-center justify-center text-slate-400 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4 mb-6">
              {/* Current Task */}
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-light text-slate-400 uppercase tracking-wide">Currently Working On</span>
                </div>
                <p className="text-white font-light">{currentTaskTitle}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400 font-light">Focus session in progress</span>
                </div>
              </div>

              {/* Warning Message */}
              <div className="text-center py-2">
                <p className="text-slate-300 font-light text-sm leading-relaxed">
                  Switching to <span className="text-cyan-400 font-medium">"{newTaskTitle}"</span> will interrupt your current focus session.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onContinue}
                className="flex-1 px-4 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-light"
              >
                <Play className="w-4 h-4" />
                Continue Current
              </button>
              <button
                onClick={onSwitch}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-light"
              >
                <StopCircle className="w-4 h-4" />
                Switch Task
              </button>
            </div>

            {/* Help Text */}
            <p className="text-xs text-slate-500 text-center mt-3 font-light">
              Press <kbd className="px-1.5 py-0.5 bg-slate-700/50 rounded text-slate-400">Esc</kbd> or click outside to continue current task
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}