'use client';

import { useState, useEffect } from 'react';
import { activityLogApi } from '@/lib/api';
import { ActivityLog } from '@/types';

interface ActivityLogViewerProps {
  projectId: string;
  projectName: string;
  onClose: () => void;
}

export default function ActivityLogViewer({ projectId, projectName, onClose }: ActivityLogViewerProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchLogs();
  }, [projectId]);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await activityLogApi.getByProject(projectId, 20);
      setLogs(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    // Assignee actions
    if (action.includes('assignee') || action.includes('assigned')) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    }
    // Due date actions
    if (action.includes('due date')) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }

    switch (action) {
      case 'created':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        );
      case 'updated':
      case 'updated note':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        );
      case 'deleted':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        );
      case 'moved':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getActionColor = (action: string) => {
    // Assignee actions
    if (action.includes('assignee') || action.includes('assigned')) {
      return 'text-indigo-600 bg-indigo-100';
    }
    // Due date actions
    if (action.includes('due date')) {
      return 'text-orange-600 bg-orange-100';
    }

    switch (action) {
      case 'created':
        return 'text-green-600 bg-green-100';
      case 'updated':
      case 'updated note':
        return 'text-blue-600 bg-blue-100';
      case 'deleted':
        return 'text-red-600 bg-red-100';
      case 'moved':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatActivityDescription = (log: ActivityLog) => {
    const details = log.details || {};
    
    switch (log.action) {
      case 'assigned note to':
        return (
          <span>
            <span className="text-gray-600">assigned</span>{' '}
            <span className="font-medium text-gray-900">"{log.entityName}"</span>{' '}
            <span className="text-gray-600">to</span>{' '}
            <span className="font-semibold text-indigo-600">{details.assigneeTo}</span>
          </span>
        );
      
      case 'removed assignee':
        return (
          <span>
            <span className="text-gray-600">removed assignee from</span>{' '}
            <span className="font-medium text-gray-900">"{log.entityName}"</span>
            {details.previousAssignee && (
              <>
                {' '}<span className="text-gray-500">(was {details.previousAssignee})</span>
              </>
            )}
          </span>
        );
      
      case 'changed assignee':
        return (
          <span>
            <span className="text-gray-600">changed assignee of</span>{' '}
            <span className="font-medium text-gray-900">"{log.entityName}"</span>{' '}
            <span className="text-gray-600">from</span>{' '}
            <span className="font-semibold text-gray-700">{details.from}</span>{' '}
            <span className="text-gray-600">to</span>{' '}
            <span className="font-semibold text-indigo-600">{details.to}</span>
          </span>
        );
      
      case 'set due date':
        return (
          <span>
            <span className="text-gray-600">set due date for</span>{' '}
            <span className="font-medium text-gray-900">"{log.entityName}"</span>{' '}
            <span className="text-gray-600">to</span>{' '}
            <span className="font-semibold text-orange-600">{details.dueDate}</span>
          </span>
        );
      
      case 'removed due date':
        return (
          <span>
            <span className="text-gray-600">removed due date from</span>{' '}
            <span className="font-medium text-gray-900">"{log.entityName}"</span>
            {details.previousDueDate && (
              <>
                {' '}<span className="text-gray-500">(was {details.previousDueDate})</span>
              </>
            )}
          </span>
        );
      
      case 'changed due date':
        return (
          <span>
            <span className="text-gray-600">changed due date of</span>{' '}
            <span className="font-medium text-gray-900">"{log.entityName}"</span>{' '}
            <span className="text-gray-600">from</span>{' '}
            <span className="font-semibold text-gray-700">{details.from}</span>{' '}
            <span className="text-gray-600">to</span>{' '}
            <span className="font-semibold text-orange-600">{details.to}</span>
          </span>
        );
      
      case 'updated note':
        return (
          <span>
            <span className="text-gray-600">updated</span>{' '}
            <span className="font-medium text-gray-900">"{log.entityName}"</span>
            {details.changes && details.changes.length > 0 && (
              <>
                {' '}<span className="text-gray-500">({details.changes.join(', ')})</span>
              </>
            )}
          </span>
        );
      
      default:
        // Default format for other actions
        return (
          <span>
            <span className="text-gray-600">{log.action}</span>{' '}
            <span className="text-gray-600">{log.entityType}</span>{' '}
            <span className="font-medium text-gray-900">"{log.entityName}"</span>
          </span>
        );
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'project':
        return '📁';
      case 'group':
        return '📂';
      case 'note':
        return '📝';
      case 'comment':
        return '💬';
      default:
        return '📄';
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    return date.toLocaleDateString();
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    if (filter === 'updated') {
      // Include all update-related actions
      return log.action === 'updated' || 
             log.action === 'updated note' || 
             log.action.includes('assignee') || 
             log.action.includes('assigned') ||
             log.action.includes('due date');
    }
    return log.action === filter;
  });

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Activity Log</h2>
            <p className="text-sm text-gray-600 mt-1">Project: {projectName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 flex gap-2">
          {['all', 'created', 'updated', 'deleted', 'moved'].map((action) => (
            <button
              key={action}
              onClick={() => setFilter(action)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                filter === action
                  ? 'bg-indigo-100 text-indigo-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {action.charAt(0).toUpperCase() + action.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading activity...</div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchLogs}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Retry
              </button>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No activity found {filter !== 'all' && `for "${filter}" actions`}.
            </div>
          ) : (
            <>
              <div className="mb-4 flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Showing last {filteredLogs.length} {filter !== 'all' ? filter : ''} activities
                </p>
                <a
                  href={`/dashboard/activity/${projectId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Show All
                </a>
              </div>
              <div className="space-y-4">
                {filteredLogs.map((log) => (
                  <div key={log._id} className="flex gap-4 p-5 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${getActionColor(log.action)}`}>
                      {getActionIcon(log.action)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{log.userName}</span>
                        {formatActivityDescription(log)}
                        <span className="text-xl">{getEntityIcon(log.entityType)}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                        <span>{formatRelativeTime(log.createdAt)}</span>
                        {log.userRole === 'admin' && (
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                            Admin
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

