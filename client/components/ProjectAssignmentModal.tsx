'use client';

import { useState, useEffect } from 'react';
import { projectsApi, publicUsersApi } from '@/lib/api';
import { Project } from '@/types';

interface ProjectAssignmentModalProps {
  user: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProjectAssignmentModal({
  user,
  onClose,
  onSuccess,
}: ProjectAssignmentModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<{
    [key: string]: { canRead: boolean; canWrite: boolean };
  }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await projectsApi.getAll();
        setProjects(response.data);

        // Initialize selected permissions from user's current permissions
        const initial: any = {};
        user.projectPermissions?.forEach((perm: any) => {
          initial[perm.projectId] = {
            canRead: perm.canRead,
            canWrite: perm.canWrite,
          };
        });
        setSelectedPermissions(initial);
      } catch (err) {
        console.error('Failed to fetch projects:', err);
      }
    };

    fetchProjects();
  }, [user]);

  const togglePermission = (projectId: string, type: 'canRead' | 'canWrite') => {
    setSelectedPermissions((prev) => {
      const current = prev[projectId] || { canRead: false, canWrite: false };
      return {
        ...prev,
        [projectId]: {
          ...current,
          [type]: !current[type],
        },
      };
    });
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');

    try {
      // Build project permissions array
      const projectPermissions = Object.keys(selectedPermissions)
        .filter((projectId) => {
          const perms = selectedPermissions[projectId];
          return perms.canRead || perms.canWrite;
        })
        .map((projectId) => ({
          projectId,
          ...selectedPermissions[projectId],
        }));

      await publicUsersApi.update(user._id, {
        projectPermissions,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update permissions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold">
            Assign Projects to {user.username}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Select projects and set read/write permissions
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {projects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No projects available
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => {
                const perms = selectedPermissions[project._id] || {
                  canRead: false,
                  canWrite: false,
                };

                return (
                  <div
                    key={project._id}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <h3 className="font-medium text-gray-900 mb-2">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="text-sm text-gray-600 mb-3">
                        {project.description}
                      </p>
                    )}
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={perms.canRead}
                          onChange={() =>
                            togglePermission(project._id, 'canRead')
                          }
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">
                          Can Read
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={perms.canWrite}
                          onChange={() =>
                            togglePermission(project._id, 'canWrite')
                          }
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">
                          Can Write
                        </span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {error && (
          <div className="px-6 pb-4">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          </div>
        )}

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Permissions'}
          </button>
        </div>
      </div>
    </div>
  );
}

