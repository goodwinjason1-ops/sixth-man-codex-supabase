import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import {
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
import PageShell from '../../components/PageShell';

const DataExplorerPage = () => {
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
    <PageShell
      title="Data Explorer"
      subtitle="Raw data access and analysis"
      backTo="/welcome"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'Data Explorer' }
      ]}
    >
      {/* Collection Tabs */}
      <div className="mb-4">
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
                  ? 'bg-[#005028] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <col.icon size={16} />
              {col.name}
              <span className="bg-gray-200 px-2 py-0.5 rounded-full text-xs">
                {col.data.length}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl p-4">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder={`Search ${currentCollection.name.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-100 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-gray-800 placeholder-white/40 focus:outline-none focus:border-[#00A651]"
              />
            </div>

            {/* Export Button */}
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-[#005028] hover:bg-gray-100 rounded-lg font-medium transition-colors"
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
                  className="bg-gray-100 border border-white/20 rounded-lg px-3 py-1 text-sm text-gray-800 focus:outline-none focus:border-[#00A651]"
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
                className="px-3 py-1 text-sm text-gray-500 hover:text-gray-800"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Showing {processedData.length} of {currentCollection.data.length} records
          </span>
          <div className="flex items-center gap-2 text-gray-500">
            <span>Sort:</span>
            <button
              onClick={() => handleSort(sortField)}
              className="flex items-center gap-1 text-gray-800 hover:text-[#00A651]"
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
        <div className="bg-white rounded-xl overflow-hidden">
          {processedData.length === 0 ? (
            <div className="p-8 text-center">
              <Database className="mx-auto mb-2 text-gray-800/30" size={32} />
              <p className="text-gray-400">No records found</p>
              <p className="text-sm text-gray-800/30">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-white/10">
                  <tr>
                    {currentCollection.columns.map(col => (
                      <th
                        key={col}
                        onClick={() => handleSort(col)}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-800"
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {processedData.slice(0, 50).map((item, index) => (
                    <React.Fragment key={item.id || index}>
                      <tr className="hover:bg-gray-100">
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
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                          >
                            <Eye size={16} className="text-gray-400" />
                          </button>
                        </td>
                      </tr>
                      {expandedRow === index && (
                        <tr>
                          <td colSpan={currentCollection.columns.length + 1} className="px-4 py-3 bg-gray-100">
                            <div className="text-sm">
                              <p className="font-medium mb-2 text-gray-600">Full Record:</p>
                              <pre className="bg-black/30 rounded-lg p-3 overflow-x-auto text-xs text-[#00A651]">
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
                <div className="p-4 text-center text-sm text-gray-400 border-t border-white/10">
                  Showing first 50 of {processedData.length} records. Export to CSV for full data.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{players?.length || 0}</p>
            <p className="text-xs text-gray-400">Total Players</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{Object.keys(evaluations || {}).length}</p>
            <p className="text-xs text-gray-400">Total Evaluations</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{teams?.length || [...new Set(players?.map(p => p.team))].filter(Boolean).length}</p>
            <p className="text-xs text-gray-400">Total Teams</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{processedData.length}</p>
            <p className="text-xs text-gray-400">Current Results</p>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default DataExplorerPage;
