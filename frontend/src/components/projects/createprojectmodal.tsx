import React, { useState } from 'react';
import { X, Plus, Folder, Palette } from 'lucide-react';
import { projectAPI } from '@/lib/api';
import { useNotifications } from '@/contexts/notificationcontext';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated?: () => void;
}

const PROJECT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#EC4899', // Pink
];

export default function CreateProjectModal({ isOpen, onClose, onProjectCreated }: CreateProjectModalProps) {
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectKey, setProjectKey] = useState('');
  const [projectColor, setProjectColor] = useState(PROJECT_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { error: notifyError } = useNotifications();

  // Auto-generate project key from name
  const handleNameChange = (name: string) => {
    setProjectName(name);
    const key = name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 10);
    setProjectKey(key);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !projectKey.trim()) return;

    setLoading(true);
    try {
      await projectAPI.createProject({
        name: projectName.trim(),
        description: projectDescription.trim() || undefined,
        key: projectKey.trim(),
        color: projectColor,
      });

      setSuccess(true);
      setTimeout(() => {
        setProjectName('');
        setProjectDescription('');
        setProjectKey('');
        setProjectColor(PROJECT_COLORS[0]);
        setSuccess(false);
        onClose();
        onProjectCreated?.();
      }, 1500);

    } catch (error: any) {
      console.error('Failed to create project:', error);
      notifyError('Create Failed', error.response?.data?.error || 'Failed to create project', { variant: 'center', duration: 2600 });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Plus className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl text-white">Create New Project</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Folder className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl text-white mb-2">Project Created!</h3>
            <p className="text-slate-400">Your new project is ready to go.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Project Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Enter project name"
                className="w-full px-3 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                required
                maxLength={50}
              />
            </div>

            {/* Project Key */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Project Key *
              </label>
              <input
                type="text"
                value={projectKey}
                onChange={(e) => setProjectKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
                placeholder="AUTO-GENERATED"
                className="w-full px-3 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                required
                maxLength={10}
              />
              <p className="text-xs text-slate-500 mt-1">
                This will be used for task IDs (e.g., {projectKey || 'PROJ'}-1, {projectKey || 'PROJ'}-2)
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="What is this project about?"
                className="w-full px-3 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 resize-none"
                rows={3}
                maxLength={200}
              />
            </div>

            {/* Color Picker */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Palette className="w-4 h-4 inline mr-1" />
                Project Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {PROJECT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setProjectColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      projectColor === color ? 'border-white scale-110' : 'border-slate-600 hover:border-slate-400'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !projectName.trim() || !projectKey.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Project
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
