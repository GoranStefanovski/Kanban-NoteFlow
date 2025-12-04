'use client';

import { useState, useEffect } from 'react';
import { publicUsersApi } from '@/lib/api';

interface PublicUserFormProps {
  onClose: () => void;
  onSuccess: () => void;
  user?: any; // Optional user prop for edit mode
}

export default function PublicUserForm({ onClose, onSuccess, user }: PublicUserFormProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isEditMode = !!user;

  // Pre-populate fields when editing
  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isEditMode) {
        // Update existing user
        await publicUsersApi.update(user._id, {
          username,
          email,
        });
      } else {
        // Create new user
        await publicUsersApi.create({
          username,
          email,
          projectPermissions: [], // Start with no permissions
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} user`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-2xl font-bold mb-4">
          {isEditMode ? 'Edit Public User' : 'Add Public User'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="johndoe"
              required
              minLength={3}
            />
            <p className="text-xs text-gray-500 mt-1">
              This is what the user will use to login
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="john@example.com"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Used for sending verification codes
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {!isEditMode && (
            <div className="bg-blue-50 border border-blue-200 px-4 py-3 rounded-lg text-sm text-blue-800">
              <p className="font-medium mb-1">Note:</p>
              <p>The user will be created without project access. You can assign project permissions later.</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update User' : 'Create User')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

