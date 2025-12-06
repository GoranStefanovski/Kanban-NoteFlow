'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useDataStore } from '@/stores/dataStore';
import { activityLogApi } from '@/lib/api';
import { ActivityLog } from '@/types';

export default function ActivityPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const user = useAuthStore((state) => state.user);
  const { projects, fetchProjects } = useDataStore();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('all');

  const project = projects.find(p => p._id === projectId);

  useEffect(() => {
    // Ensure projects are loaded
    if (projects.length === 0) {
      fetchProjects();
    }
  }, [projects.length, fetchProjects]);

  useEffect(() => {
    if (projectId) {
      fetchLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const fetchLogs = async () => {
    if (!projectId) {
      setError('No project ID provided');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const response = await activityLogApi.getByProject(projectId, 500); // Get more logs
      setLogs(response.data);
    } catch (err: any) {
      console.error('Activity log fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    // Assignee actions
    if (action.includes('assignee') || action.includes('assigned')) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    }
    // Due date actions
    if (action.includes('due date')) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }

    switch (action) {
      case 'created':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        );
      case 'updated':
      case 'updated note':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        );
      case 'deleted':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        );
      case 'moved':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.back()}
                className="mb-2 text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Activity Log</h1>
              <p className="text-gray-600 mt-1">
                Project: <span className="font-medium">{project?.name || 'Unknown Project'}</span>
              </p>
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">{logs.length}</span> total activities
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mt-6">
            {['all', 'created', 'updated', 'deleted', 'moved'].map((action) => (
              <button
                key={action}
                onClick={() => setFilter(action)}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  filter === action
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {action.charAt(0).toUpperCase() + action.slice(1)}
                {action !== 'all' && (
                  <span className="ml-1 opacity-75">
                    ({logs.filter(l => l.action === action).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
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
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div
                key={log._id}
                className="flex gap-4 p-5 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
              >
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
                  {log.details && Object.keys(log.details).length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                        View details
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-50 p-2 rounded border border-gray-200 overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

