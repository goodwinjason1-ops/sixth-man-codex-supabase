/**
 * Infographic content data for the help/tutorial system.
 * Each infographic can be rendered as a FlowChart or ProcessFlow component.
 *
 * FlowChart expects: nodes [{ id, icon, label, x, y }], edges [{ from, to }]
 * ProcessFlow expects: steps [{ icon, label, description }]
 */

export const INFOGRAPHICS = {
  // ── Assessor Evaluation Flow ─────────────────────────────────────────────
  'assessor-evaluation-flow': {
    id: 'assessor-evaluation-flow',
    title: 'Assessor Evaluation Flow',
    description: 'How a single evaluation session works from start to finish.',
    icon: 'ClipboardCheck',
    type: 'flowchart',
    nodes: [
      { id: 'session', icon: 'CalendarCheck', label: 'Open Session', x: 15, y: 20 },
      { id: 'select', icon: 'UserSearch', label: 'Select Player', x: 50, y: 20 },
      { id: 'rate', icon: 'Star', label: 'Rate 5 Metrics', x: 85, y: 20 },
      { id: 'save', icon: 'Save', label: 'Auto-Save', x: 65, y: 70 },
      { id: 'next', icon: 'ChevronRight', label: 'Next Player', x: 30, y: 70 },
    ],
    edges: [
      { from: 'session', to: 'select' },
      { from: 'select', to: 'rate' },
      { from: 'rate', to: 'save' },
      { from: 'save', to: 'next' },
      { from: 'next', to: 'select' },
    ],
  },

  // ── Youth Session Flow ───────────────────────────────────────────────────
  'youth-session-flow': {
    id: 'youth-session-flow',
    title: 'Youth Session Structure',
    description: 'The standard 45-minute youth session format.',
    icon: 'BookOpen',
    type: 'process-flow',
    steps: [
      {
        icon: 'HeartPulse',
        label: 'Warm-Up (10 min)',
        description: 'Fun movement games — tag, animal walks, relays to get everyone active.',
      },
      {
        icon: 'Target',
        label: 'Skill Focus (15 min)',
        description: 'One age-appropriate basketball skill with short demonstrations.',
      },
      {
        icon: 'Gamepad2',
        label: 'Game Time (15 min)',
        description: 'Modified small-sided games that reinforce the session skill.',
      },
      {
        icon: 'Wind',
        label: 'Cool Down (5 min)',
        description: 'Stretching, high-fives, and a positive summary of the session.',
      },
    ],
  },

  // ── Parent Invitation Flow ───────────────────────────────────────────────
  'parent-invitation-flow': {
    id: 'parent-invitation-flow',
    title: 'Parent Invitation Process',
    description: 'How parents get connected to their child in the system.',
    icon: 'UserPlus',
    type: 'flowchart',
    nodes: [
      { id: 'create', icon: 'Link', label: 'Admin Creates Link', x: 15, y: 30 },
      { id: 'signup', icon: 'UserPlus', label: 'Parent Signs Up', x: 50, y: 30 },
      { id: 'linked', icon: 'Users', label: 'Auto-linked to Child', x: 85, y: 30 },
    ],
    edges: [
      { from: 'create', to: 'signup' },
      { from: 'signup', to: 'linked' },
    ],
  },

  // ── Tryout to Team Pipeline ──────────────────────────────────────────────
  'tryout-to-team-pipeline': {
    id: 'tryout-to-team-pipeline',
    title: 'Tryout to Team Pipeline',
    description: 'End-to-end flow from creating a tryout session to final team placement.',
    icon: 'BarChart3',
    type: 'flowchart',
    nodes: [
      { id: 'create-session', icon: 'CalendarPlus', label: 'Create Session', x: 15, y: 20 },
      { id: 'assign-assessors', icon: 'UserCheck', label: 'Assign Assessors', x: 50, y: 20 },
      { id: 'collect-scores', icon: 'ClipboardCheck', label: 'Collect Scores', x: 85, y: 20 },
      { id: 'team-placement', icon: 'Users', label: 'Team Placement', x: 50, y: 75 },
    ],
    edges: [
      { from: 'create-session', to: 'assign-assessors' },
      { from: 'assign-assessors', to: 'collect-scores' },
      { from: 'collect-scores', to: 'team-placement' },
    ],
  },
};

/** Look up an infographic by its ID */
export const getInfographic = (id) => INFOGRAPHICS[id] || null;
