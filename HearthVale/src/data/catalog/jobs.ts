import type { JobClassDefinition } from './types.js';

/**
 * Starter-region character job classes — HearthVale original IP.
 *
 * Every character begins as the tier-0 **Vale Novice** and, on reaching the
 * job-change level, branches into one of six tier-1 paths themed to the
 * Hearthlight Vale world. The active Phaser client consumes these paths,
 * growth values, roles, and starting skills directly.
 */
export const JOB_CLASSES: JobClassDefinition[] = [
  {
    id: 'novice',
    displayName: 'Vale Novice',
    tier: 0,
    role: 'novice',
    requiredLevel: 1,
    primaryStat: 'vit',
    description:
      'Every newcomer to Hearthlight Vale starts here — a balanced footing before choosing a path.',
    growth: { hp: 12, mp: 4, atk: 2, def: 2, matk: 2, spr: 2 },
    startingSkills: ['basic_strike', 'first_aid'],
  },
  {
    id: 'warden',
    displayName: 'Vale Warden',
    tier: 1,
    role: 'melee',
    baseClassId: 'novice',
    requiredLevel: 10,
    primaryStat: 'str',
    description:
      'Sword-and-shield defenders of the vale who hold the line and shrug off heavy blows.',
    growth: { hp: 26, mp: 4, atk: 6, def: 7, matk: 1, spr: 3 },
    startingSkills: ['guard_stance', 'shield_bash', 'vale_slash'],
    masteries: [
      {
        id: 'bulwark_keeper',
        displayName: 'Bulwark Keeper',
        description: 'Become an unshakable anchor with a deeper health reserve and heavier guard.',
        requiredLevel: 18,
        bonuses: { hp: 70, def: 8 },
      },
      {
        id: 'dawnsworn_edge',
        displayName: 'Dawnsworn Edge',
        description: 'Turn the warden path toward decisive counterstrikes and critical pressure.',
        requiredLevel: 18,
        bonuses: { atk: 8, crit: 5 },
      },
    ],
    evolutions: [
      {
        id: 'hearthwall_marshal', displayName: 'Hearthwall Marshal', requiredLevel: 28,
        unlockQuestId: 'quest_convergence_rite', skillId: 'citadel_oath',
        description: 'Carry the whole party behind a living wall whose promise does not yield.',
        bonuses: { hp: 90, def: 10 },
      },
      {
        id: 'dawnspear_vanguard', displayName: 'Dawnspear Vanguard', requiredLevel: 28,
        unlockQuestId: 'quest_convergence_rite', skillId: 'sunward_cleave',
        description: 'Turn a Warden’s patient guard into a bright first step through every threat.',
        bonuses: { atk: 10, crit: 7 },
      },
    ],
  },
  {
    id: 'ranger',
    displayName: 'Glade Ranger',
    tier: 1,
    role: 'ranged',
    baseClassId: 'novice',
    requiredLevel: 10,
    primaryStat: 'dex',
    description:
      'Keen-eyed hunters who thin threats from afar and mark quarry across the glades.',
    growth: { hp: 16, mp: 8, atk: 6, def: 3, matk: 2, spr: 3 },
    startingSkills: ['keen_shot', 'thornvolley', 'hunters_mark'],
    masteries: [
      {
        id: 'farwatch_eye',
        displayName: 'Farwatch Eye',
        description: 'Read distant openings with stronger shots and a keen critical eye.',
        requiredLevel: 18,
        bonuses: { crit: 10, powerPercent: 8 },
      },
      {
        id: 'briar_runner',
        displayName: 'Briar Runner',
        description: 'Keep ahead of the hunt with swift attacks and trail-hardened endurance.',
        requiredLevel: 18,
        bonuses: { spd: 10, hp: 30 },
      },
    ],
    evolutions: [
      {
        id: 'waystar_stalker', displayName: 'Waystar Stalker', requiredLevel: 28,
        unlockQuestId: 'quest_convergence_rite', skillId: 'meteor_fletching',
        description: 'Follow falling lights through rough country and loose arrows before they fade.',
        bonuses: { spd: 12, crit: 8 },
      },
      {
        id: 'farpoint_sentinel', displayName: 'Farpoint Sentinel', requiredLevel: 28,
        unlockQuestId: 'quest_convergence_rite', skillId: 'horizon_piercer',
        description: 'Choose one distant opening and make every measured shot answer it.',
        bonuses: { atk: 10, powerPercent: 10 },
      },
    ],
  },
  {
    id: 'channeler',
    displayName: 'Thorn Channeler',
    tier: 1,
    role: 'magic',
    baseClassId: 'novice',
    requiredLevel: 10,
    primaryStat: 'int',
    description:
      'Elemental casters who draw on the vale’s living growth and crystal veins for burst damage.',
    growth: { hp: 12, mp: 16, atk: 2, def: 2, matk: 8, spr: 4 },
    startingSkills: ['sprout_bolt', 'ember_wisp', 'crystal_lance'],
    masteries: [
      {
        id: 'prism_savant',
        displayName: 'Prism Savant',
        description: 'Shape a broader mana well into spells that strike with amplified force.',
        requiredLevel: 18,
        bonuses: { mp: 40, powerPercent: 12 },
      },
      {
        id: 'wildspark_adept',
        displayName: 'Wildspark Adept',
        description: 'Trade patient study for quick-cycling invocations and raw arcane attack.',
        requiredLevel: 18,
        bonuses: { spd: 10, atk: 6 },
      },
    ],
    evolutions: [
      {
        id: 'convergence_magus', displayName: 'Convergence Magus', requiredLevel: 28,
        unlockQuestId: 'quest_convergence_rite', skillId: 'prismatic_collapse',
        description: 'Hold several elemental truths together until their shared answer breaks free.',
        bonuses: { mp: 50, powerPercent: 15 },
      },
      {
        id: 'stormbloom_seer', displayName: 'Stormbloom Seer', requiredLevel: 28,
        unlockQuestId: 'quest_convergence_rite', skillId: 'stormbloom',
        description: 'Read weather in living petals and cast at the speed of its turning.',
        bonuses: { spd: 12, atk: 8 },
      },
    ],
  },
  {
    id: 'mender',
    displayName: 'Hearth Mender',
    tier: 1,
    role: 'support',
    baseClassId: 'novice',
    requiredLevel: 10,
    primaryStat: 'wis',
    description:
      'Warding healers whose blessings keep a lone wanderer standing through long hunts.',
    growth: { hp: 15, mp: 14, atk: 2, def: 3, matk: 5, spr: 8 },
    startingSkills: ['mend_wounds', 'warding_light', 'hearth_blessing'],
    masteries: [
      {
        id: 'hearthkeeper',
        displayName: 'Hearthkeeper',
        description: 'Carry a warmer flame that strengthens every heal and steadies your own heart.',
        requiredLevel: 18,
        bonuses: { healingPercent: 20, hp: 45 },
      },
      {
        id: 'wardcaller',
        displayName: 'Wardcaller',
        description: 'Deepen your mana reserve and layer lasting protection over the party.',
        requiredLevel: 18,
        bonuses: { def: 7, mp: 30 },
      },
    ],
    evolutions: [
      {
        id: 'beacon_saint', displayName: 'Beacon Saint', requiredLevel: 28,
        unlockQuestId: 'quest_convergence_rite', skillId: 'waystar_liturgy',
        description: 'Keep a far-traveling light that finds every companion who still needs it.',
        bonuses: { healingPercent: 25, hp: 60 },
      },
      {
        id: 'concord_aegis', displayName: 'Concord Aegis', requiredLevel: 28,
        unlockQuestId: 'quest_convergence_rite', skillId: 'constellation_ward',
        description: 'Join many small wards into one patient shelter beneath the night sky.',
        bonuses: { def: 10, mp: 40 },
      },
    ],
  },
  {
    id: 'wayfarer',
    displayName: 'Wayfarer Trader',
    tier: 1,
    role: 'artisan',
    baseClassId: 'novice',
    requiredLevel: 10,
    primaryStat: 'str',
    description:
      'Road-worn merchants who barter, haul, and sniff out ore — the vale’s economy on two feet.',
    growth: { hp: 20, mp: 6, atk: 5, def: 4, matk: 1, spr: 4 },
    startingSkills: ['haggle', 'pushcart', 'ore_sense'],
    masteries: [
      {
        id: 'trailbroker',
        displayName: 'Trailbroker',
        description: 'Secure better terms at every stall and pack more supplies for the long road.',
        requiredLevel: 18,
        bonuses: { buyPrice: -5, stackMax: 20 },
      },
      {
        id: 'relic_seeker',
        displayName: 'Relic Seeker',
        description: 'Move quickly between hidden caches and coax rarer finds from the wilds.',
        requiredLevel: 18,
        bonuses: { dropRate: 12, spd: 7 },
      },
    ],
    evolutions: [
      {
        id: 'grand_trailbroker', displayName: 'Grand Trailbroker', requiredLevel: 28,
        unlockQuestId: 'quest_convergence_rite', skillId: 'provisioners_chant',
        description: 'Make every road a supply line and every fair bargain a promise kept.',
        bonuses: { buyPrice: -6, stackMax: 25 },
      },
      {
        id: 'starprospector', displayName: 'Starprospector', requiredLevel: 28,
        unlockQuestId: 'quest_convergence_rite', skillId: 'prospectors_luck',
        description: 'Read fallen starlight like ore seams and arrive before their richest glimmer cools.',
        bonuses: { dropRate: 15, spd: 8 },
      },
    ],
  },
  {
    id: 'shade',
    displayName: 'Hollow Shade',
    tier: 1,
    role: 'scout',
    baseClassId: 'novice',
    requiredLevel: 10,
    primaryStat: 'agi',
    description:
      'Nimble skirmishers who strike from the hollows, twist behind foes, and vanish again.',
    growth: { hp: 18, mp: 7, atk: 7, def: 3, matk: 2, spr: 2 },
    startingSkills: ['shadowstep', 'twin_fang', 'pilfer'],
    masteries: [
      {
        id: 'nightglass_blade',
        displayName: 'Nightglass Blade',
        description: 'Commit to razor-thin openings with vicious critical and finishing power.',
        requiredLevel: 18,
        bonuses: { crit: 12, powerPercent: 8 },
      },
      {
        id: 'hollow_dancer',
        displayName: 'Hollow Dancer',
        description: 'Slip through danger in a blur of speed, feints, and practiced evasion.',
        requiredLevel: 18,
        bonuses: { evasion: 12, spd: 10 },
      },
    ],
    evolutions: [
      {
        id: 'gloam_reaver', displayName: 'Gloam Reaver', requiredLevel: 28,
        unlockQuestId: 'quest_convergence_rite', skillId: 'manyroad_execution',
        description: 'Find the one ending hidden among a hundred possible roads and strike there.',
        bonuses: { crit: 15, powerPercent: 10 },
      },
      {
        id: 'mirrorstep_dancer', displayName: 'Mirrorstep Dancer', requiredLevel: 28,
        unlockQuestId: 'quest_convergence_rite', skillId: 'mirrorstep_flurry',
        description: 'Leave bright afterimages on every path an enemy believed you would take.',
        bonuses: { evasion: 15, spd: 12 },
      },
    ],
  },
];

export const JOB_CLASS_BY_ID = new Map(JOB_CLASSES.map((j) => [j.id, j]));

/** Advanced classes a given base class can branch into. */
export const JOB_CLASSES_BY_BASE_ID = JOB_CLASSES.reduce((map, job) => {
  if (job.baseClassId) {
    const list = map.get(job.baseClassId) ?? [];
    list.push(job);
    map.set(job.baseClassId, list);
  }
  return map;
}, new Map<string, JobClassDefinition[]>());
