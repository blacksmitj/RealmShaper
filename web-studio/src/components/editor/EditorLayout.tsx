import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Box, Compass, Sparkles } from 'lucide-react';
import { MapCanvas } from '@/modules/map-builder/components/MapCanvas';
import { MapToolbar } from '@/modules/map-builder/components/MapToolbar';
import { StatBalancerView } from '@/modules/stat-alloc/components/StatBalancerView';
import { QuestGraphCanvas } from '@/modules/quest-editor/components/QuestGraphCanvas';
import { QuestToolbar } from '@/modules/quest-editor/components/QuestToolbar';

export type EditorMode = 'map' | 'stats' | 'quest';

interface EditorLayoutProps {
  mode: EditorMode;
  onExit: () => void;
}

export const EditorLayout: React.FC<EditorLayoutProps> = ({ mode, onExit }) => {
  const getEditorTitle = () => {
    switch (mode) {
      case 'map':
        return {
          title: '3D Modular Map Builder',
          subtitle: 'Grid Snap 2.0m • Godot 4.7 Dungeon Export',
          icon: <Box className="w-4 h-4 text-primary" />,
        };
      case 'stats':
        return {
          title: 'Monster Stat Balancer',
          subtitle: 'Server-Authoritative Budget • Deterministic Combat Math',
          icon: <Compass className="w-4 h-4 text-amber-500" />,
        };
      case 'quest':
        return {
          title: 'Quest Graph Editor (DAG)',
          subtitle: 'Interactive Dialogues • Combat & Delivery Nodes',
          icon: <Sparkles className="w-4 h-4 text-blue-500" />,
        };
    }
  };

  const info = getEditorTitle();

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
      {/* Editor Slim Header */}
      <header className="h-10 border-b border-border bg-background/95 backdrop-blur px-3 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={onExit}
            className="h-7 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Dashboard</span>
          </Button>

          <div className="h-3.5 w-px bg-border" />

          <div className="flex items-center gap-2">
            {info.icon}
            <span className="text-xs font-bold font-mono text-foreground tracking-wide">
              {info.title}
            </span>
            <span className="text-[10px] text-muted-foreground hidden sm:inline font-mono">
              ({info.subtitle})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onExit}
            className="h-7 px-2.5 text-xs font-mono"
          >
            Selesai / Tutup Editor
          </Button>
        </div>
      </header>

      {/* Fullscreen Workspace Area (NO SIDEBAR) */}
      <div className="relative flex-1 w-full h-[calc(100vh-2.5rem)] overflow-hidden">
        {mode === 'map' && (
          <div className="flex w-full h-full overflow-hidden relative">
            <MapToolbar />
            <div className="flex-1 h-full min-w-0 relative">
              <MapCanvas />
            </div>
          </div>
        )}

        {mode === 'stats' && (
          <div className="w-full h-full overflow-hidden bg-background">
            <StatBalancerView />
          </div>
        )}

        {mode === 'quest' && (
          <div className="relative w-full h-full flex flex-col">
            <QuestToolbar />
            <div className="flex-1 w-full h-full relative">
              <QuestGraphCanvas />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
