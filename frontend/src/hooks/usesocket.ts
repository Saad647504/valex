import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/authcontext';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;

    // Connect to WebSocket server
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || undefined; // default to same origin
    socketRef.current = io(wsUrl || '', {
      auth: {
        token
      }
    });

    socketRef.current.on('connect', () => {
    if (process.env.NODE_ENV !== 'production') console.log('Connected to WebSocket server');
    });

    socketRef.current.on('disconnect', () => {
    if (process.env.NODE_ENV !== 'production') console.log('Disconnected from WebSocket server');
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
      return () => {
        if (socketRef.current) {
          socketRef.current.off('task-created', callback);
        }
      };
    }
    return () => {}; // Return empty function if no socket
  };

  const onTaskMoved = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('task-moved', callback);
      return () => {
        if (socketRef.current) {
          socketRef.current.off('task-moved', callback);
        }
      };
    }
    return () => {}; // Return empty function if no socket
  };

  return {
    socket: socketRef.current,
    joinProject,
    leaveProject,
    onTaskCreated,
    onTaskMoved
  };
}
