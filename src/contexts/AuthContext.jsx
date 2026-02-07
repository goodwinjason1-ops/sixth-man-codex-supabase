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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Fetch user profile from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          } else {
            // Create initial profile for new users
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
  }, []);

  const signInWithGoogle = async () => {
    try {
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
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
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Sanitize the requested role — only allow safe self-assignable roles.
      // Admin, team_manager, committee_member must be set by an admin.
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

      return result.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const signUpParentWithInvitation = async (email, password, displayName) => {
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);

      const profile = {
        uid: result.user.uid,
        email: email.trim().toLowerCase(),
        displayName: (displayName || '').trim(),
        role: 'parent',
        linkedPlayerIds: [],
        invitationCode: '',
        createdAt: new Date().toISOString(),
        photoURL: null
      };

      await setDoc(doc(db, 'users', result.user.uid), profile);
      setUserProfile(profile);

      return result.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const signUpParentWithGoogle = async (requiredEmail) => {
    try {
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);

      // Validate the Google email matches the invitation email (if provided)
      if (requiredEmail && result.user.email?.toLowerCase() !== requiredEmail.toLowerCase()) {
        // Sign out the mismatched Google account
        await firebaseSignOut(auth);
        throw new Error('google-email-mismatch');
      }

      // Check if user already exists in Firestore
      const existingDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (existingDoc.exists()) {
        // User already has an account — just return the user
        setUserProfile(existingDoc.data());
        return result.user;
      }

      // Create new parent profile
      const profile = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName || '',
        role: 'parent',
        linkedPlayerIds: [],
        invitationCode: '',
        createdAt: new Date().toISOString(),
        photoURL: result.user.photoURL || null
      };

      await setDoc(doc(db, 'users', result.user.uid), profile);
      setUserProfile(profile);

      return result.user;
    } catch (err) {
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
  // Primary: admin, coach, player, parent
  // Extended: team_manager, committee_member (used in tryout system)
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
    // Role helper methods
    isAdmin: role === 'admin',
    isCoach: role === 'coach',
    isPlayer: role === 'player',
    isParent: role === 'parent',
    isTeamManager: role === 'team_manager',
    isCommitteeMember: role === 'committee_member',
    // Composite role checks
    isStaff: role === 'coach' || role === 'admin',           // Can access coach-level features
    isCoachOrAdmin: role === 'coach' || role === 'admin',     // Alias for route guards
    canAssessTryouts: role === 'coach' || role === 'admin' || role === 'team_manager' || role === 'committee_member',
    hasRole: (checkRole) => role === checkRole
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
