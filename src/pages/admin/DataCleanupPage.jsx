import React, { useState, useMemo } from 'react';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  deleteDoc,
  setDoc,
  updateDoc,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import PageShell from '../../components/PageShell';
import {
  Search,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Users,
  UserX,
  FileWarning,
  ShieldAlert,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Eye,
  X
} from 'lucide-react';

const REQUIRED_USER_FIELDS = ['email', 'role', 'uid'];

const DataCleanupPage = () => {
  const { currentUser } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [cleanupLog, setCleanupLog] = useState([]);
  const [confirmAction, setConfirmAction] = useState(null); // { type, data, label }
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [detailDoc, setDetailDoc] = useState(null);
  const [dryRun, setDryRun] = useState(true);
  const [deleteProgress, setDeleteProgress] = useState(null); // { current, total, categoryId }
  const [quickCleanup, setQuickCleanup] = useState({ running: false, done: false, results: null });
  const [seedingTemplates, setSeedingTemplates] = useState({ running: false, done: false, results: null });
  const [forceDelete, setForceDelete] = useState({ collection: 'notifications', docId: '', running: false, result: null });

  // One-time targeted cleanup for known orphaned data
  const runQuickCleanup = async () => {
    setQuickCleanup({ running: true, done: false, results: null });
    let usersDeleted = 0, mvpDeleted = 0, notifsDeleted = 0;
    const errors = [];

    // 1. Delete known orphaned user accounts
    const orphanIds = [
      'TnMt2cRw1fZEye9i2MWhfTtlQf53',
      '9e2Kg5TzjSQm6a8M7s6D2Wtmw7g1',
      'D3Mzi8UbwRXvIPLZ2K1zDYqFmD43',
    ];
    for (const uid of orphanIds) {
      try {
        await deleteDoc(doc(db, 'users', uid));
        usersDeleted++;
      } catch (e) {
        if (e.code !== 'not-found') errors.push(`user ${uid}: ${e.message}`);
      }
    }

    // 2. Delete all mvp_votes
    try {
      const mvpSnap = await getDocs(collection(db, 'mvp_votes'));
      if (mvpSnap.size > 0) {
        const batch = writeBatch(db);
        mvpSnap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
        mvpDeleted = mvpSnap.size;
      }
    } catch (e) {
      errors.push(`mvp_votes: ${e.message}`);
    }

    // 3. Delete phantom notifications
    try {
      const notifSnap = await getDocs(collection(db, 'notifications'));
      for (const ndoc of notifSnap.docs) {
        const data = ndoc.data();
        const recipientId = data.recipientId || data.targetId || '';
        const title = data.title || data.subject || data.message || '';
        if (recipientId === 'p3' || recipientId === 'p4' || title.includes('undefined')) {
          try {
            await deleteDoc(ndoc.ref);
            notifsDeleted++;
          } catch (e) {
            errors.push(`notification ${ndoc.id}: ${e.message}`);
          }
        }
      }
    } catch (e) {
      errors.push(`notifications scan: ${e.message}`);
    }

    setQuickCleanup({
      running: false,
      done: true,
      results: { usersDeleted, mvpDeleted, notifsDeleted, errors }
    });
  };

  // Seed 6 training plan templates into Firestore
  const seedTemplates = async () => {
    setSeedingTemplates({ running: true, done: false, results: null });
    let created = 0;
    const errors = [];

    const templates = [
      { id: 'template_ball_handling', name: 'Ball Handling Fundamentals', focusAreas: ['ball-handling'], duration: '60 minutes', description: 'Foundation session focusing on dribbling control, both hands, change of direction, and ball mastery.' },
      { id: 'template_defense', name: 'Defensive Fundamentals', focusAreas: ['defense'], duration: '60 minutes', description: 'Defensive stance, footwork, positioning, help defense, and closeouts.' },
      { id: 'template_shooting', name: 'Shooting & Scoring', focusAreas: ['shooting'], duration: '60 minutes', description: 'Shooting form, layup technique, free throws, mid-range, and shot selection.' },
      { id: 'template_passing', name: 'Passing & Court Vision', focusAreas: ['passing-receiving'], duration: '60 minutes', description: 'Chest pass, bounce pass, overhead pass, outlet passing, and catching on the move.' },
      { id: 'template_team_play', name: 'Team Play & Offensive Sets', focusAreas: ['team-play'], duration: '60 minutes', description: 'Spacing, cutting, screening, pick and roll basics, fast break concepts.' },
      { id: 'template_game_prep', name: 'Game Day Preparation', focusAreas: ['team-play', 'shooting', 'defense'], duration: '45 minutes', description: 'Light warm-up, shooting rhythm, defensive reminders, set play walkthrough.' }
    ];

    for (const t of templates) {
      const { id, ...data } = t;
      try {
        await setDoc(doc(db, 'training_plans', id), {
          ...data,
          isTemplate: true,
          isShared: false,
          status: 'approved',
          createdBy: 'system',
          ageGroups: ['u8', 'u10', 'u12', 'u14', 'u16', 'u19'],
          sessions: [],
          drills: [],
          createdAt: new Date(),
          updatedAt: new Date()
        });
        created++;
      } catch (e) {
        errors.push(`${t.name}: ${e.message}`);
      }
    }

    setSeedingTemplates({
      running: false,
      done: true,
      results: { created, errors }
    });
  };

  // Force delete a specific document by collection + ID — with updateDoc workaround
  const handleForceDelete = async () => {
    const col = forceDelete.collection.trim();
    const id = forceDelete.docId.trim();
    if (!col || !id) return;
    setForceDelete(prev => ({ ...prev, running: true, result: null }));
    try {
      const docRef = doc(db, col, id);

      // Step 1: Verify the doc exists
      const before = await getDoc(docRef);
      if (!before.exists()) {
        setForceDelete(prev => ({ ...prev, running: false, result: { success: false, message: `Document ${col}/${id} does not exist — nothing to delete` } }));
        setCleanupLog(prev => [...prev, { type: 'error', message: `Force delete: ${col}/${id} does not exist` }]);
        return;
      }

      // Step 2: Try updateDoc first — this WILL throw permission-denied if rules block it
      // (deleteDoc silently swallows permission errors in the Firebase JS SDK)
      try {
        await updateDoc(docRef, { _markedForDeletion: true });
      } catch (updateErr) {
        if (updateErr.code === 'permission-denied') {
          setForceDelete(prev => ({ ...prev, running: false, result: { success: false, message: `PERMISSION DENIED — your Firestore role does not allow writes to "${col}". Check that your user document has role: "admin" (lowercase). Firestore rules require isAdmin() for delete.` } }));
          setCleanupLog(prev => [...prev, { type: 'error', message: `Force delete BLOCKED — permission denied on updateDoc for ${col}/${id}. Your user role may not match isAdmin() rules.` }]);
          return;
        }
        throw updateErr; // re-throw non-permission errors
      }

      // Step 3: updateDoc succeeded — we have write access, now delete
      await deleteDoc(docRef);

      // Step 4: Verify it's actually gone
      const after = await getDoc(docRef);
      if (after.exists()) {
        setForceDelete(prev => ({ ...prev, running: false, result: { success: false, message: `DELETE FAILED — document still exists after deleteDoc. Update succeeded but delete was denied. Check Firestore rules: update and delete may have different permissions.` } }));
        setCleanupLog(prev => [...prev, { type: 'error', message: `Force delete PARTIAL — update worked but delete failed for ${col}/${id}. Different Firestore rules for update vs delete.` }]);
      } else {
        setForceDelete(prev => ({ ...prev, running: false, result: { success: true, message: `VERIFIED DELETED: ${col}/${id}` } }));
        setCleanupLog(prev => [...prev, { type: 'success', message: `Force deleted (verified): ${col}/${id}` }]);
      }
    } catch (err) {
      console.error('Force delete failed:', err);
      const msg = err.code === 'permission-denied'
        ? `PERMISSION DENIED — your Firestore role does not have access for "${col}". Check firestore.rules and ensure your user doc has role: "admin" (lowercase).`
        : `Failed: ${err.message}`;
      setForceDelete(prev => ({ ...prev, running: false, result: { success: false, message: msg } }));
      setCleanupLog(prev => [...prev, { type: 'error', message: `Force delete failed: ${col}/${id}: ${msg}` }]);
    }
  };

  // Run the full scan
  const scanForIssues = async () => {
    setScanning(true);
    setScanResults(null);
    setCleanupLog([]);

    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const allUsers = usersSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      const issues = {
        duplicates: [],       // groups of docs with same email
        missingUid: [],       // docs where uid is missing or doesn't match doc ID
        missingFields: [],    // docs missing required fields
        parentsNoChildren: [],// parent role but no linkedPlayerIds
        uidMismatch: [],      // uid field doesn't match document ID
        orphanedDocs: [],     // docs with no email and no uid match
      };

      // 1. Group by email to find duplicates
      const byEmail = {};
      allUsers.forEach(user => {
        const email = (user.email || '').trim().toLowerCase();
        if (!email) {
          issues.orphanedDocs.push({
            ...user,
            problem: 'No email address'
          });
          return;
        }
        if (!byEmail[email]) byEmail[email] = [];
        byEmail[email].push(user);
      });

      Object.entries(byEmail).forEach(([email, docs]) => {
        if (docs.length > 1) {
          // Score each doc — higher = more complete / more likely the "real" one
          const scored = docs.map(d => {
            let score = 0;
            if (d.uid) score += 10;
            if (d.uid === d.id) score += 5; // uid matches doc ID
            if (d.linkedPlayerIds?.length > 0) score += 5;
            if (d.role && d.role !== 'player') score += 3; // specific role assigned
            if (d.displayName) score += 2;
            if (d.createdAt) score += 1;
            score += Object.keys(d).length; // more fields = more data
            return { ...d, _score: score };
          });
          scored.sort((a, b) => b._score - a._score);
          issues.duplicates.push({
            email,
            docs: scored,
            bestId: scored[0].id,
          });
        }
      });

      // 2. Check each user for issues
      allUsers.forEach(user => {
        // Missing UID
        if (!user.uid) {
          issues.missingUid.push({
            ...user,
            problem: 'Missing uid field'
          });
        } else if (user.uid !== user.id) {
          issues.uidMismatch.push({
            ...user,
            problem: `uid field "${user.uid}" doesn't match doc ID "${user.id}"`
          });
        }

        // Missing required fields
        const missing = REQUIRED_USER_FIELDS.filter(f => !user[f]);
        if (missing.length > 0) {
          issues.missingFields.push({
            ...user,
            problem: `Missing fields: ${missing.join(', ')}`
          });
        }

        // Parent without children
        if (user.role === 'parent' && (!user.linkedPlayerIds || user.linkedPlayerIds.length === 0)) {
          issues.parentsNoChildren.push({
            ...user,
            problem: 'Parent role but no linkedPlayerIds'
          });
        }
      });

      // --- Cross-collection orphan scan ---
      const validUserIds = new Set(allUsers.map(u => u.id));
      const playersSnapshot = await getDocs(collection(db, 'players'));
      const validPlayerIds = new Set(playersSnapshot.docs.map(d => d.id));

      // Evaluations referencing non-existent players
      const evalsSnapshot = await getDocs(collection(db, 'evaluations'));
      issues.orphanedEvals = [];
      evalsSnapshot.docs.forEach(d => {
        const data = d.data();
        if (data.playerId && !validPlayerIds.has(data.playerId)) {
          issues.orphanedEvals.push({
            id: d.id, _collection: 'evaluations', ...data,
            problem: `References non-existent player: ${data.playerId}`
          });
        }
      });

      // Notifications with phantom/invalid targetAudience userIds
      const notifsSnapshot = await getDocs(collection(db, 'notifications'));
      issues.phantomNotifs = [];
      notifsSnapshot.docs.forEach(d => {
        const data = d.data();
        const ta = data.targetAudience;
        if (ta && Array.isArray(ta.userIds) && ta.userIds.length > 0) {
          const valid = ta.userIds.filter(id => validUserIds.has(id));
          if (valid.length === 0) {
            issues.phantomNotifs.push({
              id: d.id, _collection: 'notifications', ...data,
              problem: `All ${ta.userIds.length} target user(s) don't exist: ${ta.userIds.join(', ')}`
            });
          }
        }
        // Also flag notifications with no targetAudience but a recipientId that doesn't exist
        if (!ta && data.recipientId && !validUserIds.has(data.recipientId)) {
          issues.phantomNotifs.push({
            id: d.id, _collection: 'notifications', ...data,
            problem: `recipientId "${data.recipientId}" doesn't exist in users`
          });
        }
      });

      // Scoring assignments referencing non-existent users
      const scoringSnapshot = await getDocs(collection(db, 'scoring_assignments'));
      issues.orphanedScoring = [];
      scoringSnapshot.docs.forEach(d => {
        const data = d.data();
        if (data.assignedTo && !validUserIds.has(data.assignedTo)) {
          issues.orphanedScoring.push({
            id: d.id, _collection: 'scoring_assignments', ...data,
            problem: `Assigned to non-existent user: ${data.assignedTo}`
          });
        }
      });

      // Remaining mvp_votes (should be empty after cleanup)
      const mvpSnapshot = await getDocs(collection(db, 'mvp_votes'));
      issues.orphanedMvp = mvpSnapshot.docs.map(d => ({
        id: d.id, _collection: 'mvp_votes', ...d.data(),
        problem: 'Orphaned MVP vote'
      }));

      setScanResults({
        totalUsers: allUsers.length,
        totalPlayers: validPlayerIds.size,
        issues,
        scannedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Scan failed:', err);
      setCleanupLog([{ type: 'error', message: `Scan failed: ${err.message}` }]);
    } finally {
      setScanning(false);
    }
  };

  // Count total issues
  const totalIssues = useMemo(() => {
    if (!scanResults) return 0;
    const { issues } = scanResults;
    return (
      issues.duplicates.length +
      issues.missingUid.length +
      issues.missingFields.length +
      issues.parentsNoChildren.length +
      issues.uidMismatch.length +
      issues.orphanedDocs.length +
      (issues.orphanedEvals?.length || 0) +
      (issues.phantomNotifs?.length || 0) +
      (issues.orphanedScoring?.length || 0) +
      (issues.orphanedMvp?.length || 0)
    );
  }, [scanResults]);

  // Delete a single document from any collection
  const deleteDocument = async (docId, collectionName = 'users') => {
    console.log('deleteDocument called:', collectionName, docId, 'dryRun:', dryRun);
    if (dryRun) {
      setCleanupLog(prev => [...prev, { type: 'dry-run', message: `[DRY RUN] Would delete ${collectionName}/${docId} — turn off Safe Mode to actually delete` }]);
      return true;
    }
    try {
      await deleteDoc(doc(db, collectionName, docId));
      setCleanupLog(prev => [...prev, { type: 'success', message: `Deleted ${collectionName}/${docId}` }]);
      return true;
    } catch (err) {
      console.error('deleteDocument FAILED:', collectionName, docId, err);
      setCleanupLog(prev => [...prev, { type: 'error', message: `Failed to delete ${collectionName}/${docId}: ${err.message}` }]);
      return false;
    }
  };

  // Fix a document's missing fields
  const fixDocument = async (docId, updates) => {
    if (dryRun) {
      setCleanupLog(prev => [...prev, {
        type: 'dry-run',
        message: `Would update doc ${docId}: ${JSON.stringify(updates)}`
      }]);
      return true;
    }
    try {
      await updateDoc(doc(db, 'users', docId), updates);
      setCleanupLog(prev => [...prev, {
        type: 'success',
        message: `Updated doc ${docId}: ${Object.keys(updates).join(', ')}`
      }]);
      return true;
    } catch (err) {
      setCleanupLog(prev => [...prev, {
        type: 'error',
        message: `Failed to update ${docId}: ${err.message}`
      }]);
      return false;
    }
  };

  // Clean duplicates — keep best, delete rest
  const cleanDuplicates = async () => {
    if (!scanResults?.issues.duplicates.length) return;
    setCleaning(true);
    let deleted = 0;

    for (const group of scanResults.issues.duplicates) {
      for (const d of group.docs) {
        if (d.id !== group.bestId) {
          const ok = await deleteDocument(d.id);
          if (ok) deleted++;
        }
      }
    }

    setCleanupLog(prev => [...prev, {
      type: 'info',
      message: `${dryRun ? '[DRY RUN] ' : ''}Duplicate cleanup done: ${deleted} documents ${dryRun ? 'would be' : ''} removed`
    }]);
    setCleaning(false);
  };

  // Fix missing UIDs
  const fixMissingUids = async () => {
    if (!scanResults?.issues.missingUid.length) return;
    setCleaning(true);
    let fixed = 0;

    for (const d of scanResults.issues.missingUid) {
      const ok = await fixDocument(d.id, { uid: d.id });
      if (ok) fixed++;
    }

    setCleanupLog(prev => [...prev, {
      type: 'info',
      message: `${dryRun ? '[DRY RUN] ' : ''}UID fix done: ${fixed} documents ${dryRun ? 'would be' : ''} updated`
    }]);
    setCleaning(false);
  };

  // Fix UID mismatches
  const fixUidMismatches = async () => {
    if (!scanResults?.issues.uidMismatch.length) return;
    setCleaning(true);
    let fixed = 0;

    for (const d of scanResults.issues.uidMismatch) {
      const ok = await fixDocument(d.id, { uid: d.id });
      if (ok) fixed++;
    }

    setCleanupLog(prev => [...prev, {
      type: 'info',
      message: `${dryRun ? '[DRY RUN] ' : ''}UID mismatch fix done: ${fixed} documents ${dryRun ? 'would be' : ''} updated`
    }]);
    setCleaning(false);
  };

  // Fix parents missing linkedPlayerIds
  const fixParentsNoChildren = async () => {
    if (!scanResults?.issues.parentsNoChildren.length) return;
    setCleaning(true);
    let fixed = 0;

    for (const d of scanResults.issues.parentsNoChildren) {
      if (!d.linkedPlayerIds) {
        const ok = await fixDocument(d.id, { linkedPlayerIds: [] });
        if (ok) fixed++;
      }
    }

    setCleanupLog(prev => [...prev, {
      type: 'info',
      message: `${dryRun ? '[DRY RUN] ' : ''}Parent fix done: ${fixed} documents ${dryRun ? 'would be' : ''} updated with empty linkedPlayerIds`
    }]);
    setCleaning(false);
  };

  // Delete orphaned docs
  const cleanOrphaned = async () => {
    if (!scanResults?.issues.orphanedDocs.length) return;
    setCleaning(true);
    let deleted = 0;

    for (const d of scanResults.issues.orphanedDocs) {
      const ok = await deleteDocument(d.id);
      if (ok) deleted++;
    }

    setCleanupLog(prev => [...prev, {
      type: 'info',
      message: `${dryRun ? '[DRY RUN] ' : ''}Orphan cleanup done: ${deleted} documents ${dryRun ? 'would be' : ''} removed`
    }]);
    setCleaning(false);
  };

  // Delete all documents in a category
  const deleteAllInCategory = async (cat) => {
    setCleaning(true);
    let deleted = 0;
    let failed = 0;

    // Collect all doc IDs to delete
    const docIds = [];
    if (cat.id === 'duplicates') {
      // For duplicates, delete all except the best in each group
      for (const group of scanResults.issues.duplicates) {
        for (const d of group.docs) {
          if (d.id !== group.bestId) docIds.push(d.id);
        }
      }
    } else {
      // For other categories, get the doc IDs from the issue arrays
      const issueKey = cat.id;
      const items = scanResults.issues[issueKey] || [];
      for (const d of items) {
        docIds.push(d.id);
      }
    }

    const total = docIds.length;
    setDeleteProgress({ current: 0, total, categoryId: cat.id });

    for (let i = 0; i < docIds.length; i++) {
      setDeleteProgress({ current: i + 1, total, categoryId: cat.id });
      const ok = await deleteDocument(docIds[i], cat._collection || 'users');
      if (ok) deleted++;
      else failed++;
    }

    setDeleteProgress(null);
    setCleanupLog(prev => [...prev, {
      type: failed > 0 ? 'error' : 'success',
      message: `${dryRun ? '[DRY RUN] ' : ''}Delete all "${cat.label}": ${deleted} deleted${failed > 0 ? `, ${failed} failed` : ''}. ${!dryRun ? 'Re-scan to verify.' : ''}`
    }]);
    setCleaning(false);

    // Auto re-scan after live deletion
    if (!dryRun && deleted > 0) {
      await scanForIssues();
    }
  };

  // Clean ALL issues
  const cleanAll = async () => {
    setCleaning(true);
    setCleanupLog([{ type: 'info', message: `${dryRun ? '[DRY RUN] ' : ''}Starting full cleanup...` }]);

    await cleanDuplicates();
    await fixMissingUids();
    await fixUidMismatches();
    await fixParentsNoChildren();
    await cleanOrphaned();

    setCleanupLog(prev => [...prev, {
      type: 'success',
      message: `${dryRun ? '[DRY RUN] ' : ''}Full cleanup complete. ${dryRun ? 'Switch off dry run mode and run again to apply changes.' : 'Re-scan to verify.'}`
    }]);
    setCleaning(false);
  };

  // Export scan results as JSON backup
  const exportBackup = () => {
    if (!scanResults) return;
    const blob = new Blob([JSON.stringify(scanResults, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `firestore-users-scan-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Count deletable docs in a category
  const getDeletableCount = (catId) => {
    if (!scanResults) return 0;
    if (catId === 'duplicates') {
      let count = 0;
      for (const group of scanResults.issues.duplicates) {
        count += group.docs.length - 1; // all except best
      }
      return count;
    }
    return (scanResults.issues[catId] || []).length;
  };

  const categories = scanResults ? [
    {
      id: 'duplicates',
      label: 'Duplicate Users',
      icon: Users,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      count: scanResults.issues.duplicates.length,
      description: 'Multiple documents with the same email address',
      action: cleanDuplicates,
      actionLabel: 'Remove Duplicates',
      deleteLabel: `Delete All Duplicates (${getDeletableCount('duplicates')})`,
      items: scanResults.issues.duplicates.map(g => ({
        id: g.email,
        label: g.email,
        sublabel: `${g.docs.length} docs — keeping ${g.bestId}`,
        details: g.docs,
        isDuplicateGroup: true,
      }))
    },
    {
      id: 'missingUid',
      label: 'Missing UID',
      icon: UserX,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      count: scanResults.issues.missingUid.length,
      description: 'Documents missing the uid field',
      action: fixMissingUids,
      actionLabel: 'Fix UIDs',
      deleteLabel: `Delete All (${getDeletableCount('missingUid')})`,
      items: scanResults.issues.missingUid.map(d => ({
        id: d.id,
        label: d.email || d.id,
        sublabel: d.problem,
        details: d,
      }))
    },
    {
      id: 'uidMismatch',
      label: 'UID Mismatch',
      icon: ShieldAlert,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      count: scanResults.issues.uidMismatch.length,
      description: 'uid field does not match the document ID',
      action: fixUidMismatches,
      actionLabel: 'Fix Mismatches',
      deleteLabel: `Delete All (${getDeletableCount('uidMismatch')})`,
      items: scanResults.issues.uidMismatch.map(d => ({
        id: d.id,
        label: d.email || d.id,
        sublabel: d.problem,
        details: d,
      }))
    },
    {
      id: 'missingFields',
      label: 'Missing Required Fields',
      icon: FileWarning,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      count: scanResults.issues.missingFields.length,
      description: 'Documents missing email, role, or uid',
      action: null,
      actionLabel: null,
      deleteLabel: `Delete All (${getDeletableCount('missingFields')})`,
      items: scanResults.issues.missingFields.map(d => ({
        id: d.id,
        label: d.email || d.id,
        sublabel: d.problem,
        details: d,
      }))
    },
    {
      id: 'parentsNoChildren',
      label: 'Parents Without Children',
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      count: scanResults.issues.parentsNoChildren.length,
      description: 'Parent accounts with no linked players',
      action: fixParentsNoChildren,
      actionLabel: 'Add Empty Array',
      deleteLabel: `Delete All Orphaned Parents (${getDeletableCount('parentsNoChildren')})`,
      items: scanResults.issues.parentsNoChildren.map(d => ({
        id: d.id,
        label: d.email || d.displayName || d.id,
        sublabel: d.problem,
        details: d,
      }))
    },
    {
      id: 'orphanedDocs',
      label: 'Orphaned Documents',
      icon: UserX,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      count: scanResults.issues.orphanedDocs.length,
      description: 'Documents with no email address',
      action: cleanOrphaned,
      actionLabel: 'Delete Orphans',
      deleteLabel: `Delete All Orphaned Docs (${getDeletableCount('orphanedDocs')})`,
      items: scanResults.issues.orphanedDocs.map(d => ({
        id: d.id,
        label: d.displayName || d.id,
        sublabel: d.problem,
        details: d,
      }))
    },
    // --- Cross-Collection Orphans ---
    {
      id: 'orphanedEvals',
      label: 'Orphaned Evaluations',
      icon: FileWarning,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      count: (scanResults.issues.orphanedEvals || []).length,
      description: 'Evaluations referencing non-existent players',
      action: null,
      actionLabel: null,
      _collection: 'evaluations',
      deleteLabel: `Delete All (${(scanResults.issues.orphanedEvals || []).length})`,
      items: (scanResults.issues.orphanedEvals || []).map(d => ({
        id: d.id,
        _collection: 'evaluations',
        label: d.playerName || d.playerId || d.id,
        sublabel: d.problem,
        details: d,
      }))
    },
    {
      id: 'phantomNotifs',
      label: 'Phantom Notifications',
      icon: AlertTriangle,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10',
      count: (scanResults.issues.phantomNotifs || []).length,
      description: 'Notifications targeting only non-existent users',
      action: null,
      actionLabel: null,
      _collection: 'notifications',
      deleteLabel: `Delete All (${(scanResults.issues.phantomNotifs || []).length})`,
      items: (scanResults.issues.phantomNotifs || []).map(d => ({
        id: d.id,
        _collection: 'notifications',
        label: d.title || d.message || d.id,
        sublabel: d.problem,
        details: d,
      }))
    },
    {
      id: 'orphanedScoring',
      label: 'Orphaned Scoring Assignments',
      icon: UserX,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      count: (scanResults.issues.orphanedScoring || []).length,
      description: 'Scoring assignments referencing non-existent users',
      action: null,
      actionLabel: null,
      _collection: 'scoring_assignments',
      deleteLabel: `Delete All (${(scanResults.issues.orphanedScoring || []).length})`,
      items: (scanResults.issues.orphanedScoring || []).map(d => ({
        id: d.id,
        _collection: 'scoring_assignments',
        label: d.assignedName || d.assignedEmail || d.id,
        sublabel: d.problem,
        details: d,
      }))
    },
    {
      id: 'orphanedMvp',
      label: 'Orphaned MVP Votes',
      icon: AlertTriangle,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      count: (scanResults.issues.orphanedMvp || []).length,
      description: 'MVP vote documents (collection should be empty)',
      action: null,
      actionLabel: null,
      _collection: 'mvp_votes',
      deleteLabel: `Delete All (${(scanResults.issues.orphanedMvp || []).length})`,
      items: (scanResults.issues.orphanedMvp || []).map(d => ({
        id: d.id,
        _collection: 'mvp_votes',
        label: d.voterId || d.playerId || d.id,
        sublabel: d.problem,
        details: d,
      }))
    },
  ] : [];

  return (
    <PageShell
      title="Data Cleanup"
      subtitle="Scan and fix user document issues"
      backTo="/welcome"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'Admin', url: '/admin' },
        { label: 'Data Cleanup' }
      ]}
      maxWidth="6xl"
      headerActions={
        <div className="flex items-center gap-2">
          {scanResults && (
            <button
              onClick={exportBackup}
              className="flex items-center gap-2 px-3 py-2 bg-[#F5F9F5] border border-[#D4E4D4] text-gray-800 rounded-lg text-sm hover:border-[#00A651] transition-colors"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}
          <button
            onClick={scanForIssues}
            disabled={scanning}
            className="flex items-center gap-2 px-4 py-2 bg-[#005028] text-white rounded-lg font-semibold text-sm hover:bg-[#00A651] disabled:opacity-50 transition-colors"
          >
            {scanning ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Search size={16} />
            )}
            {scanning ? 'Scanning...' : 'Scan for Issues'}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* One-Time Quick Cleanup */}
        <div className="bg-white border border-[#D4E4D4] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#D4E4D4]/50">
            <h3 className="text-gray-800 font-bold text-sm flex items-center gap-2">
              <Trash2 size={16} className="text-rose-500" />
              Quick Cleanup &mdash; Known Orphaned Data
            </h3>
            <p className="text-gray-400 text-xs mt-1">
              Delete known test accounts, orphaned MVP votes, and phantom notifications in one click.
            </p>
          </div>
          <div className="p-4">
            {!quickCleanup.done ? (
              <div className="space-y-3">
                <div className="text-xs text-gray-500 space-y-1">
                  <p>This will delete:</p>
                  <ul className="list-disc list-inside ml-2 space-y-0.5">
                    <li>3 orphaned user accounts (Frank Lewis, test mc test, Test)</li>
                    <li>All documents in the <code className="bg-gray-100 px-1 rounded text-gray-700">mvp_votes</code> collection</li>
                    <li>Notifications with phantom recipient IDs or &ldquo;undefined&rdquo; in the title</li>
                  </ul>
                </div>
                <button
                  onClick={() => setConfirmAction({
                    type: 'quickCleanup',
                    fn: runQuickCleanup,
                    label: 'Run Quick Cleanup',
                    description: 'This will permanently delete orphaned users, MVP votes, and phantom notifications from Firestore.'
                  })}
                  disabled={quickCleanup.running}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg font-semibold text-sm hover:bg-rose-600 disabled:opacity-50 transition-colors"
                >
                  {quickCleanup.running ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  {quickCleanup.running ? 'Cleaning...' : 'Run Quick Cleanup'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-green-500" />
                  <span className="text-gray-800 font-medium text-sm">Cleanup Complete</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-gray-800">{quickCleanup.results?.usersDeleted}</p>
                    <p className="text-xs text-gray-500">Users Deleted</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-gray-800">{quickCleanup.results?.mvpDeleted}</p>
                    <p className="text-xs text-gray-500">MVP Votes Deleted</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-gray-800">{quickCleanup.results?.notifsDeleted}</p>
                    <p className="text-xs text-gray-500">Notifications Deleted</p>
                  </div>
                </div>
                {quickCleanup.results?.errors?.length > 0 && (
                  <div className="text-xs text-red-500 space-y-1">
                    {quickCleanup.results.errors.map((e, i) => <p key={i}>Error: {e}</p>)}
                  </div>
                )}
                <button
                  onClick={() => setQuickCleanup({ running: false, done: false, results: null })}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Reset
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Seed Training Plan Templates */}
        <div className="bg-white border border-[#D4E4D4] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#D4E4D4]/50">
            <h3 className="text-gray-800 font-bold text-sm flex items-center gap-2">
              <RefreshCw size={16} className="text-[#00A651]" />
              Seed Training Plan Templates
            </h3>
            <p className="text-gray-400 text-xs mt-1">
              Write 6 system training plan templates to Firestore. Safe to run multiple times (uses deterministic IDs).
            </p>
          </div>
          <div className="p-4">
            {!seedingTemplates.done ? (
              <div className="space-y-3">
                <div className="text-xs text-gray-500 space-y-0.5">
                  <p>Templates: Ball Handling, Defense, Shooting, Passing, Team Play, Game Prep</p>
                </div>
                <button
                  onClick={seedTemplates}
                  disabled={seedingTemplates.running}
                  className="flex items-center gap-2 px-4 py-2 bg-[#005028] text-white rounded-lg font-semibold text-sm hover:bg-[#00A651] disabled:opacity-50 transition-colors"
                >
                  {seedingTemplates.running ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Download size={16} />
                  )}
                  {seedingTemplates.running ? 'Seeding...' : 'Seed Templates'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-green-500" />
                  <span className="text-gray-800 font-medium text-sm">
                    {seedingTemplates.results?.created} template{seedingTemplates.results?.created !== 1 ? 's' : ''} written to Firestore
                  </span>
                </div>
                {seedingTemplates.results?.errors?.length > 0 && (
                  <div className="text-xs text-red-500 space-y-1">
                    {seedingTemplates.results.errors.map((e, i) => <p key={i}>Error: {e}</p>)}
                  </div>
                )}
                <button
                  onClick={() => setSeedingTemplates({ running: false, done: false, results: null })}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Reset
                </button>
              </div>
            )}
          </div>
        </div>


        {/* Fix Plan Names — Strip "(Copy)" */}
        <div className="bg-white border border-[#D4E4D4] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#D4E4D4]/50">
            <h3 className="text-gray-800 font-bold text-sm flex items-center gap-2">
              <RefreshCw size={16} className="text-blue-500" />
              Fix Plan Names — Strip "(Copy)"
            </h3>
            <p className="text-gray-400 text-xs mt-1">
              Scan all training plans for names containing "(Copy)" and remove that suffix. This fixes promoted templates that inherited the "(Copy)" text from the original plan name.
            </p>
          </div>
          <div className="p-4">
            <button
              onClick={async () => {
                setCleanupLog(prev => [...prev, { type: 'info', message: 'Scanning training plans for "(Copy)" in names...' }]);
                try {
                  const plansSnap = await getDocs(collection(db, 'training_plans'));
                  let fixed = 0;
                  for (const planDoc of plansSnap.docs) {
                    const data = planDoc.data();
                    const name = data.name || '';
                    if (name.includes('(Copy)')) {
                      const cleanName = name.replace(/\s*\(Copy\)\s*/gi, '').trim();
                      await updateDoc(doc(db, 'training_plans', planDoc.id), { name: cleanName });
                      setCleanupLog(prev => [...prev, { type: 'success', message: `Fixed: "${name}" → "${cleanName}" (${planDoc.id})` }]);
                      fixed++;
                    }
                  }
                  setCleanupLog(prev => [...prev, { type: fixed > 0 ? 'success' : 'info', message: fixed > 0 ? `Done: Fixed ${fixed} plan name${fixed !== 1 ? 's' : ''}.` : 'No plans found with "(Copy)" in the name.' }]);
                } catch (err) {
                  setCleanupLog(prev => [...prev, { type: 'error', message: `Fix plan names failed: ${err.message}` }]);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold text-sm hover:bg-blue-600 transition-colors"
            >
              <RefreshCw size={16} />
              Fix Plan Names
            </button>
          </div>
        </div>
        {/* Force Delete — Direct Document Removal */}
        <div className="bg-white border border-[#D4E4D4] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#D4E4D4]/50">
            <h3 className="text-gray-800 font-bold text-sm flex items-center gap-2">
              <Trash2 size={16} className="text-red-500" />
              Force Delete — Direct Document Removal
            </h3>
            <p className="text-gray-400 text-xs mt-1">
              Delete any Firestore document by collection name and document ID. Bypasses the scanner. Use with caution.
            </p>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#6B7C6B] text-xs font-medium mb-1">Collection</label>
                <input
                  type="text"
                  value={forceDelete.collection}
                  onChange={(e) => setForceDelete(prev => ({ ...prev, collection: e.target.value, result: null }))}
                  placeholder="e.g. notifications"
                  className="w-full bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg px-3 py-2 text-gray-800 text-sm focus:border-[#00A651] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[#6B7C6B] text-xs font-medium mb-1">Document ID</label>
                <input
                  type="text"
                  value={forceDelete.docId}
                  onChange={(e) => setForceDelete(prev => ({ ...prev, docId: e.target.value, result: null }))}
                  placeholder="e.g. notif_1771906770778_tlhmaxr1c"
                  className="w-full bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg px-3 py-2 text-gray-800 text-sm focus:border-[#00A651] focus:outline-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setConfirmAction({
                  type: 'forceDelete',
                  fn: handleForceDelete,
                  label: `Force Delete: ${forceDelete.collection}/${forceDelete.docId}`,
                  description: `This will permanently delete the document "${forceDelete.docId}" from the "${forceDelete.collection}" collection. This cannot be undone.`
                })}
                disabled={forceDelete.running || !forceDelete.collection.trim() || !forceDelete.docId.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg font-semibold text-sm hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {forceDelete.running ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                {forceDelete.running ? 'Deleting...' : 'Force Delete'}
              </button>
              {forceDelete.result && (
                <span className={`text-xs font-medium ${forceDelete.result.success ? 'text-green-500' : 'text-red-500'}`}>
                  {forceDelete.result.message}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Dry Run Toggle */}
        <div className="flex items-center justify-between bg-white border border-[#D4E4D4] rounded-xl p-4">
          <div>
            <p className="text-gray-800 font-medium text-sm">Safe Mode (Dry Run)</p>
            <p className="text-gray-400 text-xs mt-0.5">
              {dryRun
                ? 'Actions will be simulated — nothing is deleted or modified'
                : 'Actions will modify Firestore data permanently'}
            </p>
          </div>
          <button
            onClick={() => setDryRun(!dryRun)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              dryRun ? 'bg-[#005028]' : 'bg-red-500'
            }`}
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
              dryRun ? 'left-0.5' : 'left-6'
            }`} />
          </button>
        </div>

        {!dryRun && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <AlertTriangle className="text-red-400 flex-shrink-0" size={20} />
            <p className="text-red-300 text-sm">
              Live mode is active. Actions will permanently modify or delete Firestore documents.
            </p>
          </div>
        )}

        {/* Scan Results Summary */}
        {scanResults && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <SummaryCard
                label="Total Users"
                value={scanResults.totalUsers}
                icon={Users}
                color="text-gray-800"
              />
              <SummaryCard
                label="Issues Found"
                value={totalIssues}
                icon={totalIssues > 0 ? AlertTriangle : CheckCircle2}
                color={totalIssues > 0 ? 'text-yellow-400' : 'text-green-400'}
              />
              <SummaryCard
                label="Duplicate Groups"
                value={scanResults.issues.duplicates.length}
                icon={Users}
                color={scanResults.issues.duplicates.length > 0 ? 'text-red-400' : 'text-green-400'}
              />
              <SummaryCard
                label="Fixable"
                value={
                  scanResults.issues.missingUid.length +
                  scanResults.issues.uidMismatch.length +
                  scanResults.issues.parentsNoChildren.length
                }
                icon={RefreshCw}
                color="text-blue-400"
              />
            </div>

            {/* Clean All button */}
            {totalIssues > 0 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-[#D4E4D4] rounded-xl p-4">
                <div>
                  <p className="text-gray-800 font-medium text-sm">
                    {totalIssues} issue{totalIssues !== 1 ? 's' : ''} found across {Object.values(scanResults.issues).filter(arr => arr.length > 0).length} categories
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {dryRun ? 'Dry run: preview changes before applying' : 'Changes will be applied to Firestore'}
                  </p>
                </div>
                <button
                  onClick={() => setConfirmAction({
                    type: 'cleanAll',
                    fn: cleanAll,
                    label: `${dryRun ? '[DRY RUN] ' : ''}Clean all ${totalIssues} issues`
                  })}
                  disabled={cleaning}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                    dryRun
                      ? 'bg-[#005028] text-white hover:bg-[#00A651]'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  } disabled:opacity-50`}
                >
                  {cleaning ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  {dryRun ? 'Preview Clean All' : 'Clean All'}
                </button>
              </div>
            )}

            {totalIssues === 0 && (
              <div className="bg-white border-2 border-green-500/30 rounded-xl p-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-gray-800 font-semibold">All Clear</p>
                <p className="text-gray-400 text-sm mt-1">No issues found in {scanResults.totalUsers} user documents.</p>
              </div>
            )}

            {/* Issue Categories */}
            <div className="space-y-3">
              {categories.filter(c => c.count > 0).map(cat => (
                <div key={cat.id} className="bg-white border border-[#D4E4D4] rounded-xl overflow-hidden">
                  {/* Category Header */}
                  <button
                    onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${cat.bgColor} rounded-lg flex items-center justify-center`}>
                        <cat.icon className={cat.color} size={20} />
                      </div>
                      <div className="text-left">
                        <p className="text-gray-800 font-medium text-sm">{cat.label}</p>
                        <p className="text-gray-400 text-xs">{cat.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${cat.bgColor} ${cat.color}`}>
                        {cat.count}
                      </span>
                      {expandedCategory === cat.id ? (
                        <ChevronDown className="text-gray-400" size={18} />
                      ) : (
                        <ChevronRight className="text-gray-400" size={18} />
                      )}
                    </div>
                  </button>

                  {/* Expanded Items */}
                  {expandedCategory === cat.id && (
                    <div className="border-t border-[#D4E4D4]/50">
                      {/* Category Action Bar */}
                      <div className="px-4 py-3 bg-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <span className="text-gray-500 text-xs">
                          {cat.count} item{cat.count !== 1 ? 's' : ''} in this category
                          {deleteProgress?.categoryId === cat.id && (
                            <span className="text-[#00A651] ml-2">
                              — deleting {deleteProgress.current} of {deleteProgress.total}...
                            </span>
                          )}
                        </span>
                        <div className="flex items-center gap-2">
                          {cat.action && (
                            <button
                              onClick={() => setConfirmAction({
                                type: cat.id,
                                fn: cat.action,
                                label: `${dryRun ? '[DRY RUN] ' : ''}${cat.actionLabel} (${cat.count} items)`
                              })}
                              disabled={cleaning}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                dryRun
                                  ? 'bg-[#005028]/20 text-[#00A651] hover:bg-[#00A651]/30'
                                  : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                              } disabled:opacity-50`}
                            >
                              <RefreshCw size={12} />
                              {cat.actionLabel}
                            </button>
                          )}
                          <button
                            onClick={() => setConfirmAction({
                              type: 'deleteCategory',
                              fn: () => deleteAllInCategory(cat),
                              label: cat.deleteLabel,
                              description: `This will permanently delete ${getDeletableCount(cat.id)} documents from the Firestore ${cat._collection || 'users'} collection. This cannot be undone.`
                            })}
                            disabled={cleaning}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            <Trash2 size={12} />
                            {cat.deleteLabel}
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {deleteProgress?.categoryId === cat.id && (
                        <div className="px-4 pb-2">
                          <div className="w-full bg-[#F5F9F5] rounded-full h-1.5">
                            <div
                              className="bg-[#005028] h-1.5 rounded-full transition-all duration-200"
                              style={{ width: `${(deleteProgress.current / deleteProgress.total) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="max-h-80 overflow-y-auto">
                        {cat.items.map((item, idx) => (
                          <div
                            key={item.id + '-' + idx}
                            className="flex items-center justify-between px-4 py-3 border-t border-[#D4E4D4]/20 hover:bg-gray-100"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-800 text-sm truncate">{item.label}</p>
                              <p className="text-gray-400 text-xs truncate">{item.sublabel}</p>
                            </div>
                            <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                              <button
                                onClick={() => setDetailDoc(item.details)}
                                className="p-1.5 text-gray-400 hover:text-gray-800 transition-colors"
                                title="View details"
                              >
                                <Eye size={14} />
                              </button>
                              {!item.isDuplicateGroup && (
                                <button
                                  onClick={() => setConfirmAction({
                                    type: 'deleteSingle',
                                    fn: () => deleteDocument(item.id, item._collection || 'users'),
                                    label: `${dryRun ? '[DRY RUN] ' : ''}Delete document ${item.id}`
                                  })}
                                  disabled={cleaning}
                                  className="p-1.5 text-red-400/60 hover:text-red-400 transition-colors disabled:opacity-50"
                                  title="Delete document"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Cleanup Log */}
        {cleanupLog.length > 0 && (
          <div className="bg-white border border-[#D4E4D4] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#D4E4D4]/50">
              <p className="text-gray-800 font-medium text-sm">Activity Log</p>
              <button
                onClick={() => setCleanupLog([])}
                className="text-gray-400 hover:text-gray-800 text-xs"
              >
                Clear
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto p-4 space-y-2">
              {cleanupLog.map((entry, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className={`text-xs mt-0.5 ${
                    entry.type === 'error' ? 'text-red-400' :
                    entry.type === 'success' ? 'text-green-400' :
                    entry.type === 'dry-run' ? 'text-blue-400' :
                    'text-gray-500'
                  }`}>
                    {entry.type === 'error' ? '✗' :
                     entry.type === 'success' ? '✓' :
                     entry.type === 'dry-run' ? '◦' : '→'}
                  </span>
                  <p className="text-gray-600 text-xs font-mono break-all">{entry.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!scanResults && !scanning && (
          <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl p-8 text-center">
            <Search className="w-16 h-16 text-[#6B7C6B] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Scan Your Data</h2>
            <p className="text-[#6B7C6B] text-sm max-w-md mx-auto">
              Click &ldquo;Scan for Issues&rdquo; to check the users collection for duplicates,
              missing fields, orphaned documents, and other problems.
            </p>
          </div>
        )}

        {scanning && (
          <div className="text-center py-12">
            <Loader2 className="w-10 h-10 text-[#00A651] animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Scanning Firestore collections for issues...</p>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#D4E4D4] rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <AlertTriangle className="text-yellow-400" size={20} />
              </div>
              <h3 className="text-gray-800 font-bold">Confirm Action</h3>
            </div>
            <p className="text-gray-700 text-sm mb-2">{confirmAction.label}</p>
            {confirmAction.description && (!dryRun || confirmAction.type === 'quickCleanup' || confirmAction.type === 'forceDelete') && (
              <p className="text-red-400 text-xs mb-4">{confirmAction.description}</p>
            )}
            {!confirmAction.description && !dryRun && (
              <p className="text-red-400 text-xs mb-4">
                This action will permanently modify Firestore data. This cannot be undone.
              </p>
            )}
            {dryRun && confirmAction.type !== 'quickCleanup' && confirmAction.type !== 'forceDelete' && (
              <p className="text-blue-400 text-xs mb-4">
                Dry run mode — no data will be changed. Results will appear in the activity log.
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 px-4 py-2 bg-[#F5F9F5] border border-[#D4E4D4] text-gray-800 rounded-lg text-sm hover:border-[#00A651] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const fn = confirmAction.fn;
                  setConfirmAction(null);
                  await fn();
                }}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  dryRun && confirmAction.type !== 'quickCleanup' && confirmAction.type !== 'forceDelete'
                    ? 'bg-[#005028] text-white hover:bg-[#00A651]'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {(dryRun && confirmAction.type !== 'quickCleanup' && confirmAction.type !== 'forceDelete') ? 'Preview' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Detail Modal */}
      {detailDoc && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#D4E4D4] rounded-2xl max-w-lg w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#D4E4D4]/50">
              <h3 className="text-gray-800 font-bold text-sm">Document Details</h3>
              <button
                onClick={() => setDetailDoc(null)}
                className="text-gray-400 hover:text-gray-800"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <pre className="text-gray-700 text-xs font-mono whitespace-pre-wrap break-all">
                {JSON.stringify(
                  detailDoc,
                  (key, value) => {
                    if (key === '_score') return undefined;
                    if (value && typeof value === 'object' && value.seconds) {
                      return new Date(value.seconds * 1000).toISOString();
                    }
                    return value;
                  },
                  2
                )}
              </pre>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};

// Summary Card
const SummaryCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white border border-[#D4E4D4] rounded-xl p-4 text-center">
    <Icon className={`${color} mx-auto mb-2`} size={20} />
    <p className="text-2xl font-bold text-gray-800">{value}</p>
    <p className="text-gray-500 text-xs">{label}</p>
  </div>
);

export default DataCleanupPage;
