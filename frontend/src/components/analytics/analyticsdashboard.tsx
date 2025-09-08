'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Josefin_Sans } from 'next/font/google';
import { TrendingUp, Users, Clock, Target, ArrowLeft, BarChart3 } from 'lucide-react';
import BackgroundAnimation from '@/components/shared/backgroundanimation';
import { analyticsAPI } from '@/lib/api';
import { useAuth } from '@/contexts/authcontext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const josefinSans = Josefin_Sans({ subsets: ['latin'] });

interface AnalyticsData {
  userInfo?: {
    name: string;
    email: string;
    memberSince: string;
    totalProjects: number;
  };
  taskMetrics: {
    total: number;
    completed: number;
    inProgress: number;
    todo: number;
    completionRate: number;
    averageCompletionTime: number;
  };
  productivityData: Array<{
    week: string;
    tasksCompleted: number;
    focusHours: number;
  }>;
  projectContributions: Array<{
    projectName: string;
    tasksCompleted: number;
    percentage: number;
  }>;
  priorityDistribution: Array<{
    priority: string;
    count: number;
  }>;
  dailyActivity: Array<{
    date: string;
    tasksCompleted: number;
    focusMinutes: number;
  }>;
  insights: Array<{
    type: 'success' | 'warning' | 'info';
    message: string;
  }>;
  isDemoData?: boolean;
  isPersonalAnalytics?: boolean;
}

interface AnalyticsDashboardProps {
  userId?: string;
  onBack?: () => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function AnalyticsDashboard({ userId, onBack }: AnalyticsDashboardProps) {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadAnalytics();
    }
  }, [userId, user?.id]);

  const loadAnalytics = async () => {
    if (!user?.id) return;
    
    try {
      const data = await analyticsAPI.getPersonalAnalytics(user.id);
      console.log('Analytics data loaded:', data);
      setAnalytics(data);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 relative ${josefinSans.className}`}>
        <BackgroundAnimation />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between p-6">
            <h1 className="text-2xl font-light text-white">Personal Analytics</h1>
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 text-white px-4 py-2 rounded-lg hover:bg-slate-700/50"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}
          </div>
          
          <div className="max-w-md mx-auto mt-20 p-6">
            <div className="bg-slate-900/60 backdrop-blur-xl p-8 rounded-2xl border border-slate-700/50 text-center">
              <BarChart3 className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
              <h2 className="text-xl font-light text-white mb-4">Personal Analytics</h2>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Sign in to view your personal task analytics, completion rates, and performance insights.
              </p>
              <button
                onClick={() => {
                  if (onBack) onBack();
                  setTimeout(() => {
                    // Navigate to login by simulating the navigation
                    if (typeof window !== 'undefined') {
                      const event = new CustomEvent('navigate', { detail: 'login' });
                      window.dispatchEvent(event);
                    }
                  }, 100);
                }}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-lg font-light hover:from-cyan-600 hover:to-blue-700 transition-all duration-200"
              >
                Sign In to View Analytics
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`min-h-screen bg-slate-900 relative overflow-hidden ${josefinSans.className}`}>
        <BackgroundAnimation />
        <div className="relative z-20">
          <div className="relative z-10 border-b border-slate-700/30 bg-black/90 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {onBack && (
                  <motion.button 
                    whileHover={{ x: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-all text-xs font-light group"
                  >
                    <svg className="w-3.5 h-3.5 group-hover:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Back</span>
                  </motion.button>
                )}
                
                <div className="h-4 w-px bg-slate-600/50" />
                
                <div className="flex items-center space-x-3">
                  <div>
                    <h1 className="text-lg font-light text-white">Personal Analytics</h1>
                    <div className="flex items-center space-x-3 text-xs">
                      <span className="text-slate-400 font-light">Loading Performance Data</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
                      <span className="text-cyan-400 font-light">Real-time data</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
          
          <div className="relative z-10 max-w-7xl mx-auto p-6">
            <div className="flex items-center justify-center min-h-[70vh]">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-slate-600/50 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>
                <div className="text-slate-400 text-sm font-light">Loading your analytics...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className={`min-h-screen bg-slate-900 relative overflow-hidden ${josefinSans.className}`}>
      <BackgroundAnimation />
      
      <div className="relative z-20">
        <div className="relative z-10 border-b border-slate-700/30 bg-black/90 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {onBack && (
                <motion.button 
                  whileHover={{ x: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onBack}
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-all text-xs font-light group"
                >
                  <svg className="w-3.5 h-3.5 group-hover:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Back</span>
                </motion.button>
              )}
              
              <div className="h-4 w-px bg-slate-600/50" />
              
              <div className="flex items-center space-x-3">
                <div>
                  <h1 className="text-lg font-light text-white">Personal Analytics</h1>
                  <div className="flex items-center space-x-3 text-xs">
                    <span className="text-slate-400 font-light">Your Performance</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
                    <span className="text-cyan-400 font-light">{analytics.taskMetrics.completionRate}% completion</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-4 px-3 py-1.5 bg-slate-800/40 rounded-lg backdrop-blur">
                <div className="flex items-center space-x-1.5 text-xs">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                  <span className="text-slate-300 font-light">{analytics.taskMetrics.completed} Completed</span>
                </div>
                <div className="flex items-center space-x-1.5 text-xs">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                  <span className="text-slate-300 font-light">{analytics.taskMetrics.total} Total</span>
                </div>
              </div>
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto p-6">
          <div className="mb-8">
            <div className="grid grid-cols-4 gap-4">
              <MetricCard
                title="Total Tasks"
                value={analytics.taskMetrics.total}
                icon={<Target className="w-4 h-4" />}
              />
              <MetricCard
                title="Completed"
                value={analytics.taskMetrics.completed}
                icon={<TrendingUp className="w-4 h-4" />}
              />
              <MetricCard
                title="In Progress"
                value={analytics.taskMetrics.inProgress}
                icon={<Clock className="w-4 h-4" />}
              />
              <MetricCard
                title="Completion Rate"
                value={`${analytics.taskMetrics.completionRate}%`}
                icon={<Users className="w-4 h-4" />}
              />
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Productivity Chart */}
            <div className="bg-slate-900/40 border border-slate-700/10 rounded-xl backdrop-blur-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-light text-white">Weekly Productivity</h3>
                <div className="flex items-center space-x-4 text-xs">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-cyan-400 rounded"></div>
                    <span className="text-slate-300">Tasks</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-emerald-400 rounded"></div>
                    <span className="text-slate-300">Focus Hours</span>
                  </div>
                </div>
              </div>
              {analytics.productivityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart 
                    data={analytics.productivityData}
                    margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                    barCategoryGap="20%"
                  >
                    <CartesianGrid strokeDasharray="2 2" stroke="#334155" strokeOpacity={0.3} />
                    <XAxis 
                      dataKey="week" 
                      stroke="#94a3b8" 
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(6, 182, 212, 0.5)',
                        borderRadius: '12px',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: '500',
                        padding: '12px 16px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                        zIndex: 1000,
                      }}
                      wrapperStyle={{ zIndex: 1000 }}
                      cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                    />
                    <Bar 
                      dataKey="tasksCompleted" 
                      fill="#06b6d4" 
                      name="Tasks Completed"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                    <Bar 
                      dataKey="focusHours" 
                      fill="#10B981" 
                      name="Focus Hours"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[260px] flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 mx-auto">
                      <BarChart3 className="w-8 h-8 opacity-50" />
                    </div>
                    <p className="text-sm font-light">Complete tasks to see productivity trends</p>
                  </div>
                </div>
              )}
            </div>

            {/* Priority Distribution */}
            <div className="bg-slate-900/40 border border-slate-700/10 rounded-xl backdrop-blur-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-light text-white">Priority Distribution</h3>
                <div className="text-xs text-slate-400">
                  {analytics.priorityDistribution.length > 0 
                    ? `${analytics.taskMetrics.total} total tasks` 
                    : 'No tasks yet'
                  }
                </div>
              </div>
              {analytics.priorityDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <Pie
                      data={analytics.priorityDistribution}
                      cx="50%"
                      cy="45%"
                      labelLine={false}
                      label={({ priority, percent }) => `${priority} (${(percent! * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      innerRadius={30}
                      fill="#8884d8"
                      dataKey="count"
                      fontSize={11}
                      strokeWidth={2}
                      stroke="#1e293b"
                    >
                      {analytics.priorityDistribution.map((_, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(139, 92, 246, 0.5)',
                        borderRadius: '12px',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: '500',
                        padding: '12px 16px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                        zIndex: 1000,
                      }}
                      labelStyle={{ color: '#ffffff' }}
                      itemStyle={{ color: '#ffffff' }}
                      wrapperStyle={{ zIndex: 1000 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 mx-auto">
                      <Target className="w-8 h-8 opacity-50" />
                    </div>
                    <p className="text-sm font-light">Add tasks with priorities to see distribution</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Daily Activity Chart */}
          <div className="grid grid-cols-1 gap-6 mb-8">
            <div className="bg-slate-900/40 border border-slate-700/10 rounded-xl backdrop-blur-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-light text-white">Daily Activity</h3>
                  <p className="text-xs text-slate-400 mt-1">Last 14 days performance</p>
                </div>
                <div className="flex items-center space-x-4 text-xs">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                    <span className="text-slate-300">Tasks</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                    <span className="text-slate-300">Focus Min</span>
                  </div>
                </div>
              </div>
              {analytics.dailyActivity.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart 
                    data={analytics.dailyActivity}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="2 2" stroke="#334155" strokeOpacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#94a3b8" 
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      backdropFilter: 'blur(16px)',
                      border: '1px solid rgba(16, 185, 129, 0.5)',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: '500',
                      padding: '12px 16px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                      zIndex: 1000,
                    }}
                    wrapperStyle={{ zIndex: 1000 }}
                    labelFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      });
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="tasksCompleted" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    name="Tasks Completed"
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2, fill: '#ffffff' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="focusMinutes" 
                    stroke="#06b6d4" 
                    strokeWidth={3}
                    name="Focus Minutes"
                    dot={{ fill: '#06b6d4', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#06b6d4', strokeWidth: 2, fill: '#ffffff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
              ) : (
                <div className="h-[240px] flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 mx-auto">
                      <TrendingUp className="w-8 h-8 opacity-50" />
                    </div>
                    <p className="text-sm font-light">Complete tasks and focus sessions to see daily trends</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Insights */}
          <div className="bg-slate-900/40 border border-slate-700/10 rounded-xl backdrop-blur-sm p-6">
            <div className="flex items-center space-x-2 mb-6">
              <h3 className="text-lg font-light text-white">AI Insights</h3>
            </div>
            <div className="space-y-3">
              {analytics.insights.map((insight, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-xl border text-sm ${
                    insight.type === 'success' 
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' :
                    insight.type === 'warning' 
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' :
                      'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                  }`}
                >
                  {insight.message}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon }: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-6 hover:border-slate-600/40 hover:bg-slate-800/40 transition-all duration-200 backdrop-blur-sm">
      <div className="flex items-center">
        <div className="flex-1">
          <div className="text-3xl font-light text-white mb-2 tracking-tight">{value}</div>
          <div className="text-sm text-slate-400 font-light">{title}</div>
        </div>
        <div className="text-slate-500 opacity-60 ml-4">
          <div className="w-10 h-10 rounded-lg bg-slate-700/30 flex items-center justify-center">
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}