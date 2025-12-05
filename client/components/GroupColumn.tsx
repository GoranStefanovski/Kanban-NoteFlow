'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useDataStore } from '@/stores/dataStore';
import { Group } from '@/types';
import NoteCard from './NoteCard';
import NoteForm from './forms/NoteForm';
import GroupForm from './forms/GroupForm';
import ConfirmDialog from './ConfirmDialog';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface GroupColumnProps {
  group: Group;
  canWrite?: boolean;
}

export default function GroupColumn({ group, canWrite: parentCanWrite }: GroupColumnProps) {
  const user = useAuthStore((state) => state.user);
  const { notes, fetchNotes, deleteGroup } = useDataStore();
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Use both sortable (for group reordering) and droppable (for notes)
  const {
    attributes,
    listeners,
    setNodeRef: setSortableNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: group._id,
    disabled: !parentCanWrite,
  });

  const { setNodeRef: setDroppableNodeRef } = useDroppable({
    id: group._id,
  });

  // Combine refs
  const setNodeRef = (node: HTMLElement | null) => {
    setSortableNodeRef(node);
    setDroppableNodeRef(node);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isAdmin = user?.role === 'admin';
  // Public users need BOTH canRead AND canWrite to perform write operations
  const canWrite = parentCanWrite ?? (isAdmin || user?.permissions?.some(
    p => p.projectId === group.projectId && p.canRead && p.canWrite
  ));
  const groupNotes = notes.filter((note) => note.groupId === group._id);

  useEffect(() => {
    fetchNotes(group._id);
  }, [group._id, fetchNotes]);

  const handleDeleteGroup = async () => {
    try {
      await deleteGroup(group._id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Failed to delete group:', error);
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-[500px] sm:h-[600px]"
      >
        <div
          className="p-4 border-b border-gray-200"
          style={{ borderTopColor: group.color, borderTopWidth: '4px' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {canWrite && (
                <button
                  {...attributes}
                  {...listeners}
                  className="p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing touch-none"
                  title="Drag to reorder"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 3C9 2.44772 9.44772 2 10 2C10.5523 2 11 2.44772 11 3V21C11 21.5523 10.5523 22 10 22C9.44772 22 9 21.5523 9 21V3ZM13 3C13 2.44772 13.4477 2 14 2C14.5523 2 15 2.44772 15 3V21C15 21.5523 14.5523 22 14 22C13.4477 22 13 21.5523 13 21V3Z" />
                  </svg>
                </button>
              )}
              <h3 className="font-semibold text-gray-800 truncate">{group.name}</h3>
            </div>
            {canWrite && (
              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={() => setShowGroupForm(true)}
                  className="p-1 text-black-600 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                  title="Edit Group"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                  title="Delete Group"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {groupNotes.map((note) => (
            <NoteCard
              key={note._id}
              note={note}
              projectId={group.projectId}
              onEdit={() => {
                setEditingNote(note);
                setShowNoteForm(true);
              }}
            />
          ))}
          {groupNotes.length === 0 && (
            <div className="text-center text-gray-400 py-8 text-sm">
              No notes yet
            </div>
          )}
        </div>

        {canWrite && (
          <div className="p-3 border-t border-gray-200">
            <button
              onClick={() => setShowNoteForm(true)}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Note
            </button>
          </div>
        )}
      </div>

      {showNoteForm && (
        <NoteForm
          note={editingNote}
          groupId={group._id}
          projectId={group.projectId}
          onClose={() => {
            setShowNoteForm(false);
            setEditingNote(null);
          }}
        />
      )}

      {showGroupForm && (
        <GroupForm
          group={group}
          projectId={group.projectId}
          onClose={() => setShowGroupForm(false)}
        />
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Group"
        message={`Are you sure you want to delete "${group.name}"? All notes in this group will be permanently deleted.`}
        confirmLabel="Delete Group"
        cancelLabel="Cancel"
        onConfirm={handleDeleteGroup}
        onCancel={() => setShowDeleteConfirm(false)}
        variant="danger"
      />
    </>
  );
}

