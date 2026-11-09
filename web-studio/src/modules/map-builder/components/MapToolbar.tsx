import React, { useRef, useState } from 'react';
import {
  Layers,
  Square,
  Skull,
  DoorOpen,
  Box,
  Eraser,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useMapStore } from '../stores/mapStore';
import type { ToolMode } from '../types/map.types';

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const MapToolbar: React.FC = () => {
  const {
    activeTool,
    setActiveTool,
    selectedFloorType,
    setSelectedFloorType,
    selectedSpawnerType,
    setSelectedSpawnerType,
    portalTargetMapId,
    portalLabel,
    setPortalConfig,
    width,
    height,
    setDimensions,
    exportToMapData,
    loadFromMapData,
    resetMap,
    mapId,
    mapName,
    setMapMeta,
  } = useMapStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const tools: Array<{ id: ToolMode; label: string; icon: React.ReactNode; desc: string }> = [
    { id: 'floor', label: 'Floor Tile', icon: <Layers className="w-4 h-4" />, desc: 'Paint walkable dungeon floors' },
    { id: 'wall', label: 'Wall / Col', icon: <Square className="w-4 h-4" />, desc: 'Place collision wall blocks' },
    { id: 'spawner', label: 'Spawner', icon: <Skull className="w-4 h-4" />, desc: 'Add monster spawn points' },
    { id: 'portal', label: 'Portal', icon: <DoorOpen className="w-4 h-4" />, desc: 'Place Realm Gate transition' },
    { id: 'prop', label: '3D Prop', icon: <Box className="w-4 h-4" />, desc: 'Decorate with 3D props' },
    { id: 'eraser', label: 'Eraser', icon: <Eraser className="w-4 h-4" />, desc: 'Remove tiles or entities' },
  ];

  const floorTypes = [
    { id: 2, name: 'Cobblestone', color: 'bg-slate-700' },
    { id: 1, name: 'Border Stone', color: 'bg-slate-900' },
    { id: 3, name: 'Dirt Pathway', color: 'bg-amber-900' },
    { id: 4, name: 'Blood Carpet', color: 'bg-red-950' },
    { id: 5, name: 'Mossy Ruins', color: 'bg-emerald-950' },
  ];

  const handleExportJSON = () => {
    const data = exportToMapData();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.map_id || 'map'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        loadFromMapData(parsed);
      } catch (err) {
        alert('Format file JSON map tidak valid!');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <TooltipProvider delay={200}>
      <aside className="w-80 bg-slate-950/95 border-r border-slate-800 flex flex-col h-full z-10 select-none shadow-2xl backdrop-blur">
        {/* App Header */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h1 className="font-bold text-xs tracking-wider text-slate-100 uppercase">
                  RealmShaper Studio
                </h1>
                <p className="text-[10px] text-slate-400">3D Modular Map Builder</p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 font-mono border border-cyan-800/50">
              v0.1.0
            </span>
          </div>
        </div>

        {/* Map Metadata & Grid Dimension Slider */}
        <div className="p-4 border-b border-slate-800/80 space-y-3.5 bg-slate-900/20">
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">
              Map ID (Unique)
            </label>
            <input
              type="text"
              value={mapId}
              onChange={(e) => setMapMeta(e.target.value, mapName)}
              className="w-full bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={mapName}
              onChange={(e) => setMapMeta(mapId, e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Grid Dimension with Shadcn Slider */}
          <div className="space-y-2 pt-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[11px] font-medium text-slate-400">Grid Size (2m/tile)</span>
              <span className="font-mono text-cyan-400 font-semibold text-xs">
                {width} x {height}
              </span>
            </div>
            <Slider
              value={[width]}
              min={8}
              max={32}
              step={2}
              onValueChange={(val) => {
                const size = Array.isArray(val) ? val[0] : val;
                if (typeof size === 'number') setDimensions(size, size);
              }}
              className="py-1"
            />
          </div>
        </div>

        {/* Primary Tool Palette */}
        <div className="p-4 border-b border-slate-800/80 flex-1 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Palette & Tools
            </label>
            <span className="text-[10px] text-slate-500 capitalize">{activeTool} Mode</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {tools.map((t) => {
              const isActive = activeTool === t.id;
              return (
                <Tooltip key={t.id}>
                  <TooltipTrigger
                    onClick={() => setActiveTool(t.id)}
                    className={`h-11 flex items-center justify-start gap-2.5 px-3 rounded-md transition-all text-left ${
                      isActive
                        ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-950 font-medium'
                        : 'bg-slate-900/60 border border-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {t.icon}
                    <span className="text-xs font-medium">{t.label}</span>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="text-xs">{t.desc}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>

          {/* Context Options depending on Active Tool */}
          {activeTool === 'floor' && (
            <div className="pt-2 space-y-2 border-t border-slate-800/60">
              <label className="text-[11px] font-medium text-slate-400 block">
                Floor Material
              </label>
              <div className="space-y-1.5">
                {floorTypes.map((ft) => (
                  <button
                    key={ft.id}
                    onClick={() => setSelectedFloorType(ft.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs transition-all ${
                      selectedFloorType === ft.id
                        ? 'bg-slate-800 text-cyan-300 font-medium border border-cyan-500/40'
                        : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded ${ft.color} border border-slate-600`} />
                    <span>{ft.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTool === 'spawner' && (
            <div className="pt-2 space-y-2 border-t border-slate-800/60">
              <label className="text-[11px] font-medium text-slate-400 block">
                Monster Entity
              </label>
              <Select
                value={selectedSpawnerType}
                onValueChange={(val) => {
                  if (val) setSelectedSpawnerType(val);
                }}
              >
                <SelectTrigger className="w-full bg-slate-900 border-slate-800 text-xs text-slate-200">
                  <SelectValue placeholder="Select Monster" />
                </SelectTrigger>
                <SelectContent className="bg-slate-950 border-slate-800 text-slate-200 text-xs">
                  <SelectItem value="dummy">Dummy Training Target</SelectItem>
                  <SelectItem value="skeleton_warrior">Skeleton Warrior</SelectItem>
                  <SelectItem value="dark_cultist">Dark Cultist</SelectItem>
                  <SelectItem value="dungeon_boss">Catacomb Overlord (Boss)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {activeTool === 'portal' && (
            <div className="pt-2 space-y-3 border-t border-slate-800/60">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Destination Map ID
                </label>
                <input
                  type="text"
                  value={portalTargetMapId}
                  onChange={(e) => setPortalConfig(e.target.value, portalLabel)}
                  placeholder="e.g. main_city"
                  className="w-full bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Portal Label
                </label>
                <input
                  type="text"
                  value={portalLabel}
                  onChange={(e) => setPortalConfig(portalTargetMapId, e.target.value)}
                  placeholder="e.g. Return to Sanctuary"
                  className="w-full bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions (Import, Export, Reset Dialog) */}
        <div className="p-4 border-t border-slate-800/80 space-y-2.5 bg-slate-900/30">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportJSON}
            accept=".json"
            className="hidden"
          />

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-200 gap-1.5 text-xs"
            >
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <span>Import</span>
            </Button>
            <Button
              size="sm"
              onClick={handleExportJSON}
              className="bg-cyan-600 hover:bg-cyan-500 text-white gap-1.5 text-xs shadow-md shadow-cyan-950 font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Godot</span>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setResetDialogOpen(false)}
            className="w-full text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 text-xs h-8 gap-1.5"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Canvas</span>
          </Button>
        </div>

        {/* Shadcn Reset Confirmation Dialog */}
        <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
          <DialogContent className="bg-slate-950 border border-slate-800 text-slate-200 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-slate-100 text-sm font-semibold">
                Reset Map Canvas?
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs pt-1">
                Semua ubin, spawner monster, dan portal yang sedang dirancang akan dikembalikan ke
                ukuran default (16x16). Perubahan yang belum diexport akan hilang.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2 sm:justify-end pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setResetDialogOpen(false)}
                className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 text-xs"
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  resetMap();
                  setResetDialogOpen(false);
                }}
                className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium"
              >
                Reset Sekarang
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </aside>
    </TooltipProvider>
  );
};
