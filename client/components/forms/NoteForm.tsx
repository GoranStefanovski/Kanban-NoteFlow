'use client';

import { useState, useEffect } from 'react';
import { useDataStore } from '@/stores/dataStore';
import { projectsApi } from '@/lib/api';
import { ProjectUser } from '@/types';

interface NoteFormProps {
  note?: any;
  groupId: string;
  projectId: string;
  onClose: () => void;
}

export default function NoteForm({ note, groupId, projectId, onClose }: NoteFormProps) {
  const { createNote, updateNote, fetchGroups } = useDataStore();
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [assigneeId, setAssigneeId] = useState(note?.assigneeId || '');
  const [assigneeName, setAssigneeName] = useState(note?.assigneeName || '');
  const [dueDate, setDueDate] = useState(note?.dueDate ? note.dueDate.split('T')[0] : '');
  const [projectUsers, setProjectUsers] = useState<ProjectUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!note;

  useEffect(() => {
    const fetchProjectUsers = async () => {
      try {
        const response = await projectsApi.getUsers(projectId);
        setProjectUsers(response.data.users);
      } catch (err) {
        console.error('Failed to fetch project users:', err);
      }
    };

    fetchProjectUsers();
  }, [projectId]);

  const handleAssigneeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setAssigneeId(selectedId);
    
    if (selectedId) {
      const user = projectUsers.find((u) => u.id === selectedId);
      setAssigneeName(user?.name || '');
    } else {
      setAssigneeName('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const noteData = {
        title,
        content,
        assigneeId: assigneeId || undefined,
        assigneeName: assigneeName || undefined,
        dueDate: dueDate || undefined,
      };

      if (isEdit) {
        await updateNote(note._id, noteData);
      } else {
        await createNote({ ...noteData, groupId, order: 0 });
      }
      onClose();
      // Refresh groups to update the UI
      if (projectId) {
        fetchGroups(projectId);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
        <h2 className="text-2xl font-bold mb-4">
          {isEdit ? 'Edit Note' : 'Create Note'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="Note title..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="Note content..."
              rows={8}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assignee (Optional)
            </label>
            <select
              value={assigneeId}
              onChange={handleAssigneeChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            >
              <option value="">None</option>
              {projectUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} {user.role === 'admin' ? '(Admin)' : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Assign this note to someone with project access
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
              {dueDate && (
                <button
                  type="button"
                  onClick={() => setDueDate('')}
                  className="px-3 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  title="Clear due date"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
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
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

