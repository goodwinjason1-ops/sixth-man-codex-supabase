import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Mail, Lock, User, Chrome, Apple as AppleIcon, AlertCircle, Users, ClipboardCheck, KeyRound, Phone, Shield, MessageSquare } from 'lucide-react';
import { LOGIN_LOGO_SRC } from '../lib/publicAssets';

const LoginPage = () => {
  const {
    signInWithGoogle,
    signInWithApple,
    signInWithEmail,
    signUpWithEmail,
    resetPassword
  } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('signin'); // signin, signup, reset
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedRole, setSelectedRole] = useState(''); // requested role
  const [requestedTeam, setRequestedTeam] = useState('');
  const [phone, setPhone] = useState('');
  const [registrationNote, setRegistrationNote] = useState('');
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showInvitationInput, setShowInvitationInput] = useState(false);
  const [invitationCodeInput, setInvitationCodeInput] = useState('');

  // Hardcoded fallback teams (used if Firestore read fails for unauthenticated users)
  const FALLBACK_TEAMS = [
    { id: 'fb_u8', name: 'Lakers U8' },
    { id: 'fb_u10', name: 'Lakers U10' },
    { id: 'fb_u12', name: 'Lakers U12' },
    { id: 'fb_u14g', name: 'Lakers U14 Girls' },
    { id: 'fb_u16', name: 'Lakers U16' },
    { id: 'fb_u19', name: 'Lakers U19' },
  ];

  // Fetch teams for dropdown
  useEffect(() => {
    getDocs(collection(db, 'teams')).then(snap => {
      const t = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      t.sort((a, b) => (a.name || a.teamName || '').localeCompare(b.name || b.teamName || ''));
      setTeams(t.length > 0 ? t : FALLBACK_TEAMS);
    }).catch(() => {
      setTeams(FALLBACK_TEAMS);
    });
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      const user = await signInWithGoogle();
      if (user) {
        // Let onAuthStateChanged load profile, then App.jsx route guard redirects
        navigate('/welcome');
      }
    } catch (err) {
      // popup-closed-by-user and cancelled-popup-request are handled in AuthContext
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError(err.message || 'Google sign-in failed. Please try again.');
        console.error('Google sign-in error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await signInWithApple();
      navigate('/welcome');
    } catch (err) {
      setError(err.message || 'Failed to sign in with Apple. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (mode === 'reset') {
      try {
        setLoading(true);
        await resetPassword(email);
        setMessage('Password reset email sent. Check your inbox.');
      } catch (err) {
        setError('Failed to send reset email. Please check your email address.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (mode === 'signup' && !displayName?.trim()) {
      setError('Please enter your name');
      return;
    }

    if (mode === 'signup' && !selectedRole) {
      setError('Please select a preferred role');
      return;
    }

    if (mode === 'signup' && password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      setLoading(true);
      if (mode === 'signup') {
        await signUpWithEmail(email, password, displayName, {
          requestedRole: selectedRole,
          requestedTeam: requestedTeam || 'Not sure',
          phone: phone.trim(),
          registrationNote: registrationNote.trim(),
        });
      } else {
        await signInWithEmail(email, password);
      }
      navigate('/welcome');
    } catch (err) {
      if (err.message.includes('user-not-found')) {
        setError('No account found with this email');
      } else if (err.message.includes('wrong-password')) {
        setError('Incorrect password');
      } else if (err.message.includes('email-already-in-use')) {
        setError('An account with this email already exists');
      } else if (err.message.includes('weak-password')) {
        setError('Password must be at least 8 characters');
      } else if (err.message.includes('too-many-requests')) {
        setError('Too many attempts. Please try again later.');
      } else if (err.message.includes('invalid-email')) {
        setError('Please enter a valid email address.');
      } else {
        setError('Authentication failed. Please try again.');
      }
      // Only log error code in development, not the full error object
      if (import.meta.env.DEV) {
        console.error('Auth error:', err.code);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-lakers-900 via-lakers-800 to-lakers-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center mb-4">
            <img
              src={LOGIN_LOGO_SRC}
              alt="Emerald Lakers"
              className="max-h-[120px] w-auto object-contain drop-shadow-lg"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Emerald Lakers</h1>
          <p className="text-green-200">Basketball Club Portal</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 animate-slide-in">
          {/* Error/Message Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          
          {message && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">{message}</p>
            </div>
          )}

          {/* Social Login Buttons */}
          {mode !== 'reset' && (
            <div className="space-y-3 mb-6">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Chrome className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-gray-700">Continue with Google</span>
              </button>

              <button
                onClick={handleAppleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <AppleIcon className="w-5 h-5" />
                <span className="font-semibold">Continue with Apple</span>
              </button>
            </div>
          )}

          {/* Divider */}
          {mode !== 'reset' && (
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Or continue with email</span>
              </div>
            </div>
          )}

          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lakers-600 focus:border-transparent outline-none"
                      placeholder="Enter your name"
                      disabled={loading}
                      autoComplete="name"
                      maxLength={100}
                    />
                  </div>
                </div>

                {/* Preferred Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Role <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lakers-600 focus:border-transparent outline-none appearance-none"
                      required
                    >
                      <option value="">Select a role...</option>
                      <option value="coach">Coach</option>
                      <option value="parent">Parent</option>
                      <option value="team_manager">Team Manager</option>
                      <option value="tryout_assessor">Volunteer / Assessor</option>
                    </select>
                  </div>
                </div>

                {/* Team Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Team</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={requestedTeam}
                      onChange={(e) => setRequestedTeam(e.target.value)}
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lakers-600 focus:border-transparent outline-none appearance-none"
                    >
                      <option value="">Not sure</option>
                      {teams.map(t => (
                        <option key={t.id} value={t.name || t.teamName}>{t.name || t.teamName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lakers-600 focus:border-transparent outline-none"
                      placeholder="0400 000 000"
                      disabled={loading}
                      maxLength={20}
                    />
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brief note <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      value={registrationNote}
                      onChange={(e) => setRegistrationNote(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lakers-600 focus:border-transparent outline-none resize-none"
                      placeholder="Tell us about your involvement with the club"
                      disabled={loading}
                      rows={2}
                      maxLength={300}
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lakers-600 focus:border-transparent outline-none"
                  placeholder="you@example.com"
                  disabled={loading}
                  autoComplete="email"
                  maxLength={254}
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lakers-600 focus:border-transparent outline-none"
                    placeholder={mode === 'signup' ? 'Min. 8 characters' : 'Enter password'}
                    disabled={loading}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    minLength={mode === 'signup' ? 8 : undefined}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-lakers-700 text-white py-3 rounded-lg font-semibold hover:bg-lakers-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait...' : 
                mode === 'signin' ? 'Sign In' : 
                mode === 'signup' ? 'Create Account' : 
                'Send Reset Link'}
            </button>
          </form>

          {/* Parent Invitation Code Entry */}
          {mode === 'signin' && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              {!showInvitationInput ? (
                <button
                  onClick={() => setShowInvitationInput(true)}
                  className="w-full flex items-center justify-center gap-2 text-sm text-lakers-700 hover:text-lakers-800 font-medium"
                >
                  <KeyRound className="w-4 h-4" />
                  Have a parent invitation code?
                </button>
              ) : (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Enter Invitation Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={invitationCodeInput}
                      onChange={(e) => setInvitationCodeInput(e.target.value.toUpperCase())}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lakers-600 focus:border-transparent outline-none font-mono text-center tracking-wider"
                      placeholder="XXXX-XXXX"
                      maxLength={9}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const code = invitationCodeInput.trim();
                        if (code) navigate(`/signup/${code}`);
                      }}
                      disabled={!invitationCodeInput.trim()}
                      className="px-4 py-3 bg-lakers-700 text-white rounded-lg font-semibold hover:bg-lakers-800 transition-colors disabled:opacity-50"
                    >
                      Continue
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setShowInvitationInput(false);
                      setInvitationCodeInput('');
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Info note for signup mode */}
          {mode === 'signup' && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                Your account will be reviewed by a club administrator before access is granted.
              </p>
            </div>
          )}

          {/* Mode Toggle */}
          <div className="mt-6 text-center space-y-2">
            {mode === 'signin' && (
              <>
                <button
                  onClick={() => setMode('reset')}
                  className="text-sm text-lakers-700 hover:text-lakers-800 font-medium"
                >
                  Forgot password?
                </button>
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <button
                    onClick={() => {
                      setMode('signup');
                      setError('');
                      setMessage('');
                    }}
                    className="text-lakers-700 hover:text-lakers-800 font-semibold"
                  >
                    Sign up
                  </button>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Parents: contact your club admin for an invitation code
                </p>
              </>
            )}
            
            {mode === 'signup' && (
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setMode('signin');
                    setError('');
                    setMessage('');
                  }}
                  className="text-lakers-700 hover:text-lakers-800 font-semibold"
                >
                  Sign in
                </button>
              </p>
            )}
            
            {mode === 'reset' && (
              <button
                onClick={() => {
                  setMode('signin');
                  setError('');
                  setMessage('');
                }}
                className="text-sm text-lakers-700 hover:text-lakers-800 font-medium"
              >
                Back to sign in
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-green-200 text-sm mt-6 space-y-1">
          <p>&copy; 2026 Emerald Lakers Basketball Club</p>
          <Link to="/privacy-policy" className="text-green-300 hover:text-white text-xs underline underline-offset-2">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
