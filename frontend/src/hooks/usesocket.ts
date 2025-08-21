import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/authcontext';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;

    // Connect to WebSocket server
    socketRef.current = io('http://localhost:5001', {
      auth: {
        token
      }
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [token]);

  const joinProject = (projectId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('join-project', projectId);
    }
  };

  const leaveProject = (projectId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leave-project', projectId);
    }
  };

  const onTaskCreated = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('task-created', callback);
    }
  };

  const onTaskMoved = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('task-moved', callback);
    }
  };

  return {
    socket: socketRef.current,
    joinProject,
    leaveProject,
    onTaskCreated,
    onTaskMoved
  };
}