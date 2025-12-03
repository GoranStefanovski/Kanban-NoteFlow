export interface ProjectPermission {
  projectId: string;
  canRead: boolean;
  canWrite: boolean;
}

export interface User {
  id: string;
  email?: string;
  username?: string;
  role: 'admin' | 'public';
  permissions?: ProjectPermission[];
}

export interface Project {
  _id: string;
  name: string;
  description: string;
  createdBy: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  _id: string;
  name: string;
  projectId: string;
  order: number;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  _id: string;
  title: string;
  content: string;
  groupId: string;
  order: number;
  createdBy: string;
  assigneeId?: string;
  assigneeName?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectUser {
  id: string;
  name: string;
  role: 'admin' | 'public';
}

export interface Comment {
  _id: string;
  noteId: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicUser {
  _id: string;
  username: string;
  email: string;
  projectPermissions: ProjectPermission[];
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  _id: string;
  projectId: string;
  userId: string;
  userRole: 'admin' | 'public';
  userName: string;
  action: string;
  entityType: 'project' | 'group' | 'note' | 'comment';
  entityId: string;
  entityName: string;
  details: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

