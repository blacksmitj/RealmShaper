import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  GripHorizontal,
  Settings,
  X,
  Maximize2,
  Minimize2,
  Check,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
  Sun,
  Moon,
  Mountain,
  Wand2,
} from 'lucide-react';
import { useMapStore } from '../stores/mapStore';
import { FLOOR_MATERIALS, TERRAIN_TEMPLATES } from '../types/map.types';
import type { EnvironmentTheme, MapPresetId } from '../types/map.types';

// Strict Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

interface FloatingMapSettingsWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FloatingMapSettingsWindow: React.FC<FloatingMapSettingsWindowProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    mapId,
    mapName,
    width,
    height,
    environmentTheme,
    customFloors,
    props,
    spawners,
    portals,
    voxelBlocks,
    setMapMeta,
    setDimensions,
    setEnvironmentTheme,
    loadPresetMap,
  } = useMapStore();

  // Local form states
  const [localName, setLocalName] = useState(mapName);
  const [localId, setLocalId] = useState(mapId);
  const [localWidth, setLocalWidth] = useState(width);
  const [localHeight, setLocalHeight] = useState(height);
  const [localTheme, setLocalTheme] = useState<EnvironmentTheme>(environmentTheme);
  const [selectedFillFloor, setSelectedFillFloor] = useState<number>(6); // Default: Grass (id 6)
  const [selectedTemplateId, setSelectedTemplateId] = useState<MapPresetId>('walled_dirt');
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Dragging window state
  const [position, setPosition] = useState({ x: 28, y: 84 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
  });

  // Sync state when store changes or window opens
  useEffect(() => {
    if (isOpen) {
      setLocalName(mapName);
      setLocalId(mapId);
      setLocalWidth(width);
      setLocalHeight(height);
      setLocalTheme(environmentTheme);
      setHasChanges(false);
    }
  }, [isOpen, mapName, mapId, width, height, environmentTheme]);

  // Combine default and custom floor materials
  const allFloors = useMemo(() => {
    return [...FLOOR_MATERIALS, ...customFloors];
  }, [customFloors]);

  // Track if changes occurred
  useEffect(() => {
    const changed =
      localName !== mapName ||
      localId !== mapId ||
      localWidth !== width ||
      localHeight !== height ||
      localTheme !== environmentTheme;
    setHasChanges(changed);
  }, [localName, localId, localWidth, localHeight, localTheme, mapName, mapId, width, height, environmentTheme]);

  // Drag listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const newX = Math.max(10, Math.min(window.innerWidth - 380, dragRef.current.initX + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 100, dragRef.current.initY + dy));
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: position.x,
      initY: position.y,
    };
  };

  const handleNameChange = (val: string) => {
    setLocalName(val);
    // Auto-generate slug if user hasn't explicitly customized it deeply
    const slug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, '_')
      .slice(0, 32);
    setLocalId(slug || 'map_realm');
  };

  const handleApply = () => {
    const finalWidth = Math.max(8, Math.min(64, localWidth));
    const finalHeight = Math.max(8, Math.min(64, localHeight));
    const finalName = localName.trim() || 'Untitled Map';
    const finalId = localId.trim() || 'untitled_map';

    setMapMeta(finalId, finalName);
    setEnvironmentTheme(localTheme);
    setDimensions(finalWidth, finalHeight, selectedFillFloor);
    setHasChanges(false);
  };

  const handleApplyTemplate = (templateId: MapPresetId) => {
    const finalWidth = Math.max(8, Math.min(64, localWidth));
    const finalHeight = Math.max(8, Math.min(64, localHeight));
    loadPresetMap(templateId, finalWidth, finalHeight);
    setIsConfirmDialogOpen(false);
  };

  const isCanvasOccupied = useMemo(() => {
    const hasProps = props.length > 0;
    const hasSpawners = spawners.length > 0;
    const hasPortals = portals.length > 0;
    const blockCount = Object.keys(voxelBlocks).length;
    // Map dianggap memiliki konten jika ada props/spawner/portal atau banyak balok
    return hasProps || hasSpawners || hasPortals || blockCount > (width * 2 + height * 2);
  }, [props.length, spawners.length, portals.length, voxelBlocks, width, height]);

  const onTriggerGenerateTemplate = () => {
    if (isCanvasOccupied) {
      setIsConfirmDialogOpen(true);
    } else {
      handleApplyTemplate(selectedTemplateId);
    }
  };

  const isCropWarning = localWidth < width || localHeight < height;

  if (!isOpen) return null;

  return (
    <div
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className={`fixed z-50 w-[380px] bg-card/95 border border-border rounded-xl shadow-2xl backdrop-blur-md transition-all duration-150 flex flex-col text-card-foreground ${
        isDragging ? 'select-none opacity-90 scale-[0.99]' : ''
      }`}
    >
      {/* Header / Drag Bar */}
      <div
        onMouseDown={handleDragStart}
        className="flex items-center justify-between px-3.5 py-2.5 bg-muted/60 border-b border-border rounded-t-xl cursor-grab active:cursor-grabbing select-none"
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="w-4 h-4 text-muted-foreground" />
          <div className="p-1 rounded bg-warning/10 text-warning border border-warning/20">
            <Settings className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold tracking-wide text-foreground">
            Map Settings
          </span>
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 h-4 bg-background/60 border-border text-muted-foreground"
          >
            {width}x{height}
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized((prev) => !prev)}
            className="w-6 h-6 text-muted-foreground hover:text-foreground hover:bg-muted"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="w-6 h-6 text-muted-foreground hover:text-destructive hover:bg-muted"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Body Content */}
      {!isMinimized && (
        <div className="p-4 space-y-4 text-xs">
          {/* Metadata Section */}
          <div className="space-y-3 p-2.5 rounded-lg bg-background/50 border border-border">
            <div>
              <Label className="text-[11px] font-medium text-foreground">Map Name</Label>
              <Input
                value={localName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Catacombs Entrance"
                className="h-8 mt-1 text-xs bg-muted/40 border-input focus-visible:ring-ring"
              />
            </div>
            <div>
              <Label className="text-[11px] font-medium text-muted-foreground">Map ID (Technical Slug)</Label>
              <Input
                value={localId}
                onChange={(e) => setLocalId(e.target.value)}
                placeholder="e.g. catacombs_entrance"
                className="h-8 mt-1 text-xs font-mono bg-muted/20 border-input text-foreground focus-visible:ring-ring"
              />
            </div>
          </div>

          {/* Grid Dimensions Section */}
          <div className="space-y-3 p-2.5 rounded-lg bg-background/50 border border-border">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-warning" /> Grid Dimensions (Tiles)
              </Label>
              <span className="font-mono text-[11px] font-bold text-warning">
                {localWidth} x {localHeight} tiles
              </span>
            </div>

            {/* Width */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Width (X)</span>
                <span className="font-mono text-foreground">{localWidth}</span>
              </div>
              <Slider
                min={8}
                max={64}
                step={1}
                value={[localWidth]}
                onValueChange={(val) => {
                  const num = Array.isArray(val) ? val[0] : val;
                  if (typeof num === 'number') setLocalWidth(num);
                }}
                className="py-1 cursor-pointer"
              />
            </div>

            {/* Height */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Height / Length (Y)</span>
                <span className="font-mono text-foreground">{localHeight}</span>
              </div>
              <Slider
                min={8}
                max={64}
                step={1}
                value={[localHeight]}
                onValueChange={(val) => {
                  const num = Array.isArray(val) ? val[0] : val;
                  if (typeof num === 'number') setLocalHeight(num);
                }}
                className="py-1 cursor-pointer"
              />
            </div>

            {/* Crop Warning Alert */}
            {isCropWarning && (
              <div className="flex items-start gap-2 p-2 rounded bg-warning/10 border border-warning/30 text-warning text-[10px] leading-relaxed">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-warning" />
                <span>
                  Memperkecil dimensi akan memotong (crop) tile dan prop di luar batas koordinat baru (Anchor Top-Left).
                </span>
              </div>
            )}
          </div>

          {/* Environment Theme & Default Fill */}
          <div className="space-y-3 p-2.5 rounded-lg bg-background/50 border border-border">
            <div>
              <Label className="text-[11px] font-medium text-foreground flex items-center gap-1.5 mb-1.5">
                {localTheme === 'medieval_day' ? (
                  <Sun className="w-3.5 h-3.5 text-warning" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-info" />
                )}
                Environment Theme
              </Label>
              <Select
                value={localTheme}
                onValueChange={(val) => {
                  if (val) setLocalTheme(val as EnvironmentTheme);
                }}
              >
                <SelectTrigger className="w-full h-8 text-xs bg-muted/40 border-input">
                  <SelectValue placeholder="Pilih tema visual">
                    {localTheme === 'medieval_day'
                      ? 'Medieval Sunlit Day (Warm Ambient)'
                      : 'Gothic Moonlight Night (Dark Fog)'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  sideOffset={4}
                  className="bg-popover border border-border text-popover-foreground text-xs shadow-xl"
                >
                  <SelectItem value="medieval_day">Medieval Sunlit Day (Warm Ambient)</SelectItem>
                  <SelectItem value="gothic_night">Gothic Moonlight Night (Dark Fog)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[11px] font-medium text-foreground flex items-center gap-1.5 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-success" />
                Default Floor Expansion Fill
              </Label>
              <Select
                value={String(selectedFillFloor)}
                onValueChange={(val) => {
                  if (val) setSelectedFillFloor(Number(val));
                }}
              >
                <SelectTrigger className="w-full h-8 text-xs bg-muted/40 border-input">
                  <SelectValue placeholder="Pilih material dasar">
                    {(() => {
                      const fl = allFloors.find((f) => f.id === selectedFillFloor);
                      if (!fl) return null;
                      return (
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/40"
                            style={{ backgroundColor: fl.swatchColor }}
                          />
                          <span>{fl.name}</span>
                        </div>
                      );
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  sideOffset={4}
                  className="bg-popover border border-border text-popover-foreground text-xs max-h-48 shadow-xl"
                >
                  {allFloors.map((fl) => (
                    <SelectItem key={fl.id} value={String(fl.id)}>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black/40"
                          style={{ backgroundColor: fl.swatchColor }}
                        />
                        <span>{fl.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Terrain & Environment Templates Section */}
          <div className="space-y-3 p-2.5 rounded-lg bg-background/50 border border-border">
            <div>
              <Label className="text-[11px] font-medium text-foreground flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Mountain className="w-3.5 h-3.5 text-warning" />
                  Default Terrain / Map Templates
                </span>
                <Badge
                  variant="outline"
                  className="text-[9px] px-1 py-0 h-4 border-warning/30 text-warning bg-warning/10 font-normal"
                >
                  {localWidth}x{localHeight} grid
                </Badge>
              </Label>
              <Select
                value={selectedTemplateId}
                onValueChange={(val) => {
                  if (val) setSelectedTemplateId(val as MapPresetId);
                }}
              >
                <SelectTrigger className="w-full h-9 text-xs bg-muted/40 border-input">
                  <SelectValue placeholder="Pilih template terrain">
                    {TERRAIN_TEMPLATES.find((t) => t.id === selectedTemplateId)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  sideOffset={6}
                  className="bg-popover border border-border text-popover-foreground text-xs shadow-2xl max-h-60"
                >
                  {TERRAIN_TEMPLATES.map((tmpl) => (
                    <SelectItem key={tmpl.id} value={tmpl.id} className="py-2 focus:bg-accent focus:text-accent-foreground">
                      <div className="flex flex-col text-left pr-2">
                        <span className="font-semibold text-foreground">{tmpl.name}</span>
                        <span className="text-[10px] text-muted-foreground leading-snug">
                          {tmpl.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onTriggerGenerateTemplate}
              className="w-full h-8 text-xs font-medium border-warning/40 text-warning hover:bg-warning/10 hover:text-warning"
            >
              <Wand2 className="w-3.5 h-3.5 mr-1.5 text-warning" />
              Generate / Apply Template ({localWidth}x{localHeight})
            </Button>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLocalName(mapName);
                setLocalId(mapId);
                setLocalWidth(width);
                setLocalHeight(height);
                setLocalTheme(environmentTheme);
              }}
              disabled={!hasChanges}
              className="h-8 text-xs text-muted-foreground border-border hover:bg-muted"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reset
            </Button>

            <Button
              size="sm"
              onClick={handleApply}
              disabled={!hasChanges && localWidth === width && localHeight === height}
              className="h-8 px-4 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
            >
              <Check className="w-3.5 h-3.5 mr-1.5" />
              Apply Changes
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog when applying template over existing content */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border text-card-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Terapkan Template Terrain Baru?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs pt-1 leading-relaxed">
              Menerapkan template <strong>{TERRAIN_TEMPLATES.find((t) => t.id === selectedTemplateId)?.name}</strong> akan menghapus objek, dinding, spawner, dan portal yang ada saat ini di canvas dan menggantinya dengan template baru berukuran <strong>{localWidth}x{localHeight}</strong>.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <DialogClose render={<Button variant="outline" size="sm" className="border-border text-foreground" />}>
              Batal
            </DialogClose>
            <Button
              size="sm"
              onClick={() => handleApplyTemplate(selectedTemplateId)}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Ya, Ganti Canvas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

