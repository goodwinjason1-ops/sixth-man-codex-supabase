/**
 * Youth Programs Data
 * Little Lakers (Ages 4-5) & Lakers Ready (Ages 6-7)
 */

// Program type constants
export const PROGRAM_TYPES = {
  LITTLE_LAKERS: 'little_lakers',
  LAKERS_READY: 'lakers_ready'
};

export const PROGRAM_CONFIG = {
  [PROGRAM_TYPES.LITTLE_LAKERS]: {
    id: PROGRAM_TYPES.LITTLE_LAKERS,
    name: 'Little Lakers',
    ageRange: '4-5',
    minAge: 4,
    maxAge: 5,
    sessionDuration: 45,
    totalWeeks: 6,
    color: 'from-yellow-400 to-orange-500',
    bgColor: 'bg-yellow-500/20',
    textColor: 'text-yellow-400',
    borderColor: 'border-yellow-500',
    emoji: '\uD83C\uDFC0',
    description: 'Fun, movement, and coordination through play-based basketball activities',
    focus: ['Fun & engagement', 'Movement & coordination', 'Basic ball handling', 'Social skills', 'Parent involvement']
  },
  [PROGRAM_TYPES.LAKERS_READY]: {
    id: PROGRAM_TYPES.LAKERS_READY,
    name: 'Lakers Ready',
    ageRange: '6-7',
    minAge: 6,
    maxAge: 7,
    sessionDuration: 60,
    totalWeeks: 8,
    color: 'from-emerald-400 to-cyan-500',
    bgColor: 'bg-emerald-500/20',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500',
    emoji: '\uD83C\uDF1F',
    description: 'Introduction to basketball basics, skills, and teamwork',
    focus: ['Basketball fundamentals', 'Skill progression', 'Teamwork', 'Game introduction', 'Light competition']
  }
};

// Developmental milestones
export const MILESTONES = {
  [PROGRAM_TYPES.LITTLE_LAKERS]: [
    { id: 'll-m1', label: 'Can dribble ball 5+ steps', category: 'ball-handling' },
    { id: 'll-m2', label: 'Can catch a bounced ball', category: 'catching' },
    { id: 'll-m3', label: 'Follows simple instructions', category: 'listening' },
    { id: 'll-m4', label: 'Participates with enthusiasm', category: 'engagement' },
    { id: 'll-m5', label: 'Comfortable handling a basketball', category: 'ball-handling' },
    { id: 'll-m6', label: 'Shows coordination improvement', category: 'movement' },
    { id: 'll-m7', label: 'Can roll ball to a partner', category: 'passing' },
    { id: 'll-m8', label: 'Runs and stops on command', category: 'movement' },
    { id: 'll-m9', label: 'Plays well with others', category: 'social' },
    { id: 'll-m10', label: 'Attempts to bounce and catch ball', category: 'ball-handling' }
  ],
  [PROGRAM_TYPES.LAKERS_READY]: [
    { id: 'lr-m1', label: 'Can dribble with control (both standing and moving)', category: 'ball-handling' },
    { id: 'lr-m2', label: 'Understands and executes basic passing (chest pass)', category: 'passing' },
    { id: 'lr-m3', label: 'Attempts proper shooting form', category: 'shooting' },
    { id: 'lr-m4', label: 'Knows and holds defensive stance', category: 'defense' },
    { id: 'lr-m5', label: 'Participates in small-sided games', category: 'game-play' },
    { id: 'lr-m6', label: 'Shows teamwork and sharing the ball', category: 'teamwork' },
    { id: 'lr-m7', label: 'Follows game rules and takes turns', category: 'sportsmanship' },
    { id: 'lr-m8', label: 'Can dribble with non-dominant hand', category: 'ball-handling' },
    { id: 'lr-m9', label: 'Understands basic court boundaries', category: 'game-play' },
    { id: 'lr-m10', label: 'Attempts layup motion', category: 'shooting' },
    { id: 'lr-m11', label: 'Shows hustle and effort', category: 'engagement' },
    { id: 'lr-m12', label: 'Can perform defensive slides', category: 'defense' }
  ]
};

// Milestone status options
export const MILESTONE_STATUS = {
  NOT_STARTED: 'not_started',
  IMPROVING: 'improving',
  ACHIEVED: 'achieved'
};

// Activity library - Little Lakers (Ages 4-5)
export const LITTLE_LAKERS_ACTIVITIES = [
  {
    id: 'll-a1',
    name: 'Red Light, Green Light (with Ball)',
    program: PROGRAM_TYPES.LITTLE_LAKERS,
    category: 'movement',
    duration: 8,
    equipment: ['Basketballs (1 per child)', 'Open space'],
    instructions: 'Children dribble (or carry) the ball forward on "Green Light" and stop on "Red Light". Add "Yellow Light" for slow walking. Coach faces away and turns around to catch movers.',
    keyPoints: ['Encourage keeping the ball close', 'Praise stopping quickly', 'Keep it fun and silly'],
    variations: ['Easier: Walk with ball in hands', 'Harder: Must dribble while moving', 'Add animal movements on Yellow Light'],
    safetyNotes: 'Ensure enough space between children. Watch for collisions when stopping.',
    funRating: 5,
    icon: 'traffic-light'
  },
  {
    id: 'll-a2',
    name: 'Balloon Dribble',
    program: PROGRAM_TYPES.LITTLE_LAKERS,
    category: 'coordination',
    duration: 6,
    equipment: ['Balloons (1 per child)', 'Basketballs (1 per child)'],
    instructions: 'Children try to keep a balloon in the air using one hand while holding or dribbling a basketball with the other. This builds coordination and multi-tasking.',
    keyPoints: ['Focus on gentle taps', 'Ball control is secondary to fun', 'Celebrate any attempts'],
    variations: ['Easier: Just keep balloon up (no ball)', 'Medium: Hold ball while tapping balloon', 'Harder: Dribble ball while tapping balloon'],
    safetyNotes: 'Pop balloons that deflate to avoid choking hazard. No balloon pieces on floor.',
    funRating: 5,
    icon: 'balloon'
  },
  {
    id: 'll-a3',
    name: 'Treasure Hunt Dribble',
    program: PROGRAM_TYPES.LITTLE_LAKERS,
    category: 'ball-handling',
    duration: 10,
    equipment: ['Basketballs', 'Colored cones (scattered)', 'Small toys or bean bags'],
    instructions: 'Hide small objects (bean bags or toy animals) under cones spread across the court. Children dribble to a cone, lift it to check for treasure, then dribble to the next one.',
    keyPoints: ['Encourage dribbling between cones', 'Celebrate finding treasures', 'Keep distances short for little legs'],
    variations: ['Easier: Carry the ball and walk', 'Harder: Must dribble the whole time', 'Team version: collect treasures together'],
    safetyNotes: 'Ensure cones are soft/lightweight. Avoid small objects that could be put in mouths.',
    funRating: 5,
    icon: 'treasure'
  },
  {
    id: 'll-a4',
    name: 'Animal Walks',
    program: PROGRAM_TYPES.LITTLE_LAKERS,
    category: 'movement',
    duration: 8,
    equipment: ['Open space', 'Optional: animal picture cards'],
    instructions: 'Coach calls out animals and children move like them: Bear crawl, crab walk, kangaroo hops, flamingo balance, frog jumps, penguin waddle. Add ball challenges over time.',
    keyPoints: ['Builds core strength and coordination', 'Keep energy high with sound effects', 'Demonstrate each animal first'],
    variations: ['Easier: Just animal movements', 'Medium: Carry ball while moving', 'Harder: Dribble ball in animal stance (where possible)'],
    safetyNotes: 'Watch for fatigue in bear crawls. Ensure soft surface for frog jumps.',
    funRating: 5,
    icon: 'animal'
  },
  {
    id: 'll-a5',
    name: 'Ball Rolling Bowling',
    program: PROGRAM_TYPES.LITTLE_LAKERS,
    category: 'passing',
    duration: 7,
    equipment: ['Basketballs', 'Empty bottles or tall cones (6-10)'],
    instructions: 'Set up pins (bottles/cones) at one end. Children roll the basketball to knock them down. Teaches aim, control, and rolling with two hands.',
    keyPoints: ['Two hands on the ball', 'Step forward and push', 'Cheer for knocked pins'],
    variations: ['Easier: Move closer to pins', 'Harder: Use one hand, move further back', 'Add scoring for fun'],
    safetyNotes: 'Use lightweight bottles. Keep children behind a line while others roll.',
    funRating: 4,
    icon: 'bowling'
  },
  {
    id: 'll-a6',
    name: 'Passing Circle',
    program: PROGRAM_TYPES.LITTLE_LAKERS,
    category: 'passing',
    duration: 6,
    equipment: ['Basketballs (2-3 for group)', 'Cones for circle markers'],
    instructions: 'Children sit or stand in a circle and roll the ball to each other. Say the name of the person you roll to. Add multiple balls as they get comfortable.',
    keyPoints: ['Eye contact before rolling', 'Say the persons name', 'Push with two hands'],
    variations: ['Easier: Seated, one ball', 'Medium: Standing, two balls', 'Harder: Bounce pass instead of roll'],
    safetyNotes: 'Seated version safer for 4-year-olds. Space children apart enough.',
    funRating: 3,
    icon: 'circle'
  },
  {
    id: 'll-a7',
    name: 'Freeze Dance Basketball',
    program: PROGRAM_TYPES.LITTLE_LAKERS,
    category: 'ball-handling',
    duration: 8,
    equipment: ['Basketballs (1 per child)', 'Music speaker'],
    instructions: 'Play music. Children dribble or bounce the ball while dancing. When music stops, everyone freezes with ball held still. Last to freeze does a silly dance.',
    keyPoints: ['Encourage bouncing with music', 'Freeze with ball on hip or overhead', 'Keep it celebratory not punitive'],
    variations: ['Easier: Hold ball and dance', 'Medium: Bounce ball while music plays', 'Harder: Must be dribbling when music stops'],
    safetyNotes: 'Clear space of obstacles. Use kid-friendly music at moderate volume.',
    funRating: 5,
    icon: 'music'
  },
  {
    id: 'll-a8',
    name: 'Color Cone Tag',
    program: PROGRAM_TYPES.LITTLE_LAKERS,
    category: 'movement',
    duration: 8,
    equipment: ['Colored cones (multiple colors)', 'Basketballs optional'],
    instructions: 'Scatter colored cones around the court. Coach calls a color and children run to touch that color cone. Last one there does 3 jumping jacks. Add dribbling for progression.',
    keyPoints: ['Listen carefully for the color', 'Run safely (no pushing)', 'Quick direction changes'],
    variations: ['Easier: Walk to cones', 'Medium: Run to cones', 'Harder: Dribble to cones', 'Expert: Dribble with non-dominant hand'],
    safetyNotes: 'Spread cones widely to prevent crowding. Ensure no slippery spots.',
    funRating: 4,
    icon: 'tag'
  },
  {
    id: 'll-a9',
    name: 'Ball Balancing Challenges',
    program: PROGRAM_TYPES.LITTLE_LAKERS,
    category: 'coordination',
    duration: 6,
    equipment: ['Basketballs (1 per child)'],
    instructions: 'Series of challenges: Balance ball on head (with hands), hold ball behind back, pass ball around waist, between legs, toss and catch. Coach demonstrates each.',
    keyPoints: ['Go slow and demonstrate', 'Celebrate all attempts', 'Its okay to drop the ball!'],
    variations: ['Easier: Seated challenges only', 'Medium: Standing challenges', 'Harder: Walking while doing challenges'],
    safetyNotes: 'Soft surface preferred. Watch for balls rolling underfoot.',
    funRating: 3,
    icon: 'balance'
  },
  {
    id: 'll-a10',
    name: 'Partner Toss & Catch',
    program: PROGRAM_TYPES.LITTLE_LAKERS,
    category: 'catching',
    duration: 7,
    equipment: ['Soft/foam basketballs or regular basketballs'],
    instructions: 'Pair children up, standing 1-2 meters apart. Toss underhand to partner who catches with two hands. Take one step back after 3 successful catches.',
    keyPoints: ['Hands out ready (show me your alligator mouth)', 'Watch the ball into your hands', 'Soft gentle tosses'],
    variations: ['Easier: Roll to partner instead', 'Medium: Underhand toss', 'Harder: Bounce to partner'],
    safetyNotes: 'Use size-appropriate balls. Foam balls for youngest children.',
    funRating: 3,
    icon: 'catch'
  },
  {
    id: 'll-a11',
    name: 'Obstacle Course Adventure',
    program: PROGRAM_TYPES.LITTLE_LAKERS,
    category: 'movement',
    duration: 12,
    equipment: ['Cones', 'Hoops', 'Pool noodles', 'Small hurdles', 'Basketballs'],
    instructions: 'Set up a fun obstacle course: weave through cones, jump over noodles, hop through hoops, crawl under a bar, then toss ball at a target. Children go one at a time.',
    keyPoints: ['Demonstrate the full course first', 'Encourage not rush', 'Add ball to course gradually'],
    variations: ['Easier: No ball, just movement', 'Medium: Carry ball through course', 'Harder: Dribble through parts of course'],
    safetyNotes: 'Pad any hard edges. Ensure stable obstacles. Have spotters at tricky parts.',
    funRating: 5,
    icon: 'obstacle'
  },
  {
    id: 'll-a12',
    name: 'Sharks and Minnows (Ball Version)',
    program: PROGRAM_TYPES.LITTLE_LAKERS,
    category: 'movement',
    duration: 8,
    equipment: ['Basketballs (1 per minnow)', 'Cones for boundary'],
    instructions: 'One child (shark) stands in the middle. Others (minnows) dribble or carry their ball from one side to the other without getting tagged. Tagged minnows become sharks.',
    keyPoints: ['Keep ball close while running', 'Look up to avoid the shark', 'Change direction to dodge'],
    variations: ['Easier: Carry ball, walk only', 'Medium: Carry ball, run', 'Harder: Must dribble across'],
    safetyNotes: 'Gentle tags only (two-hand touch). Clear boundaries.',
    funRating: 5,
    icon: 'shark'
  },
  {
    id: 'll-a13',
    name: 'Musical Hoops',
    program: PROGRAM_TYPES.LITTLE_LAKERS,
    category: 'movement',
    duration: 7,
    equipment: ['Hula hoops (one fewer than children)', 'Music speaker', 'Basketballs optional'],
    instructions: 'Like musical chairs but with hoops on the floor. When music stops, find a hoop to stand in. Instead of elimination, removed children do a fun activity on the side (bounce ball 10 times).',
    keyPoints: ['No elimination version keeps everyone active', 'Side activity keeps them engaged', 'Add basketball holds while moving'],
    variations: ['Easier: Same hoops as children', 'Medium: One fewer hoop', 'Harder: Dribble while music plays'],
    safetyNotes: 'Hoops should be flat on floor. No pushing to get into hoops.',
    funRating: 4,
    icon: 'music'
  },
  {
    id: 'll-a14',
    name: 'Target Toss',
    program: PROGRAM_TYPES.LITTLE_LAKERS,
    category: 'throwing',
    duration: 6,
    equipment: ['Soft basketballs', 'Hula hoops (laid flat) or buckets'],
    instructions: 'Place targets (hoops flat on ground, buckets, or boxes) at short distances. Children toss the ball underhand trying to land in the target. Move closer/further as needed.',
    keyPoints: ['Underhand toss', 'Step forward and release', 'Follow through with hands'],
    variations: ['Easier: Very close targets', 'Medium: Mix of distances', 'Harder: Smaller targets further away'],
    safetyNotes: 'Use soft balls. Clear area behind targets.',
    funRating: 4,
    icon: 'target'
  },
  {
    id: 'll-a15',
    name: 'Follow the Leader Dribble',
    program: PROGRAM_TYPES.LITTLE_LAKERS,
    category: 'ball-handling',
    duration: 6,
    equipment: ['Basketballs (1 per child)'],
    instructions: 'Coach leads a line of children around the court doing different dribble/ball activities: high dribble, low dribble, stop and hold, spin in circle, march in place with ball. Let children take turns leading.',
    keyPoints: ['Go slow enough for everyone', 'Mix in silly movements', 'Rotate leaders to build confidence'],
    variations: ['Easier: Hold ball and follow movements', 'Medium: Bounce and follow', 'Harder: Continuous dribble while following'],
    safetyNotes: 'Maintain spacing between children. Go slow on turns.',
    funRating: 4,
    icon: 'leader'
  },
  {
    id: 'll-a16',
    name: 'Bubble Pop Dribble',
    program: PROGRAM_TYPES.LITTLE_LAKERS,
    category: 'ball-handling',
    duration: 6,
    equipment: ['Basketballs', 'Bubble machine or manual bubbles'],
    instructions: 'Coach blows bubbles across the court. Children dribble their ball while trying to pop bubbles with their free hand. Combines dribbling focus with excitement.',
    keyPoints: ['Keep dribbling while popping', 'Use free hand for bubbles', 'Stay in your space'],
    variations: ['Easier: Hold ball, pop bubbles', 'Medium: Stationary dribble, pop nearby bubbles', 'Harder: Moving dribble chasing bubbles'],
    safetyNotes: 'Ensure floor doesnt get slippery from bubble solution. Non-toxic bubbles only.',
    funRating: 5,
    icon: 'bubbles'
  },
  {
    id: 'll-a17',
    name: 'Simon Says Basketball',
    program: PROGRAM_TYPES.LITTLE_LAKERS,
    category: 'listening',
    duration: 7,
    equipment: ['Basketballs (1 per child)'],
    instructions: 'Classic Simon Says with basketball moves: "Simon says bounce the ball", "Simon says hold the ball over your head", "Simon says sit on the ball". Builds listening and ball familiarity.',
    keyPoints: ['Use clear basketball actions', 'Go slowly for young ones', 'Celebrate good listening'],
    variations: ['Easier: All commands with "Simon says"', 'Medium: Mix in trick commands', 'Harder: Faster pace with dribbling commands'],
    safetyNotes: 'Avoid sitting on ball for very small children (balance risk).',
    funRating: 4,
    icon: 'listen'
  },
  {
    id: 'll-a18',
    name: 'Dribble & Count',
    program: PROGRAM_TYPES.LITTLE_LAKERS,
    category: 'ball-handling',
    duration: 5,
    equipment: ['Basketballs (1 per child)'],
    instructions: 'Children bounce the ball and count each bounce out loud. Goal: how many bounces can you do in a row? Coach counts along. Celebrate personal bests.',
    keyPoints: ['Push the ball down, dont slap', 'Count together as a group', 'Celebrate every improvement'],
    variations: ['Easier: Two-hand bounces', 'Medium: One-hand bounces', 'Harder: Alternate hands each bounce'],
    safetyNotes: 'Ensure enough spacing so balls dont collide.',
    funRating: 3,
    icon: 'count'
  },
  {
    id: 'll-a19',
    name: 'Tunnel Ball',
    program: PROGRAM_TYPES.LITTLE_LAKERS,
    category: 'passing',
    duration: 6,
    equipment: ['Basketballs (1 per team of 4-5)'],
    instructions: 'Children stand in a line with legs wide apart. Last person rolls the ball through everyones legs to the front. Front person picks it up and runs to the back.',
    keyPoints: ['Legs wide like a tunnel', 'Roll gently and straight', 'Cheer for teammates'],
    variations: ['Easier: Wider spacing, bigger ball', 'Medium: Standard spacing', 'Harder: Overhead pass back instead of rolling'],
    safetyNotes: 'Ensure stable footing. Watch for heads bumping when bending.',
    funRating: 4,
    icon: 'tunnel'
  },
  {
    id: 'll-a20',
    name: 'Clean Up Your Room',
    program: PROGRAM_TYPES.LITTLE_LAKERS,
    category: 'throwing',
    duration: 8,
    equipment: ['Basketballs and foam balls (lots)', 'Dividing line or net'],
    instructions: 'Split court in half. Each team has balls on their side. On "go", throw/roll balls to the other side. When whistle blows, team with fewer balls on their side wins. Repeat!',
    keyPoints: ['Use two hands to throw', 'Keep moving and throwing', 'Its okay to be silly'],
    variations: ['Easier: Roll only', 'Medium: Underhand throws', 'Harder: Must bounce ball to other side'],
    safetyNotes: 'Use soft/foam balls. No throwing at people.',
    funRating: 5,
    icon: 'cleanup'
  }
];

// Activity library - Lakers Ready (Ages 6-7)
export const LAKERS_READY_ACTIVITIES = [
  {
    id: 'lr-a1',
    name: 'Dribbling Obstacle Course',
    program: PROGRAM_TYPES.LAKERS_READY,
    category: 'ball-handling',
    duration: 10,
    equipment: ['Cones', 'Chairs', 'Pool noodle arches', 'Basketballs'],
    instructions: 'Set up a course: weave through cones, dribble under noodle arches, around chairs, through a gate, and finish with a shot. Time each player for motivation.',
    keyPoints: ['Eyes up while dribbling', 'Keep ball at waist height', 'Control over speed'],
    variations: ['Easier: Walk through, no timer', 'Medium: Light jog, timed', 'Harder: Sprint, use weak hand on return'],
    safetyNotes: 'Pad chair legs. Ensure noodle arches are stable.',
    funRating: 5,
    icon: 'obstacle'
  },
  {
    id: 'lr-a2',
    name: 'Passing Relay Races',
    program: PROGRAM_TYPES.LAKERS_READY,
    category: 'passing',
    duration: 8,
    equipment: ['Basketballs (1 per team)', 'Cones for lanes'],
    instructions: 'Teams of 4-5 in lines. First person chest passes to second, who passes to third, etc. Last person dribbles to the front. First team to rotate everyone wins.',
    keyPoints: ['Step into your pass', 'Hands ready to receive', 'Call for the ball'],
    variations: ['Easier: Bounce pass instead', 'Medium: Chest pass', 'Harder: Overhead pass, must be caught cleanly'],
    safetyNotes: 'Proper spacing between teams. Ensure pass distance is appropriate.',
    funRating: 4,
    icon: 'relay'
  },
  {
    id: 'lr-a3',
    name: 'Shooting Form Practice',
    program: PROGRAM_TYPES.LAKERS_READY,
    category: 'shooting',
    duration: 10,
    equipment: ['Basketballs', 'Low hoops or wall targets'],
    instructions: 'Teach B-E-E-F: Balance, Eyes on target, Elbow in, Follow through. Practice shooting motion without hoop first, then at wall target, then at lowered hoop. Focus on form not makes.',
    keyPoints: ['B-E-E-F technique', 'Form over power', 'Flick the wrist like reaching into a cookie jar'],
    variations: ['Easier: Close to wall, two-hand push', 'Medium: Short distance to low hoop', 'Harder: Standard distance, track makes'],
    safetyNotes: 'Lower hoops to 7-8 feet. Use appropriate size balls (size 5).',
    funRating: 3,
    icon: 'shooting'
  },
  {
    id: 'lr-a4',
    name: '1v1 Keep Away',
    program: PROGRAM_TYPES.LAKERS_READY,
    category: 'game-play',
    duration: 8,
    equipment: ['Basketballs', 'Cones for small squares'],
    instructions: 'Pairs in small squares (3m x 3m). Offensive player protects ball while dribbling. Defensive player tries to tip or steal. Switch every 30 seconds. Count successful steals.',
    keyPoints: ['Protect ball with body', 'Stay low on defense', 'Keep dribble alive'],
    variations: ['Easier: Bigger square, gentle defense', 'Medium: Standard', 'Harder: Smaller square, 2v1'],
    safetyNotes: 'No reaching across body. Two-hand touch steals only.',
    funRating: 4,
    icon: 'keepaway'
  },
  {
    id: 'lr-a5',
    name: 'Cone Dribbling Patterns',
    program: PROGRAM_TYPES.LAKERS_READY,
    category: 'ball-handling',
    duration: 8,
    equipment: ['Cones (5-8 per line)', 'Basketballs'],
    instructions: 'Set cones in a line 1.5m apart. Players weave through with right hand going right, left hand going left. Practice crossover at each cone.',
    keyPoints: ['Push ball forward not down', 'Low dribble through cones', 'Head up between cones'],
    variations: ['Easier: Wider spacing, walking pace', 'Medium: Standard spacing, jogging', 'Harder: Tight spacing, crossovers required'],
    safetyNotes: 'Use soft cones that wont trip players.',
    funRating: 3,
    icon: 'cones'
  },
  {
    id: 'lr-a6',
    name: 'Partner Chest Pass Challenge',
    program: PROGRAM_TYPES.LAKERS_READY,
    category: 'passing',
    duration: 7,
    equipment: ['Basketballs (1 per pair)', 'Cones for distance markers'],
    instructions: 'Partners face each other at 2m distance. Make 5 good chest passes each, then step back one step. See which pair can make passes from the furthest distance.',
    keyPoints: ['Step toward your target', 'Thumbs down on release', 'Catch with soft hands'],
    variations: ['Easier: Bounce pass version', 'Medium: Chest pass', 'Harder: One-hand pass, moving targets'],
    safetyNotes: 'Ensure adequate spacing between pairs.',
    funRating: 3,
    icon: 'pass'
  },
  {
    id: 'lr-a7',
    name: 'Layup Introduction',
    program: PROGRAM_TYPES.LAKERS_READY,
    category: 'shooting',
    duration: 10,
    equipment: ['Basketballs', 'Low basket or taped wall target', 'Footprint stickers optional'],
    instructions: 'Break layup into 3 steps: 1) Pick up ball, 2) Step-step (right-left for right side), 3) Jump and release. Use footprint markers. Practice without ball first, then add ball.',
    keyPoints: ['Right side = left foot takeoff', 'Knee up high', 'Soft touch off the backboard'],
    variations: ['Easier: Standing layup (no approach)', 'Medium: Walking approach', 'Harder: Jogging approach from wing'],
    safetyNotes: 'Lower basket. Ensure safe landing area. One player at hoop at a time.',
    funRating: 4,
    icon: 'layup'
  },
  {
    id: 'lr-a8',
    name: 'Defensive Slide Drills',
    program: PROGRAM_TYPES.LAKERS_READY,
    category: 'defense',
    duration: 7,
    equipment: ['Cones for lanes', 'Optional: pool noodle for coach'],
    instructions: 'Players in athletic stance (wide feet, butt down, hands up). Slide left on coach whistle, slide right on double whistle. Coach can use noodle to check stance height.',
    keyPoints: ['Stay low - sit in your chair', 'Dont cross feet', 'Hands active and wide'],
    variations: ['Easier: Short slides, walking pace', 'Medium: Full court slides', 'Harder: React to ball movement, closeouts'],
    safetyNotes: 'Ensure non-slippery surface. Watch for ankle rolls on quick direction changes.',
    funRating: 3,
    icon: 'defense'
  },
  {
    id: 'lr-a9',
    name: '3v3 Mini Games',
    program: PROGRAM_TYPES.LAKERS_READY,
    category: 'game-play',
    duration: 12,
    equipment: ['Basketballs', '2 low hoops or cones as goals', 'Pinnies/bibs'],
    instructions: 'Half-court 3v3 games with simplified rules: must pass twice before shooting, no stealing from hands (only intercepts), score = 1 point. First to 5 wins. Rotate teams.',
    keyPoints: ['Pass before you shoot', 'Find the open teammate', 'Get back on defense'],
    variations: ['Easier: 2v2 with coach helping', 'Medium: 3v3 standard', 'Harder: 4v4, add dribble limits'],
    safetyNotes: 'Matched teams by size. No hard fouls - explain fouls first.',
    funRating: 5,
    icon: 'game'
  },
  {
    id: 'lr-a10',
    name: 'Ball Handling Circuit',
    program: PROGRAM_TYPES.LAKERS_READY,
    category: 'ball-handling',
    duration: 10,
    equipment: ['Basketballs (1 per child)', 'Cones for stations'],
    instructions: '4 stations, 2 minutes each: 1) Figure-8 through legs, 2) Crossover dribbles, 3) Behind-the-back wrap, 4) Speed dribble sprint. Rotate on whistle.',
    keyPoints: ['Quality over speed', 'Keep the ball moving', 'Challenge yourself each round'],
    variations: ['Easier: Simpler moves at each station', 'Medium: As described', 'Harder: Add a fifth station with combo moves'],
    safetyNotes: 'Enough space between stations. Non-slip surface.',
    funRating: 4,
    icon: 'circuit'
  },
  {
    id: 'lr-a11',
    name: 'Knockout',
    program: PROGRAM_TYPES.LAKERS_READY,
    category: 'shooting',
    duration: 10,
    equipment: ['Basketballs (2)', 'Hoop'],
    instructions: 'Line up at free throw line. First two players have balls. Player 1 shoots. If they miss, Player 2 tries to make their shot before Player 1 makes theirs. Make it = go to back. Knocked out = practice dribbling on side.',
    keyPoints: ['Quick follow-up shots', 'Rebound your own ball', 'Stay engaged when out (practice on side)'],
    variations: ['Easier: Closer shooting distance', 'Medium: Free throw line', 'Harder: Further back'],
    safetyNotes: 'No running under the basket. Take turns collecting rebounds.',
    funRating: 5,
    icon: 'knockout'
  },
  {
    id: 'lr-a12',
    name: 'Dribble Tag',
    program: PROGRAM_TYPES.LAKERS_READY,
    category: 'ball-handling',
    duration: 8,
    equipment: ['Basketballs (1 per child)', 'Cones for boundary'],
    instructions: 'Everyone dribbles inside the boundary. Two players are "it" (wear pinnies). Tag others while dribbling. If tagged or you lose your ball, do 5 jumping jacks then return.',
    keyPoints: ['Must maintain dribble', 'Protect your ball', 'Use change of pace to escape'],
    variations: ['Easier: Walking only', 'Medium: Jogging', 'Harder: Must use weak hand, smaller boundary'],
    safetyNotes: 'Soft tags only. Clear boundary markers.',
    funRating: 5,
    icon: 'tag'
  },
  {
    id: 'lr-a13',
    name: 'Hot Shot Shooting Game',
    program: PROGRAM_TYPES.LAKERS_READY,
    category: 'shooting',
    duration: 8,
    equipment: ['Basketballs', 'Cones for shooting spots', 'Hoop'],
    instructions: 'Place 5 cones at different spots around the key. Players rotate through spots. Make a shot = move to next spot. First to complete all 5 spots wins. Everyone cheers for each make.',
    keyPoints: ['Use proper form at each spot', 'Be patient - aim then shoot', 'Celebrate teammates makes'],
    variations: ['Easier: All spots close to basket', 'Medium: Mix of distances', 'Harder: Must make 2 at each spot'],
    safetyNotes: 'One shooter per hoop at a time. Queue behind cone.',
    funRating: 4,
    icon: 'hotshot'
  },
  {
    id: 'lr-a14',
    name: 'Two-Ball Dribbling',
    program: PROGRAM_TYPES.LAKERS_READY,
    category: 'ball-handling',
    duration: 7,
    equipment: ['Basketballs (2 per child)'],
    instructions: 'Challenge: dribble two balls at once. Start standing still with alternating bounces. Progress to walking. This dramatically improves weak-hand coordination.',
    keyPoints: ['Start with alternating rhythm', 'Stay low', 'Its okay to lose control - pick up and try again'],
    variations: ['Easier: One bounce each ball, catch, repeat', 'Medium: Continuous alternating', 'Harder: Both at same time, walking'],
    safetyNotes: 'Extra space needed per player. Loose balls everywhere!',
    funRating: 4,
    icon: 'twoball'
  },
  {
    id: 'lr-a15',
    name: 'Steal the Bacon (Basketball)',
    program: PROGRAM_TYPES.LAKERS_READY,
    category: 'game-play',
    duration: 8,
    equipment: ['Basketball (1)', 'Cones for team lines'],
    instructions: 'Two teams line up on opposite sides, numbered 1-5. Coach puts ball in middle and calls a number. That number from each team races to the ball. Player who gets it tries to score before other player can defend.',
    keyPoints: ['React quickly to your number', 'Protect the ball when you get it', 'Play defense even if you didnt get the ball'],
    variations: ['Easier: Just race to ball, no scoring', 'Medium: Score on mini hoop', 'Harder: Call two numbers for 2v2'],
    safetyNotes: 'Avoid head collisions - approach from sides. Soft play only.',
    funRating: 5,
    icon: 'steal'
  },
  {
    id: 'lr-a16',
    name: 'Passing Accuracy Challenge',
    program: PROGRAM_TYPES.LAKERS_READY,
    category: 'passing',
    duration: 7,
    equipment: ['Basketballs', 'Hula hoops (hung or held)', 'Wall targets'],
    instructions: 'Set up targets on the wall (hula hoops, tape squares). Players chest pass to hit the target from increasing distances. Track hits for friendly competition.',
    keyPoints: ['Step and push', 'Aim for center of target', 'Follow through toward target'],
    variations: ['Easier: Large targets, close distance', 'Medium: Standard', 'Harder: Moving targets (partner holds hoop and moves)'],
    safetyNotes: 'Wall should be smooth. Stand behind passing line.',
    funRating: 4,
    icon: 'target'
  },
  {
    id: 'lr-a17',
    name: 'Speed Dribble Races',
    program: PROGRAM_TYPES.LAKERS_READY,
    category: 'ball-handling',
    duration: 6,
    equipment: ['Basketballs', 'Cones for start/finish'],
    instructions: 'Players race from baseline to half court and back while dribbling. Must maintain control. If ball gets away, stop and get it before continuing. Track personal bests.',
    keyPoints: ['Push ball out in front', 'Long dribbles for speed', 'Control is more important than speed'],
    variations: ['Easier: Walking race', 'Medium: Jogging', 'Harder: Sprint, weak hand on return'],
    safetyNotes: 'One direction at a time. Clear lane.',
    funRating: 4,
    icon: 'race'
  },
  {
    id: 'lr-a18',
    name: 'Defensive Mirror Drill',
    program: PROGRAM_TYPES.LAKERS_READY,
    category: 'defense',
    duration: 7,
    equipment: ['Cones for lanes'],
    instructions: 'Partners face each other. One is the leader who moves side to side, forward, backward. The other mirrors their movements in defensive stance. Switch every 30 seconds.',
    keyPoints: ['Stay in athletic stance', 'React to hips not feet', 'Hands active'],
    variations: ['Easier: Slow movements only', 'Medium: Mix of speeds', 'Harder: Add ball - leader dribbles, defender mirrors'],
    safetyNotes: 'Keep space between pairs. No contact.',
    funRating: 3,
    icon: 'mirror'
  },
  {
    id: 'lr-a19',
    name: 'Around the World',
    program: PROGRAM_TYPES.LAKERS_READY,
    category: 'shooting',
    duration: 10,
    equipment: ['Basketballs', 'Hoop', 'Cones for spots'],
    instructions: 'Set 5-7 shooting spots in an arc around the basket. Make a shot to advance. Miss = stay at that spot. First to complete all spots and come back wins. Can play individually or as teams.',
    keyPoints: ['Consistent form at each spot', 'Adjust power for distance', 'Cheer for others'],
    variations: ['Easier: Close spots, 3 spots only', 'Medium: Standard 5 spots', 'Harder: 7 spots, must swish to advance'],
    safetyNotes: 'One shooter at a time. Line behind cones.',
    funRating: 5,
    icon: 'world'
  },
  {
    id: 'lr-a20',
    name: 'Pivot & Protect',
    program: PROGRAM_TYPES.LAKERS_READY,
    category: 'footwork',
    duration: 6,
    equipment: ['Basketballs (1 per pair)'],
    instructions: 'Teach pivot foot concept. Player holds ball, establishes pivot foot. Partner tries to reach for ball. Pivoting player spins and protects using body. Switch after 4 pivots.',
    keyPoints: ['Keep pivot foot planted', 'Ball away from defender', 'Chin the ball (hold tight)'],
    variations: ['Easier: No defender, just practice pivoting', 'Medium: Light defense', 'Harder: Pivot then pass to open teammate'],
    safetyNotes: 'Light reaching only. No grabbing.',
    funRating: 3,
    icon: 'pivot'
  },
  {
    id: 'lr-a21',
    name: 'Full Court Relay',
    program: PROGRAM_TYPES.LAKERS_READY,
    category: 'conditioning',
    duration: 8,
    equipment: ['Basketballs (1 per team)', 'Cones'],
    instructions: 'Teams of 4. Player 1 dribbles to half court, passes to Player 2 who dribbles to the end and passes to Player 3 going back. Fastest team with no turnovers wins.',
    keyPoints: ['Controlled dribble then crisp pass', 'Hands ready to receive', 'Communicate with your team'],
    variations: ['Easier: Walk and pass', 'Medium: Jog and pass', 'Harder: Sprint, must chest pass only'],
    safetyNotes: 'One team per lane. Clear handoff zones.',
    funRating: 4,
    icon: 'relay'
  },
  {
    id: 'lr-a22',
    name: 'King of the Court',
    program: PROGRAM_TYPES.LAKERS_READY,
    category: 'game-play',
    duration: 10,
    equipment: ['Basketball', 'Hoop'],
    instructions: '1v1 games to 2. Winner stays on. New challenger enters from the line. King gets the ball first. Great for competitive players. Non-playing kids practice dribbling.',
    keyPoints: ['Play hard but fair', 'Use your moves', 'Good defense can win too'],
    variations: ['Easier: Must take 2 dribbles first', 'Medium: Standard 1v1', 'Harder: 2v2 king of the court'],
    safetyNotes: 'Matched by size when possible. Call fouls clearly.',
    funRating: 5,
    icon: 'crown'
  },
  {
    id: 'lr-a23',
    name: 'Outlet Pass Drill',
    program: PROGRAM_TYPES.LAKERS_READY,
    category: 'passing',
    duration: 7,
    equipment: ['Basketballs', 'Cones'],
    instructions: 'One player rebounds (coach tosses ball off backboard). Rebounder pivots and makes outlet pass to wing player. Wing catches and dribbles to the other end. Rotate positions.',
    keyPoints: ['Chin the rebound', 'Pivot to see the floor', 'Strong accurate pass'],
    variations: ['Easier: Coach hands ball, player passes', 'Medium: Rebound then pass', 'Harder: Add a defender on the passer'],
    safetyNotes: 'Watch elbows on rebounds. Clear spacing on outlet.',
    funRating: 3,
    icon: 'outlet'
  },
  {
    id: 'lr-a24',
    name: 'Sharks and Dribblers',
    program: PROGRAM_TYPES.LAKERS_READY,
    category: 'ball-handling',
    duration: 8,
    equipment: ['Basketballs (1 per dribbler)', 'Cones for boundary', 'Pinnies'],
    instructions: 'Advanced version of Sharks & Minnows. All dribblers must maintain their dribble. Sharks try to knock balls away. Lost dribble = become a shark. Last dribbler standing wins.',
    keyPoints: ['Low, controlled dribble', 'Shield ball with body', 'Keep head up to see sharks'],
    variations: ['Easier: Large boundary', 'Medium: Half court', 'Harder: Quarter court only'],
    safetyNotes: 'Only knock ball - no body contact on steals.',
    funRating: 5,
    icon: 'shark'
  },
  {
    id: 'lr-a25',
    name: 'Free Throw Routine',
    program: PROGRAM_TYPES.LAKERS_READY,
    category: 'shooting',
    duration: 8,
    equipment: ['Basketballs', 'Hoop'],
    instructions: 'Teach a consistent free throw routine: 1) Feet set, 2) Bounce ball 3 times, 3) Look at rim, 4) Bend knees, 5) Shoot with BEEF form. Each player gets 5 shots. Track makes.',
    keyPoints: ['Same routine every time', 'Take your time', 'Breathe and focus'],
    variations: ['Easier: Closer than free throw line', 'Medium: Free throw line', 'Harder: Pressure: must make 2 in a row to sit down'],
    safetyNotes: 'One shooter at a time. Rebounders stay aware.',
    funRating: 3,
    icon: 'freethrow'
  },
  {
    id: 'lr-a26',
    name: 'Skill Challenge Circuit',
    program: PROGRAM_TYPES.LAKERS_READY,
    category: 'mixed',
    duration: 12,
    equipment: ['Full equipment set', 'Station cards'],
    instructions: '6 stations, 90 seconds each: 1) Dribble weave, 2) Passing targets, 3) Layups, 4) Defensive slides, 5) Free throws, 6) 1v1. Rotate on whistle. Record scores at each.',
    keyPoints: ['Max effort at each station', 'Transition quickly', 'Track your own improvement'],
    variations: ['Easier: 4 stations, 2 min each', 'Medium: 6 stations as described', 'Harder: 8 stations with advanced moves'],
    safetyNotes: 'Adult or older player at each station to supervise.',
    funRating: 5,
    icon: 'circuit'
  },
  {
    id: 'lr-a27',
    name: 'Crossover Move Practice',
    program: PROGRAM_TYPES.LAKERS_READY,
    category: 'ball-handling',
    duration: 7,
    equipment: ['Basketballs', 'Cones'],
    instructions: 'Teach the basic crossover: low dribble, push ball from one hand to the other in front. Practice stationary first, then at a walk approaching a cone, then at a jog.',
    keyPoints: ['Low and quick', 'Push ball across, dont carry', 'Sell the fake with your shoulder'],
    variations: ['Easier: Stationary crossovers', 'Medium: Walking at cone', 'Harder: Jog, crossover, attack past cone'],
    safetyNotes: 'Adequate spacing. Smooth surface preferred.',
    funRating: 4,
    icon: 'crossover'
  },
  {
    id: 'lr-a28',
    name: 'Team Scrimmage',
    program: PROGRAM_TYPES.LAKERS_READY,
    category: 'game-play',
    duration: 12,
    equipment: ['Basketballs', 'Pinnies', 'Scoreboard'],
    instructions: '4v4 or 5v5 modified scrimmage. Rules: must pass 3 times before shooting, call own fouls, sub every 3 minutes. Coach referees and teaches during stoppages.',
    keyPoints: ['Move without the ball', 'Share the ball', 'Transition defense'],
    variations: ['Easier: 3v3 half court', 'Medium: 4v4 full court', 'Harder: 5v5 with positions'],
    safetyNotes: 'Equal teams. Sub frequently. Stop play to teach.',
    funRating: 5,
    icon: 'scrimmage'
  },
  {
    id: 'lr-a29',
    name: 'Rebound Wars',
    program: PROGRAM_TYPES.LAKERS_READY,
    category: 'rebounding',
    duration: 7,
    equipment: ['Basketball', 'Hoop'],
    instructions: 'Coach shoots and misses on purpose. Two players box out and compete for the rebound. Player who gets it tries to score. Teaches positioning and effort on the boards.',
    keyPoints: ['Find your player, make contact', 'Wide base, butt out', 'Go up strong with two hands'],
    variations: ['Easier: No box out, just rebound', 'Medium: Box out then rebound', 'Harder: 2v2 rebounding battles'],
    safetyNotes: 'No pushing in the back. Elbows down.',
    funRating: 4,
    icon: 'rebound'
  },
  {
    id: 'lr-a30',
    name: 'End of Session Shootout',
    program: PROGRAM_TYPES.LAKERS_READY,
    category: 'shooting',
    duration: 5,
    equipment: ['Basketballs', 'Hoop'],
    instructions: 'Fun end to every session: each player gets 3 shots from a spot of their choice. Make all 3 = pick next sessions warm-up game. Everyone cheers. High fives all around.',
    keyPoints: ['Pick a spot you feel confident at', 'Focus and have fun', 'Celebrate every make'],
    variations: ['Easier: Choose from 3 close spots', 'Medium: Any spot inside the arc', 'Harder: One shot from the 3-point line'],
    safetyNotes: 'Orderly queue. One shooter at a time.',
    funRating: 5,
    icon: 'shootout'
  }
];

// All activities combined
export const ALL_ACTIVITIES = [...LITTLE_LAKERS_ACTIVITIES, ...LAKERS_READY_ACTIVITIES];

// Weekly curriculum templates
export const LITTLE_LAKERS_CURRICULUM = [
  {
    week: 1,
    theme: 'Welcome to Basketball!',
    focus: 'Ball introduction and comfort',
    activities: ['ll-a7', 'll-a9', 'll-a10', 'll-a17'],
    warmUp: 'Free play with balls - bounce, roll, toss',
    coolDown: 'Circle time: "What did you learn today?"',
    parentTip: 'At home, let your child bounce and play with any ball. Comfort with a ball starts with fun!'
  },
  {
    week: 2,
    theme: 'Move Your Body!',
    focus: 'Movement and coordination',
    activities: ['ll-a4', 'll-a8', 'll-a11', 'll-a13'],
    warmUp: 'Animal parade around the court',
    coolDown: 'Stretch like a starfish, shrink like a ball',
    parentTip: 'Practice animal walks at home - bear crawls, frog jumps. Builds core strength for basketball!'
  },
  {
    week: 3,
    theme: 'Bounce It!',
    focus: 'Basic dribbling introduction',
    activities: ['ll-a1', 'll-a15', 'll-a16', 'll-a18'],
    warmUp: 'Bounce the ball and count together',
    coolDown: 'Who can bounce the most times? Personal bests!',
    parentTip: 'Encourage bouncing the ball at home. Count bounces together. Any surface works!'
  },
  {
    week: 4,
    theme: 'Pass It On!',
    focus: 'Rolling, tossing, and catching',
    activities: ['ll-a5', 'll-a6', 'll-a14', 'll-a19'],
    warmUp: 'Roll ball to a partner, switch partners each time',
    coolDown: 'Partner high-fives and ball exchange',
    parentTip: 'Roll a ball back and forth with your child at home. Then try gentle underhand tosses!'
  },
  {
    week: 5,
    theme: 'Game Time Fun!',
    focus: 'Active games with basketball skills',
    activities: ['ll-a3', 'll-a12', 'll-a20', 'll-a2'],
    warmUp: 'Dribble freeze tag',
    coolDown: 'Show off your best bounce!',
    parentTip: 'Play catch at the park. Any ball works. Focus on watching the ball into the hands.'
  },
  {
    week: 6,
    theme: 'Super Stars Showcase!',
    focus: 'Celebration and skill demonstration',
    activities: ['ll-a11', 'll-a7', 'll-a1', 'll-a10'],
    warmUp: 'Warm-up dance party with balls',
    coolDown: 'Award ceremony: everyone gets a high-five parade!',
    parentTip: 'Celebrate your childs progress! They have learned so many new skills. Keep bouncing at home!'
  }
];

export const LAKERS_READY_CURRICULUM = [
  {
    week: 1,
    theme: 'Ball Handling Basics',
    focus: 'Dribbling fundamentals',
    activities: ['lr-a5', 'lr-a10', 'lr-a12', 'lr-a30'],
    warmUp: 'Ball handling warm-up (wraps, figure-8s)',
    coolDown: 'Dribble challenge: most bounces in 30 seconds',
    parentTip: 'Practice dribbling at home for 5 minutes daily. Challenge: dribble while watching TV!'
  },
  {
    week: 2,
    theme: 'Passing Power',
    focus: 'Chest pass and bounce pass',
    activities: ['lr-a2', 'lr-a6', 'lr-a16', 'lr-a30'],
    warmUp: 'Partner passing warm-up (20 passes each type)',
    coolDown: 'Passing accuracy contest',
    parentTip: 'Practice passing against a wall. Mark a target with tape. 20 passes a day builds great habits!'
  },
  {
    week: 3,
    theme: 'Shooting Form',
    focus: 'B-E-E-F shooting technique',
    activities: ['lr-a3', 'lr-a13', 'lr-a25', 'lr-a30'],
    warmUp: 'Form shooting close to basket',
    coolDown: 'Free throw challenge',
    parentTip: 'Remember B-E-E-F: Balance, Eyes, Elbow, Follow-through. Practice the motion even without a hoop!'
  },
  {
    week: 4,
    theme: 'Defense Wins',
    focus: 'Defensive stance and slides',
    activities: ['lr-a8', 'lr-a18', 'lr-a4', 'lr-a30'],
    warmUp: 'Defensive stance hold (30 seconds x 3)',
    coolDown: 'Mirror drill contest',
    parentTip: 'Practice the defensive stance at home: feet wide, butt low, hands up. Hold for 30 seconds!'
  },
  {
    week: 5,
    theme: 'Layup Introduction',
    focus: 'Layup footwork and technique',
    activities: ['lr-a7', 'lr-a20', 'lr-a1', 'lr-a30'],
    warmUp: 'Footwork patterns: right-left-up, left-right-up',
    coolDown: 'Layup line (everyone gets 5 attempts)',
    parentTip: 'Practice the layup steps without a ball: step-step-jump. Right side = left foot takeoff!'
  },
  {
    week: 6,
    theme: 'Game Play',
    focus: 'Small-sided games and rules',
    activities: ['lr-a9', 'lr-a15', 'lr-a22', 'lr-a30'],
    warmUp: 'Dynamic stretching with ball',
    coolDown: 'Team debrief: what worked well?',
    parentTip: 'Watch a basketball game together. Point out passing, defense, and teamwork!'
  },
  {
    week: 7,
    theme: 'Skill Combo Week',
    focus: 'Combining skills in game situations',
    activities: ['lr-a26', 'lr-a21', 'lr-a27', 'lr-a30'],
    warmUp: 'Full skill warm-up circuit (2 min each)',
    coolDown: 'Personal skill assessment: what improved most?',
    parentTip: 'Encourage your child to practice their weakest skill. Growth comes from the challenge!'
  },
  {
    week: 8,
    theme: 'Lakers Ready Showcase',
    focus: 'Skills demo and celebration game',
    activities: ['lr-a28', 'lr-a11', 'lr-a26', 'lr-a30'],
    warmUp: 'Warm-up game chosen by last weeks shootout winner',
    coolDown: 'Awards, photos, and celebration!',
    parentTip: 'Your child has completed Lakers Ready! They are ready for team basketball. Keep practicing!'
  }
];

// Coach resources / tips
export const COACH_TIPS = {
  [PROGRAM_TYPES.LITTLE_LAKERS]: [
    'Keep activities to 5-8 minutes max. Young attention spans need variety.',
    'Use animal names for moves (kangaroo jumps, bear dribbles) to keep it fun.',
    'Always demonstrate before asking kids to do something.',
    'Praise effort over results. Every bounce is a win!',
    'Include parents when possible - they can be helpers and partners.',
    'Have a consistent routine: Warm-up, Activity 1, Water, Activity 2, Activity 3, Cool-down.',
    'Use music! Kids respond to rhythm and movement.',
    'Keep equipment bright and colorful. Boring = disengaged.',
    'End every session on a high note with a fun game.',
    'Prepare 20% more activities than you think you need.'
  ],
  [PROGRAM_TYPES.LAKERS_READY]: [
    'Start with ball handling every session - it builds confidence.',
    'Use the sandwich method: skill drill, fun game, skill drill.',
    'Let kids experience success before adding challenge.',
    'Small-sided games (3v3) teach more than standing in lines.',
    'Rotate groups every 7-8 minutes to maintain energy.',
    'Use scorekeeping sparingly - focus on effort and improvement.',
    'Demonstrate in slow motion, then at speed.',
    'Let players suggest warm-up games to build ownership.',
    'End every session with free throws or a shooting game.',
    'Celebrate personal bests, not just the best players.'
  ]
};
