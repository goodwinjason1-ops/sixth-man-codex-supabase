import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, appleProvider, db } from '../services/firebase';
import { logActivity } from '../services/auditService';
import { ADMIN_ROLES, STAFF_ROLES, TRYOUT_ASSESSOR_ROLES, TRYOUT_RESULTS_ROLES, ASSESSOR_ASSIGNER_ROLES } from '../constants/roles';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Flag to prevent onAuthStateChanged from creating a default profile
  // during signup flows that create their own profile
  const [signupInProgress, setSignupInProgress] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        // If a signup flow is in progress, it will create its own profile.
        // Don't race it by creating a default 'player' profile here.
        if (signupInProgress) {
          return;
        }

        // Fetch user profile from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const profile = userDoc.data();
            if (profile.disabled) {
              await firebaseSignOut(auth);
              setError('Your account has been disabled. Please contact an administrator.');
              setLoading(false);
              return;
            }
            if (profile.deleted) {
              await firebaseSignOut(auth);
              setError('Your account has been removed. Please contact an administrator.');
              setLoading(false);
              return;
            }
            setUserProfile(profile);
          } else {
            // Create initial profile for new users (social login without signup flow)
            const initialProfile = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || '',
              role: 'player', // Default role
              createdAt: new Date().toISOString(),
              photoURL: user.photoURL || null
            };
            await setDoc(doc(db, 'users', user.uid), initialProfile);
            setUserProfile(initialProfile);
          }
        } catch (err) {
          console.error('Error fetching user profile:', err.code || 'unknown');
          setError('Failed to load user profile. Please try again.');
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, [signupInProgress]);

  const signInWithGoogle = async () => {
    try {
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      logActivity(
        { uid: result.user.uid, displayName: result.user.displayName, email: result.user.email },
        'user.login',
        `${result.user.displayName || result.user.email} signed in with Google`
      );
      return result.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const signInWithApple = async () => {
    try {
      setError(null);
      const result = await signInWithPopup(auth, appleProvider);
      logActivity(
        { uid: result.user.uid, displayName: result.user.displayName, email: result.user.email },
        'user.login',
        `${result.user.displayName || result.user.email} signed in with Apple`
      );
      return result.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const signInWithEmail = async (email, password) => {
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      logActivity(
        { uid: result.user.uid, email: result.user.email },
        'user.login',
        `${result.user.email} signed in with email`
      );
      return result.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Allowed roles that users can self-select during signup
  const SELF_ASSIGNABLE_ROLES = ['player', 'coach'];

  const signUpWithEmail = async (email, password, displayName, additionalData = {}) => {
    try {
      setError(null);
      setSignupInProgress(true);

      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Sanitize the requested role — only allow safe self-assignable roles.
      // Privileged roles must be set by an admin.
      const requestedRole = additionalData.role;
      const safeRole = SELF_ASSIGNABLE_ROLES.includes(requestedRole) ? requestedRole : 'player';

      // Create user profile in Firestore with only allowed fields
      const profile = {
        uid: result.user.uid,
        email: email.trim().toLowerCase(),
        displayName: (displayName || '').trim(),
        role: safeRole,
        createdAt: new Date().toISOString(),
        photoURL: null
      };

      await setDoc(doc(db, 'users', result.user.uid), profile);
      setUserProfile(profile);
      setSignupInProgress(false);

      return result.user;
    } catch (err) {
      setSignupInProgress(false);
      setError(err.message);
      throw err;
    }
  };

  const signUpParentWithInvitation = async (email, password, displayName, invitationData = {}) => {
    try {
      setError(null);
      setSignupInProgress(true);

      const result = await createUserWithEmailAndPassword(auth, email, password);

      const profile = {
        uid: result.user.uid,
        email: email.trim().toLowerCase(),
        displayName: (displayName || '').trim(),
        role: 'parent',
        linkedPlayerIds: invitationData.playerIds || [],
        invitationCode: invitationData.invitationCode || '',
        createdAt: new Date().toISOString(),
        photoURL: null
      };

      await setDoc(doc(db, 'users', result.user.uid), profile);
      setUserProfile(profile);
      setSignupInProgress(false);

      return result.user;
    } catch (err) {
      setSignupInProgress(false);
      setError(err.message);
      throw err;
    }
  };

  const signUpParentWithGoogle = async (requiredEmail, invitationData = {}) => {
    try {
      setError(null);
      setSignupInProgress(true);

      const result = await signInWithPopup(auth, googleProvider);

      // Validate the Google email matches the invitation email (if provided)
      if (requiredEmail && result.user.email?.toLowerCase() !== requiredEmail.toLowerCase()) {
        // Sign out the mismatched Google account
        await firebaseSignOut(auth);
        setSignupInProgress(false);
        throw new Error('google-email-mismatch');
      }

      // Check if user already exists in Firestore
      const existingDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (existingDoc.exists()) {
        // User already has an account — merge linkedPlayerIds if needed
        const existingData = existingDoc.data();
        const existingPlayerIds = existingData.linkedPlayerIds || [];
        const newPlayerIds = invitationData.playerIds || [];
        const mergedPlayerIds = [...new Set([...existingPlayerIds, ...newPlayerIds])];

        if (newPlayerIds.length > 0 && mergedPlayerIds.length !== existingPlayerIds.length) {
          await setDoc(doc(db, 'users', result.user.uid), {
            linkedPlayerIds: mergedPlayerIds,
            invitationCode: invitationData.invitationCode || existingData.invitationCode || ''
          }, { merge: true });
          const updated = { ...existingData, linkedPlayerIds: mergedPlayerIds };
          setUserProfile(updated);
        } else {
          setUserProfile(existingData);
        }

        setSignupInProgress(false);
        return result.user;
      }

      // Create new parent profile
      const profile = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName || '',
        role: 'parent',
        linkedPlayerIds: invitationData.playerIds || [],
        invitationCode: invitationData.invitationCode || '',
        createdAt: new Date().toISOString(),
        photoURL: result.user.photoURL || null
      };

      await setDoc(doc(db, 'users', result.user.uid), profile);
      setUserProfile(profile);
      setSignupInProgress(false);

      return result.user;
    } catch (err) {
      setSignupInProgress(false);
      setError(err.message);
      throw err;
    }
  };

  const resetPassword = async (email) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await firebaseSignOut(auth);
      setUserProfile(null);
    } catch (err) {
      setError(err.message);
      throw err;
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
      // Strip sensitive fields that users should not self-modify
      // Role changes must go through admin workflows
      const { role, uid, createdAt, ...safeUpdates } = updates;
      await setDoc(doc(db, 'users', currentUser.uid), safeUpdates, { merge: true });
      setUserProfile(prev => ({ ...prev, ...safeUpdates }));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Valid roles in the system
  // Leadership: admin, president, vice_president, coach_coordinator
  // Coordinators: girls_coordinator, boys_coordinator
  // Coaching: youth_head_coach, coach, youth_coach
  // Other: tryout_assessor, team_manager, player, parent
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
    // Role helper methods
    isAdmin: role === 'admin',
    isCoach: role === 'coach',
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
    // Composite role checks
    isLeadership: ADMIN_ROLES.includes(role),
    isStaff: STAFF_ROLES.includes(role),
    isCoachOrAdmin: STAFF_ROLES.includes(role),
    canAssessTryouts: TRYOUT_ASSESSOR_ROLES.includes(role),
    canViewTryoutResults: TRYOUT_RESULTS_ROLES.includes(role),
    canAssignAssessors: ASSESSOR_ASSIGNER_ROLES.includes(role),
    hasRole: (checkRole) => role === checkRole
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
