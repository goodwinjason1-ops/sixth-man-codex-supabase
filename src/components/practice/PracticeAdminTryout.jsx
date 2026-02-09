import React, { useState, useMemo } from 'react';
import {
  Users,
  Calendar,
  Clock,
  UserPlus,
  ClipboardList,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Check,
  MapPin,
  Trophy,
  Star
} from 'lucide-react';

const TOTAL_STEPS = 5;

const AGE_GROUPS = [
  { id: 'u10', label: 'U10', description: 'Under 10s' },
  { id: 'u12', label: 'U12', description: 'Under 12s' },
  { id: 'u14', label: 'U14', description: 'Under 14s' },
  { id: 'u16', label: 'U16', description: 'Under 16s' },
  { id: 'u18', label: 'U18', description: 'Under 18s' },
];

const FAKE_PLAYERS = [
  { id: 'tp1', name: 'Mia Thompson', age: 11 },
  { id: 'tp2', name: 'Jake Morrison', age: 12 },
  { id: 'tp3', name: 'Sophie Huang', age: 11 },
  { id: 'tp4', name: 'Aidan Kelly', age: 12 },
  { id: 'tp5', name: 'Chloe Patel', age: 11 },
  { id: 'tp6', name: 'Riley Jensen', age: 12 },
  { id: 'tp7', name: 'Ella Nguyen', age: 11 },
  { id: 'tp8', name: 'Tyler Brooks', age: 12 },
  { id: 'tp9', name: 'Ava Collins', age: 11 },
  { id: 'tp10', name: 'Max Sullivan', age: 12 },
];

const FAKE_ASSESSORS = [
  { id: 'ta1', name: 'Coach Mike Davis', role: 'Head Coach' },
  { id: 'ta2', name: 'Sarah Mitchell', role: 'Assistant Coach' },
  { id: 'ta3', name: 'James Cooper', role: 'Assessor' },
  { id: 'ta4', name: 'Lisa Wang', role: 'Assessor' },
  { id: 'ta5', name: 'Tom Edwards', role: 'Guest Assessor' },
];

const StepIndicator = ({ current, total }) => (
  <div className="flex items-center gap-1.5">
    {Array.from({ length: total }, (_, i) => (
      <div
        key={i}
        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
          i <= current ? 'bg-[#4ade80]' : 'bg-white/20'
        }`}
      />
    ))}
  </div>
);

const PracticeAdminTryout = () => {
  const [step, setStep] = useState(0);
  const [ageGroup, setAgeGroup] = useState(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [selectedAssessors, setSelectedAssessors] = useState([]);

  const stepLabels = ['Age Group', 'Date & Time', 'Add Players', 'Assign Assessors', 'Confirm'];

  const canAdvance = useMemo(() => {
    switch (step) {
      case 0: return ageGroup !== null;
      case 1: return date !== '' && time !== '';
      case 2: return selectedPlayers.length > 0;
      case 3: return selectedAssessors.length > 0;
      case 4: return true;
      default: return false;
    }
  }, [step, ageGroup, date, time, selectedPlayers, selectedAssessors]);

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1 && canAdvance) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep((prev) => prev - 1);
    }
  };

  const togglePlayer = (playerId) => {
    setSelectedPlayers((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  const toggleAssessor = (assessorId) => {
    setSelectedAssessors((prev) =>
      prev.includes(assessorId)
        ? prev.filter((id) => id !== assessorId)
        : [...prev, assessorId]
    );
  };

  const selectAllPlayers = () => {
    if (selectedPlayers.length === FAKE_PLAYERS.length) {
      setSelectedPlayers([]);
    } else {
      setSelectedPlayers(FAKE_PLAYERS.map((p) => p.id));
    }
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-AU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDisplayTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${minutes} ${ampm}`;
  };

  const renderStepContent = () => {
    switch (step) {
      // Step 1: Select Age Group
      case 0:
        return (
          <div>
            <div className="mb-5">
              <h3 className="text-white font-bold text-lg">Select Age Group</h3>
              <p className="text-[#1a8a68] text-sm mt-1">Choose the age group for this tryout session</p>
            </div>

            <div className="space-y-3">
              {AGE_GROUPS.map((group) => (
                <button
                  key={group.id}
                  onClick={() => setAgeGroup(group.id)}
                  className={`w-full text-left rounded-xl p-4 transition-all duration-200 active:scale-[0.98] flex items-center gap-3 min-h-[60px] ${
                    ageGroup === group.id
                      ? 'bg-[#22c55e]/15 border-2 border-[#22c55e]'
                      : 'bg-[#0d5943] border-2 border-[#1a8a68] hover:border-[#22c55e]/50'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                    ageGroup === group.id
                      ? 'bg-[#22c55e] text-[#0a3d2e]'
                      : 'bg-[#0a3d2e] border border-[#1a8a68] text-white'
                  }`}>
                    {group.label}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-semibold">{group.label} Division</h4>
                    <p className="text-[#1a8a68] text-xs">{group.description}</p>
                  </div>
                  {ageGroup === group.id && (
                    <CheckCircle className="w-6 h-6 text-[#4ade80]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        );

      // Step 2: Set Date & Time
      case 1:
        return (
          <div>
            <div className="mb-5">
              <h3 className="text-white font-bold text-lg">Set Date & Time</h3>
              <p className="text-[#1a8a68] text-sm mt-1">When will the tryout session take place?</p>
            </div>

            <div className="space-y-4">
              {/* Date Input */}
              <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4">
                <label className="flex items-center gap-2 text-white font-medium text-sm mb-3">
                  <Calendar className="w-4 h-4 text-[#4ade80]" />
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg text-white focus:border-[#22c55e] focus:outline-none min-h-[44px]"
                />
                {date && (
                  <p className="text-[#4ade80] text-xs mt-2">
                    {formatDisplayDate(date)}
                  </p>
                )}
              </div>

              {/* Time Input */}
              <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4">
                <label className="flex items-center gap-2 text-white font-medium text-sm mb-3">
                  <Clock className="w-4 h-4 text-[#4ade80]" />
                  Start Time
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg text-white focus:border-[#22c55e] focus:outline-none min-h-[44px]"
                />
                {time && (
                  <p className="text-[#4ade80] text-xs mt-2">
                    {formatDisplayTime(time)}
                  </p>
                )}
              </div>

              {/* Location (static) */}
              <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4">
                <label className="flex items-center gap-2 text-white font-medium text-sm mb-3">
                  <MapPin className="w-4 h-4 text-[#4ade80]" />
                  Location
                </label>
                <div className="px-4 py-3 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg text-white/60 text-sm">
                  Emerald Lakers Home Court
                </div>
              </div>
            </div>
          </div>
        );

      // Step 3: Add Players
      case 2:
        return (
          <div>
            <div className="mb-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-bold text-lg">Add Players</h3>
                  <p className="text-[#1a8a68] text-sm mt-1">
                    {selectedPlayers.length}/{FAKE_PLAYERS.length} selected
                  </p>
                </div>
                <button
                  onClick={selectAllPlayers}
                  className="px-3 py-2 bg-[#0d5943] border border-[#1a8a68] rounded-lg text-[#4ade80] text-xs font-medium hover:border-[#22c55e] transition-colors min-h-[44px] flex items-center"
                >
                  {selectedPlayers.length === FAKE_PLAYERS.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {FAKE_PLAYERS.map((player) => {
                const isSelected = selectedPlayers.includes(player.id);
                return (
                  <button
                    key={player.id}
                    onClick={() => togglePlayer(player.id)}
                    className={`w-full text-left rounded-xl p-4 transition-all duration-200 active:scale-[0.98] flex items-center gap-3 min-h-[56px] ${
                      isSelected
                        ? 'bg-[#22c55e]/15 border-2 border-[#22c55e]'
                        : 'bg-[#0d5943] border-2 border-[#1a8a68] hover:border-[#22c55e]/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? 'bg-[#22c55e]/20'
                        : 'bg-[#0a3d2e] border border-[#1a8a68]'
                    }`}>
                      {isSelected ? (
                        <Check className="w-5 h-5 text-[#4ade80]" />
                      ) : (
                        <UserPlus className="w-4 h-4 text-[#1a8a68]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium text-sm">{player.name}</h4>
                      <p className="text-[#1a8a68] text-xs">Age {player.age}</p>
                    </div>
                    {isSelected && (
                      <span className="text-[#4ade80] text-xs font-medium">Added</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );

      // Step 4: Assign Assessors
      case 3:
        return (
          <div>
            <div className="mb-5">
              <h3 className="text-white font-bold text-lg">Assign Assessors</h3>
              <p className="text-[#1a8a68] text-sm mt-1">
                {selectedAssessors.length}/{FAKE_ASSESSORS.length} selected
              </p>
            </div>

            <div className="space-y-2">
              {FAKE_ASSESSORS.map((assessor) => {
                const isSelected = selectedAssessors.includes(assessor.id);
                return (
                  <button
                    key={assessor.id}
                    onClick={() => toggleAssessor(assessor.id)}
                    className={`w-full text-left rounded-xl p-4 transition-all duration-200 active:scale-[0.98] flex items-center gap-3 min-h-[56px] ${
                      isSelected
                        ? 'bg-[#22c55e]/15 border-2 border-[#22c55e]'
                        : 'bg-[#0d5943] border-2 border-[#1a8a68] hover:border-[#22c55e]/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? 'bg-[#22c55e]/20'
                        : 'bg-[#0a3d2e] border border-[#1a8a68]'
                    }`}>
                      {isSelected ? (
                        <Check className="w-5 h-5 text-[#4ade80]" />
                      ) : (
                        <ClipboardList className="w-4 h-4 text-[#1a8a68]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium text-sm">{assessor.name}</h4>
                      <p className="text-[#1a8a68] text-xs">{assessor.role}</p>
                    </div>
                    {isSelected && (
                      <span className="text-[#4ade80] text-xs font-medium">Assigned</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );

      // Step 5: Summary / Success
      case 4:
        return (
          <div>
            {/* Success Header */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-[#22c55e]/20 border-2 border-[#22c55e] rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-10 h-10 text-[#4ade80]" />
              </div>
              <h3 className="text-white font-bold text-xl">Session Created!</h3>
              <p className="text-[#4ade80] text-sm mt-1">Your tryout session is ready to go</p>
            </div>

            {/* Summary Card */}
            <div className="bg-[#0d5943] border-2 border-[#22c55e] rounded-xl p-5 space-y-4">
              {/* Age Group */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0a3d2e] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Star className="w-5 h-5 text-[#4ade80]" />
                </div>
                <div>
                  <p className="text-white/50 text-xs">Age Group</p>
                  <p className="text-white font-semibold">
                    {AGE_GROUPS.find((g) => g.id === ageGroup)?.label} Division
                  </p>
                </div>
              </div>

              {/* Date & Time */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0a3d2e] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-[#4ade80]" />
                </div>
                <div>
                  <p className="text-white/50 text-xs">Date & Time</p>
                  <p className="text-white font-semibold">
                    {formatDisplayDate(date)}
                  </p>
                  <p className="text-[#4ade80] text-sm">{formatDisplayTime(time)}</p>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0a3d2e] rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-[#4ade80]" />
                </div>
                <div>
                  <p className="text-white/50 text-xs">Location</p>
                  <p className="text-white font-semibold">Emerald Lakers Home Court</p>
                </div>
              </div>

              {/* Players */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0a3d2e] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-[#4ade80]" />
                </div>
                <div>
                  <p className="text-white/50 text-xs">Players</p>
                  <p className="text-white font-semibold">{selectedPlayers.length} players registered</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedPlayers.slice(0, 5).map((id) => {
                      const player = FAKE_PLAYERS.find((p) => p.id === id);
                      return (
                        <span
                          key={id}
                          className="px-2 py-0.5 bg-[#0a3d2e] rounded text-[#4ade80] text-xs"
                        >
                          {player?.name?.split(' ')[0]}
                        </span>
                      );
                    })}
                    {selectedPlayers.length > 5 && (
                      <span className="px-2 py-0.5 bg-[#0a3d2e] rounded text-white/40 text-xs">
                        +{selectedPlayers.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Assessors */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0a3d2e] rounded-lg flex items-center justify-center flex-shrink-0">
                  <ClipboardList className="w-5 h-5 text-[#4ade80]" />
                </div>
                <div>
                  <p className="text-white/50 text-xs">Assessors</p>
                  <p className="text-white font-semibold">{selectedAssessors.length} assessors assigned</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedAssessors.map((id) => {
                      const assessor = FAKE_ASSESSORS.find((a) => a.id === id);
                      return (
                        <span
                          key={id}
                          className="px-2 py-0.5 bg-[#0a3d2e] rounded text-[#4ade80] text-xs"
                        >
                          {assessor?.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Progress Bar */}
      <div className="mb-2">
        <StepIndicator current={step} total={TOTAL_STEPS} />
      </div>

      {/* Step Label */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-white/40 text-xs">
          Step {step + 1} of {TOTAL_STEPS}
        </p>
        <p className="text-[#4ade80] text-xs font-medium">
          {stepLabels[step]}
        </p>
      </div>

      {/* Step Content */}
      {renderStepContent()}

      {/* Navigation Buttons */}
      {step < TOTAL_STEPS - 1 && (
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button
              onClick={handleBack}
              className="flex-1 py-3 bg-[#0d5943] border border-[#1a8a68] text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 hover:border-[#22c55e] min-h-[48px]"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canAdvance}
            className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 min-h-[48px] ${
              canAdvance
                ? 'bg-[#1a8a68] hover:bg-[#22c55e] text-white active:scale-[0.98]'
                : 'bg-[#0d5943] border border-[#1a8a68] text-[#1a8a68] cursor-not-allowed'
            }`}
          >
            {step === TOTAL_STEPS - 2 ? 'Create Session' : 'Next'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default PracticeAdminTryout;
