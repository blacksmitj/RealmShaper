import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  GripHorizontal,
  Search,
  Layers,
  Box,
  X,
  Plus,
  Trash2,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
} from 'lucide-react';
import { useMapStore } from '../stores/mapStore';
import { FLOOR_MATERIALS, PROP_PREFABS } from '../types/map.types';
import type { FloorMaterialMeta, PropPrefabMeta } from '../types/map.types';
import { updateDynamicFloorTiling } from '../utils/proceduralTextures';
import { TexturePreviewViewport } from './TexturePreviewViewport';
import { getBlob } from '@/lib/assetStorage';

// Strict Shadcn UI Components (@base-ui/react)
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface FloatingPaletteWindowProps {
  onOpenUploadFloor: () => void;
  onOpenUploadProp: () => void;
  onRequestRemove: (item: { type: 'prop' | 'floor'; id: string | number; name: string }) => void;
}

export const FloatingPaletteWindow: React.FC<FloatingPaletteWindowProps> = ({
  onOpenUploadFloor,
  onOpenUploadProp,
  onRequestRemove,
}) => {
  const {
    activeTool,
    setActiveTool,
    selectedFloorType,
    setSelectedFloorType,
    selectedWallType,
    setSelectedWallType,
    selectedPropPrefab,
    setSelectedPropPrefab,
    customProps,
    customFloors,
    updateCustomFloor,
  } = useMapStore();

  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<'objects' | 'materials'>(() =>
    activeTool === 'floor' || activeTool === 'wall' ? 'materials' : 'objects'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    if (activeTool === 'floor' || activeTool === 'wall') {
      setActiveTab('materials');
    } else if (activeTool === 'prop') {
      setActiveTab('objects');
    }
  }, [activeTool]);

  // Edit Material Settings Dialog State
  const [editFloorMeta, setEditFloorMeta] = useState<FloorMaterialMeta | null>(null);
  const [editScale, setEditScale] = useState<number>(1.0);
  const [editLiveTextureUrl, setEditLiveTextureUrl] = useState<string | null>(null);

  // Drag Window Position State
  const [position, setPosition] = useState({ x: window.innerWidth - 380, y: 70 });
  const isDraggingRef = useRef(false);
  const dragStartOffsetRef = useRef({ x: 0, y: 0 });

  // Handle Dragging
  const handlePointerDownHeader = (e: React.PointerEvent) => {
    // Only drag from header handle
    isDraggingRef.current = true;
    dragStartOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const newX = Math.max(10, Math.min(window.innerWidth - 340, e.clientX - dragStartOffsetRef.current.x));
    const newY = Math.max(50, Math.min(window.innerHeight - 100, e.clientY - dragStartOffsetRef.current.y));
    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  // Adjust on resize
  useEffect(() => {
    const onResize = () => {
      setPosition((prev) => ({
        x: Math.min(prev.x, window.innerWidth - 340),
        y: Math.min(prev.y, window.innerHeight - 100),
      }));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Combined Prop List
  const allProps = useMemo<PropPrefabMeta[]>(() => {
    return [...customProps, ...PROP_PREFABS];
  }, [customProps]);

  const filteredProps = useMemo(() => {
    return allProps.filter((p) => {
      const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
      const matchSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [allProps, categoryFilter, searchQuery]);

  // Combined Floor List
  const allFloors = useMemo<FloorMaterialMeta[]>(() => {
    return [...customFloors, ...FLOOR_MATERIALS];
  }, [customFloors]);

  const filteredFloors = useMemo(() => {
    return allFloors.filter((f) => {
      const matchCat = categoryFilter === 'all' || f.category === categoryFilter;
      const matchSearch =
        !searchQuery.trim() ||
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [allFloors, categoryFilter, searchQuery]);


  if (!isOpen) {
    return (
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="absolute bottom-5 right-5 z-30 shadow-2xl bg-slate-900/90 border border-cyan-500/40 text-cyan-300 hover:bg-slate-800 gap-2 backdrop-blur-md"
      >
        <Box className="w-4 h-4 text-cyan-400" />
        <span className="text-xs font-semibold">Open Asset Palette</span>
      </Button>
    );
  }

  return (
    <div
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className="absolute z-30 w-84 bg-slate-950/95 border border-slate-800/90 rounded-xl shadow-2xl shadow-black/80 backdrop-blur-xl flex flex-col overflow-hidden select-none transition-[height] duration-150"
    >
      {/* Draggable Window Header */}
      <div
        onPointerDown={handlePointerDownHeader}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="px-3.5 py-2.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2 pointer-events-none">
          <GripHorizontal className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-semibold tracking-wide text-slate-200">
            Asset Palette
          </span>
          <Badge
            variant="outline"
            className="text-[9px] h-4 px-1.5 border-cyan-500/40 text-cyan-400 font-mono"
          >
            {activeTab === 'objects' ? `${filteredProps.length} Props` : `${filteredFloors.length} Floors`}
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(!isMinimized)}
            className="w-6 h-6 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="w-6 h-6 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex flex-col flex-1 max-h-[500px]">
          {/* Tab Selector (Objects vs Materials) */}
          <div className="p-2 border-b border-slate-800/60 flex items-center gap-1.5 bg-slate-900/40">
            <Button
              variant={activeTab === 'objects' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => {
                setActiveTab('objects');
                setActiveTool('prop');
                setCategoryFilter('all');
              }}
              className={`flex-1 h-7 text-xs gap-1.5 ${
                activeTab === 'objects'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D Objects</span>
            </Button>
            <Button
              variant={activeTab === 'materials' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => {
                setActiveTab('materials');
                if (activeTool !== 'floor' && activeTool !== 'wall') {
                  setActiveTool('floor');
                }
                setCategoryFilter('all');
              }}
              className={`flex-1 h-7 text-xs gap-1.5 ${
                activeTab === 'materials'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Materials</span>
            </Button>
          </div>

          {/* Search Bar & Action Upload */}
          <div className="p-2.5 space-y-2 border-b border-slate-800/60">
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
                <Input
                  placeholder={`Search ${activeTab === 'objects' ? '3D props...' : 'floor tiles...'}`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-7.5 pl-8 text-xs bg-slate-900/90 border-slate-800 text-slate-200 placeholder:text-slate-500"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={activeTab === 'objects' ? onOpenUploadProp : onOpenUploadFloor}
                className="h-7.5 px-2 text-xs gap-1 bg-cyan-950/40 border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/60 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Upload</span>
              </Button>
            </div>

            {/* Category Pills */}
            <div className="flex gap-1 overflow-x-auto pb-0.5 text-[10px]">
              {(activeTab === 'objects'
                ? (['all', 'nature', 'medieval', 'dungeon', 'custom'] as const)
                : (['all', 'town', 'nature', 'dungeon', 'custom'] as const)
              ).map((cat) => (
                <Button
                  key={cat}
                  variant={categoryFilter === cat ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setCategoryFilter(cat)}
                  className={`h-5.5 px-2 text-[10px] capitalize shrink-0 ${
                    categoryFilter === cat
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {/* Grid / List Gallery with Real Thumbnails */}
          <ScrollArea className="flex-1 p-2.5 h-80">
            {activeTab === 'objects' ? (
              <div className="grid grid-cols-2 gap-2">
                {filteredProps.map((prop) => {
                  const isSelected = selectedPropPrefab === prop.id && activeTool === 'prop';
                  return (
                    <div
                      key={prop.id}
                      onClick={() => {
                        setSelectedPropPrefab(prop.id);
                        setActiveTool('prop');
                      }}
                      className={`group relative flex flex-col p-2 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-800/95 border-cyan-400 shadow-md shadow-cyan-950 ring-1 ring-cyan-400/40'
                          : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                      }`}
                    >
                      {/* Real Thumbnail Preview Container */}
                      <div className="w-full aspect-square rounded-md overflow-hidden bg-slate-950 border border-slate-800/90 flex items-center justify-center relative mb-1.5">
                        {prop.thumbnailUrl ? (
                          <img
                            src={prop.thumbnailUrl}
                            alt={prop.name}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <Box className="w-8 h-8 text-cyan-400/80" />
                        )}

                        {prop.isCustom && (
                          <Badge className="absolute top-1 left-1 h-3.5 px-1 text-[8px] bg-indigo-500/80 text-white font-medium border-0">
                            Custom
                          </Badge>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="text-[11px] font-medium text-slate-200 truncate">
                          {prop.name}
                        </div>
                        <div className="text-[9px] text-slate-400 truncate capitalize">
                          {prop.category}
                        </div>
                      </div>

                      {prop.isCustom && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRequestRemove({
                              type: 'prop',
                              id: prop.id,
                              name: prop.name,
                            });
                          }}
                          className="absolute top-1.5 right-1.5 w-5 h-5 text-slate-400 hover:text-red-400 hover:bg-red-950/60 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/70 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {activeTool === 'wall' && (
                  <div className="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-300 flex items-center justify-between">
                    <span className="font-medium">Active for: Modular Blocks</span>
                    <span className="font-mono text-amber-200 font-bold">ID: {selectedWallType}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {filteredFloors.map((floor) => {
                    const isSelected =
                      activeTool === 'wall'
                        ? selectedWallType === floor.id
                        : selectedFloorType === floor.id && activeTool === 'floor';
                    return (
                      <div
                        key={floor.id}
                        onClick={() => {
                          if (activeTool === 'wall') {
                            setSelectedWallType(floor.id);
                          } else {
                            setSelectedFloorType(floor.id);
                            setActiveTool('floor');
                          }
                        }}
                        className={`group relative flex flex-col p-2 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? activeTool === 'wall'
                              ? 'bg-amber-950/40 border-amber-400 shadow-md shadow-amber-950 ring-1 ring-amber-400/50'
                              : 'bg-slate-800/95 border-cyan-400 shadow-md shadow-cyan-950 ring-1 ring-cyan-400/40'
                            : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                        }`}
                      >
                      {/* Real Tile Thumbnail Preview Container */}
                      <div className="w-full aspect-square rounded-md overflow-hidden bg-slate-950 border border-slate-800/90 flex items-center justify-center relative mb-1.5">
                        {floor.thumbnailUrl ? (
                          <img
                            src={floor.thumbnailUrl}
                            alt={floor.name}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <span
                            className="w-full h-full border border-white/10 shadow-inner flex items-center justify-center font-bold text-base text-white/90"
                            style={{ backgroundColor: floor.swatchColor }}
                          >
                            {floor.id}
                          </span>
                        )}

                        {floor.isCustom && (
                          <Badge className="absolute top-1 left-1 h-3.5 px-1 text-[8px] bg-indigo-500/80 text-white font-medium border-0">
                            Custom
                          </Badge>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="text-[11px] font-medium text-slate-200 truncate">
                          {floor.name}
                        </div>
                        <div className="text-[9px] text-slate-400 truncate capitalize">
                          {floor.category}
                        </div>
                      </div>

                      {floor.isCustom && (
                        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={async (e) => {
                              e.stopPropagation();
                              setEditFloorMeta(floor);
                              setEditScale(floor.repeatScale ?? 1.0);
                              if (floor.textureUrl && !floor.textureUrl.startsWith('blob:')) {
                                setEditLiveTextureUrl(floor.textureUrl);
                              } else {
                                const blob = await getBlob(`custom_floor_${floor.id}`);
                                if (blob) {
                                  setEditLiveTextureUrl(URL.createObjectURL(blob));
                                } else {
                                  setEditLiveTextureUrl(floor.textureUrl || null);
                                }
                              }
                            }}
                            className="w-5 h-5 text-slate-300 hover:text-cyan-300 hover:bg-cyan-950/60 bg-slate-950/70 rounded"
                          >
                            <SlidersHorizontal className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRequestRemove({
                                type: 'floor',
                                id: floor.id,
                                name: floor.name,
                              });
                            }}
                            className="w-5 h-5 text-slate-400 hover:text-red-400 hover:bg-red-950/60 bg-slate-950/70 rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </ScrollArea>
        </div>
      )}

      {/* Edit Floor Material Settings Dialog */}
      <Dialog open={!!editFloorMeta} onOpenChange={(open) => !open && setEditFloorMeta(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-200 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm text-cyan-300 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              Setting Texture Zoom
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Atur kerapatan repetisi ubin (tiling) untuk material <strong>"{editFloorMeta?.name}"</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {/* Live 3D Interactive Tile Preview */}
            {editFloorMeta && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-cyan-300 font-medium">3D Tile Live Preview</Label>
                  <Badge variant="outline" className="border-cyan-500 text-cyan-300 text-[10px] font-mono">
                    Scale: {editScale.toFixed(2)}x
                  </Badge>
                </div>
                <TexturePreviewViewport
                  textureUrl={editLiveTextureUrl || editFloorMeta.textureUrl}
                  repeatScale={editScale}
                  className="w-full h-44"
                />
                <p className="text-[11px] text-slate-400">
                  Preview 3D interaktif: kerapatan tekstur ubin dan kanvas peta berubah seketika saat slider digeser.
                </p>
              </div>
            )}

            <div className="flex justify-between items-center">
              <Label className="text-xs text-slate-300">Tiling Scale Slider</Label>
              <Badge variant="outline" className="border-cyan-500 text-cyan-300 text-[10px] font-mono">
                {editScale.toFixed(2)}x {editScale > 1 ? '(Zoom Out)' : editScale < 1 ? '(Zoom In)' : '(Normal 1:1)'}
              </Badge>
            </div>

            <Slider
              min={0.1}
              max={4.0}
              step={0.05}
              value={[editScale]}
              onValueChange={(val) => {
                const nextVal = Array.isArray(val) ? val[0] : val;
                if (typeof nextVal === 'number') {
                  const rounded = Number(nextVal.toFixed(2));
                  setEditScale(rounded);
                  if (editFloorMeta) {
                    updateDynamicFloorTiling(editFloorMeta.id, rounded);
                  }
                }
              }}
              className="py-1 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0.1x (Zoom In Max)</span>
              <span>1.0x (Normal)</span>
              <span>4.0x (Zoom Out Max)</span>
            </div>
          </div>

          <DialogFooter>
            <Button
              size="sm"
              onClick={() => {
                if (editFloorMeta) {
                  updateCustomFloor(editFloorMeta.id, { repeatScale: editScale });
                  updateDynamicFloorTiling(editFloorMeta.id, editScale);
                }
                setEditFloorMeta(null);
              }}
              className="w-full text-xs bg-cyan-600 hover:bg-cyan-500 text-white"
            >
              Simpan Pengaturan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
