'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useDataStore } from '@/stores/dataStore';
import GroupColumn from './GroupColumn';
import GroupForm from './forms/GroupForm';
import { DndContext, DragOverlay, closestCorners, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import NoteCard from './NoteCard';

export default function MainContent() {
  const user = useAuthStore((state) => state.user);
  const { selectedProjectId, groups, notes, fetchGroups, moveNote } = useDataStore();
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [activeNote, setActiveNote] = useState<any>(null);

  const isAdmin = user?.role === 'admin';
  // Public users need BOTH canRead AND canWrite to perform write operations
  const canWrite = isAdmin || user?.permissions?.some(
    p => p.projectId === selectedProjectId && p.canRead && p.canWrite
  );

  useEffect(() => {
    if (selectedProjectId) {
      fetchGroups(selectedProjectId);
    }
  }, [selectedProjectId, fetchGroups]);

  const handleDragStart = (event: DragStartEvent) => {
    const note = notes.find((n) => n._id === event.active.id);
    setActiveNote(note);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveNote(null);

    if (!over) return;

    const noteId = active.id as string;
    const newGroupId = over.id as string;

    const note = notes.find((n) => n._id === noteId);
    if (!note) return;

    // If dropped on the same group, do nothing
    if (note.groupId === newGroupId) return;

    // Calculate new order (put it at the end of the new group)
    const notesInNewGroup = notes.filter((n) => n.groupId === newGroupId);
    const newOrder = notesInNewGroup.length;

    try {
      await moveNote(noteId, { newGroupId, newOrder });
      // Refresh notes for both groups
      if (selectedProjectId) {
        fetchGroups(selectedProjectId);
      }
    } catch (error) {
      console.error('Failed to move note:', error);
    }
  };

  if (!selectedProjectId) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-lg">Select a project to get started</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full p-4 sm:p-6">
        <div className="mb-4 sm:mb-6 flex items-center justify-between gap-3">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Note Groups</h2>
          {canWrite && (
            <button
              onClick={() => setShowGroupForm(true)}
              className="px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Add Group</span>
              <span className="sm:hidden">Add</span>
            </button>
          )}
        </div>

        {groups.length === 0 ? (
          <div className="text-center text-gray-500 py-12 sm:py-16">
            <p className="text-sm sm:text-base">No groups yet. {canWrite && 'Create one to get started!'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
            {groups.map((group) => (
              <GroupColumn key={group._id} group={group} />
            ))}
          </div>
        )}

        {showGroupForm && (
          <GroupForm
            onClose={() => setShowGroupForm(false)}
            projectId={selectedProjectId}
          />
        )}
      </div>

      <DragOverlay>
        {activeNote ? (
          <div className="bg-white p-3 rounded-lg border-2 border-indigo-500 shadow-xl opacity-90">
            <h4 className="font-medium text-gray-800">{activeNote.title}</h4>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

