import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Map,
  Skull,
  GitBranch,
  Swords,
  Wifi,
  WifiOff,
  Database,
  HardDrive,
  ArrowRight,
  TrendingUp,
  Boxes,
  Users,
} from 'lucide-react';
import { useServerHealth, useMapDrafts } from '@/hooks/usePgcQueries';
import { useStatStore } from '@/modules/stat-alloc/stores/statStore';
import { useQuestStore } from '@/modules/quest-editor/stores/questStore';
import { INITIAL_EQUIPMENT_DATA } from '@/types/equipment.types';

interface GeneralOverviewProps {
  onNavigate: (tab: 'maps' | 'monsters' | 'quests' | 'equipment') => void;
  onOpenMapEditor: () => void;
  onOpenStatEditor: () => void;
  onOpenQuestEditor: () => void;
}

export const GeneralOverview: React.FC<GeneralOverviewProps> = ({
  onNavigate,
  onOpenMapEditor,
  onOpenStatEditor,
  onOpenQuestEditor,
}) => {
  const { data: serverStatus = { online: false, db: false, storage: false } } = useServerHealth();
  const { data: mapDrafts = [] } = useMapDrafts();
  const monsters = useStatStore((s) => s.monstersList);
  const quests = useQuestStore((s) => s.questsList);

  return (
    <div className="space-y-6">
      {/* Welcome & Creator Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-border/80 bg-gradient-to-r from-card via-card to-primary/5">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-[10px] text-primary border-primary/40">
              CREATOR HUB v2.0
            </Badge>
            <span className="text-xs text-muted-foreground">Signed in as</span>
            <span className="text-xs font-semibold text-foreground font-mono">GrandArchitect_01</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1">
            RealmShaper Creator Workstation
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Kelola dunia MMORPG, monster balancing, alur quest narrative DAG, dan socket equipment untuk Godot 4.7.
          </p>
        </div>

        {/* Server & Engine Telemetry Status */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-muted/60 border border-border rounded-lg px-3 py-1.5 text-xs">
            {serverStatus.online ? (
              <span className="flex items-center gap-1.5 text-emerald-500 font-medium">
                <Wifi className="w-3.5 h-3.5" /> Fastify Gateway
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-destructive font-medium">
                <WifiOff className="w-3.5 h-3.5" /> Gateway Offline
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 bg-muted/60 border border-border rounded-lg px-3 py-1.5 text-xs">
            <Database className={`w-3.5 h-3.5 ${serverStatus.db ? 'text-blue-400' : 'text-muted-foreground'}`} />
            <span className="text-muted-foreground">Postgres</span>
            <span className={serverStatus.db ? 'text-foreground font-semibold' : 'text-muted-foreground'}>
              {serverStatus.db ? 'Connected' : 'N/A'}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-muted/60 border border-border rounded-lg px-3 py-1.5 text-xs">
            <HardDrive className={`w-3.5 h-3.5 ${serverStatus.storage ? 'text-amber-400' : 'text-muted-foreground'}`} />
            <span className="text-muted-foreground">RustFS / S3</span>
            <span className={serverStatus.storage ? 'text-foreground font-semibold' : 'text-muted-foreground'}>
              {serverStatus.storage ? 'Synced' : 'Local'}
            </span>
          </div>
        </div>
      </div>

      {/* 4 Core Pillars Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Maps */}
        <Card className="hover:border-primary/50 transition-all cursor-pointer bg-card/60" onClick={() => onNavigate('maps')}>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">3D Modular Maps</span>
              <div className="w-7 h-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Map className="w-4 h-4 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold font-mono mt-1">{mapDrafts.length}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <CardDescription className="text-xs flex items-center justify-between text-muted-foreground">
              <span>Grid dungeons & portals</span>
              <ArrowRight className="w-3.5 h-3.5 text-primary" />
            </CardDescription>
          </CardContent>
        </Card>

        {/* Card 2: Stat Balancer */}
        <Card className="hover:border-primary/50 transition-all cursor-pointer bg-card/60" onClick={() => onNavigate('monsters')}>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Monster Stat Balancer</span>
              <div className="w-7 h-7 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Skull className="w-4 h-4 text-amber-500" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold font-mono mt-1">{monsters.length}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <CardDescription className="text-xs flex items-center justify-between text-muted-foreground">
              <span>Server budget checked</span>
              <ArrowRight className="w-3.5 h-3.5 text-primary" />
            </CardDescription>
          </CardContent>
        </Card>

        {/* Card 3: Quest DAG */}
        <Card className="hover:border-primary/50 transition-all cursor-pointer bg-card/60" onClick={() => onNavigate('quests')}>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Quest Graph DAG</span>
              <div className="w-7 h-7 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <GitBranch className="w-4 h-4 text-blue-500" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold font-mono mt-1">{quests.length}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <CardDescription className="text-xs flex items-center justify-between text-muted-foreground">
              <span>Dialogues & Kill DAG</span>
              <ArrowRight className="w-3.5 h-3.5 text-primary" />
            </CardDescription>
          </CardContent>
        </Card>

        {/* Card 4: Equipment */}
        <Card className="hover:border-primary/50 transition-all cursor-pointer bg-card/60" onClick={() => onNavigate('equipment')}>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Weapon & Armor</span>
              <div className="w-7 h-7 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Swords className="w-4 h-4 text-purple-500" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold font-mono mt-1">{INITIAL_EQUIPMENT_DATA.length}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <CardDescription className="text-xs flex items-center justify-between text-muted-foreground">
              <span>Godot 3D Socket items</span>
              <ArrowRight className="w-3.5 h-3.5 text-primary" />
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Quick Launchpad to Fullscreen Editors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card/40 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <Boxes className="w-4 h-4" />
              <span>Launch 3D Map Studio</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Buka viewport 3D React Three Fiber (R3F) layar penuh tanpa sidebar untuk membangun dungeon modular 2.0m grid.
            </p>
          </div>
          <Button onClick={onOpenMapEditor} className="w-full text-xs h-8">
            Buka 3D Map Builder
          </Button>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card/40 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2 text-amber-500 font-semibold text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>Launch Stat Balancer</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Simulasi live combat stats dan radar chart dengan validasi budget level deterministik.
            </p>
          </div>
          <Button onClick={onOpenStatEditor} variant="outline" className="w-full text-xs h-8 border-amber-500/30 text-amber-500 hover:text-amber-400">
            Buka Stat Balancer
          </Button>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card/40 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2 text-blue-500 font-semibold text-sm">
              <Users className="w-4 h-4" />
              <span>Launch Quest Node Editor</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Desain alur percakapan interaktif NPC, quest kill counter, dan item deliver dalam SVG visual DAG.
            </p>
          </div>
          <Button onClick={onOpenQuestEditor} variant="outline" className="w-full text-xs h-8 border-blue-500/30 text-blue-500 hover:text-blue-400">
            Buka Quest Graph
          </Button>
        </div>
      </div>
    </div>
  );
};

