import { create } from 'zustand';
import {
  type MonsterStats,
  type MonsterTier,
  type MonsterBehavior,
  calculateMaxBudget,
  computeDerivedStats,
} from '../types/stat.types';

export interface MonsterListItem extends MonsterStats {
  updatedAt: string;
}

const DEFAULT_MONSTERS: MonsterListItem[] = [
  {
    id: 'skeleton_guard_01',
    name: 'Abyssal Skeleton Guard',
    tier: 'normal',
    level: 5,
    behavior: 'aggressive',
    str: 12,
    agi: 8,
    vit: 14,
    int: 4,
    dex: 7,
    luk: 5,
    maxHp: 393,
    attackDamage: 66,
    defense: 26,
    moveSpeed: 3.2,
    expReward: 105,
    drops: [{ itemId: 'bone_fragment', dropRate: 0.85 }],
    updatedAt: '2026-11-10',
  },
  {
    id: 'dungeon_elite_knight',
    name: 'Corrupted Knight Commander',
    tier: 'elite',
    level: 12,
    behavior: 'patrol',
    str: 24,
    agi: 14,
    vit: 28,
    int: 6,
    dex: 12,
    luk: 8,
    maxHp: 1472,
    attackDamage: 130,
    defense: 47,
    moveSpeed: 3.5,
    expReward: 420,
    drops: [{ itemId: 'cursed_sigil', dropRate: 0.35 }],
    updatedAt: '2026-11-09',
  },
  {
    id: 'abyssal_lord_malakar',
    name: 'Malakar, The Void Overlord',
    tier: 'boss',
    level: 25,
    behavior: 'aggressive',
    str: 52,
    agi: 22,
    vit: 60,
    int: 30,
    dex: 25,
    luk: 15,
    maxHp: 7225,
    attackDamage: 266,
    defense: 95,
    moveSpeed: 3.9,
    expReward: 2025,
    drops: [
      { itemId: 'void_heart', dropRate: 0.1 },
      { itemId: 'abyssal_blade', dropRate: 0.05 },
    ],
    updatedAt: '2026-11-08',
  },
  {
    id: 'slime_forest_01',
    name: 'Emerald Slime',
    tier: 'normal',
    level: 1,
    behavior: 'passive',
    str: 4,
    agi: 4,
    vit: 8,
    int: 2,
    dex: 4,
    luk: 8,
    maxHp: 221,
    attackDamage: 26,
    defense: 17,
    moveSpeed: 3.0,
    expReward: 45,
    drops: [{ itemId: 'slime_gel', dropRate: 0.95 }],
    updatedAt: '2026-11-07',
  },
];

interface StatBalancerState {
  // Current Monster loaded in editor
  monsterId: string;
  name: string;
  tier: MonsterTier;
  level: number;
  behavior: MonsterBehavior;

  // Attributes
  str: number;
  agi: number;
  vit: number;
  int: number;
  dex: number;
  luk: number;

  // Monsters List
  monstersList: MonsterListItem[];

  // Actions
  setMeta: (name: string, tier: MonsterTier, level: number, behavior: MonsterBehavior) => void;
  setAttribute: (key: 'str' | 'agi' | 'vit' | 'int' | 'dex' | 'luk', value: number) => void;
  getAllocatedPoints: () => number;
  getMaxBudget: () => number;
  getRemainingPoints: () => number;
  getDerivedStats: () => ReturnType<typeof computeDerivedStats>;
  exportMonsterJson: () => string;
  loadMonsterJson: (json: any) => void;
  resetStats: () => void;

  // List Actions
  loadMonsterById: (id: string) => void;
  saveCurrentMonsterToList: () => void;
  deleteMonsterFromList: (id: string) => void;
  createNewMonster: () => void;
}

export const useStatStore = create<StatBalancerState>((set, get) => ({
  monsterId: 'custom_skeleton_01',
  name: 'Abyssal Skeleton Guard',
  tier: 'normal',
  level: 5,
  behavior: 'aggressive',

  str: 12,
  agi: 8,
  vit: 14,
  int: 4,
  dex: 7,
  luk: 5,

  monstersList: DEFAULT_MONSTERS,

  setMeta: (name, tier, level, behavior) => set({ name, tier, level, behavior }),

  setAttribute: (key, value) => {
    const safeVal = Math.max(0, value);
    set({ [key]: safeVal } as unknown as Partial<StatBalancerState>);
  },

  getAllocatedPoints: () => {
    const s = get();
    return s.str + s.agi + s.vit + s.int + s.dex + s.luk;
  },

  getMaxBudget: () => {
    const s = get();
    return calculateMaxBudget(s.level, s.tier);
  },

  getRemainingPoints: () => {
    return get().getMaxBudget() - get().getAllocatedPoints();
  },

  getDerivedStats: () => {
    const s = get();
    return computeDerivedStats({
      level: s.level,
      tier: s.tier,
      str: s.str,
      vit: s.vit,
      agi: s.agi,
    });
  },

  exportMonsterJson: () => {
    const s = get();
    const derived = s.getDerivedStats();
    const payload: MonsterStats = {
      id: s.monsterId,
      name: s.name,
      tier: s.tier,
      level: s.level,
      behavior: s.behavior,
      str: s.str,
      agi: s.agi,
      vit: s.vit,
      int: s.int,
      dex: s.dex,
      luk: s.luk,
      maxHp: derived.maxHp,
      attackDamage: derived.attackDamage,
      defense: derived.defense,
      moveSpeed: derived.moveSpeed,
      expReward: derived.expReward,
      drops: [{ itemId: 'gold_coin', dropRate: 1.0 }],
    };
    return JSON.stringify(payload, null, 2);
  },

  loadMonsterJson: (json: any) => {
    if (!json || typeof json !== 'object') return;
    set({
      monsterId: json.id || `monster_${Date.now()}`,
      name: json.name || 'Unnamed Beast',
      tier: json.tier || 'normal',
      level: Number(json.level) || 1,
      behavior: json.behavior || 'passive',
      str: Number(json.str) || 5,
      agi: Number(json.agi) || 5,
      vit: Number(json.vit) || 5,
      int: Number(json.int) || 5,
      dex: Number(json.dex) || 5,
      luk: Number(json.luk) || 5,
    });
  },

  resetStats: () => {
    set({
      str: 5,
      agi: 5,
      vit: 5,
      int: 5,
      dex: 5,
      luk: 5,
    });
  },

  loadMonsterById: (id: string) => {
    const item = get().monstersList.find((m) => m.id === id);
    if (item) {
      set({
        monsterId: item.id,
        name: item.name,
        tier: item.tier,
        level: item.level,
        behavior: item.behavior,
        str: item.str,
        agi: item.agi,
        vit: item.vit,
        int: item.int,
        dex: item.dex,
        luk: item.luk,
      });
    }
  },

  saveCurrentMonsterToList: () => {
    const s = get();
    const derived = s.getDerivedStats();
    const existingIndex = s.monstersList.findIndex((m) => m.id === s.monsterId);
    const updatedMonster: MonsterListItem = {
      id: s.monsterId,
      name: s.name,
      tier: s.tier,
      level: s.level,
      behavior: s.behavior,
      str: s.str,
      agi: s.agi,
      vit: s.vit,
      int: s.int,
      dex: s.dex,
      luk: s.luk,
      maxHp: derived.maxHp,
      attackDamage: derived.attackDamage,
      defense: derived.defense,
      moveSpeed: derived.moveSpeed,
      expReward: derived.expReward,
      drops: [{ itemId: 'bone_fragment', dropRate: 0.8 }],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    if (existingIndex >= 0) {
      const updatedList = [...s.monstersList];
      updatedList[existingIndex] = updatedMonster;
      set({ monstersList: updatedList });
    } else {
      set({ monstersList: [updatedMonster, ...s.monstersList] });
    }
  },

  deleteMonsterFromList: (id: string) => {
    set((state) => ({
      monstersList: state.monstersList.filter((m) => m.id !== id),
    }));
  },

  createNewMonster: () => {
    const newId = `monster_${Date.now().toString(36)}`;
    set({
      monsterId: newId,
      name: 'New Dungeon Fiend',
      tier: 'normal',
      level: 1,
      behavior: 'aggressive',
      str: 6,
      agi: 5,
      vit: 6,
      int: 4,
      dex: 5,
      luk: 4,
    });
  },
}));
