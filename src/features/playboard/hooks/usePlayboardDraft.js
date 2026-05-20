import { useEffect, useMemo, useState } from 'react';
import {
  createEmptyBoard,
  createPlayboardId,
  getDefaultBoardName,
  normalizeBoard,
} from '../utils/boardState';
import { createPlayboard, fetchPlayboard, updatePlayboard } from '../services/playboardService';

export const usePlayboardDraft = ({
  teams = [],
  playboards = [],
  currentUser,
  userProfile,
  boardId = '',
  initialTeamId = '',
  sourceType = '',
  sourceRefs = {},
  setDocument,
  updateDocument,
  fetchDocument,
} = {}) => {
  const [selectedTeamId, setSelectedTeamId] = useState(initialTeamId);
  const [board, setBoard] = useState(() => normalizeBoard(createEmptyBoard({
    teamId: initialTeamId,
    coachId: currentUser?.uid || '',
    coachName: userProfile?.displayName || '',
    sourceType,
    sourceRefs,
  })));
  const [statusMessage, setStatusMessage] = useState('');
  const [showLoadBoard, setShowLoadBoard] = useState(false);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [savingBoard, setSavingBoard] = useState(false);

  const selectedTeam = useMemo(
    () => teams.find(team => team.id === selectedTeamId) || null,
    [teams, selectedTeamId]
  );

  useEffect(() => {
    if (!initialTeamId && teams.length === 1 && !selectedTeamId && !boardId) {
      setSelectedTeamId(teams[0].id);
    }
  }, [boardId, initialTeamId, selectedTeamId, teams]);

  useEffect(() => {
    if (!selectedTeam || boardId) return;
    setBoard(prev => {
      const teamName = selectedTeam.name || selectedTeam.teamName || '';
      const shouldNameFromTeam = !prev.name || prev.name === 'Untitled Playboard';

      return normalizeBoard({
        ...prev,
        teamId: selectedTeam.id,
        teamName,
        coachId: currentUser?.uid || prev.coachId,
        coachName: userProfile?.displayName || prev.coachName,
        name: shouldNameFromTeam ? getDefaultBoardName(teamName) : prev.name,
      });
    });
  }, [boardId, currentUser, selectedTeam, userProfile]);

  useEffect(() => {
    let cancelled = false;

    const loadBoard = async () => {
      if (!boardId) return;
      setLoadingBoard(true);
      const cachedBoard = playboards.find(item => item.id === boardId);
      const loadedBoard = cachedBoard || await fetchPlayboard(boardId, { fetchDocument });

      if (!cancelled) {
        if (loadedBoard) {
          const normalized = normalizeBoard(loadedBoard);
          setBoard(normalized);
          setSelectedTeamId(normalized.teamId || '');
          setStatusMessage('');
        } else {
          setStatusMessage('Unable to find that playboard.');
        }
        setLoadingBoard(false);
      }
    };

    loadBoard();
    return () => {
      cancelled = true;
    };
  }, [boardId, fetchDocument, playboards]);

  const startNewBoard = () => {
    const teamName = selectedTeam?.name || selectedTeam?.teamName || '';
    setBoard(normalizeBoard(createEmptyBoard({
      teamId: selectedTeam?.id || initialTeamId,
      teamName,
      coachId: currentUser?.uid || '',
      coachName: userProfile?.displayName || '',
      sourceType,
      sourceRefs,
    })));
    setShowLoadBoard(false);
    setStatusMessage('New board ready.');
  };

  const saveBoard = async () => {
    setSavingBoard(true);
    const now = new Date().toISOString();
    const id = board.id || boardId || createPlayboardId();
    const teamName = selectedTeam?.name || selectedTeam?.teamName || board.teamName || '';
    const payload = normalizeBoard({
      ...board,
      id,
      teamId: selectedTeam?.id || board.teamId || '',
      teamName,
      coachId: currentUser?.uid || board.coachId,
      coachName: userProfile?.displayName || board.coachName,
      name: board.name && board.name !== 'Untitled Playboard' ? board.name : getDefaultBoardName(teamName),
      createdAt: board.createdAt || now,
      createdBy: board.createdBy || currentUser?.uid || '',
      updatedAt: now,
      updatedBy: currentUser?.uid || '',
    });

    const result = board.id || boardId
      ? await updatePlayboard(id, payload, { updateDocument })
      : await createPlayboard(payload, { setDocument }, id);

    setSavingBoard(false);

    if (result.success) {
      setBoard({ ...payload, id });
      setStatusMessage(`${result.offline ? 'Saved offline' : 'Saved'} ${payload.name}`);
      return { ...result, id };
    }

    setStatusMessage(`Unable to save board: ${result.error || 'Unknown error'}`);
    return result;
  };

  const loadBoard = () => {
    setShowLoadBoard(prev => !prev);
    setStatusMessage('');
  };

  return {
    board,
    selectedTeam,
    selectedTeamId,
    setBoard,
    setSelectedTeamId,
    showLoadBoard,
    loadingBoard,
    savingBoard,
    statusMessage,
    startNewBoard,
    saveBoard,
    loadBoard,
  };
};
