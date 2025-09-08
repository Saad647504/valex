// API client and utilities - Prefer env base URL, fallback to Next.js proxy
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api';

// Store JWT token
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
};

export const getAuthToken = (): string | null => {
  if (authToken) return authToken;
  if (typeof window !== 'undefined') {
    authToken = localStorage.getItem('auth_token');
  }
  return authToken;
};

// Generic API request helper
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const fullUrl = `${API_BASE}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const isDev = typeof window !== 'undefined' && process.env.NODE_ENV !== 'production';
    if (isDev) {
      const safeConfig = { ...config, headers: { ...(config.headers as any), Authorization: 'REDACTED' } };
      // eslint-disable-next-line no-console
      console.log('🌐 API Request:', fullUrl, safeConfig);
    }
    const response = await fetch(fullUrl, config);
    if (isDev) {
      // eslint-disable-next-line no-console
      console.log('🌐 API Response status:', response.status, response.statusText);
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: 'Network error' }));
      if (isDev) {
        // eslint-disable-next-line no-console
        console.log('❌ API Error body:', errorBody);
      }
      const err: any = new Error(errorBody.error || `HTTP ${response.status}`);
      err.status = response.status;
      err.body = errorBody;
      throw err;
    }

    const data = await response.json();
    if (isDev) {
      // eslint-disable-next-line no-console
      console.log('🌐 API Success data:', data);
    }
    return data;
  } catch (fetchError) {
    // eslint-disable-next-line no-console
    console.error('API: Fetch failed:', fetchError);
    throw fetchError;
  }
};

// Auth APIs
export const authAPI = {
  login: async (email: string, password: string) => {
    // eslint-disable-next-line no-console
    console.log('API: Making login request to /auth/login');
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    // eslint-disable-next-line no-console
    console.log('API: Login response received:', {
      hasUser: !!response.user,
      hasToken: !!response.token,
      message: response.message
    });
    
    if (response.token) {
      setAuthToken(response.token);
      // eslint-disable-next-line no-console
      console.log('API: Token saved to localStorage');
    }
    return response;
  },

  register: async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password: string;
  }) => {
    // eslint-disable-next-line no-console
    console.log('API: Making registration request to /auth/register with data:', userData);
    try {
      const response = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      // eslint-disable-next-line no-console
      console.log('API: Raw registration response:', response);
      // eslint-disable-next-line no-console
      console.log('API: Response structure check:', {
        hasUser: !!response.user,
        hasToken: !!response.token,
        message: response.message,
        userKeys: response.user ? Object.keys(response.user) : 'no user',
        tokenType: typeof response.token
      });
      return response;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('API: Registration request failed:', error);
      throw error;
    }
  },

  logout: () => {
    setAuthToken(null);
  },
};

// Project APIs
export const projectAPI = {
  getProjects: () => apiRequest('/projects'),
  
  getProject: (projectId: string) => apiRequest(`/projects/${projectId}`),
  
  getProjectByKey: (projectKey: string) => apiRequest(`/projects/key/${projectKey}`),
  
  createProject: (projectData: {
    name: string;
    description?: string;
    key: string;
    color?: string;
  }) => apiRequest('/projects', {
    method: 'POST',
    body: JSON.stringify(projectData),
  }),

  deleteProject: (projectId: string) => apiRequest(`/projects/${projectId}`, {
    method: 'DELETE',
  }),
};

// Task APIs
export const taskAPI = {
  createTask: (taskData: {
    title: string;
    description?: string;
    projectId: string;
    columnId: string;
    assigneeId?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    estimatedMinutes?: number;
    useAI?: boolean;
  }) => apiRequest('/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData),
  }),

  updateTask: (taskId: string, taskData: any) => apiRequest(`/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(taskData),
  }),

  moveTask: (taskId: string, moveData: {
    columnId: string;
    position: number;
    fromColumn: string;
  }) => apiRequest(`/tasks/${taskId}/move`, {
    method: 'PATCH',
    body: JSON.stringify(moveData),
  }),
  autoAssign: (taskId: string) => apiRequest(`/tasks/${taskId}/auto-assign`, {
    method: 'POST'
  }),

  deleteTask: (taskId: string) => apiRequest(`/tasks/${taskId}`, {
    method: 'DELETE',
  }),
};

// Analytics APIs
export const analyticsAPI = {
  getProjectAnalytics: (projectKey: string) => 
    apiRequest(`/analytics/project/key/${projectKey}`),
    
  getPersonalAnalytics: (userId: string) =>
    apiRequest(`/analytics/user/${userId}`),
};

// Search APIs
export const searchAPI = {
  search: (query: string, filters?: any) => apiRequest('/search', {
    method: 'POST',
    body: JSON.stringify({ query, ...filters }),
  }),

  searchTasks: (body: {
    projectId: string;
    filters?: any;
    page?: number;
    limit?: number;
  }) => apiRequest('/search/tasks', {
    method: 'POST',
    body: JSON.stringify(body),
  }),
};

// AI APIs
export const aiAPI = {
  chat: (message: string, context?: any) => apiRequest('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message, context }),
  }),

  analyzeTask: (title: string, description: string, projectId: string) => apiRequest('/ai/analyze-task', {
    method: 'POST',
    body: JSON.stringify({ title, description, projectId }),
  }),

  suggestTasks: (projectContext: string) => apiRequest('/ai/suggest-tasks', {
    method: 'POST',
    body: JSON.stringify({ projectContext }),
  }),

  getInsights: () => apiRequest('/ai/insights'),
};

// Session APIs
export const sessionAPI = {
  startSession: (sessionData: {
    duration: number;
    projectId?: string;
    taskId?: string;
    sessionType?: 'FOCUS' | 'BREAK';
  }) => apiRequest('/sessions/start', {
    method: 'POST',
    body: JSON.stringify(sessionData),
  }),

  completeSession: (sessionId: string, data: {
    actualDuration?: number;
    notes?: string;
  }) => apiRequest(`/sessions/${sessionId}/complete`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  pauseSession: (sessionId: string) => apiRequest(`/sessions/${sessionId}/pause`, {
    method: 'POST',
  }),

  getStats: (period?: '1d' | '7d' | '30d') => apiRequest('/sessions/stats', {
    method: 'GET',
  }),

  getActiveSession: () => apiRequest('/sessions/active'),
};

// Notes APIs
export const notesAPI = {
  getNotes: (search?: string, tag?: string) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (tag) params.append('tag', tag);
    const queryString = params.toString();
    return apiRequest(`/notes${queryString ? `?${queryString}` : ''}`);
  },

  createNote: (noteData: {
    title: string;
    content: string;
    color?: string;
    tags?: string[];
    projectId?: string;
  }) => apiRequest('/notes', {
    method: 'POST',
    body: JSON.stringify(noteData),
  }),

  updateNote: (noteId: string, noteData: {
    title?: string;
    content?: string;
    color?: string;
    tags?: string[];
    projectId?: string;
  }) => apiRequest(`/notes/${noteId}`, {
    method: 'PUT',
    body: JSON.stringify(noteData),
  }),

  deleteNote: (noteId: string) => apiRequest(`/notes/${noteId}`, {
    method: 'DELETE',
  }),

  getNote: (noteId: string) => apiRequest(`/notes/${noteId}`),
};

// GitHub APIs
export const githubAPI = {
  getStatus: () => apiRequest('/github/status'),
};


// User APIs
export const userAPI = {
  searchUsers: (query: string) => apiRequest(`/users/search?q=${encodeURIComponent(query)}`),

  getUserProfile: (username: string) => apiRequest(`/users/profile/${username}`),

  getCurrentUser: () => apiRequest('/users/me'),

  updateProfile: (profileData: {
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string;
    avatar?: string;
  }) => apiRequest('/users/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  }),

  updatePassword: (passwordData: {
    currentPassword: string;
    newPassword: string;
  }) => apiRequest('/users/password', {
    method: 'PUT',
    body: JSON.stringify(passwordData),
  }),

  inviteUserToProject: (projectId: string, userData: {
    userId: string;
    role?: 'MEMBER' | 'ADMIN' | 'VIEWER';
  }) => apiRequest(`/team/projects/${projectId}/invite-user`, {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
};

// Notifications APIs
export const notificationsAPI = {
  getNotifications: (unreadOnly = false, limit = 20) => apiRequest(`/notifications?unreadOnly=${unreadOnly}&limit=${limit}`),
  
  markAsRead: (notificationId: string) => apiRequest(`/notifications/${notificationId}/read`, {
    method: 'PUT',
  }),
  
  markAllAsRead: () => apiRequest('/notifications/read-all', {
    method: 'PUT',
  }),
};

// Team APIs
export const teamAPI = {
  // Send invitation by email
  sendInvitation: (projectId: string, inviteData: {
    email: string;
    role?: 'MEMBER' | 'ADMIN' | 'VIEWER';
  }) => apiRequest(`/team/projects/${projectId}/invite`, {
    method: 'POST',
    body: JSON.stringify(inviteData),
  }),

  // Get project members
  getMembers: (projectId: string) => apiRequest(`/team/projects/${projectId}/members`),

  // Remove member from project
  removeMember: (projectId: string, memberId: string) => apiRequest(`/team/projects/${projectId}/members/${memberId}`, {
    method: 'DELETE',
  }),

  // Update member role
  updateMemberRole: (projectId: string, memberId: string, role: string) => apiRequest(`/team/projects/${projectId}/members/${memberId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  }),

  // Get pending invitations for current user
  getPendingInvitations: () => apiRequest('/team/invitations/pending'),

  // Accept invitation
  acceptInvitation: (token: string) => apiRequest(`/team/invitations/${token}/accept`, {
    method: 'POST',
  }),

  // Decline invitation
  declineInvitation: (token: string) => apiRequest(`/team/invitations/${token}/decline`, {
    method: 'POST',
  }),

  // Get user's colleagues
  getColleagues: () => apiRequest('/team/colleagues'),

  // Remove colleague relationship
  removeColleague: (colleagueId: string) => apiRequest(`/team/colleagues/${colleagueId}`, {
    method: 'DELETE',
  }),

  // Check if invitation can be sent
  canInvite: (projectId: string, email: string) => apiRequest(`/team/projects/${projectId}/can-invite/${encodeURIComponent(email)}`),
};

export default {
  auth: authAPI,
  projects: projectAPI,
  tasks: taskAPI,
  analytics: analyticsAPI,
  search: searchAPI,
  ai: aiAPI,
  sessions: sessionAPI,
  notes: notesAPI,
  team: teamAPI,
  users: userAPI,
  notifications: notificationsAPI,
};
