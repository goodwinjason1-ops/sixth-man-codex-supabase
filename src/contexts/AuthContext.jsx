import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
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
  // Ref to prevent re-entrant processing in onAuthStateChanged
  const processingRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCurrentUser(null);
        setUserProfile(null);
        setLoading(false);
        return;
      }

      // Guard: don't re-process if already handling this auth event
      if (processingRef.current) return;

      // If a signup flow is in progress, it will create its own profile.
      // Don't race it by creating a default profile here.
      if (signupInProgress) {
        setCurrentUser(user);
        return;
      }

      processingRef.current = true;
      setCurrentUser(user);

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
            role: 'pending', // Pending admin approval
            needsRegistration: true, // Show registration form to collect extra info
            createdAt: new Date().toISOString(),
            photoURL: user.photoURL || null
          };
          try {
            await setDoc(doc(db, 'users', user.uid), initialProfile);
          } catch (createErr) {
            console.error('Failed to create user document in Firestore:', createErr.code || createErr.message || createErr);
            setError('Failed to create your account profile. Please try again or contact an administrator.');
            setLoading(false);
            return;
          }
          setUserProfile(initialProfile);

          // Create in-app notification for admins about new pending user
          try {
            await addDoc(collection(db, 'notifications'), {
              title: 'New User Pending Approval',
              message: `${user.displayName || user.email || 'A new user'} signed up and is awaiting approval.`,
              type: 'pending_user',
              targetRoles: ['admin', 'president', 'vice_president'],
              status: 'sent',
              readBy: [],
              deletedBy: [],
              metadata: { pendingUid: user.uid, email: user.email },
              createdAt: serverTimestamp(),
              date: new Date().toISOString()
            });
          } catch (notifErr) {
            console.error('Failed to create admin notification for new user:', notifErr.code || notifErr.message);
          }
        }
      } catch (err) {
        console.error('Error fetching user profile:', err.code || 'unknown');
        setError('Failed to load user profile. Please try again.');
      } finally {
        processingRef.current = false;
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
      // Don't show error if user just closed the popup
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        return null;
      }
      console.error('Google Sign-In Error:', err.code, err.message);
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

  const signUpWithEmail = async (email, password, displayName, additionalData = {}) => {
    try {
      setError(null);
      setSignupInProgress(true);

      const result = await createUserWithEmailAndPassword(auth, email, password);

      // All new signups go to pending for admin approval
      const profile = {
        uid: result.user.uid,
        email: email.trim().toLowerCase(),
        displayName: (displayName || '').trim(),
        role: 'pending',
        requestedRole: additionalData.requestedRole || additionalData.role || '',
        requestedTeam: additionalData.requestedTeam || '',
        phone: additionalData.phone || '',
        registrationNote: additionalData.registrationNote || '',
        needsRegistration: false, // Already collected during signup
        createdAt: new Date().toISOString(),
        photoURL: null
      };

      await setDoc(doc(db, 'users', result.user.uid), profile);
      setUserProfile(profile);

      // Create in-app notification for admins about new pending user
      try {
        await addDoc(collection(db, 'notifications'), {
          title: 'New User Pending Approval',
          message: `${(displayName || '').trim() || email} signed up and is awaiting approval.`,
          type: 'pending_user',
          targetRoles: ['admin', 'president', 'vice_president'],
          status: 'sent',
          readBy: [],
          deletedBy: [],
          metadata: { pendingUid: result.user.uid, email: email.trim().toLowerCase(), requestedRole: additionalData.requestedRole || '' },
          createdAt: serverTimestamp(),
          date: new Date().toISOString()
        });
      } catch (_) {
        // Never let notification creation block the auth flow
      }

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
