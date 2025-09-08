'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertCircle, Info } from 'lucide-react';
import { Josefin_Sans } from 'next/font/google';

const josefinSans = Josefin_Sans({ subsets: ['latin'] });

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  variant?: 'toast' | 'center';
}

interface NotificationContextValue {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  success: (title: string, message?: string, opts?: Partial<Notification>) => void;
  error: (title: string, message?: string, opts?: Partial<Notification>) => void;
  warning: (title: string, message?: string, opts?: Partial<Notification>) => void;
  info: (title: string, message?: string, opts?: Partial<Notification>) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto remove after duration (default 5 seconds)
    const duration = notification.duration || 5000;
    setTimeout(() => {
      removeNotification(id);
    }, duration);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const success = (title: string, message?: string, opts?: Partial<Notification>) => {
    addNotification({ type: 'success', title, message, ...(opts || {}) });
  };

  const error = (title: string, message?: string, opts?: Partial<Notification>) => {
    addNotification({ type: 'error', title, message, ...(opts || {}) });
  };

  const warning = (title: string, message?: string, opts?: Partial<Notification>) => {
    addNotification({ type: 'warning', title, message, ...(opts || {}) });
  };

  const info = (title: string, message?: string, opts?: Partial<Notification>) => {
    addNotification({ type: 'info', title, message, ...(opts || {}) });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <Check className="w-5 h-5" />;
      case 'error': return <X className="w-5 h-5" />;
      case 'warning': return <AlertCircle className="w-5 h-5" />;
      case 'info': return <Info className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  const getAccent = (type: string) => {
    switch (type) {
      case 'success':
        return { icon: 'text-emerald-400', line: 'via-emerald-400/50', ring: 'ring-emerald-400/20', gradFrom: 'from-emerald-400/25' };
      case 'error':
        return { icon: 'text-red-400', line: 'via-red-400/50', ring: 'ring-red-400/20', gradFrom: 'from-red-400/25' };
      case 'warning':
        return { icon: 'text-amber-400', line: 'via-amber-400/50', ring: 'ring-amber-400/20', gradFrom: 'from-amber-400/25' };
      case 'info':
      default:
        return { icon: 'text-cyan-400', line: 'via-cyan-400/50', ring: 'ring-cyan-400/20', gradFrom: 'from-cyan-400/25' };
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      success,
      error,
      warning,
      info
    }}>
      {children}
      
      {/* Toasts (top-right) */}
      <div className={`fixed top-6 right-4 sm:top-8 sm:right-8 md:top-10 md:right-12 space-y-4 ${josefinSans.className}`} style={{ zIndex: 99999 }} role="status" aria-live="polite">
        <AnimatePresence>
          {notifications.filter(n => (n.variant || 'toast') === 'toast').map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 24, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, y: -8, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className={`relative flex items-start gap-4 px-6 py-5 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-md backdrop-saturate-150 border min-w-[360px] max-w-[600px] sm:min-w-[380px] sm:max-w-[640px] bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-black/60 border-white/10 text-white`}
            >
              <div className={`absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent ${getAccent(notification.type).line} to-transparent`}></div>
              <div className="flex-shrink-0 mt-0.5">
                <div className={`w-7 h-7 rounded-full grid place-items-center bg-gradient-to-br ${getAccent(notification.type).gradFrom} to-transparent backdrop-blur-sm shadow-inner`}>
                  <div className={getAccent(notification.type).icon}>{getIcon(notification.type)}</div>
                </div>
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm leading-5 text-white">{notification.title}</div>
                {notification.message && (
                  <div className="text-[13px] text-slate-300 mt-1 leading-5">{notification.message}</div>
                )}
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="flex-shrink-0 text-slate-400 hover:text-white transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Backdrop blur/tint for center popups */}
      <AnimatePresence>
        {notifications.some(n => n.variant === 'center') && (
          <motion.div
            key="notif-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 pointer-events-auto bg-slate-950/45 backdrop-blur-md"
            style={{ zIndex: 99997 }}
            onClick={() => {
              const list = notifications.filter(n => n.variant === 'center');
              const last = list[list.length - 1];
              if (last) removeNotification(last.id);
            }}
          />
        )}
      </AnimatePresence>

      {/* Center popups */}
      <div className={`fixed inset-0 pointer-events-none flex items-center justify-center ${josefinSans.className}`} style={{ zIndex: 99998 }}>
        <div className="w-full max-w-md px-4 sm:px-6">
          <AnimatePresence>
            {notifications.filter(n => n.variant === 'center').map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: -12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                className={`relative pointer-events-auto mb-4 flex items-start gap-4 px-6 py-6 min-h-[96px] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.65)] backdrop-blur-md backdrop-saturate-150 border bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-black/60 border-white/10 text-white`}
                role="dialog" aria-modal="true"
              >
                <div className={`absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent ${getAccent(notification.type).line} to-transparent`}></div>
                <div className="flex-shrink-0 mt-0.5">
                  <div className={`w-8 h-8 rounded-full grid place-items-center bg-gradient-to-br ${getAccent(notification.type).gradFrom} to-transparent backdrop-blur-sm shadow-inner`}>
                    <div className={getAccent(notification.type).icon}>{getIcon(notification.type)}</div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white leading-6">{notification.title}</div>
                  {notification.message && (
                    <div className="text-[13px] text-slate-300 mt-1 leading-6">{notification.message}</div>
                  )}
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="flex-shrink-0 text-slate-300/80 hover:text-white transition-colors"
                  aria-label="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
