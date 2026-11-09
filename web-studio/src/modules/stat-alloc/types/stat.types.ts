export type MonsterTier = 'normal' | 'elite' | 'boss';
export type MonsterBehavior = 'passive' | 'aggressive' | 'patrol';

export interface MonsterStats {
  id: string;
  name: string;
  tier: MonsterTier;
  level: number;
  behavior: MonsterBehavior;

  // Base Attributes
  str: number; // Attack power modifier
  agi: number; // Attack speed & move speed modifier
  vit: number; // HP & defense modifier
  int: number; // Magic / elemental damage
  dex: number; // Hit rate & critical chance
  luk: number; // Rare item drop luck

  // Derived Combat Stats (Computed deterministically)
  maxHp: number;
  attackDamage: number;
  defense: number;
  moveSpeed: number;
  expReward: number;

  // Drop Table
  drops: Array<{
    itemId: string;
    dropRate: number; // 0.01% - 100%
  }>;
}

export interface BudgetConfig {
  basePoints: number;
  pointsPerLevel: number;
  tierMultiplier: Record<MonsterTier, number>;
}

export const MONSTER_BUDGET_CONFIG: BudgetConfig = {
  basePoints: 30,
  pointsPerLevel: 5,
  tierMultiplier: {
    normal: 1.0,
    elite: 1.5,
    boss: 3.0,
  },
};

export function calculateMaxBudget(level: number, tier: MonsterTier): number {
  const base = MONSTER_BUDGET_CONFIG.basePoints + (level - 1) * MONSTER_BUDGET_CONFIG.pointsPerLevel;
  return Math.floor(base * MONSTER_BUDGET_CONFIG.tierMultiplier[tier]);
}

export function computeDerivedStats(stats: Pick<MonsterStats, 'level' | 'tier' | 'str' | 'vit' | 'agi'>) {
  const tierHpMultiplier = stats.tier === 'boss' ? 5.0 : stats.tier === 'elite' ? 2.0 : 1.0;
  
  const maxHp = Math.floor((100 + stats.level * 25 + stats.vit * 12) * tierHpMultiplier);
  const attackDamage = Math.floor(10 + stats.level * 4 + stats.str * 3);
  const defense = Math.floor(5 + stats.vit * 1.5);
  const moveSpeed = Number((2.8 + (stats.agi * 0.05)).toFixed(2));
  const expReward = Math.floor((30 + stats.level * 15) * tierHpMultiplier);

  return { maxHp, attackDamage, defense, moveSpeed, expReward };
}

