import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Search,
  Calendar,
  LogIn,
  UserPlus,
  UserCog,
  UserX,
  Trash2,
  Shield,
  Dumbbell,
  ClipboardCheck,
  Target,
  ChevronDown,
  Loader2,
  AlertCircle,
  Filter
} from 'lucide-react';
import PageShell from '../../components/PageShell';
import { subscribeToAuditLogs, ACTION_TYPES } from '../../services/auditService';

// Map icon string names to components
const ICON_MAP = {
  LogIn,
  UserPlus,
  UserCog,
  UserX,
  Trash2,
  Shield,
  Calendar,
  Dumbbell,
  ClipboardCheck,
  Target,
  Activity
};

const getActionIcon = (action) => {
  const actionDef = ACTION_TYPES[action];
  if (actionDef && ICON_MAP[actionDef.icon]) {
    return ICON_MAP[actionDef.icon];
  }
  return Activity;
};

const getActionLabel = (action) => {
  return ACTION_TYPES[action]?.label || action;
};

const formatRelativeTime = (date) => {
  if (!date) return '';
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
};

const ActivityLogPage = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Subscribe to audit logs
  useEffect(() => {
    const filters = {
      actionType: actionFilter,
      limitCount: 100
    };

    const unsubscribe = subscribeToAuditLogs(filters, (data) => {
      setLogs(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [actionFilter]);

  // Filter by search query locally
  const filteredLogs = searchQuery.trim()
    ? logs.filter(log =>
        log.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : logs;

  // Group unique action types for the filter
  const actionTypeOptions = [
    { value: 'all', label: 'All Actions' },
    ...Object.entries(ACTION_TYPES).map(([key, val]) => ({
      value: key,
      label: val.label
    }))
  ];

  return (
    <PageShell
      title="Activity Log"
      subtitle={`${filteredLogs.length} entries`}
      backTo="/admin"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'Admin', url: '/admin' },
        { label: 'Activity Log' }
      ]}
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Filters */}
        <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl p-4">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6B7C6B]" />
              <input
                type="text"
                placeholder="Search by user or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 placeholder-gray-400 focus:border-[#00A651] focus:outline-none text-sm"
              />
            </div>

            {/* Action Type Filter */}
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-4 py-2.5 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 focus:border-[#00A651] focus:outline-none text-sm"
            >
              {actionTypeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#00A651] animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredLogs.length === 0 && (
          <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-[#6B7C6B] mx-auto mb-3" />
            <h3 className="text-gray-800 font-semibold mb-2">No Activity Found</h3>
            <p className="text-[#6B7C6B] text-sm">
              {searchQuery ? 'Try a different search term' : 'Activity will appear here as users interact with the system'}
            </p>
          </div>
        )}

        {/* Log Entries */}
        {!isLoading && filteredLogs.length > 0 && (
          <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl overflow-hidden">
            <div className="divide-y divide-[#D4E4D4]/50">
              {filteredLogs.map((log) => {
                const Icon = getActionIcon(log.action);
                return (
                  <div key={log.id} className="p-4 hover:bg-[#F5F9F5]/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-[#F5F9F5] border border-[#D4E4D4] rounded-full flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-[#00A651]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-gray-800 text-sm font-medium">{log.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[#00A651] text-xs font-medium">{log.userName}</span>
                              {log.userRole && (
                                <span className="text-[#6B7C6B] text-xs capitalize">({log.userRole.replace(/_/g, ' ')})</span>
                              )}
                            </div>
                          </div>
                          <span className="text-[#6B7C6B] text-xs whitespace-nowrap flex-shrink-0">
                            {formatRelativeTime(log.createdAt)}
                          </span>
                        </div>
                        <span className="inline-block mt-1.5 px-2 py-0.5 bg-[#F5F9F5] border border-[#D4E4D4] rounded text-[#6B7C6B] text-[10px] font-medium">
                          {getActionLabel(log.action)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <footer className="py-4 text-center border-t border-[#D4E4D4]">
        <p className="text-[#6B7C6B] text-xs">Emerald Lakers Activity Log</p>
      </footer>
    </PageShell>
  );
};

export default ActivityLogPage;
