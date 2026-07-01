import type { NpcDefinition } from './types.js';

export const NPCS: NpcDefinition[] = [
  {
    id: 'elder',
    displayName: 'Elder Gemhorn',
    role: 'quest',
    title: 'Vale Elder',
    dialogue: [
      'Welcome to Hearthlight Vale, traveler. The lanterns burn brighter now that you are here.',
      'Old Millwick has gone quiet, and I fear a letter of mine never reached him.',
      'When your legs are steady — say, level eight — come back and I will ask a favor of you.',
    ],
  },
  {
    id: 'merchant_silas',
    displayName: 'Merchant Silas',
    role: 'merchant',
    title: 'General Goods',
    dialogue: [
      'Potions, rope, a lantern or two — everything a green adventurer forgets to pack.',
      'Coin up front, and I will not ask where the monsters found it.',
    ],
  },
  {
    id: 'hearth_courier',
    displayName: 'Hearth Courier',
    role: 'warp',
    title: 'Warp Keeper',
    dialogue: [
      'Need to be somewhere yesterday? The hearth-lines run to every town that will have me.',
      'Step onto the glow and I will fold the road beneath your feet — for a modest fee.',
    ],
  },
  {
    id: 'innkeeper_mara',
    displayName: 'Innkeeper Mara',
    role: 'flavor',
    title: 'Innkeeper',
    dialogue: [
      'A warm bed and warmer stew — the Hearthlight Inn never turns a tired soul away.',
      'Rest here and the road will feel kinder in the morning, I promise you that.',
    ],
  },
  {
    id: 'trainer_bram',
    displayName: 'Trainer Bram',
    role: 'trainer',
    title: 'Combat Trainer',
    dialogue: [
      'Grip loose, weight low, eyes on the whole field — that is how you live past level one.',
      'Bring me proof of your first honest hunt and I will teach you a thing or two.',
    ],
  },
  {
    id: 'herbalist_lyra',
    displayName: 'Herbalist Lyra',
    role: 'merchant',
    title: 'Herbalist',
    dialogue: [
      'Cloverleaf salve, mushroom tonic, a pinch of moonpetal — I stock what the fields give up.',
      'Fresh cuttings today. The plains have been generous since the rains.',
    ],
  },
  {
    id: 'scout_pip',
    displayName: 'Scout Pip',
    role: 'quest',
    title: 'Field Scout',
    dialogue: [
      'Keep low in the clover — the plains look calm until something with teeth disagrees.',
      'I have been mapping the far hedgerows. Could use sharp eyes out there before long.',
    ],
  },
  {
    id: 'mycologist_fern',
    displayName: 'Mycologist Fern',
    role: 'quest',
    title: 'Mycologist',
    dialogue: [
      'The Hollow breathes, you know — spores in, spores out, all day and night.',
      'Some caps glow, some bite back. I could use a runner to gather the harmless sort.',
    ],
  },
  {
    id: 'ranger_elowen',
    displayName: 'Ranger Elowen',
    role: 'quest',
    title: 'Whisperwood Ranger',
    dialogue: [
      'The Whisperwood remembers every footstep. Tread it with respect.',
      'Something has been thinning the deer trails. Walk with me and we may learn what.',
    ],
  },
  {
    id: 'miller_tobin',
    displayName: 'Miller Tobin',
    role: 'flavor',
    title: 'Miller',
    dialogue: [
      'Wheel turns, stone grinds, flour flies — same song every day and I love it still.',
      'Mind the sacks by the door. Trip over one and the whole town hears about it.',
    ],
  },
  {
    id: 'caravan_guard',
    displayName: 'Caravan Guard',
    role: 'flavor',
    title: 'Caravan Guard',
    dialogue: [
      'Eyes open, blade oiled. The road pays best to those who reach the end of it.',
      'We roll for the riverside town come dawn. Long haul, but the ale is worth it.',
    ],
  },
  {
    id: 'mayor_holt',
    displayName: 'Mayor Holt',
    role: 'quest',
    title: 'Town Mayor',
    dialogue: [
      'Riverside welcomes you. Keep your boots dry and your temper drier.',
      'The docks have troubles I would rather solve quietly. Perhaps you are the quiet sort.',
    ],
  },
  {
    id: 'merchant_elsie',
    displayName: 'Merchant Elsie',
    role: 'merchant',
    title: 'Riverside Trader',
    dialogue: [
      'Goods off the barges, fresh as the tide — I undercut the town square and sleep fine for it.',
      'Haggle if you like, but my prices already float lower than most.',
    ],
  },
  {
    id: 'prospector_garrick',
    displayName: 'Prospector Garrick',
    role: 'quest',
    title: 'Prospector',
    dialogue: [
      'These foothills are lousy with crystal, if you know where the seams hide.',
      'My last dig ran into something that dug back. Might pay a brave soul to have a look.',
    ],
  },
  {
    id: 'watcher_seren',
    displayName: 'Watcher Seren',
    role: 'quest',
    title: 'Moonwell Watcher',
    dialogue: [
      'The Moonwell only opens to those it deems ready. Patience, wanderer.',
      'Bring me the sigil the glade keeps hidden — near level ten, when your spirit can bear it.',
    ],
  },
];

export const NPC_BY_ID = new Map(NPCS.map((n) => [n.id, n]));
