import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Chrome, Apple as AppleIcon, AlertCircle, Users, ClipboardCheck, KeyRound } from 'lucide-react';

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
  const [selectedRole, setSelectedRole] = useState('player'); // player or coach
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showInvitationInput, setShowInvitationInput] = useState(false);
  const [invitationCodeInput, setInvitationCodeInput] = useState('');

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await signInWithGoogle();
      navigate('/welcome');
    } catch (err) {
      setError('Failed to sign in with Google. Please try again.');
      console.error(err);
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
      setError('Failed to sign in with Apple. Please try again.');
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

    if (mode === 'signup' && password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      setLoading(true);
      if (mode === 'signup') {
        await signUpWithEmail(email, password, displayName, { role: selectedRole });
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
          <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-[#FFD700]/20 ring-2 ring-[#FFD700]/40 mb-4">
            <img
              src="/images/logo_login.png"
              alt="Emerald Lakers"
              className="w-24 h-24 drop-shadow-lg"
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
                    Full Name
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

                {/* Role Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    I am a...
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('player')}
                      className={`flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg transition-all ${
                        selectedRole === 'player'
                          ? 'border-lakers-600 bg-lakers-50 text-lakers-700'
                          : 'border-gray-300 text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      <Users className="w-5 h-5" />
                      <span className="font-medium">Player</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRole('coach')}
                      className={`flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg transition-all ${
                        selectedRole === 'coach'
                          ? 'border-lakers-600 bg-lakers-50 text-lakers-700'
                          : 'border-gray-300 text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      <ClipboardCheck className="w-5 h-5" />
                      <span className="font-medium">Coach</span>
                    </button>
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
                Parents need an invitation code from the club admin to create a parent account.
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
