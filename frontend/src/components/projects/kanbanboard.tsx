// frontend/src/components/projects/KanbanBoard.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Josefin_Sans } from 'next/font/google';
import { X, Clock, User, Zap, Save, ArrowLeft, Trello, Users, Search, Trash2 } from 'lucide-react';
import GithubBadge from '@/components/integrations/githubbadge';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '@/contexts/authcontext';
import { useProjects } from '@/contexts/projectcontext';
import { taskAPI } from '@/lib/api';
import { useTimer } from '@/contexts/timercontext';
import { useNotifications } from '@/contexts/notificationcontext';
import TaskSearch from '@/components/search/tasksearch';
import BackgroundAnimation from '@/components/shared/backgroundanimation';
import TeamMembersModal from '@/components/team/teammembersmodal';

const josefinSans = Josefin_Sans({ subsets: ['latin'] });

interface Task {
  id: string;
  title: string;
  description: string;
  key: string;
  priority: string;
  estimatedMinutes?: number;
  position?: number;
  status?: string;
  assignee?: {
    firstName: string;
    lastName: string;
  };
}

interface Column {
  id: string;
  name: string;
  tasks: Task[];
}

// Priority options for tasks
const PRIORITY_OPTIONS = [
  { value: 'LOW', label: '🟢 Low', color: '#10b981' },
  { value: 'MEDIUM', label: '🟡 Medium', color: '#f59e0b' },
  { value: 'HIGH', label: '🟠 High', color: '#f97316' },
  { value: 'URGENT', label: '🔴 Urgent', color: '#ef4444' }
];

// Create Task Modal Component (matching QuickNotes design)
function CreateTaskModal({ isOpen, onClose, columnId, projectId }: {
  isOpen: boolean;
  onClose: () => void;
  columnId: string;
  projectId: string;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(25);
  const [assigneeId, setAssigneeId] = useState('');
  const [priorityInput, setPriorityInput] = useState('');
  const [selectedPriority, setSelectedPriority] = useState(PRIORITY_OPTIONS[1].value);
  const [loading, setLoading] = useState(false);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  
  const { createTask, currentProject } = useProjects();
  const { user } = useAuth();
  const { error: notifyError } = useNotifications();

  // Get available team members (project owner + project members)
  const getTeamMembers = () => {
    if (!currentProject) return [];
    
    const members = [
      // Project owner
      {
        id: currentProject.owner.id,
        firstName: currentProject.owner.firstName,
        lastName: currentProject.owner.lastName,
        email: currentProject.owner.email,
        role: 'OWNER' as const
      }
    ];

    // Add project members if they exist
    if (currentProject.members) {
      currentProject.members.forEach((member: any) => {
        if (member.user && member.user.id !== currentProject.owner.id) {
          members.push({
            id: member.user.id,
            firstName: member.user.firstName,
            lastName: member.user.lastName,
            email: member.user.email,
            role: member.role
          });
        }
      });
    }

    return members;
  };

  const teamMembers = getTeamMembers();
  
  // Check if current user is project manager/owner
  const isProjectManager = !!(
    user && currentProject?.owner && (
      user.id === currentProject.owner.id ||
      currentProject.members?.some(
        (m: any) => m.userId === user.id && ['OWNER', 'ADMIN'].includes(m.role)
      )
    )
  );

  const handleSubmit = async () => {
    // At least title or description is required
    if (!title.trim() && !description.trim()) return;
    
    setLoading(true);
    try {
      console.log('🚀 Creating task with data:', {
        title: title || 'Untitled Task',
        description,
        projectId,
        columnId,
        assigneeId: assigneeId || undefined,
        priority: selectedPriority,
        estimatedMinutes,
        useAI: true
      });

      await createTask({
        title: title || 'Untitled Task',
        description,
        projectId,
        columnId,
        assigneeId: assigneeId || undefined,
        priority: selectedPriority,
        estimatedMinutes,
        useAI: true
      });
      
      // Reset form
      setTitle('');
      setDescription('');
      setSelectedPriority(PRIORITY_OPTIONS[1].value);
      setEstimatedMinutes(25);
      setAssigneeId('');
      onClose();
    } catch (error: any) {
      console.error('❌ Failed to create task:', error);
      console.error('❌ Error details:', error.message, error.status, error.body);
      notifyError('Create Task Failed', error?.body?.error || error.message || 'Unknown error', { variant: 'center', duration: 2600 });
    } finally {
      setLoading(false);
    }
  };

  const addPriorityTag = () => {
    if (priorityInput.trim() && PRIORITY_OPTIONS.find(p => p.label.toLowerCase().includes(priorityInput.trim().toLowerCase()))) {
      const foundPriority = PRIORITY_OPTIONS.find(p => p.label.toLowerCase().includes(priorityInput.trim().toLowerCase()));
      if (foundPriority) {
        setSelectedPriority(foundPriority.value);
      }
      setPriorityInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addPriorityTag();
    }
  };

  useEffect(() => {
    if (isOpen && descriptionRef.current) {
      descriptionRef.current.focus();
    }
  }, [isOpen]);

  // Auto-assign to self if not project manager
  useEffect(() => {
    if (!isProjectManager && user) {
      setAssigneeId(user.id);
    }
  }, [isProjectManager, user]);


  // removed misplaced team size logic from CreateTaskModal

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden"
      >
        <div className="ultra-glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-light text-white mb-1">Create Task</h2>
              <p className="text-slate-400 text-sm">Add a new task to your project</p>
            </div>
            <button 
              onClick={onClose} 
              className="w-8 h-8 rounded-full bg-slate-700/50 hover:bg-slate-600/50 flex items-center justify-center text-slate-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-transparent border-0 text-white placeholder-slate-400 text-lg font-light focus:outline-none"
                placeholder="Task title (optional)"
              />
            </div>

            <div className="border-t border-slate-600/30 pt-4">
              <textarea
                ref={descriptionRef}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={8}
                className="w-full px-4 py-3 bg-slate-800/30 border border-slate-600/40 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20 resize-none transition-all"
                placeholder="Describe what needs to be done..."
              />
            </div>

            {/* Priority & Time Section */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-light text-slate-300 mb-3">
                  <Zap className="w-4 h-4 inline mr-2" />
                  Priority
                </label>
                <div className="flex space-x-2">
                  {PRIORITY_OPTIONS.map((priorityOption) => (
                    <button
                      key={priorityOption.value}
                      onClick={() => setSelectedPriority(priorityOption.value)}
                      className={`px-3 py-2 rounded-lg border-2 transition-all text-xs ${
                        selectedPriority === priorityOption.value 
                          ? 'border-white scale-105 text-white' 
                          : 'border-transparent hover:scale-105 text-slate-400 hover:text-white'
                      }`}
                      style={{ 
                        backgroundColor: selectedPriority === priorityOption.value 
                          ? `${priorityOption.color}20` 
                          : 'transparent',
                        borderColor: selectedPriority === priorityOption.value 
                          ? priorityOption.color 
                          : 'transparent'
                      }}
                    >
                      {priorityOption.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-light text-slate-300 mb-3">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Estimated Time (minutes)
                </label>
                <input
                  type="number"
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                  min="5"
                  max="480"
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/40 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/60 text-sm"
                  placeholder="25"
                />
              </div>
            </div>

            {/* Assignment Section */}
            {isProjectManager && teamMembers.length > 0 && (
              <div>
                <label className="block text-sm font-light text-slate-300 mb-3">
                  <User className="w-4 h-4 inline mr-2" />
                  Assign To
                </label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/40 rounded-lg text-white focus:outline-none focus:border-cyan-400/60 text-sm"
                  title="Pick a teammate or let AI choose"
                  aria-label="Assign task to teammate or AI"
                >
                  <option value="">🤖 Let AI choose (recommended)</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      👤 {member.firstName} {member.lastName} ({member.role.toLowerCase()})
                    </option>
                  ))}
                </select>
                <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-400" />
                  AI balances workload and context to pick the best assignee.
                </div>
              </div>
            )}

            {/* Self-assignment for non-managers */}
            {!isProjectManager && user && (
              <div className="bg-slate-700/30 border border-slate-600/40 rounded-lg p-3">
                <div className="flex items-center space-x-2 text-sm text-slate-300">
                  <User className="w-4 h-4" />
                  <span>Assigned to: {user.firstName} {user.lastName}</span>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-600/30">
              <button
                onClick={onClose}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || (!title.trim() && !description.trim())}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-cyan-600 hover:from-green-400 hover:to-cyan-500 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-lg transition-all font-light flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Create Task</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Draggable Task Component
function TaskCard({ task, onDelete }: { task: Task; onDelete: (taskId: string) => void }) {
  const { currentProject, loadProject } = useProjects();
  const { info, error: notifyError } = useNotifications();
  const teamSize = 1 + ((currentProject?.members?.length) || 0);
  const isSoloProject = teamSize <= 1;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPriorityIndicator = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-slate-500';
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(task.id);
  };

  const handleAutoAssign = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (isSoloProject) {
        info('Solo Project', "Task can't be auto-assigned to someone else — you're the only member.", { variant: 'center', duration: 3000 });
        return;
      }
      const { task: updated } = await taskAPI.autoAssign(task.id);
      const name = updated.assignee?.firstName ? `${updated.assignee.firstName} ${updated.assignee.lastName || ''}`.trim() : 'a team member';
      info('AI Assignment Complete', `Assigned to ${name}`, { variant: 'center', duration: 2500 });
      if (currentProject) await loadProject(currentProject.id);
    } catch (err: any) {
      notifyError('Auto-assign Failed', err?.body?.error || err?.message || 'Could not auto-assign', { variant: 'center', duration: 3000 });
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 text-left hover:border-slate-600/50 transition-all duration-150 cursor-grab active:cursor-grabbing group relative ${
        isDragging ? 'opacity-80 rotate-2 scale-105' : ''
      }`}
    >
      <div {...listeners} className="flex items-start gap-4">
        <div className={`w-1.5 h-1.5 rounded-full mt-2.5 ${getPriorityIndicator(task.priority)}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-light text-slate-500 uppercase tracking-wide">
              {task.key}
            </span>
          </div>
          <h3 className="text-white font-light group-hover:text-cyan-400 transition-colors text-sm mb-2">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-slate-500 text-xs font-light line-clamp-2 mb-2">
              {task.description}
            </p>
          )}
          {task.assignee && (
            <div className="text-xs text-slate-500 font-light">
              {task.assignee.firstName} {task.assignee.lastName}
            </div>
          )}
        </div>
      </div>
      
      {/* Action Buttons */}
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-md bg-red-900/20 hover:bg-red-900/40 text-red-400 hover:text-red-300 transition-all duration-150"
        title="Delete task"
      >
        <Trash2 className="w-3 h-3" />
      </button>
      {/* AI auto-assign is available for solo and group projects */}
      <>
        <button
          onClick={handleAutoAssign}
          className="absolute top-2 right-9 opacity-0 group-hover:opacity-100 p-1 rounded-md bg-emerald-900/20 hover:bg-emerald-900/40 text-emerald-400 hover:text-emerald-300 transition-all duration-150"
          title={isSoloProject ? 'Assign to you with AI' : 'Reassign with AI'}
          aria-label={isSoloProject ? 'Assign to me with AI' : 'Reassign with AI'}
        >
          <Zap className="w-3 h-3" />
        </button>
        {/* Subtle AI label shown when hovering the card to make the intent obvious */}
        <span
          className="absolute top-2 right-16 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 opacity-0 group-hover:opacity-100 transition-opacity"
          title={isSoloProject ? 'Only you in this project — AI assigns to you' : 'AI balances workload and context'}
        >
          AI
        </span>
      </>
    </div>
  );
}

// Droppable Column Component
function KanbanColumn({ column, currentProject, onOpenTaskModal, onDeleteTask }: { 
  column: Column; 
  currentProject: any; 
  onOpenTaskModal: (columnId: string) => void;
  onDeleteTask: (taskId: string) => void;
}) {
  const {
    setNodeRef,
    isOver,
  } = useDroppable({
    id: column.id,
  });

  const taskIds = column.tasks.map(task => task.id);

  return (
    <div 
      ref={setNodeRef}
      className={`w-full md:min-w-0 rounded-xl p-4 transition-all duration-150 backdrop-blur ${
        isOver ? 'bg-slate-800/60 border-2 border-slate-600/50' : 'bg-slate-800/40 border border-slate-700/50'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-light text-white">{column.name}</h3>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-light">{column.tasks.length}</span>
          <button
            onClick={() => onOpenTaskModal(column.id)}
            className="w-6 h-6 bg-slate-700/50 text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-600/50 hover:text-white transition-all duration-150 text-xs"
          >
            +
          </button>
        </div>
      </div>

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-h-[200px]">
          {column.tasks.map((task) => (
            <TaskCard key={task.id} task={task} onDelete={onDeleteTask} />
          ))}
          
          {column.tasks.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-xs border-2 border-dashed border-slate-700/50 rounded-xl bg-slate-800/20 transition-all duration-150 hover:border-slate-600/50">
              <div className="text-lg mb-2 opacity-50">📋</div>
              <div className="font-light">Drop tasks here</div>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default function KanbanBoard({ onBack, projectId, onNavigate }: { onBack?: () => void; projectId?: string; onNavigate?: (view: string, projectId?: string) => void }) {
  // ALL HOOKS MUST BE AT THE TOP BEFORE ANY EARLY RETURNS
  const { user } = useAuth();
  const { projects, currentProject, loading, loadProject, loadProjects, createProject } = useProjects();
  const { selectTask, startTimer, selectTaskAndStart, state, markDone, selectedTask, checkAndClearDeletedTask } = useTimer() as any;
  const { info, error: notifyError } = useNotifications();
  
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState('');
  const [projectLoading, setProjectLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);

  // Load project when component mounts
  useEffect(() => {
    if (projectId) {
      loadProject(projectId);
    }
  }, [projectId, loadProject]);

  // Check if current user is project manager/owner (guarded)
  const isProjectManager = !!(
    user && currentProject?.owner && (
      user.id === currentProject.owner.id ||
      currentProject.members?.some((m: any) => m.userId === user.id && ['OWNER', 'ADMIN'].includes(m.role))
    )
  );

  // DnD sensors MUST be declared before any conditional returns (Rules of Hooks)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Handle opening task creation modal
  const handleOpenTaskModal = (columnId: string) => {
    setSelectedColumnId(columnId);
    setShowTaskModal(true);
  };

  const handleCloseTaskModal = () => {
    setShowTaskModal(false);
    setSelectedColumnId('');
  };

  const handleDeleteTask = async (taskId: string) => {
    const t = findTaskById(taskId);
    setDeleteConfirm({ id: taskId, title: t?.title || 'this task' });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    const taskId = deleteConfirm.id;
    try {
      // Clear from timer if it's currently selected
      checkAndClearDeletedTask(taskId);
      await taskAPI.deleteTask(taskId);
      if (currentProject) await loadProject(currentProject.id);
      info('Task Deleted', 'Task has been successfully deleted', { variant: 'center', duration: 2200 });
    } catch (error) {
      console.error('Failed to delete task:', error);
      notifyError('Failed to Delete Task', 'Could not delete the task', { variant: 'center', duration: 2600 });
    } finally {
      setDeleteConfirm(null);
    }
  };

  // Load projects and auto-select first one if none selected
  // Projects are now loaded automatically by ProjectProvider, no need to load here

  // Check if user is logged in
  if (!user) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 relative ${josefinSans.className}`}>
        <BackgroundAnimation />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between p-6">
            <h1 className="text-2xl font-light text-white">Kanban Board</h1>
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
              <Trello className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
              <h2 className="text-xl font-light text-white mb-4">Kanban Board</h2>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Sign in to access your project board, manage tasks with drag-and-drop, and collaborate with your team.
              </p>
              <button
                onClick={() => {
                  if (onNavigate) {
                    onNavigate('login');
                  } else if (onBack) {
                    onBack();
                  }
                }}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-lg font-light hover:from-cyan-600 hover:to-blue-700 transition-all duration-200"
              >
                Sign In to Manage Tasks
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }


  // If we're navigating to a specific project, but the currentProject
  // hasn't updated yet (or is from a different project), show a safe loader.
  if (projectId && currentProject?.id !== projectId) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 relative ${josefinSans.className}`}>
        <BackgroundAnimation />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between p-6">
            <h1 className="text-2xl font-light text-white">Kanban Board</h1>
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
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-xl font-light text-white mb-2">Loading Project</h2>
              <p className="text-slate-400">Preparing your board...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Guard: if currentProject is still null (initial load), show loader
  if (!currentProject) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 relative ${josefinSans.className}`}>
        <BackgroundAnimation />
        <div className="relative z-10">
          <div className="max-w-md mx-auto mt-20 p-6">
            <div className="bg-slate-900/60 backdrop-blur-xl p-8 rounded-2xl border border-slate-700/50 text-center">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-xl font-light text-white mb-2">Loading Project</h2>
              <p className="text-slate-400">Preparing your board...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // sensors already declared above to satisfy Rules of Hooks

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    
    const task = findTaskById(active.id as string);
    setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || !currentProject) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    const sourceColumn = findColumnByTaskId(taskId);
    const targetColumn = findColumnById(overId) || findColumnByTaskId(overId);

    if (!sourceColumn || !targetColumn) return;
    
    // Build target list and compute insertion index/position
    const isOverTask = !!findTaskById(overId);
    // Remove the active task from the target tasks if it exists there already
    const targetTasksFiltered = (targetColumn.tasks || []).filter(t => t.id !== taskId);
    let insertIndex = targetTasksFiltered.length; // default to end
    if (isOverTask) {
      const idx = targetTasksFiltered.findIndex(t => t.id === overId);
      if (idx >= 0) insertIndex = idx; // insert before the hovered task
    }

    // Compute new position using neighbor positions
    const prevTask = insertIndex > 0 ? targetTasksFiltered[insertIndex - 1] : undefined;
    const nextTask = insertIndex < targetTasksFiltered.length ? targetTasksFiltered[insertIndex] : undefined;
    const EPS = 1e-4;
    let newPosition: number;
    if (prevTask && prevTask.position != null && nextTask && nextTask.position != null) {
      newPosition = (prevTask.position + nextTask.position) / 2;
      if (!isFinite(newPosition) || Math.abs(prevTask.position - nextTask.position) < EPS) {
        newPosition = prevTask.position + EPS; // avoid equal positions
      }
    } else if (prevTask && prevTask.position != null) {
      newPosition = prevTask.position + 1;
    } else if (nextTask && nextTask.position != null) {
      newPosition = nextTask.position - 1;
    } else {
      // Empty column or no neighbors
      newPosition = 1;
    }

    try {
      const moveRes = await taskAPI.moveTask(taskId, {
        columnId: targetColumn.id,
        position: newPosition,
        fromColumn: sourceColumn.id
      });

      // If moved into an "In Progress" column, start the timer in background
      const targetName = (targetColumn.name || '').toLowerCase();
      const targetNameNormalized = targetName.replace(/\s|-/g, '');
      const movedToInProgress = (
        targetName.includes('progress') ||
        targetName.includes('doing') ||
        targetName.includes('active') ||
        targetName.includes('working') ||
        targetNameNormalized.includes('inprogress') ||
        targetNameNormalized.includes('wip')
      );
      const movedToDone = (
        targetName.includes('done') ||
        targetName.includes('complete') ||
        targetName.includes('completed') ||
        targetName.includes('finished') ||
        targetName.includes('closed')
      );
      // Prefer server-confirmed status; fallback to alias match
      const serverInProgress = moveRes?.task?.status === 'IN_PROGRESS';
      if (process.env.NODE_ENV !== 'production') console.log('🎯 Task move result:', {
        taskId,
        targetColumnName: targetColumn.name,
        serverInProgress,
        movedToInProgress,
        shouldStartTimer: serverInProgress || movedToInProgress
      });
      
      if (serverInProgress || movedToInProgress) {
        const task = findTaskById(taskId);
        if (process.env.NODE_ENV !== 'production') console.log('🎯 Starting timer for task:', task?.title);
        if (task && currentProject) {
          const toMinutesByPriority = (p: string | undefined) => {
            const v = (p || '').toUpperCase();
            if (v === 'URGENT') return 15;
            if (v === 'HIGH') return 30;
            if (v === 'MEDIUM') return 45;
            if (v === 'LOW') return 60;
            return 25;
          };

          const taskData = {
            id: task.id,
            title: task.title,
            estimatedMinutes: (task as any).estimatedMinutes || toMinutesByPriority(task.priority),
            projectId: currentProject.id,
            projectName: currentProject.name,
            status: 'in-progress',
            priority: (task.priority || 'MEDIUM').toLowerCase() as any,
          };
          
          try {
            if (process.env.NODE_ENV !== 'production') console.log('🎯 Starting timer with selectTaskAndStart...');
            await selectTaskAndStart(taskData as any);
            if (process.env.NODE_ENV !== 'production') {
              console.log('🎯 Timer started successfully!');
              console.log('🎯 Showing notification...');
            }
            info('Timer Started', `"${task.title}" started in Focus Timer`);
            if (process.env.NODE_ENV !== 'production') console.log('🎯 Notification called');
          } catch (e: any) {
            console.error('🎯 Failed to start timer:', e);
            notifyError('Failed to Start Timer', e?.message || 'Could not start focus session');
          }
        }
      }

      // If moved to Done and this task is currently being timed, finalize it
      if (movedToDone && selectedTask && selectedTask.id === taskId) {
        try {
          await markDone();
          info('Task Completed', 'Focus session ended for the completed task');
        } catch (e) {
          if (process.env.NODE_ENV !== 'production') console.error('Failed to end focus session on Done move:', e);
        }
      }

      await loadProject(currentProject.id);
    } catch (error: any) {
      if (process.env.NODE_ENV !== 'production') console.error('Failed to move task:', error);
      notifyError('Move Failed', error?.message || 'Could not move task');
    }
  };

  const findTaskById = (taskId: string): Task | null => {
    if (!currentProject) return null;
    
    for (const column of (currentProject?.columns ?? [])) {
      const task = column.tasks.find(task => task.id === taskId);
      if (task) return task;
    }
    return null;
  };

  const findColumnByTaskId = (taskId: string) => {
    if (!currentProject) return null;
    
    return (currentProject?.columns ?? []).find(column =>
      column.tasks.some(task => task.id === taskId)
    );
  };

  const findColumnById = (columnId: string) => {
    if (!currentProject) return null;
    
    return (currentProject.columns ?? []).find(column => column.id === columnId);
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-slate-900 relative overflow-hidden ${josefinSans.className}`}>
        <BackgroundAnimation />
        <div className="relative z-20">
          {/* Header */}
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
                    <h1 className="text-lg font-light text-white">Project Board</h1>
                    <div className="flex items-center space-x-3 text-xs">
                      <span className="text-slate-400 font-light">Task Management</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
                      <span className="text-cyan-400 font-light">Loading...</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
              </div>
            </div>
          </div>
          
          {/* Loading Content */}
          <div className="relative z-10 max-w-7xl mx-auto p-6">
            <div className="flex items-center justify-center min-h-[70vh]">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-slate-600/50 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>
                <div className="text-slate-400 text-sm font-light">Loading project...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentProject && !loading) {
    return (
      <div className={`min-h-screen bg-slate-900 relative overflow-hidden ${josefinSans.className}`}>
        <BackgroundAnimation />
        <div className="relative z-20">
          {/* Header */}
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
                    <h1 className="text-lg font-light text-white">Project Board</h1>
                    <div className="flex items-center space-x-3 text-xs">
                      <span className="text-slate-400 font-light">Task Management</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                      <span className="text-yellow-400 font-light">No projects found</span>
                    </div>
                  </div>
                </div>
              </div>
              
          <div className="flex items-center space-x-4">
            <GithubBadge />
            <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
          </div>
            </div>
          </div>
          
          {/* Empty State Content */}
          <div className="relative z-10 max-w-7xl mx-auto p-6">
            <div className="flex items-center justify-center min-h-[70vh]">
              <div className="text-center max-w-md">
                <div className="w-24 h-24 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-2xl mx-auto mb-6 flex items-center justify-center border border-cyan-500/20">
                  <div className="text-4xl">📋</div>
                </div>
                <h2 className="text-2xl font-light text-white mb-4">Create Your First Project</h2>
                <p className="text-slate-400 text-sm font-light mb-8 leading-relaxed">
                  Start your productivity journey by creating a project. You'll be able to organize tasks, 
                  track progress, and focus on what matters most.
                </p>
                
                <div className="space-y-4">
                  <button 
                    onClick={async () => {
                      if (process.env.NODE_ENV !== 'production') console.log('Create Sample Project button clicked!');
                      try {
                        if (process.env.NODE_ENV !== 'production') console.log('Attempting to create sample project...');
                        // Create a sample project for first-time users with unique key
                        const uniqueKey = `PROJ${Date.now().toString().slice(-6)}`;
                        if (process.env.NODE_ENV !== 'production') console.log('Using unique project key:', uniqueKey);
                        const result = await createProject({
                          name: "My First Project",
                          description: "Getting started with task management",
                          key: uniqueKey,
                          color: "#3B82F6"
                        });
                        if (process.env.NODE_ENV !== 'production') console.log('Sample project created successfully:', result);
                      } catch (error: any) {
                        if (process.env.NODE_ENV !== 'production') console.error('Failed to create sample project:', error);
                        notifyError('Create Failed', error?.body?.error || 'Failed to create project', { variant: 'center', duration: 2600 });
                      }
                    }}
                    className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <span>🚀</span>
                    Create Sample Project
                  </button>
                  
                  <button 
                    onClick={() => onBack && onBack()}
                    className="w-full px-6 py-3 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white font-light rounded-lg transition-all duration-200 border border-slate-700/50"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-900 relative overflow-hidden ${josefinSans.className}`}>
      <BackgroundAnimation />
      
      <div className="relative z-20">
        {/* Header */}
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
                  <h1 className="text-lg font-light text-white">{currentProject?.name || 'Project'}</h1>
                  <div className="flex items-center space-x-3 text-xs">
                    <span className="text-slate-400 font-light">Task Management</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
                    <span className="text-cyan-400 font-light">{(currentProject?.columns ?? []).reduce((sum, col) => sum + col.tasks.length, 0)} tasks</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-4 px-3 py-1.5 bg-slate-800/40 rounded-lg backdrop-blur">
                <div className="flex items-center space-x-1.5 text-xs">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                  <span className="text-slate-300 font-light">Active</span>
                </div>
                <div className="flex items-center space-x-1.5 text-xs">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                  <span className="text-slate-300 font-light">{currentProject?.columns?.length || 0} Columns</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowTeamModal(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-700/40 hover:bg-slate-600/50 text-slate-300 hover:text-white transition-all duration-200 rounded-lg text-xs font-light border border-slate-600/30 hover:border-slate-500/50"
                >
                  <Users className="w-3.5 h-3.5" />
                  Team
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSearch(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-700/40 hover:bg-slate-600/50 text-slate-300 hover:text-white transition-all duration-200 rounded-lg text-xs font-light border border-slate-600/30 hover:border-slate-500/50 hover:shadow-lg hover:shadow-cyan-500/10"
                >
                  <Search className="w-3.5 h-3.5" />
                  Search
                </motion.button>
              </div>
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
            </div>
        </div>
      </div>

        {/* Main Content */}
        <div className="relative z-10 w-full px-6 md:px-8">
          
          {/* Project Description */}
          {currentProject?.description && (
            <div className="mb-8">
              <p className="text-slate-400 text-sm font-light">{currentProject?.description}</p>
            </div>
          )}

          {/* Kanban Board */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 min-h-[70vh] md:w-full md:max-w-none md:overflow-x-hidden mt-2 md:mt-3">
              {(currentProject?.columns ?? []).map((column) => (
                <KanbanColumn key={column.id} column={column} currentProject={currentProject} onOpenTaskModal={handleOpenTaskModal} onDeleteTask={handleDeleteTask} />
              ))}
            </div>

            <DragOverlay>
              {activeTask ? (
                <div className="bg-slate-800/90 backdrop-blur rounded-lg p-4 shadow-lg border border-slate-700/50 opacity-95 rotate-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-light text-slate-500 uppercase tracking-wide">
                      {activeTask.key}
                    </span>
                  </div>
                  <h3 className="text-white font-light text-sm">{activeTask.title}</h3>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          {/* Task Search Modal */}
          {showSearch && currentProject && (
            <TaskSearch
              projectId={currentProject.id}
              onClose={() => setShowSearch(false)}
            />
          )}

          {/* Team Members Modal */}
          {showTeamModal && currentProject && (
            <TeamMembersModal
              isOpen={showTeamModal}
              onClose={() => setShowTeamModal(false)}
              projectId={currentProject.id}
              isProjectManager={isProjectManager}
            />
          )}

          {/* Create Task Modal */}
          <AnimatePresence>
            {showTaskModal && currentProject && (
              <CreateTaskModal
                isOpen={showTaskModal}
                onClose={handleCloseTaskModal}
                columnId={selectedColumnId}
                projectId={currentProject.id}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <>
            <motion.div 
              key="del-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-40"
              onClick={() => setDeleteConfirm(null)}
            />
            <motion.div
              key="del-modal"
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              className="fixed inset-0 z-50 flex items-center justify-center px-4"
              onKeyDown={(e) => { if (e.key === 'Escape') setDeleteConfirm(null); }}
              tabIndex={-1}
            >
              <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-black/70 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full grid place-items-center bg-gradient-to-br from-red-400/25 to-transparent text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white text-lg font-medium">Delete Task?</h3>
                    <p className="text-slate-300 text-sm mt-1">Are you sure you want to delete “{deleteConfirm.title}”? This action cannot be undone.</p>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-end gap-3">
                  <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10">Cancel</button>
                  <button onClick={confirmDelete} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white border border-red-500/30">Delete</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx>{`
        .glass-card-minimal {
          background: rgba(30, 41, 59, 0.4);
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: 12px;
          backdrop-filter: blur(8px);
        }
      `}</style>
    </div>
  );
}
