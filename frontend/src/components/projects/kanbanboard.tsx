'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
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
// Replace the KanbanColumn component with this version
function KanbanColumn({ column }: { column: Column }) {
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
          <span className="text-sm text-gray-500">{column.tasks.length}</span>
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
    
    // Find the task being dragged
    const task = findTaskById(active.id as string);
    setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || !currentProject) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Find source and target columns
    const sourceColumn = findColumnByTaskId(taskId);
    const targetColumn = findColumnById(overId) || findColumnByTaskId(overId);

    if (!sourceColumn || !targetColumn) return;

    // If dropped in the same position, do nothing
    if (sourceColumn.id === targetColumn.id) return;

    try {
      // Call API to move task
      await axios.patch(`http://localhost:5001/api/tasks/${taskId}/move`, {
        columnId: targetColumn.id,
        position: 1, // Simplified positioning
        fromColumn: sourceColumn.id
      });

      // Refresh project to show updated state
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
            <KanbanColumn key={column.id} column={column} />
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