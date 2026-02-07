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
          console.error('Error fetching user profile:', err);
          setError(err.message);
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

  const signUpWithEmail = async (email, password, displayName, additionalData = {}) => {
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user profile in Firestore
      const profile = {
        uid: result.user.uid,
        email,
        displayName,
        role: 'player',
        createdAt: new Date().toISOString(),
        ...additionalData
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
      await setDoc(doc(db, 'users', currentUser.uid), updates, { merge: true });
      setUserProfile(prev => ({ ...prev, ...updates }));
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
