'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useDataStore } from '@/stores/dataStore';
import ProjectForm from './forms/ProjectForm';
import ConfirmDialog from './ConfirmDialog';

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

export default function Sidebar({ open, onToggle }: SidebarProps) {
  const user = useAuthStore((state) => state.user);
  const { projects, selectedProjectId, selectProject, deleteProject } = useDataStore();
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const isAdmin = user?.role === 'admin';

  const handleProjectClick = (projectId: string) => {
    selectProject(projectId);
  };

  const handleDeleteProject = async (e: React.MouseEvent, projectId: string, projectName: string) => {
    e.stopPropagation();
    setDeleteConfirm({ id: projectId, name: projectName });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteProject(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-50
        w-80 bg-white border-r border-gray-200 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${!open ? 'lg:w-0 lg:border-0 lg:overflow-hidden' : ''}
      `}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Projects</h2>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => setShowProjectForm(true)}
                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                title="Create Project"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
            <button
              onClick={onToggle}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {projects.length === 0 ? (
            <div className="text-center text-gray-500 py-8 text-sm">
              No projects yet
            </div>
          ) : (
            <div className="space-y-1">
              {projects.map((project) => (
                <div
                  key={project._id}
                  onClick={() => handleProjectClick(project._id)}
                  className={`p-3 rounded-lg cursor-pointer transition-all group relative overflow-hidden ${
                    selectedProjectId === project._id
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                  style={{
                    borderLeft: selectedProjectId === project._id 
                      ? `4px solid ${project.color}` 
                      : '4px solid transparent'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: project.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{project.name}</h3>
                        {project.description && (
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {project.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProject(project);
                            setShowProjectForm(true);
                          }}
                          className="p-1 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => handleDeleteProject(e, project._id, project.name)}
                          className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {showProjectForm && (
        <ProjectForm
          project={editingProject}
          onClose={() => {
            setShowProjectForm(false);
            setEditingProject(null);
          }}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? All groups and notes will be permanently deleted.`}
        confirmLabel="Delete Project"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
        variant="danger"
      />
    </>
  );
}

