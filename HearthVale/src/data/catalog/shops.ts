import type { ShopDefinition } from './types.js';

export const SHOPS: ShopDefinition[] = [
  {
    id: 'shop_hearthvale_general',
    displayName: 'Vale General Goods',
    npcId: 'merchant_silas',
    itemIds: [
      'healing_brew', 'mana_draught', 'stamina_snack', 'antidote_leaf',
      'hearth_charm', 'wooden_blade', 'leather_cap', 'traveler_tunic',
    ],
  },
  {
    id: 'shop_hearthvale_herbalist',
    displayName: 'Clover & Kettle',
    npcId: 'herbalist_lyra',
    itemIds: [
      'healing_brew', 'greater_healing_brew', 'mana_draught',
      'antidote_leaf', 'warding_incense', 'gale_tonic', 'dawnpetal_elixir',
    ],
  },
  {
    id: 'shop_millwick_trader',
    displayName: 'Millwick Riverside Trade',
    npcId: 'merchant_elsie',
    itemIds: [
      'greater_healing_brew', 'mana_draught', 'warding_incense', 'gale_tonic',
      'moonwater_phial', 'heartwater_draught', 'cinder_cordial', 'clover_dagger', 'bark_buckler',
      'miners_helm', 'moonstone_ring',
    ],
  },
  {
    id: 'shop_hearthstone_bakery',
    displayName: 'Hearthstone Bakery',
    npcId: 'baker_odella',
    itemIds: ['stamina_snack', 'healing_brew', 'greater_healing_brew'],
  },
  {
    id: 'shop_dawnshore_supply',
    displayName: 'Dawnshore Coast Supply',
    npcId: 'quartermaster_vesa',
    itemIds: [
      'greater_healing_brew', 'mana_draught', 'stamina_snack', 'warding_incense',
      'shoreline_stew', 'brineward_tonic', 'stormclear_draught', 'tempest_cordial', 'hearth_charm',
    ],
  },
  {
    id: 'shop_beaconfall_outfitter',
    displayName: 'Beaconfall Outfitter',
    npcId: 'cliffsmith_roan',
    itemIds: [
      'greater_healing_brew', 'mana_draught', 'stamina_snack', 'clarity_tonic',
      'sunward_philter', 'starfall_elixir', 'stormclear_draught', 'hearth_charm', 'cliffwalker_boots',
    ],
  },
  {
    id: 'shop_highland_provisions',
    displayName: 'Highland Provisions',
    npcId: 'trader_vesper',
    itemIds: [
      'greater_healing_brew', 'mana_draught', 'clarity_tonic', 'mending_salve',
      'horizon_draught', 'zenith_restorative', 'hearth_charm', 'sunmetal_greaves',
    ],
  },
  {
    id: 'shop_choirwood_resonance',
    displayName: 'Choirwood Resonance Works',
    npcId: 'cantor_eira',
    itemIds: [
      'greater_healing_brew', 'mana_draught', 'clearvoice_tisane', 'choirwood_tonic',
      'crownroot_cordial', 'hearth_charm', 'resonance_bracer', 'bellglass_ward',
    ],
  },
  {
    id: 'shop_runeveil_engraving',
    displayName: 'Runeveil Wayglass Works',
    npcId: 'runesmith_sera',
    itemIds: [
      'greater_healing_brew', 'mana_draught', 'runeveil_broth', 'scriptwater_draught',
      'hearth_charm', 'embermark_rune', 'bastion_rune', 'runesmith_maul',
    ],
  },
  {
    id: 'shop_waystar_commissary',
    displayName: 'Waystar Commissary',
    npcId: 'quartermaster_fenn',
    itemIds: [
      'greater_healing_brew', 'mana_draught', 'anchorcord_tea', 'startrail_stew',
      'hearth_charm', 'waystar_rune', 'convergence_rune', 'waystar_cowl',
    ],
  },
];

export const SHOP_BY_ID = new Map(SHOPS.map((shop) => [shop.id, shop]));
export const SHOP_BY_NPC_ID = new Map(SHOPS.map((shop) => [shop.npcId, shop]));
