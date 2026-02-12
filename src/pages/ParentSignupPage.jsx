import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, AlertCircle, Loader2, Users, CheckCircle2, Chrome, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { validateInvitationCode, acceptInvitation, getPlayerNames } from '../services/parentInvitationService';

const ParentSignupPage = () => {
  const { invitationCode } = useParams();
  const navigate = useNavigate();
  const { signUpParentWithInvitation, signUpParentWithGoogle, signOut, refreshUserProfile, currentUser, userProfile } = useAuth();

  const [validating, setValidating] = useState(true);
  const [invitation, setInvitation] = useState(null);
  const [playerNames, setPlayerNames] = useState([]);
  const [validationError, setValidationError] = useState('');

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Validate code on mount (don't wait for auth — rules allow public read)
  useEffect(() => {
    const validate = async () => {
      setValidating(true);

      // Add a timeout so we don't hang forever
      const timeoutId = setTimeout(() => {
        setValidating(false);
        setValidationError('Validation is taking too long. Please check your internet connection and try again.');
      }, 10000);

      try {
        const result = await validateInvitationCode(invitationCode);
        clearTimeout(timeoutId);

        if (result.valid) {
          setInvitation(result.invitation);
          setEmail(result.invitation.parentEmail || '');
          setDisplayName(result.invitation.parentName || '');

          // Fetch player names
          if (result.invitation.playerIds?.length > 0) {
            const names = await getPlayerNames(result.invitation.playerIds);
            setPlayerNames(names);
          }
        } else {
          setValidationError(result.error);
        }
      } catch (err) {
        clearTimeout(timeoutId);
        setValidationError('Unable to validate invitation. Please try again later.');
      }
      setValidating(false);
    };
    validate();
  }, [invitationCode]);

  const handleLogoutAndContinue = async () => {
    setLoggingOut(true);
    try {
      await signOut();
    } catch {
      // Even if signOut fails, auth state should clear
    }
    setLoggingOut(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!displayName?.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!email?.trim()) {
      setError('Please enter your email');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      setLoading(true);

      // Create parent account with linkedPlayerIds set from the start
      const user = await signUpParentWithInvitation(email.trim(), password, displayName.trim(), {
        playerIds: invitation.playerIds || [],
        invitationCode: invitation.invitationCode || ''
      });

      // Accept invitation (marks it used, links parent on player docs too)
      const acceptResult = await acceptInvitation(invitation.id, user.uid);
      if (!acceptResult.success) {
        console.error('Failed to accept invitation:', acceptResult.error);
      }

      // Refresh profile to ensure latest data
      await refreshUserProfile();

      navigate('/welcome');
    } catch (err) {
      if (err.message?.includes('email-already-in-use')) {
        setError('An account with this email already exists. Please sign in instead.');
      } else if (err.message?.includes('weak-password')) {
        setError('Password must be at least 8 characters');
      } else if (err.message?.includes('invalid-email')) {
        setError('Please enter a valid email address');
      } else {
        setError('Account creation failed. Please try again.');
      }
      if (import.meta.env.DEV) {
        console.error('Parent signup error:', err.code);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      const requiredEmail = invitation?.parentEmail || null;
      const user = await signUpParentWithGoogle(requiredEmail, {
        playerIds: invitation.playerIds || [],
        invitationCode: invitation.invitationCode || ''
      });

      // Accept invitation (marks it used, links parent on player docs too)
      const acceptResult = await acceptInvitation(invitation.id, user.uid);
      if (!acceptResult.success) {
        console.error('Failed to accept invitation:', acceptResult.error);
      }

      // Refresh profile to ensure latest data
      await refreshUserProfile();

      navigate('/welcome');
    } catch (err) {
      if (err.message?.includes('google-email-mismatch')) {
        setError(`Please use the email address the invitation was sent to (${invitation?.parentEmail}).`);
      } else if (err.message?.includes('popup-closed-by-user')) {
        // User closed popup, no error needed
      } else {
        setError('Google sign-in failed. Please try again or use email/password.');
      }
      if (import.meta.env.DEV) {
        console.error('Google signup error:', err.code || err.message);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // Loading state
  if (validating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#003018] via-[#005028] to-[#005028] flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#00A651] animate-spin mx-auto mb-4" />
          <p className="text-white font-medium">Validating invitation code...</p>
          <p className="text-green-200 text-sm mt-2">Code: {invitationCode}</p>
        </div>
      </div>
    );
  }

  // Already logged in — show log-out prompt instead of silently redirecting
  if (currentUser && invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#003018] via-[#005028] to-[#005028] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-400 rounded-full mb-4 shadow-lg">
              <span className="text-4xl font-bold text-[#003018]">L</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Emerald Lakers</h1>
            <p className="text-green-200">Parent Registration</p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center">
              <LogOut className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Already Logged In</h2>
              <p className="text-gray-600 mb-2">
                You are currently signed in as <span className="font-semibold">{userProfile?.displayName || currentUser.email}</span>
                {userProfile?.role && <span className="text-gray-400"> ({userProfile.role})</span>}.
              </p>
              <p className="text-gray-500 text-sm mb-6">
                Please log out first to create a new parent account with this invitation.
              </p>

              <button
                onClick={handleLogoutAndContinue}
                disabled={loggingOut}
                className="w-full bg-[#005028] text-white py-3 rounded-lg font-semibold hover:bg-[#003018] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mb-3"
              >
                {loggingOut ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Logging out...
                  </>
                ) : (
                  <>
                    <LogOut className="w-5 h-5" />
                    Log Out and Continue
                  </>
                )}
              </button>

              <button
                onClick={() => navigate('/welcome')}
                className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Go to Dashboard Instead
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Invalid code
  if (validationError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#003018] via-[#005028] to-[#005028] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-400 rounded-full mb-4 shadow-lg">
              <span className="text-4xl font-bold text-[#003018]">L</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Emerald Lakers</h1>
            <p className="text-green-200">Basketball Club Portal</p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
              <p className="text-gray-600 mb-6">{validationError}</p>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-[#005028] text-white py-3 rounded-lg font-semibold hover:bg-[#003018] transition-colors"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Signup form
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#003018] via-[#005028] to-[#005028] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-400 rounded-full mb-4 shadow-lg">
            <span className="text-4xl font-bold text-[#003018]">L</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Emerald Lakers</h1>
          <p className="text-green-200">Parent Registration</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 animate-slide-in">
          {/* Player Info Banner */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-700 font-medium">
                  You&apos;ve been invited to join Emerald Lakers Basketball Club
                </p>
                <p className="text-xs text-green-600 mt-0.5">Registering as a parent for:</p>
                <div className="mt-1">
                  {playerNames.length > 0 ? (
                    playerNames.map(p => (
                      <p key={p.id} className="text-green-900 font-bold">{p.name}</p>
                    ))
                  ) : (
                    <p className="text-green-900 font-bold">{invitation.playerIds?.length || 0} player(s)</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Google Sign-In */}
          <div className="mb-6">
            <button
              onClick={handleGoogleSignUp}
              disabled={loading || googleLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
              ) : (
                <Chrome className="w-5 h-5 text-blue-600" />
              )}
              <span className="font-semibold text-gray-700">
                {googleLoading ? 'Connecting...' : 'Sign up with Google'}
              </span>
            </button>
            {invitation?.parentEmail && (
              <p className="text-xs text-gray-500 text-center mt-2">
                Please use {invitation.parentEmail} when signing in with Google
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or create with email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A651] focus:border-transparent outline-none"
                  placeholder="Enter your name"
                  disabled={loading}
                  autoComplete="name"
                  maxLength={100}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A651] focus:border-transparent outline-none"
                  placeholder="you@example.com"
                  disabled={loading}
                  autoComplete="email"
                  maxLength={254}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A651] focus:border-transparent outline-none"
                  placeholder="Min. 8 characters"
                  disabled={loading}
                  autoComplete="new-password"
                  minLength={8}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full bg-[#005028] text-white py-3 rounded-lg font-semibold hover:bg-[#003018] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Create Parent Account
                </>
              )}
            </button>
          </form>

          {/* Back to login */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-[#005028] hover:text-[#003018] font-semibold"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-green-200 text-sm mt-6">
          &copy; 2024 Emerald Lakers Basketball Club
        </p>
      </div>
    </div>
  );
};

export default ParentSignupPage;
