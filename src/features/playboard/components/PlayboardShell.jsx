import React from 'react';
import { FolderOpen, Plus, Save, Users } from 'lucide-react';
import { COURT_PRESETS } from '../presets/courtPresets';

const PlayboardShell = ({
  board,
  boardId,
  mode,
  teams,
  playboards = [],
  selectedTeamId,
  onTeamChange,
  onNewBoard,
  onSaveBoard,
  onLoadBoard,
  onOpenBoard,
  showLoadBoard,
  loadingBoard,
  savingBoard,
  statusMessage,
}) => {
  const modeLabel = boardId ? `Editing board ${boardId}` : mode === 'new' ? 'New board' : 'Draft board';
  const visibleBoards = selectedTeamId
    ? playboards.filter(item => item.teamId === selectedTeamId)
    : playboards;

  return (
    <div className="space-y-4">
      <div className="bg-white border border-[#D4E4D4] rounded-xl p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#00A651]">{modeLabel}</p>
            <h2 className="text-lg font-bold text-gray-800 mt-1">{board.name}</h2>
            <p className="text-sm text-[#6B7C6B] mt-1">
              Tactical board workspace shell for coach play diagrams, drill setup, and game-day notes.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onNewBoard}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-[#D4E4D4] text-gray-800 rounded-lg hover:border-[#00A651] transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Board
            </button>
            <button
              type="button"
              onClick={onSaveBoard}
              disabled={savingBoard}
              className="flex items-center gap-2 px-3 py-2 bg-[#005028] text-white rounded-lg hover:bg-[#00A651] transition-colors"
            >
              <Save className="w-4 h-4" />
              {savingBoard ? 'Saving...' : 'Save Board'}
            </button>
            <button
              type="button"
              onClick={onLoadBoard}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-[#D4E4D4] text-gray-800 rounded-lg hover:border-[#00A651] transition-colors"
            >
              <FolderOpen className="w-4 h-4" />
              Load Board
            </button>
          </div>
        </div>
      </div>

      {showLoadBoard && (
        <section
          role="dialog"
          aria-labelledby="saved-boards-heading"
          className="bg-white border border-[#D4E4D4] rounded-xl p-4"
        >
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h2 id="saved-boards-heading" className="text-base font-bold text-gray-800">Saved Boards</h2>
              <p className="text-sm text-[#6B7C6B]">
                {visibleBoards.length} board{visibleBoards.length === 1 ? '' : 's'} available
              </p>
            </div>
          </div>
          {visibleBoards.length === 0 ? (
            <p className="text-sm text-[#6B7C6B] bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg p-3">
              No saved boards for this team yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {visibleBoards.map(savedBoard => (
                <button
                  key={savedBoard.id}
                  type="button"
                  onClick={() => onOpenBoard(savedBoard.id)}
                  className="text-left bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg p-3 hover:border-[#00A651] transition-colors"
                >
                  <span className="block text-sm font-semibold text-gray-800">{savedBoard.name || 'Untitled Playboard'}</span>
                  <span className="block text-xs text-[#6B7C6B] mt-1">
                    {savedBoard.teamName || 'No team'} - {savedBoard.status || 'draft'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-4">
        <aside className="bg-white border border-[#D4E4D4] rounded-xl p-4 space-y-4">
          <div>
            <label htmlFor="playboard-team" className="block text-sm font-semibold text-[#005028] mb-2">
              Team
            </label>
            <select
              id="playboard-team"
              value={selectedTeamId}
              onChange={event => onTeamChange(event.target.value)}
              className="w-full px-3 py-2.5 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 focus:border-[#00A651] focus:outline-none"
            >
              <option value="">Select a team</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name || team.teamName || 'Unnamed Team'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[#005028] mb-2">Court Preset</h3>
            <div className="space-y-2">
              {COURT_PRESETS.map(preset => (
                <div
                  key={preset.id}
                  className={`px-3 py-2 rounded-lg border text-sm ${
                    preset.id === board.court.id
                      ? 'bg-[#005028]/10 border-[#00A651] text-[#005028]'
                      : 'bg-[#F5F9F5] border-[#D4E4D4] text-[#6B7C6B]'
                  }`}
                >
                  {preset.label}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-[#D4E4D4] pt-4">
            <h3 className="text-sm font-semibold text-[#005028] mb-2">Tools</h3>
            <div className="grid grid-cols-2 gap-2">
              {['Players', 'Pass', 'Cut', 'Screen'].map(tool => (
                <button
                  key={tool}
                  type="button"
                  className="px-3 py-2 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-sm text-gray-700 cursor-default"
                >
                  {tool}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="bg-white border border-[#D4E4D4] rounded-xl p-4 min-h-[520px]">
          <div className="h-full min-h-[480px] rounded-xl border-2 border-dashed border-[#D4E4D4] bg-[#F5F9F5] flex items-center justify-center">
            <div className="text-center px-6">
              <div className="w-16 h-16 rounded-full bg-[#005028]/10 border border-[#00A651]/30 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-[#005028]" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Court Area</h3>
              <p className="text-sm text-[#6B7C6B] mt-2 max-w-md">
                Board details, team context, source links, and saved frames are ready for the drawing canvas.
              </p>
              {loadingBoard && (
                <p className="text-xs text-[#00A651] mt-3">Loading board...</p>
              )}
            </div>
          </div>
        </section>
      </div>

      {statusMessage && (
        <div className="bg-[#005028]/10 border border-[#00A651]/30 rounded-xl px-4 py-3 text-sm text-[#005028]">
          {statusMessage}
        </div>
      )}
    </div>
  );
};

export default PlayboardShell;
