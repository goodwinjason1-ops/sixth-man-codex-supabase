import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import PageShell from '../../components/PageShell';
import { ALL_ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, ROLE_BADGE_STYLES } from '../../constants/roles';
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Shield,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  Info
} from 'lucide-react';

const UserCreationPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    password: '',
    role: ''
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.email || !formData.displayName || !formData.password || !formData.role) {
      setError('All fields are required.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setCreating(true);

    // Use a secondary Firebase app instance to create the user
    // without signing out the current admin
    let secondaryApp = null;
    try {
      const config = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      };

      secondaryApp = initializeApp(config, 'SecondaryApp');
      const secondaryAuth = getAuth(secondaryApp);
      const result = await createUserWithEmailAndPassword(
        secondaryAuth,
        formData.email.trim().toLowerCase(),
        formData.password
      );

      // Create user profile in Firestore
      const profile = {
        uid: result.user.uid,
        email: formData.email.trim().toLowerCase(),
        displayName: formData.displayName.trim(),
        role: formData.role,
        createdAt: new Date().toISOString(),
        createdByAdmin: true,
        photoURL: null
      };

      await setDoc(doc(db, 'users', result.user.uid), profile);

      // Sign out from secondary app and clean up
      await secondaryAuth.signOut();
      await deleteApp(secondaryApp);
      secondaryApp = null;

      setSuccess(`User "${formData.displayName}" created successfully with role "${ROLE_LABELS[formData.role]}".`);
      setFormData({ email: '', displayName: '', password: '', role: '' });
    } catch (err) {
      if (secondaryApp) {
        try { await deleteApp(secondaryApp); } catch (_) {}
      }
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Use at least 6 characters.');
      } else {
        setError(err.message || 'Failed to create user.');
      }
    } finally {
      setCreating(false);
    }
  };

  const selectedRoleDescription = formData.role ? ROLE_DESCRIPTIONS[formData.role] : null;
  const selectedRoleBadge = formData.role ? ROLE_BADGE_STYLES[formData.role] : null;

  return (
    <PageShell
      title="Create User"
      subtitle="Add a new user with a specific role"
      backTo="/admin"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'Admin Dashboard', url: '/admin' },
        { label: 'Create User' }
      ]}
      maxWidth="2xl"
    >
      <div className="py-2">
        {/* Success Alert */}
        {success && (
          <div className="bg-green-500/20 border border-green-500 rounded-xl p-4 mb-6 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-green-400 font-medium">User Created</p>
              <p className="text-green-300 text-sm">{success}</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-400 font-medium">Error</p>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label className="flex items-center gap-2 text-[#00A651] text-sm font-medium mb-2">
              <Mail className="w-4 h-4" />
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="user@example.com"
              className="w-full px-4 py-3 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 placeholder-gray-400 focus:border-[#00A651] focus:outline-none"
              required
            />
          </div>

          {/* Display Name */}
          <div>
            <label className="flex items-center gap-2 text-[#00A651] text-sm font-medium mb-2">
              <User className="w-4 h-4" />
              Display Name
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
              placeholder="Full name"
              className="w-full px-4 py-3 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 placeholder-gray-400 focus:border-[#00A651] focus:outline-none"
              required
            />
          </div>

          {/* Temporary Password */}
          <div>
            <label className="flex items-center gap-2 text-[#00A651] text-sm font-medium mb-2">
              <Lock className="w-4 h-4" />
              Temporary Password
            </label>
            <input
              type="text"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Minimum 6 characters"
              className="w-full px-4 py-3 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 placeholder-gray-400 focus:border-[#00A651] focus:outline-none"
              required
              minLength={6}
            />
            <p className="text-gray-400 text-xs mt-1">The user should change this after first login.</p>
          </div>

          {/* Role Selection */}
          <div>
            <label className="flex items-center gap-2 text-[#00A651] text-sm font-medium mb-2">
              <Shield className="w-4 h-4" />
              Role
            </label>
            <div className="relative">
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-4 py-3 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 focus:border-[#00A651] focus:outline-none appearance-none"
                required
              >
                <option value="">Select a role...</option>
                {ALL_ROLES.map(role => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7C6B] pointer-events-none" />
            </div>
          </div>

          {/* Permission Summary Card */}
          {formData.role && (
            <div className="bg-white border border-[#D4E4D4] rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-[#00A651] flex-shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${selectedRoleBadge}`}>
                      {ROLE_LABELS[formData.role]}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm">{selectedRoleDescription}</p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={creating || !formData.email || !formData.displayName || !formData.password || !formData.role}
            className="w-full py-3 bg-[#005028] hover:bg-[#00A651] disabled:bg-[#D4E4D4] disabled:cursor-not-allowed text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
          >
            {creating ? (
              <>
                <div className="w-5 h-5 border-2 border-[#D4E4D4] border-t-transparent rounded-full animate-spin" />
                Creating User...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Create User
              </>
            )}
          </button>
        </form>
      </div>
    </PageShell>
  );
};

export default UserCreationPage;
