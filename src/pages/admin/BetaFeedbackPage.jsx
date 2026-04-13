import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import PageShell from '../../components/PageShell';
import {
  MessageCircle, Filter, ChevronDown, ChevronUp, Search,
  Bug, Lightbulb, HelpCircle, ThumbsUp, Clock, CheckCircle,
  AlertCircle, Loader2, X, Image
} from 'lucide-react';

const CATEGORY_CONFIG = {
  bug: { label: 'Bug Report', emoji: '\uD83D\uDC1B', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: Bug },
  feature: { label: 'Feature Request', emoji: '\uD83D\uDCA1', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Lightbulb },
  confusing: { label: 'Confusing', emoji: '\uD83D\uDE15', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: HelpCircle },
  great: { label: 'Works Great', emoji: '\uD83C\uDF89', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: ThumbsUp },
};

const STATUS_CONFIG = {
  new: { label: 'New', bg: 'bg-blue-100', text: 'text-blue-800' },
  reviewed: { label: 'Reviewed', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  in_progress: { label: 'In Progress', bg: 'bg-purple-100', text: 'text-purple-800' },
  resolved: { label: 'Resolved', bg: 'bg-green-100', text: 'text-green-800' },
};

const IMPORTANCE_CONFIG = {
  low: { label: 'Low', bg: 'bg-blue-50', text: 'text-blue-700' },
  medium: { label: 'Medium', bg: 'bg-yellow-50', text: 'text-yellow-700' },
  high: { label: 'High', bg: 'bg-red-50', text: 'text-red-700' },
};

const parseDate = (d) => {
  if (!d) return null;
  if (d.toDate) return d.toDate();
  if (d.seconds) return new Date(d.seconds * 1000);
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
};

const fmtDate = (d) => {
  const dt = parseDate(d);
  if (!dt) return '—';
  return dt.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const BetaFeedbackPage = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [importanceFilter, setImportanceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [editingNotesId, setEditingNotesId] = useState(null);
  const [notesText, setNotesText] = useState('');
  const [saving, setSaving] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'beta_feedback'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setFeedback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    return feedback.filter(f => {
      if (categoryFilter !== 'all' && f.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && f.status !== statusFilter) return false;
      if (importanceFilter !== 'all' && f.importance !== importanceFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match = (f.description || '').toLowerCase().includes(q) ||
          (f.userName || '').toLowerCase().includes(q) ||
          (f.page || '').toLowerCase().includes(q) ||
          (f.userRole || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [feedback, categoryFilter, statusFilter, importanceFilter, searchQuery]);

  // Summary stats
  const stats = useMemo(() => {
    const byCategory = {};
    const byStatus = {};
    feedback.forEach(f => {
      byCategory[f.category] = (byCategory[f.category] || 0) + 1;
      byStatus[f.status] = (byStatus[f.status] || 0) + 1;
    });
    return { total: feedback.length, byCategory, byStatus };
  }, [feedback]);

  const handleStatusChange = async (feedbackId, newStatus) => {
    try {
      await updateDoc(doc(db, 'beta_feedback', feedbackId), { status: newStatus });
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleSaveNotes = async (feedbackId) => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'beta_feedback', feedbackId), { adminNotes: notesText });
      setEditingNotesId(null);
    } catch (err) {
      console.error('Failed to save notes:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageShell title="Beta Feedback" backTo="/admin"
        breadcrumbs={[{ label: 'Home', url: '/welcome' }, { label: 'Admin', url: '/admin' }, { label: 'Beta Feedback' }]}>
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-[#00A651]" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Beta Feedback"
      subtitle={`${stats.total} feedback entries`}
      backTo="/admin"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'Admin', url: '/admin' },
        { label: 'Beta Feedback' },
      ]}
    >
      <div className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white rounded-xl border border-[#D4E4D4]/30 p-3 text-center">
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            <p className="text-xs text-[#6B7C6B]">Total</p>
          </div>
          {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
            <div key={key} className={`rounded-xl border p-3 text-center ${cfg.bg} ${cfg.border}`}>
              <p className={`text-2xl font-bold ${cfg.text}`}>{stats.byCategory[key] || 0}</p>
              <p className="text-xs text-[#6B7C6B]">{cfg.emoji} {cfg.label}</p>
            </div>
          ))}
        </div>

        {/* Status Summary */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <span key={key} className={`px-3 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
              {cfg.label}: {stats.byStatus[key] || 0}
            </span>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-[#D4E4D4]/30 p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-1.5">
              <Filter size={14} className="text-[#6B7C6B]" />
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                className="px-2 py-1.5 border border-[#D4E4D4] rounded-lg text-sm bg-white focus:outline-none">
                <option value="all">All Categories</option>
                {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.emoji} {v.label}</option>
                ))}
              </select>
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-2 py-1.5 border border-[#D4E4D4] rounded-lg text-sm bg-white focus:outline-none">
              <option value="all">All Statuses</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <select value={importanceFilter} onChange={e => setImportanceFilter(e.target.value)}
              className="px-2 py-1.5 border border-[#D4E4D4] rounded-lg text-sm bg-white focus:outline-none">
              <option value="all">All Importance</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6B7C6B]" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search feedback..."
                  className="w-full pl-8 pr-3 py-1.5 border border-[#D4E4D4] rounded-lg text-sm bg-white focus:outline-none focus:border-[#00A651]" />
              </div>
            </div>
          </div>
        </div>

        {/* Feedback List */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#D4E4D4]/30 p-12 text-center">
            <MessageCircle size={40} className="mx-auto text-[#D4E4D4] mb-3" />
            <p className="text-gray-800 font-medium">No feedback found</p>
            <p className="text-sm text-[#6B7C6B] mt-1">
              {feedback.length === 0 ? 'No feedback submitted yet.' : 'Try adjusting your filters.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(f => {
              const cat = CATEGORY_CONFIG[f.category] || CATEGORY_CONFIG.bug;
              const status = STATUS_CONFIG[f.status] || STATUS_CONFIG.new;
              const imp = f.importance ? IMPORTANCE_CONFIG[f.importance] : null;
              const isExpanded = expandedId === f.id;
              const isEditingNotes = editingNotesId === f.id;

              return (
                <div key={f.id} className="bg-white rounded-xl border border-[#D4E4D4]/30 overflow-hidden">
                  {/* Header row */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : f.id)}
                    className="w-full p-4 flex items-start gap-3 text-left"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cat.bg} ${cat.border} border`}>
                      <span className="text-lg">{cat.emoji}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cat.bg} ${cat.text} ${cat.border} border`}>
                          {cat.label}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                        {imp && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${imp.bg} ${imp.text}`}>
                            {imp.label}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-800 line-clamp-2">{f.description}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-[#6B7C6B]">
                        <span>{f.userName || 'Unknown'}</span>
                        <span className="text-[#D4E4D4]">|</span>
                        <span>{f.userRole || '—'}</span>
                        <span className="text-[#D4E4D4]">|</span>
                        <span>{f.page || '—'}</span>
                        <span className="text-[#D4E4D4]">|</span>
                        <span>{fmtDate(f.createdAt)}</span>
                        {f.screenshotUrl && (
                          <>
                            <span className="text-[#D4E4D4]">|</span>
                            <span className="flex items-center gap-0.5 text-[#00A651]"><Image size={11} /> img</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 mt-1">
                      {isExpanded ? <ChevronUp size={16} className="text-[#6B7C6B]" /> : <ChevronDown size={16} className="text-[#6B7C6B]" />}
                    </div>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-[#D4E4D4]/50 px-4 pb-4 pt-3 space-y-3 bg-[#F5F9F5]/50">
                      {/* Full description */}
                      <div>
                        <h4 className="text-xs font-bold text-[#6B7C6B] uppercase mb-1">Full Description</h4>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{f.description}</p>
                      </div>

                      {/* Screenshot */}
                      {f.screenshotUrl && (
                        <div>
                          <h4 className="text-xs font-bold text-[#6B7C6B] uppercase mb-1.5">Screenshot</h4>
                          <button onClick={() => setLightboxUrl(f.screenshotUrl)} className="block">
                            <img
                              src={f.screenshotUrl}
                              alt="Feedback screenshot"
                              className="w-40 h-28 object-cover rounded-lg border border-[#D4E4D4] hover:opacity-80 transition-opacity cursor-pointer"
                            />
                          </button>
                        </div>
                      )}

                      {/* Meta */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="bg-white rounded-lg p-2 border border-[#D4E4D4]/30">
                          <p className="text-[#6B7C6B]">User</p>
                          <p className="font-medium text-gray-800">{f.userName}</p>
                        </div>
                        <div className="bg-white rounded-lg p-2 border border-[#D4E4D4]/30">
                          <p className="text-[#6B7C6B]">Role</p>
                          <p className="font-medium text-gray-800">{f.userRole}</p>
                        </div>
                        <div className="bg-white rounded-lg p-2 border border-[#D4E4D4]/30">
                          <p className="text-[#6B7C6B]">Device</p>
                          <p className="font-medium text-gray-800">{f.device || '—'}</p>
                        </div>
                        <div className="bg-white rounded-lg p-2 border border-[#D4E4D4]/30">
                          <p className="text-[#6B7C6B]">Browser</p>
                          <p className="font-medium text-gray-800">{f.browser || '—'}</p>
                        </div>
                      </div>

                      {/* Status Update */}
                      <div>
                        <h4 className="text-xs font-bold text-[#6B7C6B] uppercase mb-2">Update Status</h4>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                            <button
                              key={key}
                              onClick={() => handleStatusChange(f.id, key)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                                f.status === key
                                  ? `${cfg.bg} ${cfg.text} border-current ring-1 ring-current`
                                  : 'bg-white border-[#D4E4D4] text-[#6B7C6B] hover:border-gray-400'
                              }`}
                            >
                              {cfg.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Admin Notes */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <h4 className="text-xs font-bold text-[#6B7C6B] uppercase">Admin Notes</h4>
                          {!isEditingNotes && (
                            <button onClick={() => { setEditingNotesId(f.id); setNotesText(f.adminNotes || ''); }}
                              className="text-xs text-[#00A651] hover:text-[#005028]">
                              {f.adminNotes ? 'Edit' : 'Add Note'}
                            </button>
                          )}
                        </div>
                        {isEditingNotes ? (
                          <div className="space-y-2">
                            <textarea value={notesText} onChange={e => setNotesText(e.target.value)}
                              rows={3} placeholder="Add internal notes..."
                              className="w-full px-3 py-2 border border-[#D4E4D4] rounded-lg text-sm focus:outline-none focus:border-[#00A651] resize-none" />
                            <div className="flex gap-2">
                              <button onClick={() => handleSaveNotes(f.id)} disabled={saving}
                                className="px-3 py-1.5 bg-[#005028] text-white rounded-lg text-xs font-medium hover:bg-[#00A651] disabled:opacity-50">
                                {saving ? 'Saving...' : 'Save'}
                              </button>
                              <button onClick={() => setEditingNotesId(null)}
                                className="px-3 py-1.5 border border-[#D4E4D4] text-[#6B7C6B] rounded-lg text-xs hover:bg-gray-50">
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : f.adminNotes ? (
                          <p className="text-sm text-gray-700 bg-white rounded-lg p-2 border border-[#D4E4D4]/30 whitespace-pre-wrap">{f.adminNotes}</p>
                        ) : (
                          <p className="text-xs text-[#6B7C6B] italic">No notes yet.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Screenshot Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setLightboxUrl(null)}>
          <button onClick={() => setLightboxUrl(null)} className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30">
            <X size={20} />
          </button>
          <img src={lightboxUrl} alt="Screenshot full size" className="max-w-full max-h-[85vh] object-contain rounded-lg" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </PageShell>
  );
};

export default BetaFeedbackPage;
