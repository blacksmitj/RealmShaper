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
} from 'lucide-react';
import { useMapStore } from '../stores/mapStore';
import { FLOOR_MATERIALS } from '../types/map.types';
import type { EnvironmentTheme } from '../types/map.types';

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
    setMapMeta,
    setDimensions,
    setEnvironmentTheme,
  } = useMapStore();

  // Local form states
  const [localName, setLocalName] = useState(mapName);
  const [localId, setLocalId] = useState(mapId);
  const [localWidth, setLocalWidth] = useState(width);
  const [localHeight, setLocalHeight] = useState(height);
  const [localTheme, setLocalTheme] = useState<EnvironmentTheme>(environmentTheme);
  const [selectedFillFloor, setSelectedFillFloor] = useState<number>(6); // Default: Grass (id 6)
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

  const isCropWarning = localWidth < width || localHeight < height;

  if (!isOpen) return null;

  return (
    <div
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className={`fixed z-50 w-[380px] bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-md transition-all duration-150 flex flex-col text-slate-100 ${
        isDragging ? 'select-none opacity-90 scale-[0.99]' : ''
      }`}
    >
      {/* Header / Drag Bar */}
      <div
        onMouseDown={handleDragStart}
        className="flex items-center justify-between px-3.5 py-2.5 bg-slate-800/90 border-b border-slate-700/60 rounded-t-xl cursor-grab active:cursor-grabbing select-none"
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="w-4 h-4 text-slate-400" />
          <div className="p-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Settings className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold tracking-wide text-slate-200">
            Map Settings
          </span>
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 h-4 bg-slate-950/60 border-slate-700 text-slate-400"
          >
            {width}x{height}
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized((prev) => !prev)}
            className="w-6 h-6 text-slate-400 hover:text-white hover:bg-slate-700/50"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="w-6 h-6 text-slate-400 hover:text-rose-400 hover:bg-slate-700/50"
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
          <div className="space-y-3 p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/80">
            <div>
              <Label className="text-[11px] font-medium text-slate-300">Map Name</Label>
              <Input
                value={localName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Catacombs Entrance"
                className="h-8 mt-1 text-xs bg-slate-900 border-slate-700 focus-visible:ring-amber-500/50"
              />
            </div>
            <div>
              <Label className="text-[11px] font-medium text-slate-400">Map ID (Technical Slug)</Label>
              <Input
                value={localId}
                onChange={(e) => setLocalId(e.target.value)}
                placeholder="e.g. catacombs_entrance"
                className="h-8 mt-1 text-xs font-mono bg-slate-900/60 border-slate-700/70 text-slate-300 focus-visible:ring-amber-500/50"
              />
            </div>
          </div>

          {/* Grid Dimensions Section */}
          <div className="space-y-3 p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/80">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" /> Grid Dimensions (Tiles)
              </Label>
              <span className="font-mono text-[11px] font-bold text-amber-400">
                {localWidth} x {localHeight} tiles
              </span>
            </div>

            {/* Width */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Width (X)</span>
                <span className="font-mono text-slate-200">{localWidth}</span>
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
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Height / Length (Y)</span>
                <span className="font-mono text-slate-200">{localHeight}</span>
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
              <div className="flex items-start gap-2 p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] leading-relaxed">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-400" />
                <span>
                  Memperkecil dimensi akan memotong (crop) tile dan prop di luar batas koordinat baru (Anchor Top-Left).
                </span>
              </div>
            )}
          </div>

          {/* Environment Theme & Default Fill */}
          <div className="space-y-3 p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/80">
            <div>
              <Label className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5 mb-1.5">
                {localTheme === 'medieval_day' ? (
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                )}
                Environment Theme
              </Label>
              <Select
                value={localTheme}
                onValueChange={(val) => setLocalTheme(val as EnvironmentTheme)}
              >
                <SelectTrigger className="h-8 text-xs bg-slate-900 border-slate-700">
                  <SelectValue placeholder="Pilih tema visual" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 text-xs">
                  <SelectItem value="medieval_day">Medieval Sunlit Day (Warm Ambient)</SelectItem>
                  <SelectItem value="gothic_night">Gothic Moonlight Night (Dark Fog)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Default Floor Expansion Fill
              </Label>
              <Select
                value={String(selectedFillFloor)}
                onValueChange={(val) => setSelectedFillFloor(Number(val))}
              >
                <SelectTrigger className="h-8 text-xs bg-slate-900 border-slate-700">
                  <SelectValue placeholder="Pilih material dasar" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 text-xs max-h-48">
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
              className="h-8 text-xs text-slate-400 border-slate-700 hover:bg-slate-800"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reset
            </Button>

            <Button
              size="sm"
              onClick={handleApply}
              disabled={!hasChanges && localWidth === width && localHeight === height}
              className="h-8 px-4 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950/50"
            >
              <Check className="w-3.5 h-3.5 mr-1.5" />
              Apply Changes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

