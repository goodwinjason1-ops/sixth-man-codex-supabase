import React, { useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../services/firebase';
import { MessageCircle, X, Send, Loader2, Camera, Trash2 } from 'lucide-react';

// ─── Beta mode flag — set to false to remove feedback button globally ───
const BETA_MODE = true;

const CATEGORIES = [
  { id: 'bug', label: 'Bug Report', emoji: '\uD83D\uDC1B' },
  { id: 'feature', label: 'Feature Request', emoji: '\uD83D\uDCA1' },
  { id: 'confusing', label: 'Confusing / Hard to Use', emoji: '\uD83D\uDE15' },
  { id: 'great', label: 'Works Great!', emoji: '\uD83C\uDF89' },
];

const IMPORTANCE = [
  { id: 'low', label: 'Low', desc: 'nice to have' },
  { id: 'medium', label: 'Medium', desc: 'affects my experience' },
  { id: 'high', label: 'High', desc: 'blocks me from using the app' },
];

const PLACEHOLDERS = {
  bug: 'What happened? What did you expect to happen?',
  feature: 'What would you like to be able to do?',
  confusing: 'What was confusing? How could it be clearer?',
  great: 'What did you like? What worked well?',
};

const ROUTE_NAMES = {
  '/welcome': 'Welcome',
  '/dashboard': 'Dashboard',
  '/admin': 'Admin Dashboard',
  '/admin/schedule': 'Schedule Management',
  '/admin/rosters': 'Roster Management',
  '/admin/analytics': 'Club Analytics',
  '/admin/analytics-hub': 'Analytics Hub',
  '/admin/assessments-hub': 'Assessments Hub',
  '/admin/team-selection': 'Team Selection',
  '/admin/rotation-analytics': 'Rotation Analytics',
  '/admin/coaching': 'Coaching Effectiveness',
  '/admin/training-records': 'Training Records',
  '/admin/match-assessments': 'Match Assessments',
  '/coach/rotation-tracker': 'Rotation Tracker',
  '/coach/rotation-analytics': 'Rotation Analytics',
  '/coach/match-assessment': 'Match Day Assessment',
  '/coach/training-plans': 'Training Plans',
  '/coach/players': 'Player Overview',
  '/player': 'Player Portal',
  '/parent': 'Parent Dashboard',
  '/notifications': 'Notifications',
};

const getPageName = (pathname) => {
  if (ROUTE_NAMES[pathname]) return ROUTE_NAMES[pathname];
  // Try prefix match
  const match = Object.entries(ROUTE_NAMES)
    .filter(([key]) => pathname.startsWith(key) && key !== '/')
    .sort((a, b) => b[0].length - a[0].length)[0];
  if (match) return match[1];
  // Fallback: format the path
  const parts = pathname.split('/').filter(Boolean);
  return parts.map(p => p.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())).join(' > ') || 'Home';
};

const getDeviceType = () => {
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
};

const getBrowser = () => {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg')) return 'Edge';
  return ua.slice(0, 50);
};

const FeedbackButton = () => {
  const { currentUser, userProfile } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('');
  const [page, setPage] = useState('');
  const [description, setDescription] = useState('');
  const [importance, setImportance] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const fileInputRef = useRef(null);

  if (!BETA_MODE || !currentUser) return null;

  // Hide on login page
  if (location.pathname === '/' || location.pathname === '/login') return null;

  const handleOpen = () => {
    setPage(getPageName(location.pathname));
    setOpen(true);
    setSubmitted(false);
  };

  const handleClose = () => {
    setOpen(false);
    if (submitted) {
      setCategory('');
      setDescription('');
      setImportance('');
      setScreenshotFile(null);
      setScreenshotPreview(null);
      setSubmitted(false);
    }
  };

  const handleScreenshotSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      alert('Please select a PNG or JPG image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB.');
      return;
    }
    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setScreenshotPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const removeScreenshot = () => {
    setScreenshotFile(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!category || !description.trim()) return;
    setSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, 'beta_feedback'), {
        userId: currentUser.uid,
        userName: userProfile?.displayName || userProfile?.name || currentUser.email || 'Unknown',
        userRole: userProfile?.role || 'unknown',
        category,
        page,
        description: description.trim(),
        importance: importance || null,
        screenshotUrl: null,
        status: 'new',
        adminNotes: '',
        createdAt: serverTimestamp(),
        device: getDeviceType(),
        browser: getBrowser(),
      });

      // Upload screenshot if attached
      if (screenshotFile) {
        try {
          const storageRef = ref(storage, `feedback/${docRef.id}/screenshot.jpg`);
          await uploadBytes(storageRef, screenshotFile);
          const url = await getDownloadURL(storageRef);
          // Update the doc with the screenshot URL
          const { updateDoc, doc: firestoreDoc } = await import('firebase/firestore');
          await updateDoc(firestoreDoc(db, 'beta_feedback', docRef.id), { screenshotUrl: url });
        } catch (uploadErr) {
          console.error('Screenshot upload failed:', uploadErr);
          // Feedback was still saved, just without screenshot
        }
      }

      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = category && description.trim().length > 0;

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={handleOpen}
          className="fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full bg-white border-2 border-[#00A651] shadow-lg flex items-center justify-center hover:bg-[#F5F9F5] hover:shadow-xl transition-all active:scale-95"
          title="Share Feedback"
        >
          <MessageCircle size={22} className="text-[#005028]" />
        </button>
      )}

      {/* Modal Overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={handleClose}>
          <div
            className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[75vh] overflow-y-auto shadow-2xl mb-16 sm:mb-0"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-[#D4E4D4] px-5 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Share Feedback</h2>
                <p className="text-xs text-[#6B7C6B]">Help us improve Sixth Man</p>
              </div>
              <button onClick={handleClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            {submitted ? (
              /* Success State */
              <div className="px-5 py-12 text-center">
                <div className="w-16 h-16 bg-[#00A651]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">{'\u2705'}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">Thank you!</h3>
                <p className="text-sm text-[#6B7C6B] mb-6">Your feedback helps us make Sixth Man better for everyone.</p>
                <button
                  onClick={() => { handleClose(); setCategory(''); setDescription(''); setImportance(''); setScreenshotFile(null); setScreenshotPreview(null); setSubmitted(false); }}
                  className="px-6 py-2.5 bg-[#005028] text-white rounded-xl text-sm font-medium hover:bg-[#00A651] transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              /* Form */
              <div className="px-5 py-4 space-y-5">
                {/* Category */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Category <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={`px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all border ${
                          category === cat.id
                            ? 'border-[#00A651] bg-[#00A651]/10 text-[#005028]'
                            : 'border-[#D4E4D4] bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <span className="mr-1.5">{cat.emoji}</span>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Page */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">What page were you on?</label>
                  <input
                    value={page}
                    onChange={e => setPage(e.target.value)}
                    className="w-full px-3 py-2 border border-[#D4E4D4] rounded-lg text-sm bg-[#F5F9F5] focus:outline-none focus:border-[#00A651]"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                    Describe your feedback <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder={PLACEHOLDERS[category] || 'Tell us what you think...'}
                    rows={4}
                    className="w-full px-3 py-2 border border-[#D4E4D4] rounded-lg text-sm focus:outline-none focus:border-[#00A651] resize-none"
                  />
                </div>

                {/* Importance */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    How important is this? <span className="text-[#6B7C6B] font-normal">(optional)</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {IMPORTANCE.map(imp => (
                      <button
                        key={imp.id}
                        onClick={() => setImportance(importance === imp.id ? '' : imp.id)}
                        className={`px-3 py-2 rounded-xl text-center transition-all border ${
                          importance === imp.id
                            ? imp.id === 'high' ? 'border-red-400 bg-red-50 text-red-700'
                              : imp.id === 'medium' ? 'border-yellow-400 bg-yellow-50 text-yellow-700'
                              : 'border-blue-400 bg-blue-50 text-blue-700'
                            : 'border-[#D4E4D4] bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <p className="text-sm font-medium">{imp.label}</p>
                        <p className="text-[10px] text-[#6B7C6B] mt-0.5">{imp.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Screenshot Upload */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Attach Screenshot <span className="text-[#6B7C6B] font-normal">(optional)</span>
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleScreenshotSelect}
                    className="hidden"
                  />
                  {screenshotPreview ? (
                    <div className="relative inline-block">
                      <img src={screenshotPreview} alt="Screenshot preview" className="w-32 h-24 object-cover rounded-lg border border-[#D4E4D4]" />
                      <button
                        type="button"
                        onClick={removeScreenshot}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-[#D4E4D4] rounded-xl text-sm text-[#6B7C6B] hover:border-[#00A651] hover:text-[#005028] transition-colors"
                    >
                      <Camera size={16} />
                      Choose Image (PNG, JPG — max 5MB)
                    </button>
                  )}
                </div>

                {/* Submit */}
                <div className="pb-6">
                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit || submitting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#005028] text-white rounded-xl text-sm font-medium hover:bg-[#00A651] transition-colors disabled:opacity-40"
                  >
                    {submitting ? (
                      <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                    ) : (
                      <><Send size={16} /> Submit Feedback</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default FeedbackButton;
