'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useDataStore } from '@/stores/dataStore';
import GroupColumn from './GroupColumn';
import GroupForm from './forms/GroupForm';
import { DndContext, DragOverlay, closestCorners, DragEndEvent, DragStartEvent, DragOverEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import NoteCard from './NoteCard';

export default function MainContent() {
  const user = useAuthStore((state) => state.user);
  const { selectedProjectId, groups, notes, fetchGroups, moveNote, updateGroup } = useDataStore();
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [activeNote, setActiveNote] = useState<any>(null);
  const [activeGroup, setActiveGroup] = useState<any>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';
  // Public users need BOTH canRead AND canWrite to perform write operations
  const canWrite = isAdmin || user?.permissions?.some(
    p => p.projectId === selectedProjectId && p.canRead && p.canWrite
  );

  // Configure sensors for better drag experience
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before dragging starts
      },
    })
  );

  useEffect(() => {
    if (selectedProjectId) {
      fetchGroups(selectedProjectId);
    }
  }, [selectedProjectId, fetchGroups]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    // Check if dragging a note or a group
    const note = notes.find((n) => n._id === active.id);
    const group = groups.find((g) => g._id === active.id);
    
    if (note) {
      setActiveNote(note);
    } else if (group) {
      setActiveGroup(group);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveNote(null);
    setActiveGroup(null);
    setActiveId(null);

    if (!over) return;

    // Check if we're dragging a group
    const draggedGroup = groups.find((g) => g._id === active.id);
    if (draggedGroup) {
      const overId = over.id as string;
      const overGroup = groups.find((g) => g._id === overId);
      
      if (overGroup && draggedGroup._id !== overGroup._id) {
        const oldIndex = groups.findIndex((g) => g._id === draggedGroup._id);
        const newIndex = groups.findIndex((g) => g._id === overGroup._id);
        
        const reorderedGroups = arrayMove(groups, oldIndex, newIndex);
        
        // Update order for all affected groups
        try {
          await Promise.all(
            reorderedGroups.map((group, index) =>
              updateGroup(group._id, { order: index })
            )
          );
          // Refresh to get updated data
          if (selectedProjectId) {
            fetchGroups(selectedProjectId);
          }
        } catch (error) {
          console.error('Failed to reorder groups:', error);
        }
      }
      return;
    }

    // Handle note dragging (existing logic)
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
      sensors={sensors}
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
          <SortableContext items={groups.map(g => g._id)} strategy={horizontalListSortingStrategy}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
              {groups.map((group) => (
                <GroupColumn key={group._id} group={group} canWrite={canWrite} />
              ))}
            </div>
          </SortableContext>
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
        ) : activeGroup ? (
          <div className="bg-white rounded-lg shadow-2xl border-2 border-indigo-500 w-80 opacity-90">
            <div
              className="p-4 border-b border-gray-200"
              style={{ borderTopColor: activeGroup.color, borderTopWidth: '4px' }}
            >
              <h3 className="font-semibold text-gray-800">{activeGroup.name}</h3>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

