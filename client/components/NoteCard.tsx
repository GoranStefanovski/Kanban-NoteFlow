'use client';

import { useState, useEffect, useRef } from 'react';
import { Note, ProjectUser } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { useDataStore } from '@/stores/dataStore';
import { projectsApi, commentsApi } from '@/lib/api';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import CommentsModal from './CommentsModal';
import ConfirmDialog from './ConfirmDialog';

interface NoteCardProps {
  note: Note;
  projectId: string;
  onEdit: () => void;
}

export default function NoteCard({ note, projectId, onEdit }: NoteCardProps) {
  const user = useAuthStore((state) => state.user);
  const { deleteNote, updateNote, fetchGroups } = useDataStore();
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [projectUsers, setProjectUsers] = useState<ProjectUser[]>([]);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: note._id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const isAdmin = user?.role === 'admin';
  // Public users need BOTH canRead AND canWrite to perform write operations
  const canWrite = isAdmin || user?.permissions?.some(
    p => p.projectId === projectId && p.canRead && p.canWrite
  );
  const canDelete = isAdmin; // Only admin can delete notes

  useEffect(() => {
    const fetchProjectUsers = async () => {
      try {
        const response = await projectsApi.getUsers(projectId);
        setProjectUsers(response.data.users);
      } catch (err) {
        console.error('Failed to fetch project users:', err);
      }
    };

    if (showAssigneeDropdown) {
      fetchProjectUsers();
    }
  }, [projectId, showAssigneeDropdown]);

  useEffect(() => {
    const fetchCommentCount = async () => {
      try {
        const response = await commentsApi.getByNote(note._id);
        setCommentCount(response.data.length);
      } catch (err) {
        console.error('Failed to fetch comments:', err);
      }
    };

    fetchCommentCount();
  }, [note._id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target as Node)) {
        setShowAssigneeDropdown(false);
      }
    };

    if (showAssigneeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAssigneeDropdown]);

  const handleDelete = async () => {
    try {
      await deleteNote(note._id);
      setShowDeleteConfirm(false);
      // Refresh groups to update the UI after deletion
      if (projectId) {
        fetchGroups(projectId);
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const handleAssigneeChange = async (userId: string) => {
    const selectedUser = projectUsers.find((u) => u.id === userId);
    try {
      await updateNote(note._id, {
        assigneeId: userId || null,
        assigneeName: selectedUser?.name || null,
      });
      setShowAssigneeDropdown(false);
    } catch (error) {
      console.error('Failed to update assignee:', error);
    }
  };

  // Calculate due date status
  const getDueDateStatus = () => {
    if (!note.dueDate) return null;
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(note.dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { status: 'overdue', text: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`, color: 'bg-red-100 text-red-700' };
    } else if (diffDays === 0) {
      return { status: 'today', text: 'Due today', color: 'bg-yellow-100 text-yellow-700' };
    } else if (diffDays === 1) {
      return { status: 'tomorrow', text: 'Due tomorrow', color: 'bg-green-100 text-green-700' };
    } else {
      return { status: 'future', text: `Due in ${diffDays} days`, color: 'bg-green-100 text-green-700' };
    }
  };

  const dueDateStatus = getDueDateStatus();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:shadow-md transition-shadow group pointer-events-auto"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="cursor-move text-gray-400 hover:text-gray-600 mt-0.5 flex-shrink-0 p-1 hover:bg-gray-200 rounded"
            title="Drag to move"
            type="button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-800 truncate">{note.title}</h4>
            {note.content && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-3">
                {note.content}
              </p>
            )}
            
            {/* Metadata */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs text-gray-400">{note.createdBy}</span>
              <span className="text-xs text-gray-400">
                {new Date(note.createdAt).toLocaleDateString()}
              </span>
              
              {/* Comments Count */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setShowCommentsModal(true);
                }}
                type="button"
                className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1 hover:bg-gray-200 transition-colors pointer-events-auto"
                title="View Comments"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {commentCount}
              </button>

              {/* Due Date Badge */}
              {dueDateStatus && (
                <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${dueDateStatus.color} ${canWrite ? 'pr-1' : ''}`}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {dueDateStatus.text}
                  {canWrite && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        try {
                          await updateNote(note._id, { dueDate: null });
                        } catch (error) {
                          console.error('Failed to clear due date:', error);
                        }
                      }}
                      type="button"
                      className="ml-0.5 hover:bg-black/10 rounded-full p-0.5 transition-colors"
                      title="Clear due date"
                    >
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </span>
              )}
              
              {/* Assignee Badge/Button */}
              {canWrite ? (
                <div className="relative z-10" ref={assigneeDropdownRef}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setShowAssigneeDropdown(!showAssigneeDropdown);
                    }}
                    type="button"
                    className={`text-xs px-2 py-0.5 rounded-full transition-colors pointer-events-auto flex items-center gap-1 ${
                      note.assigneeName 
                        ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={note.assigneeName ? 'Click to change assignee' : 'Click to assign'}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {note.assigneeName || 'Assign'}
                  </button>
                  
                  {/* Assignee Dropdown */}
                  {showAssigneeDropdown && (
                    <div className="absolute z-20 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[150px] max-h-[200px] overflow-y-auto pointer-events-auto">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleAssigneeChange('');
                        }}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-500"
                      >
                        None
                      </button>
                      {projectUsers.filter(user => user.role !== 'admin').map((projectUser) => (
                        <button
                          key={projectUser.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleAssigneeChange(projectUser.id);
                          }}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                        >
                          {projectUser.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : note.assigneeName ? (
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {note.assigneeName}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {canWrite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onEdit();
              }}
              type="button"
              className="p-1.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded pointer-events-auto"
              title="Edit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowDeleteConfirm(true);
              }}
              type="button"
              className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded pointer-events-auto"
              title="Delete (Admin Only)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Comments Modal */}
      {showCommentsModal && (
        <CommentsModal
          noteId={note._id}
          noteTitle={note.title}
          onClose={() => {
            setShowCommentsModal(false);
            // Refresh comment count after closing
            commentsApi.getByNote(note._id).then((res) => {
              setCommentCount(res.data.length);
            });
          }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Note"
        message={`Are you sure you want to delete "${note.title}"? This action cannot be undone.`}
        confirmLabel="Delete Note"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        variant="danger"
      />
    </div>
  );
}
