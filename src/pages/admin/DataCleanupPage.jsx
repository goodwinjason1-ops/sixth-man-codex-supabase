import React, { useState, useMemo } from 'react';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  deleteDoc,
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import PageShell from '../../components/PageShell';
import {
  Search,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Users,
  UserX,
  FileWarning,
  ShieldAlert,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Eye,
  X
} from 'lucide-react';

const REQUIRED_USER_FIELDS = ['email', 'role', 'uid'];

const DataCleanupPage = () => {
  const { currentUser } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [cleanupLog, setCleanupLog] = useState([]);
  const [confirmAction, setConfirmAction] = useState(null); // { type, data, label }
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [detailDoc, setDetailDoc] = useState(null);
  const [dryRun, setDryRun] = useState(true);

  // Run the full scan
  const scanForIssues = async () => {
    setScanning(true);
    setScanResults(null);
    setCleanupLog([]);

    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const allUsers = usersSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      const issues = {
        duplicates: [],       // groups of docs with same email
        missingUid: [],       // docs where uid is missing or doesn't match doc ID
        missingFields: [],    // docs missing required fields
        parentsNoChildren: [],// parent role but no linkedPlayerIds
        uidMismatch: [],      // uid field doesn't match document ID
        orphanedDocs: [],     // docs with no email and no uid match
      };

      // 1. Group by email to find duplicates
      const byEmail = {};
      allUsers.forEach(user => {
        const email = (user.email || '').trim().toLowerCase();
        if (!email) {
          issues.orphanedDocs.push({
            ...user,
            problem: 'No email address'
          });
          return;
        }
        if (!byEmail[email]) byEmail[email] = [];
        byEmail[email].push(user);
      });

      Object.entries(byEmail).forEach(([email, docs]) => {
        if (docs.length > 1) {
          // Score each doc — higher = more complete / more likely the "real" one
          const scored = docs.map(d => {
            let score = 0;
            if (d.uid) score += 10;
            if (d.uid === d.id) score += 5; // uid matches doc ID
            if (d.linkedPlayerIds?.length > 0) score += 5;
            if (d.role && d.role !== 'player') score += 3; // specific role assigned
            if (d.displayName) score += 2;
            if (d.createdAt) score += 1;
            score += Object.keys(d).length; // more fields = more data
            return { ...d, _score: score };
          });
          scored.sort((a, b) => b._score - a._score);
          issues.duplicates.push({
            email,
            docs: scored,
            bestId: scored[0].id,
          });
        }
      });

      // 2. Check each user for issues
      allUsers.forEach(user => {
        // Missing UID
        if (!user.uid) {
          issues.missingUid.push({
            ...user,
            problem: 'Missing uid field'
          });
        } else if (user.uid !== user.id) {
          issues.uidMismatch.push({
            ...user,
            problem: `uid field "${user.uid}" doesn't match doc ID "${user.id}"`
          });
        }

        // Missing required fields
        const missing = REQUIRED_USER_FIELDS.filter(f => !user[f]);
        if (missing.length > 0) {
          issues.missingFields.push({
            ...user,
            problem: `Missing fields: ${missing.join(', ')}`
          });
        }

        // Parent without children
        if (user.role === 'parent' && (!user.linkedPlayerIds || user.linkedPlayerIds.length === 0)) {
          issues.parentsNoChildren.push({
            ...user,
            problem: 'Parent role but no linkedPlayerIds'
          });
        }
      });

      setScanResults({
        totalUsers: allUsers.length,
        issues,
        scannedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Scan failed:', err);
      setCleanupLog([{ type: 'error', message: `Scan failed: ${err.message}` }]);
    } finally {
      setScanning(false);
    }
  };

  // Count total issues
  const totalIssues = useMemo(() => {
    if (!scanResults) return 0;
    const { issues } = scanResults;
    return (
      issues.duplicates.length +
      issues.missingUid.length +
      issues.missingFields.length +
      issues.parentsNoChildren.length +
      issues.uidMismatch.length +
      issues.orphanedDocs.length
    );
  }, [scanResults]);

  // Delete a single document
  const deleteDocument = async (docId) => {
    if (dryRun) {
      setCleanupLog(prev => [...prev, { type: 'dry-run', message: `Would delete doc: ${docId}` }]);
      return true;
    }
    try {
      await deleteDoc(doc(db, 'users', docId));
      setCleanupLog(prev => [...prev, { type: 'success', message: `Deleted doc: ${docId}` }]);
      return true;
    } catch (err) {
      setCleanupLog(prev => [...prev, { type: 'error', message: `Failed to delete ${docId}: ${err.message}` }]);
      return false;
    }
  };

  // Fix a document's missing fields
  const fixDocument = async (docId, updates) => {
    if (dryRun) {
      setCleanupLog(prev => [...prev, {
        type: 'dry-run',
        message: `Would update doc ${docId}: ${JSON.stringify(updates)}`
      }]);
      return true;
    }
    try {
      await updateDoc(doc(db, 'users', docId), updates);
      setCleanupLog(prev => [...prev, {
        type: 'success',
        message: `Updated doc ${docId}: ${Object.keys(updates).join(', ')}`
      }]);
      return true;
    } catch (err) {
      setCleanupLog(prev => [...prev, {
        type: 'error',
        message: `Failed to update ${docId}: ${err.message}`
      }]);
      return false;
    }
  };

  // Clean duplicates — keep best, delete rest
  const cleanDuplicates = async () => {
    if (!scanResults?.issues.duplicates.length) return;
    setCleaning(true);
    let deleted = 0;

    for (const group of scanResults.issues.duplicates) {
      for (const d of group.docs) {
        if (d.id !== group.bestId) {
          const ok = await deleteDocument(d.id);
          if (ok) deleted++;
        }
      }
    }

    setCleanupLog(prev => [...prev, {
      type: 'info',
      message: `${dryRun ? '[DRY RUN] ' : ''}Duplicate cleanup done: ${deleted} documents ${dryRun ? 'would be' : ''} removed`
    }]);
    setCleaning(false);
  };

  // Fix missing UIDs
  const fixMissingUids = async () => {
    if (!scanResults?.issues.missingUid.length) return;
    setCleaning(true);
    let fixed = 0;

    for (const d of scanResults.issues.missingUid) {
      const ok = await fixDocument(d.id, { uid: d.id });
      if (ok) fixed++;
    }

    setCleanupLog(prev => [...prev, {
      type: 'info',
      message: `${dryRun ? '[DRY RUN] ' : ''}UID fix done: ${fixed} documents ${dryRun ? 'would be' : ''} updated`
    }]);
    setCleaning(false);
  };

  // Fix UID mismatches
  const fixUidMismatches = async () => {
    if (!scanResults?.issues.uidMismatch.length) return;
    setCleaning(true);
    let fixed = 0;

    for (const d of scanResults.issues.uidMismatch) {
      const ok = await fixDocument(d.id, { uid: d.id });
      if (ok) fixed++;
    }

    setCleanupLog(prev => [...prev, {
      type: 'info',
      message: `${dryRun ? '[DRY RUN] ' : ''}UID mismatch fix done: ${fixed} documents ${dryRun ? 'would be' : ''} updated`
    }]);
    setCleaning(false);
  };

  // Fix parents missing linkedPlayerIds
  const fixParentsNoChildren = async () => {
    if (!scanResults?.issues.parentsNoChildren.length) return;
    setCleaning(true);
    let fixed = 0;

    for (const d of scanResults.issues.parentsNoChildren) {
      if (!d.linkedPlayerIds) {
        const ok = await fixDocument(d.id, { linkedPlayerIds: [] });
        if (ok) fixed++;
      }
    }

    setCleanupLog(prev => [...prev, {
      type: 'info',
      message: `${dryRun ? '[DRY RUN] ' : ''}Parent fix done: ${fixed} documents ${dryRun ? 'would be' : ''} updated with empty linkedPlayerIds`
    }]);
    setCleaning(false);
  };

  // Delete orphaned docs
  const cleanOrphaned = async () => {
    if (!scanResults?.issues.orphanedDocs.length) return;
    setCleaning(true);
    let deleted = 0;

    for (const d of scanResults.issues.orphanedDocs) {
      const ok = await deleteDocument(d.id);
      if (ok) deleted++;
    }

    setCleanupLog(prev => [...prev, {
      type: 'info',
      message: `${dryRun ? '[DRY RUN] ' : ''}Orphan cleanup done: ${deleted} documents ${dryRun ? 'would be' : ''} removed`
    }]);
    setCleaning(false);
  };

  // Clean ALL issues
  const cleanAll = async () => {
    setCleaning(true);
    setCleanupLog([{ type: 'info', message: `${dryRun ? '[DRY RUN] ' : ''}Starting full cleanup...` }]);

    await cleanDuplicates();
    await fixMissingUids();
    await fixUidMismatches();
    await fixParentsNoChildren();
    await cleanOrphaned();

    setCleanupLog(prev => [...prev, {
      type: 'success',
      message: `${dryRun ? '[DRY RUN] ' : ''}Full cleanup complete. ${dryRun ? 'Switch off dry run mode and run again to apply changes.' : 'Re-scan to verify.'}`
    }]);
    setCleaning(false);
  };

  // Export scan results as JSON backup
  const exportBackup = () => {
    if (!scanResults) return;
    const blob = new Blob([JSON.stringify(scanResults, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `firestore-users-scan-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const categories = scanResults ? [
    {
      id: 'duplicates',
      label: 'Duplicate Users',
      icon: Users,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      count: scanResults.issues.duplicates.length,
      description: 'Multiple documents with the same email address',
      action: cleanDuplicates,
      actionLabel: 'Remove Duplicates',
      items: scanResults.issues.duplicates.map(g => ({
        id: g.email,
        label: g.email,
        sublabel: `${g.docs.length} docs — keeping ${g.bestId}`,
        details: g.docs,
        isDuplicateGroup: true,
      }))
    },
    {
      id: 'missingUid',
      label: 'Missing UID',
      icon: UserX,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      count: scanResults.issues.missingUid.length,
      description: 'Documents missing the uid field',
      action: fixMissingUids,
      actionLabel: 'Fix UIDs',
      items: scanResults.issues.missingUid.map(d => ({
        id: d.id,
        label: d.email || d.id,
        sublabel: d.problem,
        details: d,
      }))
    },
    {
      id: 'uidMismatch',
      label: 'UID Mismatch',
      icon: ShieldAlert,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      count: scanResults.issues.uidMismatch.length,
      description: 'uid field does not match the document ID',
      action: fixUidMismatches,
      actionLabel: 'Fix Mismatches',
      items: scanResults.issues.uidMismatch.map(d => ({
        id: d.id,
        label: d.email || d.id,
        sublabel: d.problem,
        details: d,
      }))
    },
    {
      id: 'missingFields',
      label: 'Missing Required Fields',
      icon: FileWarning,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      count: scanResults.issues.missingFields.length,
      description: 'Documents missing email, role, or uid',
      action: null,
      actionLabel: null,
      items: scanResults.issues.missingFields.map(d => ({
        id: d.id,
        label: d.email || d.id,
        sublabel: d.problem,
        details: d,
      }))
    },
    {
      id: 'parentsNoChildren',
      label: 'Parents Without Children',
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      count: scanResults.issues.parentsNoChildren.length,
      description: 'Parent accounts with no linked players',
      action: fixParentsNoChildren,
      actionLabel: 'Add Empty Array',
      items: scanResults.issues.parentsNoChildren.map(d => ({
        id: d.id,
        label: d.email || d.displayName || d.id,
        sublabel: d.problem,
        details: d,
      }))
    },
    {
      id: 'orphanedDocs',
      label: 'Orphaned Documents',
      icon: UserX,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      count: scanResults.issues.orphanedDocs.length,
      description: 'Documents with no email address',
      action: cleanOrphaned,
      actionLabel: 'Delete Orphans',
      items: scanResults.issues.orphanedDocs.map(d => ({
        id: d.id,
        label: d.displayName || d.id,
        sublabel: d.problem,
        details: d,
      }))
    },
  ] : [];

  return (
    <PageShell
      title="Data Cleanup"
      subtitle="Scan and fix user document issues"
      backTo="/welcome"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'Admin', url: '/admin' },
        { label: 'Data Cleanup' }
      ]}
      maxWidth="6xl"
      headerActions={
        <div className="flex items-center gap-2">
          {scanResults && (
            <button
              onClick={exportBackup}
              className="flex items-center gap-2 px-3 py-2 bg-[#0a3d2e] border border-[#1a8a68] text-white rounded-lg text-sm hover:border-[#22c55e] transition-colors"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}
          <button
            onClick={scanForIssues}
            disabled={scanning}
            className="flex items-center gap-2 px-4 py-2 bg-[#22c55e] text-[#0a3d2e] rounded-lg font-semibold text-sm hover:bg-[#4ade80] disabled:opacity-50 transition-colors"
          >
            {scanning ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Search size={16} />
            )}
            {scanning ? 'Scanning...' : 'Scan for Issues'}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Dry Run Toggle */}
        <div className="flex items-center justify-between bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4">
          <div>
            <p className="text-white font-medium text-sm">Safe Mode (Dry Run)</p>
            <p className="text-white/50 text-xs mt-0.5">
              {dryRun
                ? 'Actions will be simulated — nothing is deleted or modified'
                : 'Actions will modify Firestore data permanently'}
            </p>
          </div>
          <button
            onClick={() => setDryRun(!dryRun)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              dryRun ? 'bg-[#22c55e]' : 'bg-red-500'
            }`}
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
              dryRun ? 'left-0.5' : 'left-6'
            }`} />
          </button>
        </div>

        {!dryRun && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <AlertTriangle className="text-red-400 flex-shrink-0" size={20} />
            <p className="text-red-300 text-sm">
              Live mode is active. Actions will permanently modify or delete Firestore documents.
            </p>
          </div>
        )}

        {/* Scan Results Summary */}
        {scanResults && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <SummaryCard
                label="Total Users"
                value={scanResults.totalUsers}
                icon={Users}
                color="text-white"
              />
              <SummaryCard
                label="Issues Found"
                value={totalIssues}
                icon={totalIssues > 0 ? AlertTriangle : CheckCircle2}
                color={totalIssues > 0 ? 'text-yellow-400' : 'text-green-400'}
              />
              <SummaryCard
                label="Duplicate Groups"
                value={scanResults.issues.duplicates.length}
                icon={Users}
                color={scanResults.issues.duplicates.length > 0 ? 'text-red-400' : 'text-green-400'}
              />
              <SummaryCard
                label="Fixable"
                value={
                  scanResults.issues.missingUid.length +
                  scanResults.issues.uidMismatch.length +
                  scanResults.issues.parentsNoChildren.length
                }
                icon={RefreshCw}
                color="text-blue-400"
              />
            </div>

            {/* Clean All button */}
            {totalIssues > 0 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4">
                <div>
                  <p className="text-white font-medium text-sm">
                    {totalIssues} issue{totalIssues !== 1 ? 's' : ''} found across {Object.values(scanResults.issues).filter(arr => arr.length > 0).length} categories
                  </p>
                  <p className="text-white/50 text-xs mt-0.5">
                    {dryRun ? 'Dry run: preview changes before applying' : 'Changes will be applied to Firestore'}
                  </p>
                </div>
                <button
                  onClick={() => setConfirmAction({
                    type: 'cleanAll',
                    fn: cleanAll,
                    label: `${dryRun ? '[DRY RUN] ' : ''}Clean all ${totalIssues} issues`
                  })}
                  disabled={cleaning}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                    dryRun
                      ? 'bg-[#22c55e] text-[#0a3d2e] hover:bg-[#4ade80]'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  } disabled:opacity-50`}
                >
                  {cleaning ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  {dryRun ? 'Preview Clean All' : 'Clean All'}
                </button>
              </div>
            )}

            {totalIssues === 0 && (
              <div className="bg-[#0d5943] border-2 border-green-500/30 rounded-xl p-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-white font-semibold">All Clear</p>
                <p className="text-white/50 text-sm mt-1">No issues found in {scanResults.totalUsers} user documents.</p>
              </div>
            )}

            {/* Issue Categories */}
            <div className="space-y-3">
              {categories.filter(c => c.count > 0).map(cat => (
                <div key={cat.id} className="bg-[#0d5943] border border-[#1a8a68] rounded-xl overflow-hidden">
                  {/* Category Header */}
                  <button
                    onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${cat.bgColor} rounded-lg flex items-center justify-center`}>
                        <cat.icon className={cat.color} size={20} />
                      </div>
                      <div className="text-left">
                        <p className="text-white font-medium text-sm">{cat.label}</p>
                        <p className="text-white/50 text-xs">{cat.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${cat.bgColor} ${cat.color}`}>
                        {cat.count}
                      </span>
                      {expandedCategory === cat.id ? (
                        <ChevronDown className="text-white/40" size={18} />
                      ) : (
                        <ChevronRight className="text-white/40" size={18} />
                      )}
                    </div>
                  </button>

                  {/* Expanded Items */}
                  {expandedCategory === cat.id && (
                    <div className="border-t border-[#1a8a68]/50">
                      {/* Category Action Button */}
                      {cat.action && (
                        <div className="px-4 py-3 bg-white/5 flex items-center justify-between">
                          <span className="text-white/60 text-xs">
                            {cat.count} item{cat.count !== 1 ? 's' : ''} in this category
                          </span>
                          <button
                            onClick={() => setConfirmAction({
                              type: cat.id,
                              fn: cat.action,
                              label: `${dryRun ? '[DRY RUN] ' : ''}${cat.actionLabel} (${cat.count} items)`
                            })}
                            disabled={cleaning}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              dryRun
                                ? 'bg-[#22c55e]/20 text-[#4ade80] hover:bg-[#22c55e]/30'
                                : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            } disabled:opacity-50`}
                          >
                            {cat.actionLabel}
                          </button>
                        </div>
                      )}

                      <div className="max-h-80 overflow-y-auto">
                        {cat.items.map((item, idx) => (
                          <div
                            key={item.id + '-' + idx}
                            className="flex items-center justify-between px-4 py-3 border-t border-[#1a8a68]/20 hover:bg-white/5"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm truncate">{item.label}</p>
                              <p className="text-white/40 text-xs truncate">{item.sublabel}</p>
                            </div>
                            <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                              <button
                                onClick={() => setDetailDoc(item.details)}
                                className="p-1.5 text-white/40 hover:text-white transition-colors"
                                title="View details"
                              >
                                <Eye size={14} />
                              </button>
                              {!item.isDuplicateGroup && (
                                <button
                                  onClick={() => setConfirmAction({
                                    type: 'deleteSingle',
                                    fn: () => deleteDocument(item.id),
                                    label: `${dryRun ? '[DRY RUN] ' : ''}Delete document ${item.id}`
                                  })}
                                  disabled={cleaning}
                                  className="p-1.5 text-red-400/60 hover:text-red-400 transition-colors disabled:opacity-50"
                                  title="Delete document"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Cleanup Log */}
        {cleanupLog.length > 0 && (
          <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a8a68]/50">
              <p className="text-white font-medium text-sm">Activity Log</p>
              <button
                onClick={() => setCleanupLog([])}
                className="text-white/40 hover:text-white text-xs"
              >
                Clear
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto p-4 space-y-2">
              {cleanupLog.map((entry, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className={`text-xs mt-0.5 ${
                    entry.type === 'error' ? 'text-red-400' :
                    entry.type === 'success' ? 'text-green-400' :
                    entry.type === 'dry-run' ? 'text-blue-400' :
                    'text-white/60'
                  }`}>
                    {entry.type === 'error' ? '✗' :
                     entry.type === 'success' ? '✓' :
                     entry.type === 'dry-run' ? '◦' : '→'}
                  </span>
                  <p className="text-white/70 text-xs font-mono break-all">{entry.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!scanResults && !scanning && (
          <div className="bg-[#0d5943] border-2 border-[#1a8a68] rounded-2xl p-8 text-center">
            <Search className="w-16 h-16 text-[#1a8a68] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Scan Your Data</h2>
            <p className="text-[#1a8a68] text-sm max-w-md mx-auto">
              Click &ldquo;Scan for Issues&rdquo; to check the users collection for duplicates,
              missing fields, orphaned documents, and other problems.
            </p>
          </div>
        )}

        {scanning && (
          <div className="text-center py-12">
            <Loader2 className="w-10 h-10 text-[#4ade80] animate-spin mx-auto mb-3" />
            <p className="text-white/60 text-sm">Scanning Firestore users collection...</p>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d5943] border border-[#1a8a68] rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <AlertTriangle className="text-yellow-400" size={20} />
              </div>
              <h3 className="text-white font-bold">Confirm Action</h3>
            </div>
            <p className="text-white/80 text-sm mb-2">{confirmAction.label}</p>
            {!dryRun && (
              <p className="text-red-300 text-xs mb-4">
                This action will permanently modify Firestore data. This cannot be undone.
              </p>
            )}
            {dryRun && (
              <p className="text-blue-300 text-xs mb-4">
                Dry run mode — no data will be changed. Results will appear in the activity log.
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 px-4 py-2 bg-[#0a3d2e] border border-[#1a8a68] text-white rounded-lg text-sm hover:border-[#22c55e] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const fn = confirmAction.fn;
                  setConfirmAction(null);
                  await fn();
                }}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  dryRun
                    ? 'bg-[#22c55e] text-[#0a3d2e] hover:bg-[#4ade80]'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {dryRun ? 'Preview' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Detail Modal */}
      {detailDoc && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d5943] border border-[#1a8a68] rounded-2xl max-w-lg w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#1a8a68]/50">
              <h3 className="text-white font-bold text-sm">Document Details</h3>
              <button
                onClick={() => setDetailDoc(null)}
                className="text-white/40 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <pre className="text-white/80 text-xs font-mono whitespace-pre-wrap break-all">
                {JSON.stringify(
                  detailDoc,
                  (key, value) => {
                    if (key === '_score') return undefined;
                    if (value && typeof value === 'object' && value.seconds) {
                      return new Date(value.seconds * 1000).toISOString();
                    }
                    return value;
                  },
                  2
                )}
              </pre>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};

// Summary Card
const SummaryCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4 text-center">
    <Icon className={`${color} mx-auto mb-2`} size={20} />
    <p className="text-2xl font-bold text-white">{value}</p>
    <p className="text-white/60 text-xs">{label}</p>
  </div>
);

export default DataCleanupPage;
