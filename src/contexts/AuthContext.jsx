import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, supabase } from '../services/firebase';
import { getOAuthRedirectTo, mapAuthError, normalizeSupabaseUser } from '../lib/supabaseClient';
import { logActivity } from '../services/auditService';
import { acceptInvitationByCode } from '../services/parentInvitationService';
import { ADMIN_ROLES, STAFF_ROLES, TRYOUT_ASSESSOR_ROLES, TRYOUT_RESULTS_ROLES, ASSESSOR_ASSIGNER_ROLES, VIDEO_STAFF_ROLES } from '../constants/roles';

const AuthContext = createContext();

const PENDING_PARENT_GOOGLE_KEY = 'sixthMan.pendingParentGoogleSignup';
const OAUTH_PROVIDER_LABELS = {
  apple: 'Apple',
  google: 'Google'
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const getStorage = (type) => {
  if (typeof window === 'undefined') return null;
  try {
    return type === 'session' ? window.sessionStorage : window.localStorage;
  } catch (_) {
    return null;
  }
};

const createPendingNotification = async (profile, messageName) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      title: 'New User Pending Approval',
      message: `${messageName || profile.displayName || profile.email || 'A new user'} signed up and is awaiting approval.`,
      type: 'pending_user',
      targetRoles: ['admin', 'president', 'vice_president'],
      status: 'sent',
      readBy: [],
      deletedBy: [],
      metadata: {
        pendingUid: profile.uid,
        email: profile.email,
        requestedRole: profile.requestedRole || ''
      },
      createdAt: serverTimestamp(),
      date: new Date().toISOString()
    });
  } catch (notifErr) {
    console.error('Failed to create admin notification for new user:', notifErr.code || notifErr.message);
  }
};

const pendingProfileKey = (uid) => `sixthMan.pendingProfile.${uid}`;

const savePendingProfile = (uid, profile) => {
  getStorage('local')?.setItem(pendingProfileKey(uid), JSON.stringify(profile));
};

const consumePendingProfile = (uid) => {
  const storage = getStorage('local');
  const raw = storage?.getItem(pendingProfileKey(uid));
  if (!raw) return null;
  storage.removeItem(pendingProfileKey(uid));
  try {
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signupInProgress, setSignupInProgress] = useState(false);
  const processingRef = useRef(false);

  const signOutSupabase = async () => {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) throw mapAuthError(signOutError);
  };

  const startOAuthSignIn = async (provider) => {
    const label = OAUTH_PROVIDER_LABELS[provider] || provider;
    const { data, error: signInError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: getOAuthRedirectTo(),
        skipBrowserRedirect: true
      }
    });
    if (signInError) throw mapAuthError(signInError);

    const authUrl = data?.url;
    if (!authUrl) {
      throw new Error(`${label} sign-in could not start. Please try again.`);
    }

    if (authUrl.startsWith('/')) {
      window.location.assign(authUrl);
      return null;
    }

    let response;
    try {
      response = await fetch(authUrl, {
        headers: { Accept: 'application/json' },
        credentials: 'omit',
        redirect: 'manual'
      });
    } catch (_) {
      window.location.assign(authUrl);
      return null;
    }

    if (response.type === 'opaqueredirect' || response.status === 0 || (response.status >= 300 && response.status < 400)) {
      window.location.assign(authUrl);
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    const body = contentType.includes('application/json')
      ? await response.json().catch(() => ({}))
      : {};

    if (!response.ok) {
      const message = body?.msg || body?.message || body?.error_description || body?.error;
      if (String(message || '').toLowerCase().includes('provider')) {
        throw new Error(`${label} sign-in is not enabled yet. Please use email and password, or ask an administrator to enable ${label} in Supabase Auth.`);
      }
      throw new Error(message || `${label} sign-in could not start. Please try again.`);
    }

    window.location.assign(body?.url || authUrl);
    return null;
  };

  const writeProfile = async (uid, profile, { notifyPending = false, messageName = '' } = {}) => {
    const cleanProfile = { ...profile };
    delete cleanProfile.__notifyPending;
    await setDoc(doc(db, 'users', uid), cleanProfile);
    if (notifyPending) {
      await createPendingNotification(cleanProfile, messageName);
    }
    setUserProfile(cleanProfile);
    return cleanProfile;
  };

  const completePendingParentGoogleSignup = async (user) => {
    const storage = getStorage('session');
    const raw = storage?.getItem(PENDING_PARENT_GOOGLE_KEY);
    if (!raw) return null;

    storage.removeItem(PENDING_PARENT_GOOGLE_KEY);
    const pending = JSON.parse(raw);
    const requiredEmail = pending.requiredEmail;
    const invitationData = pending.invitationData || {};

    if (requiredEmail && user.email?.toLowerCase() !== requiredEmail.toLowerCase()) {
      await signOutSupabase();
      throw new Error('google-email-mismatch');
    }

    const acceptResult = await acceptInvitationByCode(
      invitationData.invitationCode || '',
      user.displayName || invitationData.parentName || ''
    );

    if (!acceptResult.success) {
      await signOutSupabase();
      throw new Error(acceptResult.error || 'Unable to accept invitation');
    }

    return acceptResult.profile;
  };

  const loadUserProfile = async (user) => {
    const parentSignupProfile = await completePendingParentGoogleSignup(user);
    if (parentSignupProfile) {
      setUserProfile(parentSignupProfile);
      return;
    }

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const profile = userDoc.data();
      if (profile.disabled) {
        await signOutSupabase();
        setError('Your account has been disabled. Please contact an administrator.');
        return;
      }
      if (profile.deleted) {
        await signOutSupabase();
        setError('Your account has been removed. Please contact an administrator.');
        return;
      }
      setUserProfile(profile);
      return;
    }

    const pendingProfile = consumePendingProfile(user.uid);
    if (pendingProfile) {
      await writeProfile(user.uid, pendingProfile, {
        notifyPending: pendingProfile.__notifyPending,
        messageName: pendingProfile.displayName || pendingProfile.email
      });
      return;
    }

    const initialProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || '',
      role: 'pending',
      needsRegistration: true,
      createdAt: new Date().toISOString(),
      photoURL: user.photoURL || null
    };
    await writeProfile(user.uid, initialProfile, {
      notifyPending: true,
      messageName: user.displayName || user.email
    });
  };

  useEffect(() => {
    let mounted = true;

    const handleAuthUser = async (supabaseUser) => {
      const user = normalizeSupabaseUser(supabaseUser);
      if (!mounted) return;

      if (!user) {
        setCurrentUser(null);
        setUserProfile(null);
        setLoading(false);
        return;
      }

      if (processingRef.current) return;

      if (signupInProgress) {
        setCurrentUser(user);
        setLoading(false);
        return;
      }

      processingRef.current = true;
      setCurrentUser(user);

      try {
        await loadUserProfile(user);
      } catch (err) {
        console.error('Error fetching user profile:', err.code || err.message || 'unknown');
        setError(err.message === 'google-email-mismatch'
          ? 'Please sign in with the email address from your invitation.'
          : 'Failed to load user profile. Please try again.');
      } finally {
        processingRef.current = false;
        setLoading(false);
      }
    };

    supabase.auth.getUser()
      .then(({ data, error: authError }) => {
        if (authError && authError.message !== 'Auth session missing!') throw authError;
        return handleAuthUser(data?.user);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error('Supabase auth initialization error:', err.message || err);
        setError('Failed to initialize authentication.');
        setLoading(false);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthUser(session?.user);
    });

    return () => {
      mounted = false;
      subscription?.subscription?.unsubscribe?.();
    };
  }, [signupInProgress]);

  const signInWithGoogle = async () => {
    try {
      setError(null);
      return await startOAuthSignIn('google');
    } catch (err) {
      const mapped = mapAuthError(err) || err;
      console.error('Google Sign-In Error:', mapped.code, mapped.message);
      setError(mapped.message);
      throw mapped;
    }
  };

  const signInWithApple = async () => {
    try {
      setError(null);
      return await startOAuthSignIn('apple');
    } catch (err) {
      const mapped = mapAuthError(err) || err;
      setError(mapped.message);
      throw mapped;
    }
  };

  const signInWithEmail = async (email, password) => {
    try {
      setError(null);
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });
      if (signInError) throw mapAuthError(signInError);

      const user = normalizeSupabaseUser(data.user);
      logActivity(
        { uid: user.uid, email: user.email },
        'user.login',
        `${user.email} signed in with email`
      );
      return user;
    } catch (err) {
      const mapped = mapAuthError(err) || err;
      setError(mapped.message);
      throw mapped;
    }
  };

  const signUpWithEmail = async (email, password, displayName, additionalData = {}) => {
    try {
      setError(null);
      setSignupInProgress(true);

      const normalizedEmail = email.trim().toLowerCase();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            display_name: (displayName || '').trim()
          }
        }
      });
      if (signUpError) throw mapAuthError(signUpError);

      const user = normalizeSupabaseUser(data.user);
      const profile = {
        uid: user.uid,
        email: normalizedEmail,
        displayName: (displayName || '').trim(),
        role: 'pending',
        requestedRole: additionalData.requestedRole || additionalData.role || '',
        requestedTeam: additionalData.requestedTeam || '',
        phone: additionalData.phone || '',
        registrationNote: additionalData.registrationNote || '',
        needsRegistration: false,
        createdAt: new Date().toISOString(),
        photoURL: null,
        __notifyPending: true
      };

      savePendingProfile(user.uid, profile);
      await writeProfile(user.uid, profile, {
        notifyPending: true,
        messageName: profile.displayName || normalizedEmail
      });
      getStorage('local')?.removeItem(pendingProfileKey(user.uid));
      setCurrentUser(user);
      return user;
    } catch (err) {
      const mapped = mapAuthError(err) || err;
      setError(mapped.message);
      throw mapped;
    } finally {
      setSignupInProgress(false);
    }
  };

  const signUpParentWithInvitation = async (email, password, displayName, invitationData = {}) => {
    try {
      setError(null);
      setSignupInProgress(true);

      const normalizedEmail = email.trim().toLowerCase();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            display_name: (displayName || '').trim()
          }
        }
      });
      if (signUpError) throw mapAuthError(signUpError);

      const user = normalizeSupabaseUser(data.user);
      const acceptResult = await acceptInvitationByCode(
        invitationData.invitationCode || '',
        (displayName || '').trim()
      );

      if (!acceptResult.success) {
        throw new Error(acceptResult.error || 'Unable to accept invitation');
      }

      setCurrentUser(user);
      setUserProfile(acceptResult.profile);
      return user;
    } catch (err) {
      const mapped = mapAuthError(err) || err;
      setError(mapped.message);
      throw mapped;
    } finally {
      setSignupInProgress(false);
    }
  };

  const signUpParentWithGoogle = async (requiredEmail, invitationData = {}) => {
    try {
      setError(null);
      getStorage('session')?.setItem(PENDING_PARENT_GOOGLE_KEY, JSON.stringify({
        requiredEmail,
        invitationData
      }));

      return await startOAuthSignIn('google');
    } catch (err) {
      getStorage('session')?.removeItem(PENDING_PARENT_GOOGLE_KEY);
      const mapped = mapAuthError(err) || err;
      setError(mapped.message);
      throw mapped;
    }
  };

  const resetPassword = async (email) => {
    try {
      setError(null);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: getOAuthRedirectTo() }
      );
      if (resetError) throw mapAuthError(resetError);
    } catch (err) {
      const mapped = mapAuthError(err) || err;
      setError(mapped.message);
      throw mapped;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await signOutSupabase();
      setCurrentUser(null);
      setUserProfile(null);
    } catch (err) {
      const mapped = mapAuthError(err) || err;
      setError(mapped.message);
      throw mapped;
    }
  };

  const refreshUserProfile = async () => {
    if (!currentUser) return null;
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const freshProfile = userDoc.data();
        setUserProfile(freshProfile);
        return freshProfile;
      }
    } catch (err) {
      console.error('Error refreshing user profile:', err.code || 'unknown');
    }
    return null;
  };

  const updateUserProfile = async (updates) => {
    if (!currentUser) return;

    try {
      setError(null);
      const { role, uid, createdAt, ...safeUpdates } = updates;
      await setDoc(doc(db, 'users', currentUser.uid), safeUpdates, { merge: true });

      if (safeUpdates.displayName || safeUpdates.photoURL) {
        const { data, error: updateError } = await supabase.auth.updateUser({
          data: {
            display_name: safeUpdates.displayName,
            photoURL: safeUpdates.photoURL
          }
        });
        if (updateError) throw mapAuthError(updateError);
        setCurrentUser(normalizeSupabaseUser(data.user));
      }

      setUserProfile(prev => ({ ...prev, ...safeUpdates }));
    } catch (err) {
      const mapped = mapAuthError(err) || err;
      setError(mapped.message);
      throw mapped;
    }
  };

  const role = userProfile?.role;

  const value = {
    currentUser,
    userProfile,
    loading,
    error,
    signInWithGoogle,
    signInWithApple,
    signInWithEmail,
    signUpWithEmail,
    signUpParentWithInvitation,
    signUpParentWithGoogle,
    resetPassword,
    signOut,
    updateUserProfile,
    refreshUserProfile,
    isAdmin: role === 'admin',
    isCoach: role === 'coach',
    isPending: role === 'pending',
    isPlayer: role === 'player',
    isParent: role === 'parent',
    isTeamManager: role === 'team_manager',
    isPresident: role === 'president',
    isVicePresident: role === 'vice_president',
    isTryoutAssessor: role === 'tryout_assessor',
    isGirlsCoordinator: role === 'girls_coordinator',
    isBoysCoordinator: role === 'boys_coordinator',
    isYouthHeadCoach: role === 'youth_head_coach',
    isYouthCoach: role === 'youth_coach',
    isCoachCoordinator: role === 'coach_coordinator',
    isLeadership: ADMIN_ROLES.includes(role),
    isStaff: STAFF_ROLES.includes(role),
    isCoachOrAdmin: STAFF_ROLES.includes(role),
    canManageVideo: VIDEO_STAFF_ROLES.includes(role),
    canAssessTryouts: TRYOUT_ASSESSOR_ROLES.includes(role),
    canViewTryoutResults: TRYOUT_RESULTS_ROLES.includes(role),
    canAssignAssessors: ASSESSOR_ASSIGNER_ROLES.includes(role),
    hasRole: (checkRole) => role === checkRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
