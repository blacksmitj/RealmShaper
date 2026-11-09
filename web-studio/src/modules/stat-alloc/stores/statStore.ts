import { create } from 'zustand';
import {
  type MonsterStats,
  type MonsterTier,
  type MonsterBehavior,
  calculateMaxBudget,
  computeDerivedStats,
} from '../types/stat.types';

interface StatBalancerState {
  // Current Monster
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

  setMeta: (name, tier, level, behavior) => {
    set({ name, tier, level, behavior });
  },

  setAttribute: (key, targetValue) => {
    const state = get();
    const currentVal = state[key];
    const diff = targetValue - currentVal;
    const remaining = state.getRemainingPoints();

    // Prevent allocating beyond the enforced server budget
    if (diff > 0 && diff > remaining) {
      // allocate only up to remaining
      const allowed = currentVal + Math.max(0, remaining);
      set({ [key]: Math.max(1, allowed) });
    } else {
      set({ [key]: Math.max(1, targetValue) });
    }
  },

  getAllocatedPoints: () => {
    const { str, agi, vit, int, dex, luk } = get();
    return str + agi + vit + int + dex + luk;
  },

  getMaxBudget: () => {
    const { level, tier } = get();
    return calculateMaxBudget(level, tier);
  },

  getRemainingPoints: () => {
    const max = get().getMaxBudget();
    const allocated = get().getAllocatedPoints();
    return max - allocated;
  },

  getDerivedStats: () => {
    const { level, tier, str, vit, agi } = get();
    return computeDerivedStats({ level, tier, str, vit, agi });
  },

  exportMonsterJson: () => {
    const state = get();
    const derived = state.getDerivedStats();
    const payload: MonsterStats = {
      id: state.monsterId,
      name: state.name,
      tier: state.tier,
      level: state.level,
      behavior: state.behavior,
      str: state.str,
      agi: state.agi,
      vit: state.vit,
      int: state.int,
      dex: state.dex,
      luk: state.luk,
      maxHp: derived.maxHp,
      attackDamage: derived.attackDamage,
      defense: derived.defense,
      moveSpeed: derived.moveSpeed,
      expReward: derived.expReward,
      drops: [
        { itemId: 'iron_ore', dropRate: 45.0 },
        { itemId: 'bone_fragment', dropRate: 75.0 },
      ],
    };
    return JSON.stringify(payload, null, 2);
  },

  loadMonsterJson: (json: any) => {
    if (!json) return;
    set({
      monsterId: json.id || 'imported_monster',
      name: json.name || 'Unnamed Monster',
      tier: json.tier || 'normal',
      level: json.level || 1,
      behavior: json.behavior || 'aggressive',
      str: json.str || 5,
      agi: json.agi || 5,
      vit: json.vit || 5,
      int: json.int || 5,
      dex: json.dex || 5,
      luk: json.luk || 5,
    });
  },

  resetStats: () => {
    set({
      str: 8,
      agi: 8,
      vit: 8,
      int: 8,
      dex: 8,
      luk: 8,
    });
  },
}));

