import React from 'react';
import {
  Shield,
  Swords,
  Heart,
  Zap,
  Award,
  AlertCircle,
  Download,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useStatStore } from '../stores/statStore';
import type { MonsterTier, MonsterBehavior } from '../types/stat.types';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const StatBalancerView: React.FC = () => {
  const {
    name,
    tier,
    level,
    behavior,
    str,
    agi,
    vit,
    int,
    dex,
    luk,
    setMeta,
    setAttribute,
    getAllocatedPoints,
    getMaxBudget,
    getRemainingPoints,
    getDerivedStats,
    exportMonsterJson,
    resetStats,
  } = useStatStore();

  const allocated = getAllocatedPoints();
  const maxBudget = getMaxBudget();
  const remaining = getRemainingPoints();
  const derived = getDerivedStats();

  const attributes = [
    { key: 'str', label: 'STR (Strength)', val: str, desc: 'Increases physical attack damage' },
    { key: 'agi', label: 'AGI (Agility)', val: agi, desc: 'Increases move speed & attack rate' },
    { key: 'vit', label: 'VIT (Vitality)', val: vit, desc: 'Increases maximum HP & defense' },
    { key: 'int', label: 'INT (Intelligence)', val: int, desc: 'Increases magic skill potency' },
    { key: 'dex', label: 'DEX (Dexterity)', val: dex, desc: 'Increases hit chance & crit chance' },
    { key: 'luk', label: 'LUK (Luck)', val: luk, desc: 'Increases rare item drop probability' },
  ] as const;

  const handleExport = () => {
    const jsonStr = exportMonsterJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.toLowerCase().replace(/\s+/g, '_')}_preset.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full h-full flex overflow-hidden bg-background font-sans text-foreground">
      {/* Left Column: Attribute Allocation Controls */}
      <div className="w-[450px] border-r border-border flex flex-col h-full bg-muted/30 p-6 overflow-y-auto space-y-6">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Sparkles className="w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-wider">Monster Stat Balancer</h2>
          </div>
          <h1 className="text-lg font-bold text-foreground">Creator Stat Budgeting</h1>
          <p className="text-xs text-muted-foreground">
            Keseimbangan parameter monster dikunci oleh server-authoritative budget rule.
          </p>
        </div>

        {/* Monster Meta */}
        <div className="space-y-3 p-4 bg-card/60 border border-border rounded-lg">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Monster Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setMeta(e.target.value, tier, level, behavior)}
              className="w-full bg-muted/40 border border-border rounded px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Tier / Class</label>
              <Select
                value={tier}
                onValueChange={(val) => {
                  if (val) setMeta(name, val as MonsterTier, level, behavior);
                }}
              >
                <SelectTrigger className="w-full bg-muted/40 border-border text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-border text-xs">
                  <SelectItem value="normal">Normal Mob</SelectItem>
                  <SelectItem value="elite">Elite Champion</SelectItem>
                  <SelectItem value="boss">Dungeon Boss</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">AI Behavior</label>
              <Select
                value={behavior}
                onValueChange={(val) => {
                  if (val) setMeta(name, tier, level, val as MonsterBehavior);
                }}
              >
                <SelectTrigger className="w-full bg-muted/40 border-border text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-border text-xs">
                  <SelectItem value="aggressive">Aggressive (Aggro)</SelectItem>
                  <SelectItem value="patrol">Patrol Area</SelectItem>
                  <SelectItem value="passive">Passive / Neutral</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Level Slider */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Target Monster Level</span>
              <span className="font-mono text-primary font-bold">Lv. {level}</span>
            </div>
            <Slider
              value={[level]}
              min={1}
              max={50}
              step={1}
              onValueChange={(val) => {
                const lv = Array.isArray(val) ? val[0] : val;
                if (typeof lv === 'number') setMeta(name, tier, lv, behavior);
              }}
            />
          </div>
        </div>

        {/* Budget Counter Card */}
        <div className="p-4 bg-gradient-to-r from-card to-primary/10 border border-primary/40 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">
              Budget Status
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold font-mono text-white">{allocated}</span>
              <span className="text-xs text-muted-foreground font-mono">/ {maxBudget} Pts</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">
              Remaining
            </span>
            <span
              className={`text-xl font-bold font-mono ${
                remaining === 0 ? 'text-success' : 'text-primary'
              }`}
            >
              {remaining}
            </span>
          </div>
        </div>

        {/* Attribute Allocation Sliders */}
        <div className="space-y-4">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Attribute Point Allocation
          </label>
          {attributes.map((attr) => (
            <div
              key={attr.key}
              className="p-3 bg-muted/30 border border-border rounded-lg space-y-2"
            >
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs font-semibold text-foreground">{attr.label}</span>
                  <p className="text-[10px] text-muted-foreground">{attr.desc}</p>
                </div>
                <span className="text-sm font-mono font-bold text-primary px-2 py-0.5 bg-muted/40 rounded border border-border">
                  {attr.val}
                </span>
              </div>
              <Slider
                value={[attr.val]}
                min={1}
                max={50}
                step={1}
                onValueChange={(val) => {
                  const target = Array.isArray(val) ? val[0] : val;
                  if (typeof target === 'number') setAttribute(attr.key, target);
                }}
              />
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="pt-2 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetStats}
            className="flex-1 bg-muted/40 border-border hover:bg-muted text-xs gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Reset Stats</span>
          </Button>
          <Button
            size="sm"
            onClick={handleExport}
            className="flex-1 bg-primary hover:bg-primary/90 text-white text-xs gap-1.5 shadow-md shadow-primary/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Preset</span>
          </Button>
        </div>
      </div>

      {/* Right Column: Live Combat Simulation Card */}
      <div className="flex-1 p-8 flex flex-col justify-center items-center relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-card via-background to-background">
        <div className="max-w-lg w-full space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/30 uppercase tracking-widest font-mono">
              Live Combat Math Preview
            </span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">{name}</h2>
            <p className="text-xs text-muted-foreground">
              Hasil kalkulasi deterministik yang akan dieksekusi oleh{' '}
              <span className="text-primary font-mono">DummyMonster3D.gd</span> &{' '}
              <span className="text-primary font-mono">GameEngine.ts</span>
            </p>
          </div>

          {/* Combat Cards Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 bg-muted/40/80 border border-border rounded-xl space-y-2 backdrop-blur">
              <div className="flex items-center gap-2 text-destructive">
                <Heart className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase">Max Health (HP)</span>
              </div>
              <div className="text-2xl font-bold font-mono text-white">{derived.maxHp}</div>
              <p className="text-[10px] text-muted-foreground">Scaled by VIT & Tier Multiplier</p>
            </div>

            <div className="p-5 bg-muted/40/80 border border-border rounded-xl space-y-2 backdrop-blur">
              <div className="flex items-center gap-2 text-warning">
                <Swords className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase">Attack Power</span>
              </div>
              <div className="text-2xl font-bold font-mono text-white">{derived.attackDamage}</div>
              <p className="text-[10px] text-muted-foreground">Base damage dealt per swing</p>
            </div>

            <div className="p-5 bg-muted/40/80 border border-border rounded-xl space-y-2 backdrop-blur">
              <div className="flex items-center gap-2 text-blue-400">
                <Shield className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase">Armor Defense</span>
              </div>
              <div className="text-2xl font-bold font-mono text-white">{derived.defense}</div>
              <p className="text-[10px] text-muted-foreground">Damage reduction against players</p>
            </div>

            <div className="p-5 bg-muted/40/80 border border-border rounded-xl space-y-2 backdrop-blur">
              <div className="flex items-center gap-2 text-success">
                <Zap className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase">Move Speed</span>
              </div>
              <div className="text-2xl font-bold font-mono text-white">
                {derived.moveSpeed} <span className="text-xs font-normal text-muted-foreground">m/s</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Chase velocity in 3D world</p>
            </div>
          </div>

          {/* Reward & Drops Banner */}
          <div className="p-4 bg-muted/40/50 border border-border rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-warning/15 border border-warning/30 text-warning">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-foreground block">Experience Bounty</span>
                <span className="text-sm font-mono font-bold text-warning">
                  +{derived.expReward} EXP
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-muted-foreground block">Verified Budget</span>
              <span className="text-xs text-success font-medium flex items-center gap-1 justify-end">
                <AlertCircle className="w-3.5 h-3.5" /> Server Compliant
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

