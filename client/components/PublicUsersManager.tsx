'use client';

import { useState, useEffect } from 'react';
import { publicUsersApi } from '@/lib/api';
import PublicUserForm from './forms/PublicUserForm';
import ProjectAssignmentModal from './ProjectAssignmentModal';
import ConfirmDialog from './ConfirmDialog';

interface PublicUsersManagerProps {
  onClose: () => void;
}

export default function PublicUsersManager({ onClose }: PublicUsersManagerProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; username: string } | null>(null);

  const fetchUsers = async () => {
    try {
      const response = await publicUsersApi.getAll();
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await publicUsersApi.delete(deleteConfirm.id);
      await fetchUsers();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  return (
    <>
      <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-40">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Public Users</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-4 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Manage public users who can access your projects with read/write permissions.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add User
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p>No public users yet. Create one to get started!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user._id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">{user.username}</h3>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            Public User
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{user.email}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {user.projectPermissions?.length || 0} project(s) assigned
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title="Assign Projects"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ id: user._id, username: user.username })}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete User"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <PublicUserForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            fetchUsers();
          }}
        />
      )}

      {editingUser && (
        <ProjectAssignmentModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={() => {
            fetchUsers();
          }}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Delete Public User"
        message={`Are you sure you want to delete user "${deleteConfirm?.username}"? This will remove their access to all projects.`}
        confirmLabel="Delete User"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
        variant="danger"
      />
    </>
  );
}

