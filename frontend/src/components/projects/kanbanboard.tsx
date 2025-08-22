// frontend/src/components/projects/KanbanBoard.tsx
'use client';

import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
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
import { useProjects } from '@/contexts/projectcontext';
import axios from 'axios';

interface Task {
  id: string;
  title: string;
  description: string;
  key: string;
  priority: string;
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

// Create Task Modal Component
function CreateTaskModal({ isOpen, onClose, columnId, projectId }: {
  isOpen: boolean;
  onClose: () => void;
  columnId: string;
  projectId: string;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [useAI, setUseAI] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const { createTask } = useProjects();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createTask({
        title,
        description,
        projectId,
        columnId,
        priority,
        useAI
      });
      
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      onClose();
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Create New Task</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter task title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the task"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="useAI"
              checked={useAI}
              onChange={(e) => setUseAI(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="useAI" className="text-sm text-gray-700">
              Use AI for smart assignment
            </label>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Draggable Task Component
function TaskCard({ task }: { task: Task }) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
        <span className={`text-xs px-2 py-1 rounded ${
          task.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
          task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {task.priority}
        </span>
      </div>
      
      {task.description && (
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {task.description}
        </p>
      )}
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{task.key}</span>
        {task.assignee && (
          <span>{task.assignee.firstName} {task.assignee.lastName}</span>
        )}
      </div>
    </div>
  );
}

// Droppable Column Component
function KanbanColumn({ column, currentProject }: { column: Column; currentProject: any }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  
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
      className={`flex-shrink-0 w-80 rounded-lg p-4 ${
        isOver ? 'bg-blue-50 border-2 border-blue-300' : 'bg-gray-50'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{column.name}</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">{column.tasks.length}</span>
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 text-xs"
          >
            +
          </button>
        </div>
      </div>

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 min-h-[200px]">
          {column.tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
          
          {column.tasks.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
              Drop tasks here
            </div>
          )}
        </div>
      </SortableContext>

      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        columnId={column.id}
        projectId={currentProject.id}
      />
    </div>
  );
}

export default function KanbanBoard() {
  const { currentProject, loading, loadProject } = useProjects();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

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

    if (sourceColumn.id === targetColumn.id) return;

    try {
      await axios.patch(`http://localhost:5001/api/tasks/${taskId}/move`, {
        columnId: targetColumn.id,
        position: 1,
        fromColumn: sourceColumn.id
      });

      await loadProject(currentProject.id);
    } catch (error) {
      console.error('Failed to move task:', error);
    }
  };

  const findTaskById = (taskId: string): Task | null => {
    if (!currentProject) return null;
    
    for (const column of currentProject.columns) {
      const task = column.tasks.find(task => task.id === taskId);
      if (task) return task;
    }
    return null;
  };

  const findColumnByTaskId = (taskId: string) => {
    if (!currentProject) return null;
    
    return currentProject.columns.find(column =>
      column.tasks.some(task => task.id === taskId)
    );
  };

  const findColumnById = (columnId: string) => {
    if (!currentProject) return null;
    
    return currentProject.columns.find(column => column.id === columnId);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">Loading project...</div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">Select a project to view tasks</div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{currentProject.name}</h1>
        <p className="text-gray-600">{currentProject.description}</p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex space-x-6 overflow-x-auto h-full">
          {currentProject.columns?.map((column) => (
            <KanbanColumn key={column.id} column={column} currentProject={currentProject} />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="bg-white rounded-lg p-4 shadow-lg border-2 border-blue-500 opacity-95 rotate-3">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-900 text-sm">{activeTask.title}</h4>
                <span className={`text-xs px-2 py-1 rounded ${
                  activeTask.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                  activeTask.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {activeTask.priority}
                </span>
              </div>
              <div className="text-xs text-gray-500">{activeTask.key}</div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}