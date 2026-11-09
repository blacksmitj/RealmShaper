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
  Trees,
  Castle,
  ArrowUp,
  Paintbrush,
  SquareDashed,
  CloudUpload,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { usePublishAsset } from '@/hooks/usePgcQueries';
import { useMapStore } from '../stores/mapStore';
import {
  FLOOR_MATERIALS,
  PROP_PREFABS,
  type ToolMode,
} from '../types/map.types';

// Strict Shadcn UI Components (@base-ui/react)
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
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
    dragPaintMode,
    setDragPaintMode,
    selectedFloorType,
    setSelectedFloorType,
    wallStackMode,
    setWallStackMode,
    selectedWallHeight,
    setSelectedWallHeight,
    selectedSpawnerType,
    setSelectedSpawnerType,
    selectedPropPrefab,
    setSelectedPropPrefab,
    selectedPropRotation,
    setSelectedPropRotation,
    portalTargetMapId,
    portalLabel,
    setPortalConfig,
    width,
    height,
    setDimensions,
    exportToMapData,
    loadFromMapData,
    loadPresetMap,
    resetMap,
    mapId,
    mapName,
    setMapMeta,
  } = useMapStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [propFilter, setPropFilter] = useState<'all' | 'nature' | 'medieval' | 'dungeon'>('all');

  const tools: Array<{ id: ToolMode; label: string; icon: React.ReactNode; desc: string }> = [
    {
      id: 'floor',
      label: 'Floor & River',
      icon: <Layers className="w-4 h-4" />,
      desc: 'Paint textured cobblestone, grass, river water & wood decks',
    },
    {
      id: 'wall',
      label: 'Stone Stack',
      icon: <Square className="w-4 h-4" />,
      desc: 'Stack stone blocks vertically (1x up to 5x elevation)',
    },
    {
      id: 'prop',
      label: 'Town & Trees',
      icon: <Trees className="w-4 h-4" />,
      desc: 'Place 3D Oak/Pine trees, grass, river bridges & medieval houses',
    },
    {
      id: 'spawner',
      label: 'Spawner',
      icon: <Skull className="w-4 h-4" />,
      desc: 'Add monster spawn points',
    },
    {
      id: 'portal',
      label: 'Portal',
      icon: <DoorOpen className="w-4 h-4" />,
      desc: 'Place Realm Gate transition',
    },
    {
      id: 'eraser',
      label: 'Eraser',
      icon: <Eraser className="w-4 h-4" />,
      desc: 'Clear stone stacks, props, spawners or portals',
    },
  ];

  const filteredProps =
    propFilter === 'all'
      ? PROP_PREFABS
      : PROP_PREFABS.filter((p) => p.category === propFilter);

  const publishMutation = usePublishAsset();

  const handlePublishCloud = async () => {
    try {
      const data = exportToMapData();
      const jsonStr = JSON.stringify(data, null, 2);
      await publishMutation.mutateAsync({
        kind: 'map',
        contentType: 'application/json',
        data: jsonStr,
      });
    } catch (err: any) {
      alert(`Gagal publish map ke RustFS: ${err.message}`);
    }
  };

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
      } catch {
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
        <div className="p-3.5 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h1 className="font-bold text-xs tracking-wider text-slate-100 uppercase">
                  RealmShaper Studio
                </h1>
                <p className="text-[10px] text-slate-400">3D Medieval & Dungeon Map Builder</p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="bg-cyan-950/80 text-cyan-300 border-cyan-800/60 font-mono text-[10px]"
            >
              v0.2.0
            </Badge>
          </div>
        </div>

        {/* Scrollable Workspace Controls */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-3.5 space-y-4">
            {/* Quick Template Presets */}
            <div className="space-y-2 pb-3 border-b border-slate-800/80">
              <Label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                World Scene Presets
              </Label>
              <div className="grid grid-cols-2 gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadPresetMap('medieval_town')}
                  className="h-8 bg-emerald-950/40 border-emerald-800/60 hover:bg-emerald-900/50 text-emerald-300 text-[11px] gap-1.5 justify-start px-2.5"
                >
                  <Trees className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Medieval Town</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadPresetMap('catacombs')}
                  className="h-8 bg-purple-950/40 border-purple-800/60 hover:bg-purple-900/50 text-purple-300 text-[11px] gap-1.5 justify-start px-2.5"
                >
                  <Castle className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Catacombs</span>
                </Button>
              </div>
            </div>

            {/* Map Metadata & Grid Dimension Slider */}
            <div className="space-y-3 pb-3 border-b border-slate-800/80">
              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-slate-400">Map ID (Unique)</Label>
                <Input
                  type="text"
                  value={mapId}
                  onChange={(e) => setMapMeta(e.target.value, mapName)}
                  className="h-8 bg-slate-900 border-slate-800 text-xs text-slate-200 font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-slate-400">Display Name</Label>
                <Input
                  type="text"
                  value={mapName}
                  onChange={(e) => setMapMeta(mapId, e.target.value)}
                  className="h-8 bg-slate-900 border-slate-800 text-xs text-slate-200"
                />
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[11px] font-medium text-slate-400">
                    Grid Size (2m/tile)
                  </span>
                  <span className="font-mono text-cyan-400 font-semibold text-xs">
                    {width} × {height}
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
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  Palette & Tools
                </Label>
                <Badge variant="secondary" className="bg-slate-800 text-slate-300 text-[10px] capitalize">
                  {activeTool} Mode
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {tools.map((t) => {
                  const isActive = activeTool === t.id;
                  return (
                    <Tooltip key={t.id}>
                      <TooltipTrigger
                        onClick={() => setActiveTool(t.id)}
                        className={`h-10 flex items-center justify-start gap-2 px-2.5 rounded-md transition-all text-left cursor-pointer ${
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

              {/* Left-Click Drag Application Mode (Brush vs Box Area Fill) */}
              <div className="pt-2 space-y-1.5">
                <Label className="text-[11px] font-medium text-slate-400">
                  Left-Click Drag Application
                </Label>
                <div className="grid grid-cols-2 gap-1.5">
                  <Button
                    variant={dragPaintMode === 'brush' ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => setDragPaintMode('brush')}
                    className={`h-8 text-xs gap-1.5 ${
                      dragPaintMode === 'brush'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Paintbrush className="w-3.5 h-3.5" />
                    <span>Brush Path</span>
                  </Button>
                  <Button
                    variant={dragPaintMode === 'box' ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => setDragPaintMode('box')}
                    className={`h-8 text-xs gap-1.5 ${
                      dragPaintMode === 'box'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <SquareDashed className="w-3.5 h-3.5" />
                    <span>Box Area Fill</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* TOOL CONTEXT 1: Textured Floor & River Palette */}
            {activeTool === 'floor' && (
              <div className="pt-3 space-y-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-medium text-slate-300">
                    Textured Floor Tiles
                  </Label>
                  <span className="text-[10px] text-slate-500">8 Materials</span>
                </div>
                <div className="space-y-1.5">
                  {FLOOR_MATERIALS.map((ft) => {
                    const isSelected = selectedFloorType === ft.id;
                    return (
                      <Button
                        key={ft.id}
                        variant={isSelected ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setSelectedFloorType(ft.id)}
                        className={`w-full h-auto py-2 px-2.5 justify-start gap-2.5 text-left ${
                          isSelected
                            ? 'bg-slate-800/90 text-cyan-300 border border-cyan-500/40'
                            : 'text-slate-300 hover:bg-slate-900/90 border border-transparent'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded shrink-0 border border-white/20 shadow-inner"
                          style={{ backgroundColor: ft.swatchColor }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium truncate">{ft.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {ft.description}
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TOOL CONTEXT 2: Stackable Stone Blocks (1..5 Levels) */}
            {activeTool === 'wall' && (
              <div className="pt-3 space-y-3 border-t border-slate-800/80">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-medium text-slate-300">
                    Stone Stacking Behavior
                  </Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <Button
                      variant={wallStackMode === 'increment' ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => setWallStackMode('increment')}
                      className={`h-8 text-xs gap-1.5 ${
                        wallStackMode === 'increment'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                      <span>Click Stack (+1)</span>
                    </Button>
                    <Button
                      variant={wallStackMode === 'fixed' ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => setWallStackMode('fixed')}
                      className={`h-8 text-xs gap-1.5 ${
                        wallStackMode === 'fixed'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Fixed Level</span>
                    </Button>
                  </div>
                </div>

                {wallStackMode === 'increment' ? (
                  <div className="rounded-md bg-slate-900/80 border border-slate-800 p-2.5 text-[11px] text-slate-300 space-y-1">
                    <p className="font-medium text-amber-300">Interactive Stone Stacking:</p>
                    <p className="text-slate-400">
                      • <strong>Left Click</strong> on a cell to stack stone higher (Level 1 → 2 → 3 → 4 → 5).
                    </p>
                    <p className="text-slate-400">
                      • <strong>Shift + Left Click</strong> to lower stone height (-1 level).
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-[11px] text-slate-400">Target Stone Height</Label>
                      <Badge variant="outline" className="border-amber-700 text-amber-300 font-mono">
                        {selectedWallHeight}x Blocks ({(selectedWallHeight * 1.15).toFixed(1)}m)
                      </Badge>
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <Button
                          key={lvl}
                          variant={selectedWallHeight === lvl ? 'secondary' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedWallHeight(lvl)}
                          className={`h-8 text-xs font-mono ${
                            selectedWallHeight === lvl
                              ? 'bg-amber-600 text-white border-amber-500'
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}
                        >
                          {lvl}x
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TOOL CONTEXT 3: 3D Props (Trees, Grass, Bridges, Medieval Town & Dungeon) */}
            {activeTool === 'prop' && (
              <div className="pt-3 space-y-3 border-t border-slate-800/80">
                {/* Rotation Controls */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-medium text-slate-300">
                      Prop Orientation
                    </Label>
                    <span className="text-[11px] font-mono text-cyan-400">
                      {selectedPropRotation}°
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {[0, 90, 180, 270].map((deg) => (
                      <Button
                        key={deg}
                        variant={selectedPropRotation === deg ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedPropRotation(deg)}
                        className={`h-7 text-xs font-mono ${
                          selectedPropRotation === deg
                            ? 'bg-cyan-600 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {deg}°
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Category Filter */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-medium text-slate-300">
                    3D Prop Catalog
                  </Label>
                  <div className="grid grid-cols-4 gap-1">
                    {(
                      [
                        { id: 'all', label: 'All' },
                        { id: 'nature', label: 'Nature' },
                        { id: 'medieval', label: 'Town' },
                        { id: 'dungeon', label: 'Dungeon' },
                      ] as const
                    ).map((cat) => (
                      <Button
                        key={cat.id}
                        variant={propFilter === cat.id ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setPropFilter(cat.id)}
                        className={`h-7 px-1.5 text-[11px] ${
                          propFilter === cat.id
                            ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30'
                            : 'text-slate-400'
                        }`}
                      >
                        {cat.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Prop Items */}
                <div className="space-y-1.5">
                  {filteredProps.map((prop) => {
                    const isSelected = selectedPropPrefab === prop.id;
                    return (
                      <Button
                        key={prop.id}
                        variant={isSelected ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setSelectedPropPrefab(prop.id)}
                        className={`w-full h-auto py-2 px-2.5 justify-start gap-2.5 text-left ${
                          isSelected
                            ? 'bg-slate-800/90 text-cyan-300 border border-cyan-500/40'
                            : 'text-slate-300 hover:bg-slate-900/90 border border-transparent'
                        }`}
                      >
                        <Box className="w-4 h-4 shrink-0 text-cyan-400" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium truncate">{prop.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {prop.description}
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TOOL CONTEXT 4: Monster Spawner */}
            {activeTool === 'spawner' && (
              <div className="pt-3 space-y-2 border-t border-slate-800/80">
                <Label className="text-[11px] font-medium text-slate-300">
                  Monster Entity
                </Label>
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

            {/* TOOL CONTEXT 5: Portal Gate */}
            {activeTool === 'portal' && (
              <div className="pt-3 space-y-3 border-t border-slate-800/80">
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-slate-300">
                    Destination Map ID
                  </Label>
                  <Input
                    type="text"
                    value={portalTargetMapId}
                    onChange={(e) => setPortalConfig(e.target.value, portalLabel)}
                    placeholder="e.g. main_city"
                    className="h-8 bg-slate-900 border-slate-800 text-xs text-slate-200 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-slate-300">
                    Portal Label
                  </Label>
                  <Input
                    type="text"
                    value={portalLabel}
                    onChange={(e) => setPortalConfig(portalTargetMapId, e.target.value)}
                    placeholder="e.g. Return to Sanctuary"
                    className="h-8 bg-slate-900 border-slate-800 text-xs text-slate-200"
                  />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer Actions (Import, Export, Reset Dialog) */}
        <div className="p-3.5 border-t border-slate-800/80 space-y-2 bg-slate-900/30">
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
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 gap-1.5 text-xs font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </Button>
            <Button
              size="sm"
              onClick={handlePublishCloud}
              disabled={publishMutation.isPending}
              className="bg-cyan-600 hover:bg-cyan-500 text-white gap-1.5 text-xs shadow-md shadow-cyan-950 font-medium"
            >
              {publishMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : publishMutation.isSuccess ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              ) : (
                <CloudUpload className="w-3.5 h-3.5" />
              )}
              <span>
                {publishMutation.isPending
                  ? 'Uploading...'
                  : publishMutation.isSuccess
                  ? 'Published!'
                  : 'Publish'}
              </span>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setResetDialogOpen(true)}
            className="w-full text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 text-xs h-8 gap-1.5"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset to Default Town</span>
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
                Seluruh perubahan saat ini akan dikembalikan ke template default Medieval River Town.
                Pastikan Anda sudah meng-export JSON bila ingin menyimpan pekerjaan.
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
