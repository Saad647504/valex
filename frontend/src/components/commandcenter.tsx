'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Task {
  id: string;
  title: string;
  assignee: { name: string; avatar: string };
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  status: string;
}

interface LogEntry {
  id: string;
  type: 'ai' | 'github' | 'cache' | 'error';
  message: string;
  timestamp: string;
}

export default function CommandCenter() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [tasks] = useState<Record<string, Task[]>>({
    'todo': [
      {
        id: '1',
        title: 'Implement OAuth integration',
        assignee: { name: 'Alice Chen', avatar: 'https://i.pravatar.cc/32?img=1' },
        priority: 'high',
        dueDate: '2024-01-15',
        status: 'todo'
      },
      {
        id: '2', 
        title: 'Design user dashboard mockups',
        assignee: { name: 'Bob Wilson', avatar: 'https://i.pravatar.cc/32?img=2' },
        priority: 'medium',
        dueDate: '2024-01-18',
        status: 'todo'
      }
    ],
    'progress': [
      {
        id: '3',
        title: 'Optimize database queries',
        assignee: { name: 'Carol Kim', avatar: 'https://i.pravatar.cc/32?img=3' },
        priority: 'high',
        dueDate: '2024-01-12',
        status: 'progress'
      }
    ],
    'review': [
      {
        id: '4',
        title: 'Update API documentation',
        assignee: { name: 'David Lee', avatar: 'https://i.pravatar.cc/32?img=4' },
        priority: 'low',
        dueDate: '2024-01-20',
        status: 'review'
      }
    ],
    'done': [
      {
        id: '5',
        title: 'Setup CI/CD pipeline',
        assignee: { name: 'Eve Brown', avatar: 'https://i.pravatar.cc/32?img=5' },
        priority: 'medium',
        dueDate: '2024-01-10',
        status: 'done'
      }
    ]
  });

  // Simulate live system logs
  useEffect(() => {
    const logMessages = [
      { type: 'ai' as const, message: 'FRONT-12 assigned to Alice Chen (est: 3d)', delay: 1000 },
      { type: 'github' as const, message: 'Commit #a29b moved FRONT-9 to Done', delay: 3000 },
      { type: 'cache' as const, message: 'Analytics recomputed in 0.32s', delay: 5000 },
      { type: 'ai' as const, message: 'Deployment health check: PASSED', delay: 7000 },
      { type: 'error' as const, message: 'Rate limit exceeded for API endpoint /users', delay: 9000 }
    ];

    logMessages.forEach((log, index) => {
      setTimeout(() => {
        const newLog: LogEntry = {
          id: (Date.now() + index).toString(),
          type: log.type,
          message: log.message,
          timestamp: new Date().toLocaleTimeString()
        };
        setLogs(prev => [...prev, newLog].slice(-10)); // Keep last 10 logs
      }, log.delay);
    });
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-400 bg-red-500/10';
      case 'medium': return 'border-yellow-400 bg-yellow-500/10';
      case 'low': return 'border-green-400 bg-green-500/10';
      default: return 'border-gray-400 bg-gray-500/10';
    }
  };

  const getLogTypeColor = (type: string) => {
    switch (type) {
      case 'ai': return 'text-cyan-400';
      case 'github': return 'text-purple-400';
      case 'cache': return 'text-green-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };


  return (
    <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-gray-100 font-sans h-screen flex flex-col overflow-hidden">
      
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-20 w-96 h-96 bg-cyan-500/20 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full filter blur-3xl animate-pulse animation-delay-2000"></div>
      </div>

      {/* Top Bar */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }}
        className="relative z-10 flex items-center justify-between bg-slate-900/80 backdrop-blur-xl px-8 py-4 border-b border-cyan-500/30"
      >
        <div className="flex items-center gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              ⚡ VALEX
            </span>
            <div className="h-6 w-px bg-cyan-500/50"></div>
            <span className="text-sm text-cyan-400 font-mono">Command Center</span>
          </motion.div>
          
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 bg-green-400 rounded-full shadow-lg shadow-green-400/50"
            ></motion.div>
            <span className="text-sm text-green-400 font-mono">System Online</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg bg-slate-800/50 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition-all"
          >
            🔔
          </motion.button>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-10 h-10 rounded-full border-2 border-cyan-400/50 overflow-hidden"
          >
            <img src="https://i.pravatar.cc/40?img=8" alt="Profile" className="w-full h-full object-cover" />
          </motion.div>
        </div>
      </motion.header>

      <div className="flex flex-1 overflow-hidden relative z-10">
        
        {/* Left Sidebar */}
        <motion.aside
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-20 bg-slate-900/60 backdrop-blur-xl border-r border-cyan-500/30 flex flex-col items-center py-6 gap-8"
        >
          {[
            { icon: '📁', label: 'Projects', id: 'projects' },
            { icon: '📊', label: 'Analytics', id: 'analytics' },
            { icon: '🤖', label: 'AI', id: 'ai' },
            { icon: '⚙️', label: 'Settings', id: 'settings' }
          ].map((item, index) => (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="p-3 rounded-xl bg-slate-800/30 border border-cyan-500/20 hover:border-cyan-400/50 hover:bg-cyan-500/10 transition-all text-2xl"
              title={item.label}
            >
              {item.icon}
            </motion.button>
          ))}
        </motion.aside>

        {/* Main Kanban Board */}
        <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="flex-1 grid grid-cols-4 gap-6 p-8 overflow-auto">
            {Object.entries({
                'todo': { title: 'To Do', color: 'cyan' },
                'progress': { title: 'In Progress', color: 'yellow' },
                'review': { title: 'Review', color: 'purple' },
                'done': { title: 'Done', color: 'green' }
            }).map(([key, column], columnIndex) => (
            <motion.section
            key={key}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 + columnIndex * 0.1 }}
            className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="font-bold text-lg text-gray-100">{column.title}</h2>
                    <div className={`w-8 h-1 rounded-full ${
                        column.color === 'cyan' ? 'bg-cyan-400' :
                        column.color === 'yellow' ? 'bg-yellow-400' :
                        column.color === 'purple' ? 'bg-purple-400' :
                        'bg-green-400'
                        }`}>

                    </div>
                </div>

              <div className="flex-1 space-y-4">
                <AnimatePresence>
                  {tasks[key]?.map((task, index) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ 
                        y: -4, 
                        transition: { duration: 0.2 },
                        boxShadow: "0 20px 40px rgba(0, 255, 156, 0.1)"
                      }}
                      className="bg-slate-800/60 backdrop-blur-sm p-4 rounded-xl border border-slate-600/30 hover:border-cyan-400/50 transition-all cursor-pointer group"
                    >
                      <h3 className="font-medium mb-3 text-gray-100 group-hover:text-cyan-400 transition-colors">
                        {task.title}
                      </h3>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <img 
                            src={task.assignee.avatar} 
                            alt={task.assignee.name}
                            className="w-6 h-6 rounded-full border border-cyan-400/30"
                          />
                          <span className="text-gray-400">{task.assignee.name.split(' ')[0]}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs border ${getPriorityColor(task.priority)}`}>
                            {task.priority.toUpperCase()}
                          </span>
                          <span className="text-gray-500 text-xs">{task.dueDate}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.section>
          ))}
        </motion.main>

        {/* AI Copilot Sidebar */}
        <motion.aside
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="w-80 bg-slate-900/60 backdrop-blur-xl border-l border-cyan-500/30 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🤖</span>
            <h3 className="font-bold text-xl bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              AI Copilot
            </h3>
          </div>

          <div className="space-y-4">
            {[
              {
                title: 'Next Assignment',
                content: 'Alice Chen',
                subtitle: 'Based on expertise & workload',
                color: 'cyan'
              },
              {
                title: 'Task Difficulty',
                content: '🔥 High Complexity',
                subtitle: 'Estimated 8.5/10 difficulty',
                color: 'red'
              },
              {
                title: 'Completion Forecast',
                content: '3.2 days',
                subtitle: 'With 94% confidence',
                color: 'green'
              }
            ].map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="bg-slate-800/40 backdrop-blur-sm p-4 rounded-xl border border-slate-600/30 hover:border-cyan-400/30 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">{insight.title}</span>
                  <div className={`w-2 h-2 rounded-full ${
  insight.color === 'cyan' ? 'bg-cyan-400' :
  insight.color === 'red' ? 'bg-red-400' :
  'bg-green-400'
}`}></div>
                </div>
                <div className="font-mono text-lg mb-1">{insight.content}</div>
                <div className="text-xs text-gray-500">{insight.subtitle}</div>
              </motion.div>
            ))}
          </div>
        </motion.aside>
      </div>

      {/* System Log Terminal */}
      <motion.footer
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="relative z-10 bg-black/90 backdrop-blur-xl border-t border-green-400/30 p-4 h-32 overflow-auto font-mono text-sm"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-green-400">❯</span>
          <span className="text-green-400">System Console</span>
          <div className="flex-1 h-px bg-green-400/20"></div>
        </div>
        
        <div className="space-y-1">
          <AnimatePresence>
            {logs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-2"
              >
                <span className="text-gray-500">[{log.timestamp}]</span>
                <span className={`font-bold ${getLogTypeColor(log.type)}`}>
                  [{log.type.toUpperCase()}]
                </span>
                <span className="text-gray-300">{log.message}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.footer>
    </div>
  );
}