import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import {
  ArrowLeft,
  ChevronRight,
  Search,
  Database,
  Table,
  Filter,
  Download,
  ChevronDown,
  Eye,
  Users,
  Target,
  Calendar,
  FileText
} from 'lucide-react';

const DataExplorerPage = () => {
  const navigate = useNavigate();
  const { players, evaluations, teams } = useData();
  const [selectedCollection, setSelectedCollection] = useState('players');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [expandedRow, setExpandedRow] = useState(null);

  // Collection configurations
  const collections = {
    players: {
      name: 'Players',
      icon: Users,
      data: players || [],
      columns: ['name', 'team', 'role', 'dob', 'parent1Email'],
      searchFields: ['name', 'team', 'parent1Email']
    },
    evaluations: {
      name: 'Evaluations',
      icon: Target,
      data: Object.values(evaluations || {}),
      columns: ['playerId', 'skillId', 'level', 'date', 'coachId'],
      searchFields: ['playerId', 'skillId']
    },
    teams: {
      name: 'Teams',
      icon: Users,
      data: teams || [...new Set(players?.map(p => p.team))].filter(Boolean).map(t => ({ name: t })),
      columns: ['name', 'ageGroup', 'coach'],
      searchFields: ['name']
    }
  };

  // Get current collection data
  const currentCollection = collections[selectedCollection];

  // Process and filter data
  const processedData = useMemo(() => {
    let data = [...currentCollection.data];

    // Apply search
    if (searchTerm) {
      data = data.filter(item =>
        currentCollection.searchFields.some(field =>
          String(item[field] || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply filters
    Object.entries(filters).forEach(([field, value]) => {
      if (value) {
        data = data.filter(item =>
          String(item[field] || '').toLowerCase().includes(value.toLowerCase())
        );
      }
    });

    // Apply sorting
    data.sort((a, b) => {
      const aVal = String(a[sortField] || '');
      const bVal = String(b[sortField] || '');
      const comparison = aVal.localeCompare(bVal);
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return data;
  }, [currentCollection, searchTerm, filters, sortField, sortDirection]);

  // Get unique values for filter dropdowns
  const getUniqueValues = (field) => {
    const values = currentCollection.data.map(item => item[field]).filter(Boolean);
    return [...new Set(values)].sort();
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = currentCollection.columns.join(',');
    const rows = processedData.map(item =>
      currentCollection.columns.map(col => {
        const value = String(item[col] || '');
        return value.includes(',') ? `"${value}"` : value;
      }).join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedCollection}_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a3d2e] text-white pb-20">
      {/* Header */}
      <div className="bg-[#0d5943] px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold">Data Explorer</h1>
            <p className="text-white/60 text-sm">Query and analyze data</p>
          </div>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="px-4 py-2 text-sm text-white/60 flex items-center gap-2">
        <span className="hover:text-white cursor-pointer" onClick={() => navigate('/admin')}>Admin</span>
        <ChevronRight size={14} />
        <span className="text-white">Data Explorer</span>
      </div>

      {/* Collection Tabs */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {Object.entries(collections).map(([key, col]) => (
            <button
              key={key}
              onClick={() => {
                setSelectedCollection(key);
                setFilters({});
                setSearchTerm('');
                setExpandedRow(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${
                selectedCollection === key
                  ? 'bg-[#22c55e] text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              <col.icon size={16} />
              {col.name}
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                {col.data.length}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Search and Filter Bar */}
        <div className="bg-[#0d5943] rounded-xl p-4">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input
                type="text"
                placeholder={`Search ${currentCollection.name.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-[#22c55e]"
              />
            </div>

            {/* Export Button */}
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-[#22c55e] hover:bg-[#1a8a68] rounded-lg font-medium transition-colors"
            >
              <Download size={18} />
              Export CSV
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            {currentCollection.columns.slice(0, 3).map(field => {
              const uniqueValues = getUniqueValues(field);
              if (uniqueValues.length === 0 || uniqueValues.length > 50) return null;

              return (
                <select
                  key={field}
                  value={filters[field] || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, [field]: e.target.value }))}
                  className="bg-white/5 border border-white/20 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:border-[#22c55e]"
                >
                  <option value="">{field.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</option>
                  {uniqueValues.slice(0, 20).map(val => (
                    <option key={val} value={val}>{val}</option>
                  ))}
                </select>
              );
            })}

            {Object.keys(filters).length > 0 && (
              <button
                onClick={() => setFilters({})}
                className="px-3 py-1 text-sm text-white/60 hover:text-white"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/60">
            Showing {processedData.length} of {currentCollection.data.length} records
          </span>
          <div className="flex items-center gap-2 text-white/60">
            <span>Sort:</span>
            <button
              onClick={() => handleSort(sortField)}
              className="flex items-center gap-1 text-white hover:text-[#4ade80]"
            >
              {sortField}
              <ChevronDown
                size={14}
                className={`transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-[#0d5943] rounded-xl overflow-hidden">
          {processedData.length === 0 ? (
            <div className="p-8 text-center">
              <Database className="mx-auto mb-2 text-white/30" size={32} />
              <p className="text-white/50">No records found</p>
              <p className="text-sm text-white/30">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    {currentCollection.columns.map(col => (
                      <th
                        key={col}
                        onClick={() => handleSort(col)}
                        className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider cursor-pointer hover:text-white"
                      >
                        <div className="flex items-center gap-1">
                          {col.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                          {sortField === col && (
                            <ChevronDown
                              size={12}
                              className={`transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`}
                            />
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {processedData.slice(0, 50).map((item, index) => (
                    <React.Fragment key={item.id || index}>
                      <tr className="hover:bg-white/5">
                        {currentCollection.columns.map(col => (
                          <td key={col} className="px-4 py-3 text-sm">
                            <span className="truncate block max-w-[150px]">
                              {typeof item[col] === 'object'
                                ? JSON.stringify(item[col])
                                : String(item[col] || '-')}
                            </span>
                          </td>
                        ))}
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setExpandedRow(expandedRow === index ? null : index)}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                          >
                            <Eye size={16} className="text-white/50" />
                          </button>
                        </td>
                      </tr>
                      {expandedRow === index && (
                        <tr>
                          <td colSpan={currentCollection.columns.length + 1} className="px-4 py-3 bg-white/5">
                            <div className="text-sm">
                              <p className="font-medium mb-2 text-white/70">Full Record:</p>
                              <pre className="bg-black/30 rounded-lg p-3 overflow-x-auto text-xs text-[#4ade80]">
                                {JSON.stringify(item, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
              {processedData.length > 50 && (
                <div className="p-4 text-center text-sm text-white/50 border-t border-white/10">
                  Showing first 50 of {processedData.length} records. Export to CSV for full data.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#0d5943] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{players?.length || 0}</p>
            <p className="text-xs text-white/50">Total Players</p>
          </div>
          <div className="bg-[#0d5943] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{Object.keys(evaluations || {}).length}</p>
            <p className="text-xs text-white/50">Total Evaluations</p>
          </div>
          <div className="bg-[#0d5943] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{teams?.length || [...new Set(players?.map(p => p.team))].filter(Boolean).length}</p>
            <p className="text-xs text-white/50">Total Teams</p>
          </div>
          <div className="bg-[#0d5943] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{processedData.length}</p>
            <p className="text-xs text-white/50">Current Results</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataExplorerPage;
