import { create } from 'zustand';
import { Project, Group, Note } from '@/types';
import { projectsApi, groupsApi, notesApi } from '@/lib/api';

interface DataState {
  projects: Project[];
  groups: Group[];
  notes: Note[];
  selectedProjectId: string | null;
  loading: boolean;
  error: string | null;
  
  // Projects
  fetchProjects: () => Promise<void>;
  createProject: (data: { name: string; description?: string; color?: string }) => Promise<void>;
  updateProject: (id: string, data: { name?: string; description?: string; color?: string }) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  
  // Groups
  fetchGroups: (projectId: string) => Promise<void>;
  createGroup: (data: { name: string; projectId: string; order?: number; color?: string }) => Promise<void>;
  updateGroup: (id: string, data: { name?: string; order?: number; color?: string }) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  
  // Notes
  fetchNotes: (groupId: string) => Promise<void>;
  createNote: (data: { title: string; content?: string; groupId: string; order?: number; assigneeId?: string | null; assigneeName?: string | null; dueDate?: string | null }) => Promise<void>;
  updateNote: (id: string, data: { title?: string; content?: string; assigneeId?: string | null; assigneeName?: string | null; dueDate?: string | null }) => Promise<void>;
  moveNote: (id: string, data: { newGroupId: string; newOrder: number }) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  
  // UI
  selectProject: (projectId: string) => void;
}

export const useDataStore = create<DataState>((set, get) => ({
  projects: [],
  groups: [],
  notes: [],
  selectedProjectId: null,
  loading: false,
  error: null,
  
  // Projects
  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      const response = await projectsApi.getAll();
      set({ projects: response.data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  createProject: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await projectsApi.create(data);
      set((state) => ({
        projects: [response.data, ...state.projects],
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  updateProject: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await projectsApi.update(id, data);
      set((state) => ({
        projects: state.projects.map((p) =>
          p._id === id ? response.data : p
        ),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  deleteProject: async (id) => {
    set({ loading: true, error: null });
    try {
      await projectsApi.delete(id);
      set((state) => ({
        projects: state.projects.filter((p) => p._id !== id),
        selectedProjectId: state.selectedProjectId === id ? null : state.selectedProjectId,
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  // Groups
  fetchGroups: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const response = await groupsApi.getByProject(projectId);
      set({ groups: response.data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  createGroup: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await groupsApi.create(data);
      set((state) => ({
        groups: [...state.groups, response.data],
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  updateGroup: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await groupsApi.update(id, data);
      set((state) => ({
        groups: state.groups.map((g) =>
          g._id === id ? response.data : g
        ),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  deleteGroup: async (id) => {
    set({ loading: true, error: null });
    try {
      await groupsApi.delete(id);
      set((state) => ({
        groups: state.groups.filter((g) => g._id !== id),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  // Notes
  fetchNotes: async (groupId) => {
    set({ loading: true, error: null });
    try {
      const response = await notesApi.getByGroup(groupId);
      set((state) => {
        // Remove old notes from this group and add the new ones
        const otherNotes = state.notes.filter((n) => n.groupId !== groupId);
        return {
          notes: [...otherNotes, ...response.data],
          loading: false,
        };
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  createNote: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await notesApi.create(data);
      set((state) => ({
        notes: [...state.notes, response.data],
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  updateNote: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await notesApi.update(id, data);
      set((state) => ({
        notes: state.notes.map((n) =>
          n._id === id ? response.data : n
        ),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  moveNote: async (id, data) => {
    try {
      const response = await notesApi.move(id, data);
      set((state) => ({
        notes: state.notes.map((n) =>
          n._id === id ? response.data : n
        ),
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },
  
  deleteNote: async (id) => {
    set({ loading: true, error: null });
    try {
      await notesApi.delete(id);
      set((state) => ({
        notes: state.notes.filter((n) => n._id !== id),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  // UI
  selectProject: (projectId) => {
    set({ selectedProjectId: projectId });
  },
}));

