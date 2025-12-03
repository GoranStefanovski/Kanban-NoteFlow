import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  adminLogin: (email: string, password: string) =>
    api.post('/auth/admin/login', { email, password }),
  
  requestCode: (username: string) =>
    api.post('/auth/public/request-code', { username }),
  
  verifyCode: (username: string, code: string) =>
    api.post('/auth/public/verify-code', { username, code }),
};

// Projects API
export const projectsApi = {
  getAll: () => api.get('/projects'),
  getOne: (id: string) => api.get(`/projects/${id}`),
  create: (data: { name: string; description?: string }) =>
    api.post('/projects', data),
  update: (id: string, data: { name?: string; description?: string }) =>
    api.patch(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  getUsers: (id: string) => api.get(`/projects/${id}/users`),
};

// Groups API
export const groupsApi = {
  getByProject: (projectId: string) =>
    api.get(`/groups/project/${projectId}`),
  getOne: (id: string) => api.get(`/groups/${id}`),
  create: (data: { name: string; projectId: string; order?: number; color?: string }) =>
    api.post('/groups', data),
  update: (id: string, data: { name?: string; order?: number; color?: string }) =>
    api.patch(`/groups/${id}`, data),
  delete: (id: string) => api.delete(`/groups/${id}`),
};

// Notes API
export const notesApi = {
  getByGroup: (groupId: string) => api.get(`/notes/group/${groupId}`),
  getOne: (id: string) => api.get(`/notes/${id}`),
  create: (data: { title: string; content?: string; groupId: string; order?: number; assigneeId?: string; assigneeName?: string }) =>
    api.post('/notes', data),
  update: (id: string, data: { title?: string; content?: string; assigneeId?: string; assigneeName?: string }) =>
    api.patch(`/notes/${id}`, data),
  move: (id: string, data: { newGroupId: string; newOrder: number }) =>
    api.patch(`/notes/${id}/move`, data),
  delete: (id: string) => api.delete(`/notes/${id}`),
};

// Public Users API
export const publicUsersApi = {
  getAll: () => api.get('/public-users'),
  getOne: (id: string) => api.get(`/public-users/${id}`),
  create: (data: any) => api.post('/public-users', data),
  update: (id: string, data: any) => api.patch(`/public-users/${id}`, data),
  delete: (id: string) => api.delete(`/public-users/${id}`),
};

// Comments API
export const commentsApi = {
  getByNote: (noteId: string) => api.get(`/comments/note/${noteId}`),
  create: (data: { noteId: string; content: string }) => api.post('/comments', data),
  update: (id: string, data: { content: string }) => api.patch(`/comments/${id}`, data),
  // No delete - comments cannot be deleted per requirements
};

// Admin API
export const adminApi = {
  getProfile: () => api.get('/admin/profile'),
  updateEmail: (data: { newEmail: string; currentPassword: string }) =>
    api.patch('/admin/email', data),
  updatePassword: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
    api.patch('/admin/password', data),
};

// Activity Log API
export const activityLogApi = {
  getByProject: (projectId: string, limit?: number) =>
    api.get(`/activity-log/project/${projectId}`, {
      params: limit ? { limit } : {},
    }),
};

