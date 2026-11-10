export interface EquipmentItem {
  id: string;
  name: string;
  type: 'weapon' | 'armor';
  category: 'greatsword' | 'dagger' | 'bow' | 'staff' | 'chest' | 'helmet' | 'legs';
  tier: 'common' | 'rare' | 'epic' | 'legendary';
  baseAttack?: number;
  defense?: number;
  hpBonus?: number;
  speedBonus?: number;
  attackSpeed?: number;
  range?: number;
  modelPath: string;
  creator: string;
  updatedAt: string;
}

export const INITIAL_EQUIPMENT_DATA: EquipmentItem[] = [
  {
    id: 'wp_iron_greatsword',
    name: 'Iron Greatsword',
    type: 'weapon',
    category: 'greatsword',
    tier: 'common',
    baseAttack: 18,
    attackSpeed: 0.9,
    range: 2.2,
    modelPath: 'res://assets/models/adventurers/sword_2handed_color.gltf',
    creator: 'System / Base Preset',
    updatedAt: '2026-11-08',
  },
  {
    id: 'wp_shadow_dagger',
    name: 'Shadowfang Dagger',
    type: 'weapon',
    category: 'dagger',
    tier: 'rare',
    baseAttack: 12,
    attackSpeed: 1.6,
    range: 1.2,
    modelPath: 'res://assets/models/weapons/dagger_shadow.glb',
    creator: 'Valerius',
    updatedAt: '2026-11-09',
  },
  {
    id: 'wp_archmage_staff',
    name: 'Astral Ember Staff',
    type: 'weapon',
    category: 'staff',
    tier: 'epic',
    baseAttack: 26,
    attackSpeed: 1.1,
    range: 5.5,
    modelPath: 'res://assets/models/weapons/staff_ember.glb',
    creator: 'Morgana',
    updatedAt: '2026-11-10',
  },
  {
    id: 'wp_windrunner_bow',
    name: 'Windrunner Composite Bow',
    type: 'weapon',
    category: 'bow',
    tier: 'rare',
    baseAttack: 16,
    attackSpeed: 1.3,
    range: 7.0,
    modelPath: 'res://assets/models/weapons/bow_composite.glb',
    creator: 'Sylas',
    updatedAt: '2026-11-07',
  },
  {
    id: 'ar_iron_plate',
    name: 'Knight Iron Plate Armor',
    type: 'armor',
    category: 'chest',
    tier: 'common',
    defense: 22,
    hpBonus: 120,
    speedBonus: -0.1,
    modelPath: 'res://assets/models/armor/plate_knight.glb',
    creator: 'System / Base Preset',
    updatedAt: '2026-11-08',
  },
  {
    id: 'ar_drakescale_helm',
    name: 'Drakescale War Helmet',
    type: 'armor',
    category: 'helmet',
    tier: 'epic',
    defense: 16,
    hpBonus: 85,
    speedBonus: 0,
    modelPath: 'res://assets/models/armor/helm_drake.glb',
    creator: 'Grommash',
    updatedAt: '2026-11-10',
  },
  {
    id: 'ar_shadow_greaves',
    name: 'Silent Nightstalker Greaves',
    type: 'armor',
    category: 'legs',
    tier: 'legendary',
    defense: 18,
    hpBonus: 95,
    speedBonus: 0.35,
    modelPath: 'res://assets/models/armor/legs_nightstalker.glb',
    creator: 'Nocturne',
    updatedAt: '2026-11-10',
  },
];

