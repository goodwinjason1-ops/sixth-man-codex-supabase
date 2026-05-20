import React from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { useFilteredData } from '../hooks/useFilteredData';
import { PlayboardShell, usePlayboardDraft } from '../features/playboard';

const CoachPlayboardPage = ({ mode = 'default' }) => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    teams = [],
    playboards = [],
    currentUser,
    userProfile,
    setDocument,
    updateDocument,
    fetchDocument,
  } = useFilteredData();
  const sourceRefs = {
    drillId: searchParams.get('drillId') || '',
    trainingPlanId: searchParams.get('planId') || '',
    gameId: searchParams.get('gameId') || '',
    playingTimeId: searchParams.get('playingTimeId') || '',
    sessionIndex: searchParams.get('sessionIndex') || '',
  };
  const {
    board,
    selectedTeamId,
    setSelectedTeamId,
    showLoadBoard,
    loadingBoard,
    savingBoard,
    statusMessage,
    startNewBoard,
    saveBoard,
    loadBoard,
  } = usePlayboardDraft({
    teams,
    playboards,
    currentUser,
    userProfile,
    boardId: id,
    initialTeamId: searchParams.get('teamId') || '',
    sourceType: searchParams.get('source') || location.state?.sourceType || '',
    sourceRefs,
    setDocument,
    updateDocument,
    fetchDocument,
  });

  const handleNewBoard = () => {
    startNewBoard();
    navigate('/coach/playboard/new');
  };

  const handleSaveBoard = async () => {
    const result = await saveBoard();
    if (result?.success && result.id && result.id !== id) {
      navigate(`/coach/playboard/${result.id}`, { replace: true });
    }
  };

  return (
    <PageShell
      title="Playboard"
      subtitle="Build tactical basketball boards for training and game day."
      backTo="/coach"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'Dashboard', url: '/coach' },
        { label: 'Playboard' },
      ]}
      maxWidth="7xl"
    >
      <PlayboardShell
        board={board}
        boardId={id}
        mode={mode}
        teams={teams}
        playboards={playboards}
        selectedTeamId={selectedTeamId}
        onTeamChange={setSelectedTeamId}
        onNewBoard={handleNewBoard}
        onSaveBoard={handleSaveBoard}
        onLoadBoard={loadBoard}
        onOpenBoard={boardId => navigate(`/coach/playboard/${boardId}`)}
        showLoadBoard={showLoadBoard}
        loadingBoard={loadingBoard}
        savingBoard={savingBoard}
        statusMessage={statusMessage}
      />
    </PageShell>
  );
};

export default CoachPlayboardPage;
