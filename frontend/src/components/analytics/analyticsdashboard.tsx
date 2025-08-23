'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface AnalyticsData {
  taskMetrics: {
    total: number;
    completed: number;
    inProgress: number;
    todo: number;
    completionRate: number;
    averageCompletionTime: number;
  };
  velocityData: Array<{
    week: string;
    tasksCompleted: number;
  }>;
  teamPerformance: Array<{
    name: string;
    tasksCompleted: number;
    completionRate: number;
    averageCompletionTime: number;
  }>;
  priorityDistribution: Array<{
    priority: string;
    count: number;
  }>;
  completionTrends: Array<{
    date: string;
    completed: number;
  }>;
  insights: Array<{
    type: 'success' | 'warning' | 'info';
    message: string;
  }>;
}

interface AnalyticsDashboardProps {
  projectId: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function AnalyticsDashboard({ projectId }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [projectId]);

  const loadAnalytics = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/analytics/project/${projectId}`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">Failed to load analytics</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Project Analytics</h1>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Tasks"
          value={analytics.taskMetrics.total}
          icon="📋"
        />
        <MetricCard
          title="Completion Rate"
          value={`${analytics.taskMetrics.completionRate}%`}
          icon="✅"
          color={analytics.taskMetrics.completionRate > 70 ? 'green' : 'orange'}
        />
        <MetricCard
          title="Avg Completion"
          value={`${analytics.taskMetrics.averageCompletionTime}h`}
          icon="⏱️"
        />
        <MetricCard
          title="In Progress"
          value={analytics.taskMetrics.inProgress}
          icon="🔄"
          color="blue"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Velocity Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Team Velocity (4 weeks)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.velocityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="tasksCompleted" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Priority Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.priorityDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ priority, count }) => `${priority}: ${count}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {analytics.priorityDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Completion Trends */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Daily Completion Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.completionTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Team Performance */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Team Performance</h3>
          <div className="space-y-4">
            {analytics.teamPerformance.map((member) => (
              <div key={member.name} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{member.name}</div>
                  <div className="text-sm text-gray-500">
                    {member.tasksCompleted} completed • {member.averageCompletionTime}h avg
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">{member.completionRate}%</div>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${member.completionRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">AI Insights</h3>
        <div className="space-y-3">
          {analytics.insights.map((insight, index) => (
            <div 
              key={index}
              className={`p-3 rounded-lg ${
                insight.type === 'success' ? 'bg-green-50 text-green-800' :
                insight.type === 'warning' ? 'bg-yellow-50 text-yellow-800' :
                'bg-blue-50 text-blue-800'
              }`}
            >
              {insight.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, color = 'gray' }: {
  title: string;
  value: string | number;
  icon: string;
  color?: string;
}) {
  const colorClasses = {
    gray: 'border-gray-200 text-gray-800',
    green: 'border-green-200 text-green-800 bg-green-50',
    orange: 'border-orange-200 text-orange-800 bg-orange-50',
    blue: 'border-blue-200 text-blue-800 bg-blue-50'
  };

  return (
    <div className={`bg-white p-6 rounded-lg shadow border-l-4 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="flex items-center">
        <div className="text-2xl mr-3">{icon}</div>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-sm text-gray-600">{title}</div>
        </div>
      </div>
    </div>
  );
}