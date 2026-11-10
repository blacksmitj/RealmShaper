import React, { useState, useMemo } from 'react';
import {
  MousePointer,
  Layers,
  Square,
  Skull,
  DoorOpen,
  Box,
  Eraser,
  Save,
  RotateCcw,
  RotateCw,
  ArrowUp,
  Paintbrush,
  SquareDashed,
  CloudUpload,
  Loader2,
  CheckCircle2,
  Settings,
} from 'lucide-react';
import { usePublishAsset, useSaveMapDraft } from '@/hooks/usePgcQueries';
import { useMapStore } from '../stores/mapStore';
import {
  FLOOR_MATERIALS,
  PROP_PREFABS,
  type ToolMode,
} from '../types/map.types';
import {
  generateGlbThumbnail,
  generateTextureThumbnail,
} from '@/lib/thumbnailGenerator';
import { packGlbWithTexture } from '@/lib/glbPacker';
import { uploadPgcAsset } from '@/lib/pgcService';
import { registerDynamicFloorTexture } from '../utils/proceduralTextures';
import { FloatingPaletteWindow } from './FloatingPaletteWindow';
import { FloatingMapSettingsWindow } from './FloatingMapSettingsWindow';
import { TexturePreviewViewport } from './TexturePreviewViewport';
import { storeBlob, deleteBlob } from '@/lib/assetStorage';

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
    selectedEntity,
    setSelectedEntity,
    eraseAt,
    dragPaintMode,
    setDragPaintMode,
    selectedFloorType,
    selectedWallType,
    wallStackMode,
    setWallStackMode,
    selectedWallHeight,
    setSelectedWallHeight,
    selectedSpawnerType,
    setSelectedSpawnerType,
    selectedPropPrefab,
    selectedPropRotation,
    setSelectedPropRotation,
    rotateSelectedProp,
    portalTargetMapId,
    portalLabel,
    setPortalConfig,
    width,
    height,
    exportToMapData,
    resetMap,
    mapId,
    mapName,
    activeVoxelY,
    setActiveVoxelY,
    rotateVoxelBlock,
    removeVoxelBlock,
    updateVoxelBlockMaterial,
    voxelBlocks,
    setMapMeta,
    customProps,
    customFloors,
    addCustomProp,
    removeCustomProp,
    addCustomFloor,
    removeCustomFloor,
    updatePropConfig,
    movingPropId,
    setMovingPropId,
  } = useMapStore();

  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [mapSettingsOpen, setMapSettingsOpen] = useState(false);

  // Upload Prop Dialog
  const [uploadPropOpen, setUploadPropOpen] = useState(false);
  const [propNameInput, setPropNameInput] = useState('');
  const [propDescInput, setPropDescInput] = useState('');
  const [propTileWidth, setPropTileWidth] = useState<number>(1);
  const [propTileDepth, setPropTileDepth] = useState<number>(1);
  const [propScaleMultiplier, setPropScaleMultiplier] = useState<number>(1.0);
  const [propFile, setPropFile] = useState<File | null>(null);
  const [propTextureFile, setPropTextureFile] = useState<File | null>(null);
  const [propThumbPreview, setPropThumbPreview] = useState<string | null>(null);
  const [isProcessingProp, setIsProcessingProp] = useState(false);

  // Upload Floor Dialog
  const [uploadFloorOpen, setUploadFloorOpen] = useState(false);
  const [floorNameInput, setFloorNameInput] = useState('');
  const [floorDescInput, setFloorDescInput] = useState('');
  const [floorFile, setFloorFile] = useState<File | null>(null);
  const [floorPreviewUrl, setFloorPreviewUrl] = useState<string | null>(null);
  const [floorThumbPreview, setFloorThumbPreview] = useState<string | null>(null);
  const [floorRepeatScale, setFloorRepeatScale] = useState<number>(1.0);
  const [isProcessingFloor, setIsProcessingFloor] = useState(false);

  // Soft Remove Confirmation Dialog
  const [removeDialogState, setRemoveDialogState] = useState<{
    open: boolean;
    type: 'prop' | 'floor';
    id: string | number;
    name: string;
  }>({ open: false, type: 'prop', id: '', name: '' });

  // Get active selected asset names for quick status display
  const currentFloorMeta = useMemo(() => {
    return (
      customFloors.find((f) => f.id === selectedFloorType) ||
      FLOOR_MATERIALS.find((f) => f.id === selectedFloorType)
    );
  }, [customFloors, selectedFloorType]);

  const currentWallMeta = useMemo(() => {
    return (
      customFloors.find((f) => f.id === selectedWallType) ||
      FLOOR_MATERIALS.find((f) => f.id === selectedWallType)
    );
  }, [customFloors, selectedWallType]);

  const currentPropMeta = useMemo(() => {
    return (
      customProps.find((p) => p.id === selectedPropPrefab) ||
      PROP_PREFABS.find((p) => p.id === selectedPropPrefab)
    );
  }, [customProps, selectedPropPrefab]);

  const publishMutation = usePublishAsset();
  const saveDraftMutation = useSaveMapDraft();

  const handlePublishToServer = () => {
    const mapData = exportToMapData();
    publishMutation.mutate({
      kind: 'map',
      contentType: 'application/json',
      data: JSON.stringify(mapData, null, 2),
    });
  };

  const handleSaveDraft = () => {
    const mapData = exportToMapData();
    saveDraftMutation.mutate({
      mapId,
      mapName,
      mapData,
    });
  };

  // Handle Prop File & Texture Selection & Re-pack Snapshot
  const updatePropSnapshot = async (model: File | null, texture: File | null) => {
    if (!model) return;
    setIsProcessingProp(true);
    try {
      // Pack model dengan texture jika ada, atau gunakan model murni
      const packedBlob = await packGlbWithTexture(model, texture);
      const thumb = await generateGlbThumbnail(packedBlob);
      setPropThumbPreview(thumb);
    } catch (err) {
      console.error('Failed to process GLB with texture or generate thumbnail', err);
    } finally {
      setIsProcessingProp(false);
    }
  };

  const handlePropFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPropFile(file);
    if (!propNameInput) {
      setPropNameInput(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
    }
    await updatePropSnapshot(file, propTextureFile);
  };

  const handlePropTextureFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPropTextureFile(file);
    if (propFile) {
      await updatePropSnapshot(propFile, file);
    }
  };

  // Submit Prop Upload to Server & Local Catalog
  const handleSubmitPropUpload = async () => {
    if (!propFile || !propNameInput.trim()) return;
    setIsProcessingProp(true);
    try {
      // 1. Pack GLB dengan Texture agar menjadi single binary GLB embedded
      const finalGlbBlob = await packGlbWithTexture(propFile, propTextureFile);

      const newId = `custom_prop_${Date.now()}`;
      await storeBlob(newId, finalGlbBlob);
      const remoteUrl = URL.createObjectURL(finalGlbBlob);
      let assetId: string | undefined;

      try {
        const uploadResult = await uploadPgcAsset({
          kind: 'prop',
          contentType: 'model/gltf-binary',
          data: finalGlbBlob,
        });
        assetId = uploadResult.assetId;
      } catch (err) {
        console.warn('Backend upload skipped/failed, using local blob preview:', err);
      }

      const newProp = {
        id: newId,
        name: propNameInput.trim(),
        category: 'custom' as const,
        description: propDescInput.trim() || 'Custom uploaded 3D prop',
        isCustom: true,
        modelUrl: remoteUrl,
        thumbnailUrl: propThumbPreview || undefined,
        assetId,
        tileWidth: propTileWidth,
        tileDepth: propTileDepth,
        scaleMultiplier: propScaleMultiplier,
      };

      addCustomProp(newProp);
      setUploadPropOpen(false);
      setPropFile(null);
      setPropTextureFile(null);
      setPropNameInput('');
      setPropDescInput('');
      setPropTileWidth(1);
      setPropTileDepth(1);
      setPropScaleMultiplier(1.0);
      setPropThumbPreview(null);
    } catch (err) {
      console.error('Failed to submit custom prop', err);
      alert('Gagal memproses dan menyimpan model 3D.');
    } finally {
      setIsProcessingProp(false);
    }
  };

  // Handle Floor Texture File Selection & Real Snapshot
  const handleFloorFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFloorFile(file);
    const objUrl = URL.createObjectURL(file);
    setFloorPreviewUrl(objUrl);
    if (!floorNameInput) {
      setFloorNameInput(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
    }
    setIsProcessingFloor(true);
    try {
      const thumb = await generateTextureThumbnail(file, floorRepeatScale);
      setFloorThumbPreview(thumb);
    } catch (err) {
      console.error('Failed to generate Texture thumbnail', err);
    } finally {
      setIsProcessingFloor(false);
    }
  };

  // Re-render thumbnail when repeat scale changes in upload modal
  const handleRepeatScaleChange = async (newScale: number) => {
    setFloorRepeatScale(newScale);
    if (floorFile) {
      try {
        const thumb = await generateTextureThumbnail(floorFile, newScale);
        setFloorThumbPreview(thumb);
      } catch {
        // ignore
      }
    }
  };

  // Submit Floor Texture Upload to Server & Local Catalog
  const handleSubmitFloorUpload = async () => {
    if (!floorFile || !floorNameInput.trim()) return;
    setIsProcessingFloor(true);
    try {
      const newFloorId = 100 + (Date.now() % 10000);
      const storageKey = `custom_floor_${newFloorId}`;
      await storeBlob(storageKey, floorFile);
      const textureUrl = URL.createObjectURL(floorFile);
      registerDynamicFloorTexture(newFloorId, textureUrl, floorRepeatScale);

      let assetId: string | undefined;

      try {
        const uploadResult = await uploadPgcAsset({
          kind: 'texture',
          contentType: floorFile.type || 'image/png',
          data: floorFile,
        });
        assetId = uploadResult.assetId;
      } catch (err) {
        console.warn('Backend upload skipped/failed, using local texture url:', err);
      }

      const newFloor = {
        id: newFloorId,
        name: floorNameInput.trim(),
        category: 'custom' as const,
        swatchColor: '#6366f1',
        description: floorDescInput.trim() || 'Custom PBR floor texture',
        isCustom: true,
        textureUrl,
        thumbnailUrl: floorThumbPreview || undefined,
        repeatScale: floorRepeatScale,
        assetId,
      };

      addCustomFloor(newFloor);
      setUploadFloorOpen(false);
      setFloorFile(null);
      setFloorNameInput('');
      setFloorDescInput('');
      setFloorRepeatScale(1.0);
      setFloorThumbPreview(null);
    } catch {
      alert('Error uploading floor material');
    } finally {
      setIsProcessingFloor(false);
    }
  };

  const confirmRemoveAsset = () => {
    if (removeDialogState.type === 'prop') {
      deleteBlob(String(removeDialogState.id));
      removeCustomProp(String(removeDialogState.id));
    } else {
      deleteBlob(`custom_floor_${removeDialogState.id}`);
      removeCustomFloor(Number(removeDialogState.id));
    }
    setRemoveDialogState({ open: false, type: 'prop', id: '', name: '' });
  };

  const tools: Array<{ id: ToolMode; label: string; icon: React.ReactNode; desc: string }> = [
    {
      id: 'select',
      label: 'Select (V)',
      icon: <MousePointer className="w-4 h-4" />,
      desc: 'Select, inspect & rotate props or tiles without placing materials [V / Esc]',
    },
    {
      id: 'floor',
      label: 'Floor & River',
      icon: <Layers className="w-4 h-4" />,
      desc: 'Paint walkable ground, river streams, or plaza stones',
    },
    {
      id: 'wall',
      label: 'Modular Blocks',
      icon: <Square className="w-4 h-4" />,
      desc: 'Stack modular 3D blocks with custom materials (1 to 5 levels high)',
    },
    {
      id: 'prop',
      label: '3D Objects',
      icon: <Box className="w-4 h-4" />,
      desc: 'Place & rotate 3D trees, buildings, bridges & custom props',
    },
    {
      id: 'spawner',
      label: 'Monster Spawner',
      icon: <Skull className="w-4 h-4" />,
      desc: 'Place monster spawn coordinates for the game loop',
    },
    {
      id: 'portal',
      label: 'Realm Portal',
      icon: <DoorOpen className="w-4 h-4" />,
      desc: 'Set seamless gateway triggers connecting different maps',
    },
    {
      id: 'eraser',
      label: 'Eraser',
      icon: <Eraser className="w-4 h-4" />,
      desc: 'Remove walls, props, spawners, or portals from grid',
    },
  ];

  return (
    <TooltipProvider delay={200}>
      <aside className="w-72 h-full bg-card/95 border-r border-border flex flex-col shrink-0 select-none backdrop-blur-md z-10">
        {/* Top Header & Map Metadata */}
        <div className="p-3.5 border-b border-border space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-sm shadow-primary/50" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                3D Map Architect
              </h2>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant={mapSettingsOpen ? 'secondary' : 'outline'}
                size="icon"
                onClick={() => setMapSettingsOpen((prev) => !prev)}
                className={`w-7 h-7 rounded-md transition-all ${
                  mapSettingsOpen
                    ? 'bg-warning/20 text-warning border-warning/50 shadow-sm shadow-warning/20'
                    : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                title="Open Map Settings (Name, Dimensions, Theme)"
              >
                <Settings className="w-3.5 h-3.5" />
              </Button>
              <Badge variant="outline" className="border-border text-[10px] text-muted-foreground font-mono">
                {width}x{height}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] text-muted-foreground">Map ID</Label>
              <Input
                value={mapId}
                onChange={(e) => setMapMeta(e.target.value, mapName)}
                className="h-7 text-xs bg-muted/40 border-border text-foreground"
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Map Name</Label>
              <Input
                value={mapName}
                onChange={(e) => setMapMeta(mapId, e.target.value)}
                className="h-7 text-xs bg-muted/40 border-border text-foreground"
              />
            </div>
          </div>
        </div>

        {/* Scrollable Tool Panel */}
        <ScrollArea className="flex-1 p-3.5">
          <div className="space-y-4">
            {/* Primary Tool Selector */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-muted-foreground">Tool Mode</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {tools.map((t) => {
                  const isActive = activeTool === t.id;
                  return (
                    <Tooltip key={t.id}>
                      <TooltipTrigger
                        onClick={() => setActiveTool(t.id)}
                        className={`h-9 flex items-center justify-start gap-2 px-2.5 rounded-md transition-all text-left cursor-pointer ${
                          isActive
                            ? 'bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 font-medium'
                            : 'bg-muted/40 border border-border text-foreground hover:bg-muted hover:text-foreground'
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

              {/* Left-Click Drag Mode */}
              <div className="pt-2 space-y-1.5">
                <Label className="text-[11px] font-medium text-muted-foreground">
                  Drag Application
                </Label>
                <div className="grid grid-cols-2 gap-1.5">
                  <Button
                    variant={dragPaintMode === 'brush' ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => setDragPaintMode('brush')}
                    className={`h-7.5 text-xs gap-1.5 ${
                      dragPaintMode === 'brush'
                        ? 'bg-primary/20 text-primary border-primary/40'
                        : 'bg-muted/40 border-border text-muted-foreground'
                    }`}
                  >
                    <Paintbrush className="w-3.5 h-3.5" />
                    <span>Brush Path</span>
                  </Button>
                  <Button
                    variant={dragPaintMode === 'box' ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => setDragPaintMode('box')}
                    className={`h-7.5 text-xs gap-1.5 ${
                      dragPaintMode === 'box'
                        ? 'bg-primary/20 text-primary border-primary/40'
                        : 'bg-muted/40 border-border text-muted-foreground'
                    }`}
                  >
                    <SquareDashed className="w-3.5 h-3.5" />
                    <span>Box Area Fill</span>
                  </Button>
                </div>
              </div>

              {/* Voxel Height Focus / Slice Level Slider (0..19) */}
              <div className="pt-2 space-y-1.5 p-2 rounded bg-muted/20 border border-border">
                <div className="flex items-center justify-between text-[11px]">
                  <Label className="text-muted-foreground font-medium">Vertical Slice (Y Level)</Label>
                  <span className="font-mono text-primary font-bold">Lvl {activeVoxelY} / 19</span>
                </div>
                <Slider
                  min={0}
                  max={19}
                  step={1}
                  value={[activeVoxelY]}
                  onValueChange={(val) => {
                    const nextVal = Array.isArray(val) ? val[0] : val;
                    if (nextVal != null) setActiveVoxelY(nextVal);
                  }}
                  className="py-1"
                />
              </div>
            </div>

            {/* TOOL CONTEXT: Select / Pointer Inspector */}
            {activeTool === 'select' && (
              <div className="p-2.5 rounded-lg border border-border bg-muted/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <MousePointer className="w-3.5 h-3.5 text-primary" />
                    <Label className="text-[11px] font-medium text-foreground">
                      Cursor Inspector
                    </Label>
                  </div>
                  <Badge variant="outline" className="text-[9px] border-primary/40 text-primary">
                    Mode V
                  </Badge>
                </div>

                {selectedEntity ? (
                  <div className="space-y-2 p-2 rounded bg-card/80 border border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-primary uppercase tracking-wide">
                        {selectedEntity.type}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        Grid ({selectedEntity.x}, {selectedEntity.y})
                      </span>
                    </div>

                    {selectedEntity.type === 'prop' && selectedEntity.data && (() => {
                      const propId = selectedEntity.data.id;
                      const currentW = selectedEntity.data.tile_width ?? selectedEntity.data.prefabMeta?.tileWidth ?? 1;
                      const currentD = selectedEntity.data.tile_depth ?? selectedEntity.data.prefabMeta?.tileDepth ?? 1;
                      const currentScale = selectedEntity.data.scale_multiplier ?? selectedEntity.data.prefabMeta?.scaleMultiplier ?? 1.0;

                      return (
                        <div className="space-y-2 pt-1 border-t border-border">
                          <div className="text-xs text-foreground font-medium">
                            {selectedEntity.data.prefabMeta?.name || selectedEntity.data.prefab_id}
                          </div>

                          {/* Quick Footprint Size Selector */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-muted-foreground">Tile Footprint:</span>
                              <span className="font-mono text-primary font-bold">
                                {currentW}x{currentD} Tile
                              </span>
                            </div>
                            <div className="grid grid-cols-4 gap-1">
                              {[
                                { label: '1x1', w: 1, d: 1 },
                                { label: '2x2', w: 2, d: 2 },
                                { label: '3x3', w: 3, d: 3 },
                                { label: '4x4', w: 4, d: 4 },
                              ].map((preset) => (
                                <Button
                                  key={preset.label}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (propId) {
                                      updatePropConfig(propId, {
                                        tile_width: preset.w,
                                        tile_depth: preset.d,
                                      });
                                    }
                                  }}
                                  className={`h-5 text-[9px] px-1 ${
                                    currentW === preset.w && currentD === preset.d
                                      ? 'bg-primary/30 border-primary text-primary font-bold'
                                      : 'border-border text-muted-foreground hover:text-foreground'
                                  }`}
                                >
                                  {preset.label}
                                </Button>
                              ))}
                            </div>
                          </div>

                          {/* Fine-tune Scale Slider */}
                          <div className="space-y-1 pt-0.5">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-muted-foreground">Scale Fit:</span>
                              <span className="font-mono text-primary font-bold">
                                {currentScale.toFixed(2)}x
                              </span>
                            </div>
                            <Slider
                              min={0.5}
                              max={2.5}
                              step={0.05}
                              value={[currentScale]}
                              onValueChange={(val) => {
                                const nextVal = Array.isArray(val) ? val[0] : val;
                                if (typeof nextVal === 'number' && propId) {
                                  updatePropConfig(propId, {
                                    scale_multiplier: Number(nextVal.toFixed(2)),
                                  });
                                }
                              }}
                              className="py-1 cursor-pointer"
                            />
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span>Rotation:</span>
                            <span className="font-mono text-primary font-bold">
                              {selectedEntity.data.rotation_deg}°
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 pt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (propId) {
                                  setMovingPropId(movingPropId === propId ? null : propId);
                                }
                              }}
                              className={`h-6 text-[10px] flex-1 gap-1 border ${
                                movingPropId === propId
                                  ? 'bg-warning/20 border-warning text-warning animate-pulse font-bold'
                                  : 'border-border bg-muted hover:bg-muted text-foreground'
                              }`}
                            >
                              <MousePointer className="w-3 h-3" />
                              {movingPropId === propId ? 'Klik Tile Tujuan...' : 'Move (M)'}
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => rotateSelectedProp(90)}
                              className="h-6 text-[10px] bg-muted hover:bg-muted text-foreground gap-1 px-2"
                            >
                              <RotateCw className="w-3 h-3" />
                              (R)
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                eraseAt(selectedEntity.x, selectedEntity.y);
                                setSelectedEntity(null);
                              }}
                              className="h-6 text-[10px] px-2 bg-destructive/20 hover:bg-destructive/30 text-destructive border border-destructive/40"
                            >
                              <Eraser className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })()}

                    {selectedEntity.type === 'block' && (() => {
                      const bKey = `${selectedEntity.x}_${selectedEntity.z ?? selectedEntity.y}_${selectedEntity.y}`;
                      const block = voxelBlocks[bKey];
                      const matId = block?.material_id ?? selectedWallType;
                      const rot = block?.rotation_y ?? 0;
                      const yLvl = selectedEntity.z ?? 0;

                      return (
                        <div className="space-y-2 pt-1 border-t border-border">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-muted-foreground">Elevation (Height Level):</span>
                            <span className="font-mono text-warning font-bold">
                              Lvl {yLvl} ({(yLvl * 1.15).toFixed(2)}m)
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-muted-foreground">Orientation:</span>
                            <span className="font-mono text-primary font-bold">{rot}°</span>
                          </div>

                          {/* Quick Material Change */}
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Ganti Material Block:</Label>
                            <Select
                              value={String(matId)}
                              onValueChange={(val) => {
                                updateVoxelBlockMaterial(
                                  selectedEntity.x,
                                  yLvl,
                                  selectedEntity.y,
                                  Number(val)
                                );
                              }}
                            >
                              <SelectTrigger className="h-7 text-xs bg-muted/40 border-border">
                                <SelectValue placeholder="Pilih Material" />
                              </SelectTrigger>
                              <SelectContent className="bg-muted/40 border-border text-foreground">
                                {FLOOR_MATERIALS.map((mat) => (
                                  <SelectItem key={mat.id} value={String(mat.id)} className="text-xs">
                                    {mat.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Action Buttons: Rotate & Delete */}
                          <div className="flex items-center gap-1.5 pt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                rotateVoxelBlock(selectedEntity.x, yLvl, selectedEntity.y, 90);
                              }}
                              className="h-6 text-[10px] px-2 gap-1 border-border hover:text-primary"
                            >
                              <RotateCw className="w-3 h-3" />
                              Putar 90° (R)
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                removeVoxelBlock(selectedEntity.x, yLvl, selectedEntity.y);
                              }}
                              className="h-6 text-[10px] px-2 bg-destructive/20 hover:bg-destructive/30 text-destructive border border-destructive/40"
                            >
                              <Eraser className="w-3 h-3" />
                              Hapus (Del)
                            </Button>
                          </div>
                        </div>
                      );
                    })()}

                    {selectedEntity.type === 'tile' && selectedEntity.data && (
                      <div className="space-y-1 pt-1 border-t border-border text-[10px]">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Floor:</span>
                          <span className="text-foreground font-medium">{selectedEntity.data.floorName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Wall Stack:</span>
                          <span className="text-warning font-mono font-medium">
                            {selectedEntity.data.wallHeight}x
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                    Klik pada prop atau tile di canvas untuk melihat info, memutar prop (R), atau menghapusnya.
                  </p>
                )}
              </div>
            )}

            {/* Context Status Banner: Current Active Item */}
            {(activeTool === 'floor' || activeTool === 'wall' || activeTool === 'prop') && (
              <div className="p-2.5 rounded-lg border border-border bg-muted/30 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-medium text-muted-foreground">
                    {activeTool === 'floor'
                      ? 'Floor Material'
                      : activeTool === 'wall'
                      ? 'Block Skin Material'
                      : 'Active 3D Prop'}
                  </Label>
                  <Badge
                    variant="outline"
                    className={`text-[9px] font-mono ${
                      activeTool === 'wall'
                        ? 'border-warning/40 text-warning'
                        : 'border-primary/40 text-primary'
                    }`}
                  >
                    Palette Active
                  </Badge>
                </div>

                <div className="flex items-center gap-2.5 p-1.5 rounded bg-background border border-border">
                  {activeTool === 'floor' ? (
                    currentFloorMeta?.thumbnailUrl ? (
                      <img
                        src={currentFloorMeta.thumbnailUrl}
                        alt="Current floor"
                        className="w-7 h-7 rounded object-cover border border-primary/30"
                      />
                    ) : (
                      <span
                        className="w-7 h-7 rounded shrink-0 border border-white/20 shadow-inner flex items-center justify-center font-bold text-xs text-white"
                        style={{ backgroundColor: currentFloorMeta?.swatchColor || '#64748b' }}
                      >
                        {selectedFloorType}
                      </span>
                    )
                  ) : activeTool === 'wall' ? (
                    currentWallMeta?.thumbnailUrl ? (
                      <img
                        src={currentWallMeta.thumbnailUrl}
                        alt="Current block skin"
                        className="w-7 h-7 rounded object-cover border border-warning/30"
                      />
                    ) : (
                      <span
                        className="w-7 h-7 rounded shrink-0 border border-warning/40 shadow-inner flex items-center justify-center font-bold text-xs text-white"
                        style={{ backgroundColor: currentWallMeta?.swatchColor || '#64748b' }}
                      >
                        {selectedWallType}
                      </span>
                    )
                  ) : currentPropMeta?.thumbnailUrl ? (
                    <img
                      src={currentPropMeta.thumbnailUrl}
                      alt="Current prop"
                      className="w-7 h-7 rounded object-cover border border-primary/30"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded bg-muted/40 border border-border flex items-center justify-center">
                      <Box className="w-3.5 h-3.5 text-primary" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-foreground truncate">
                      {activeTool === 'floor'
                        ? currentFloorMeta?.name || 'Default Floor'
                        : activeTool === 'wall'
                        ? currentWallMeta?.name || 'Default Block Skin'
                        : currentPropMeta?.name || 'Default Prop'}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      Pilih dari Floating Palette Window
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TOOL CONTEXT 1: Prop Orientation (Rotation Angle) */}
            {activeTool === 'prop' && (
              <div className="pt-2 space-y-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-[11px] font-medium text-foreground">
                      Prop Orientation
                    </Label>
                    <span className="text-[9px] font-mono text-muted-foreground bg-muted/40 border border-border px-1 rounded">
                      Q / E
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => rotateSelectedProp(-90)}
                      title="Rotate -90° [Q] (Shift: -45°)"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-primary hover:bg-muted"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                    <span className="text-[11px] font-mono font-bold text-primary min-w-[32px] text-center">
                      {selectedPropRotation}°
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => rotateSelectedProp(90)}
                      title="Rotate +90° [E / R] (Shift: +45°)"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-primary hover:bg-muted"
                    >
                      <RotateCw className="w-3 h-3" />
                    </Button>
                  </div>
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
                          ? 'bg-primary text-white'
                          : 'bg-muted/40 border-border text-muted-foreground'
                      }`}
                    >
                      {deg}°
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* TOOL CONTEXT 2: Stackable Modular Blocks */}
            {activeTool === 'wall' && (
              <div className="pt-3 space-y-3 border-t border-border">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-medium text-foreground">
                    Block Stacking Behavior
                  </Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <Button
                      variant={wallStackMode === 'increment' ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => setWallStackMode('increment')}
                      className={`h-7.5 text-xs gap-1.5 ${
                        wallStackMode === 'increment'
                          ? 'bg-warning/20 text-warning border-warning/40'
                          : 'bg-muted/40 border-border text-muted-foreground'
                      }`}
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                      <span>Click (+1)</span>
                    </Button>
                    <Button
                      variant={wallStackMode === 'fixed' ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => setWallStackMode('fixed')}
                      className={`h-7.5 text-xs gap-1.5 ${
                        wallStackMode === 'fixed'
                          ? 'bg-warning/20 text-warning border-warning/40'
                          : 'bg-muted/40 border-border text-muted-foreground'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Fixed</span>
                    </Button>
                  </div>
                </div>

                {wallStackMode === 'increment' ? (
                  <div className="rounded-md bg-muted/60 border border-border p-2.5 text-[11px] text-foreground space-y-1">
                    <p className="font-medium text-warning">Interactive Block Stacking:</p>
                    <p className="text-muted-foreground">
                      • <strong>Left Click</strong>: Stack block with active material (1 to 5).
                    </p>
                    <p className="text-muted-foreground">
                      • <strong>Shift + Click</strong>: Lower block (-1).
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-[11px] text-muted-foreground">Target Height (Max 20)</Label>
                      <Badge variant="outline" className="border-warning/50 text-warning font-mono text-[10px]">
                        {selectedWallHeight}x ({(selectedWallHeight * 1.15).toFixed(1)}m)
                      </Badge>
                    </div>
                    {/* Quick presets for common building heights */}
                    <div className="grid grid-cols-6 gap-1">
                      {[1, 2, 3, 5, 10, 20].map((lvl) => (
                        <Button
                          key={lvl}
                          variant={selectedWallHeight === lvl ? 'secondary' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedWallHeight(lvl)}
                          className={`h-7 text-xs font-mono ${
                            selectedWallHeight === lvl
                              ? 'bg-warning text-warning-foreground border-warning'
                              : 'bg-muted/40 border-border text-muted-foreground'
                          }`}
                        >
                          {lvl}x
                        </Button>
                      ))}
                    </div>
                    {/* Continuous slider for precise 1..20 stack height */}
                    <div className="pt-1">
                      <Slider
                        min={1}
                        max={20}
                        step={1}
                        value={[selectedWallHeight]}
                        onValueChange={(val) => {
                          const nextVal = Array.isArray(val) ? val[0] : val;
                          if (nextVal != null) setSelectedWallHeight(nextVal);
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TOOL CONTEXT 3: Monster Spawner */}
            {activeTool === 'spawner' && (
              <div className="pt-3 space-y-2 border-t border-border">
                <Label className="text-[11px] font-medium text-foreground">
                  Monster Entity
                </Label>
                <Select
                  value={selectedSpawnerType}
                  onValueChange={(val) => {
                    if (val) setSelectedSpawnerType(val);
                  }}
                >
                  <SelectTrigger className="w-full bg-muted/40 border-border text-xs text-foreground">
                    <SelectValue placeholder="Select Monster" />
                  </SelectTrigger>
                  <SelectContent className="bg-muted/40 border-border text-foreground">
                    <SelectItem value="dummy">Training Combat Dummy</SelectItem>
                    <SelectItem value="skeleton_warrior">Skeleton Warrior (Undead)</SelectItem>
                    <SelectItem value="dark_cultist">Dark Cultist (Mage)</SelectItem>
                    <SelectItem value="dungeon_boss">Abyssal Dungeon Boss</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* TOOL CONTEXT 4: Realm Portal */}
            {activeTool === 'portal' && (
              <div className="pt-3 space-y-2.5 border-t border-border">
                <Label className="text-[11px] font-medium text-foreground">
                  Portal Destination
                </Label>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Target Map ID</Label>
                  <Input
                    value={portalTargetMapId}
                    onChange={(e) => setPortalConfig(e.target.value, portalLabel)}
                    placeholder="e.g. catacombs_01"
                    className="h-7.5 text-xs bg-muted/40 border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">HUD Portal Label</Label>
                  <Input
                    value={portalLabel}
                    onChange={(e) => setPortalConfig(portalTargetMapId, e.target.value)}
                    placeholder="e.g. Enter Catacombs"
                    className="h-7.5 text-xs bg-muted/40 border-border text-foreground"
                  />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="p-3 border-t border-border bg-background space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            disabled={saveDraftMutation.isPending}
            className="w-full h-8 text-xs bg-muted/40 border-border text-foreground hover:bg-muted font-medium gap-1.5"
          >
            {saveDraftMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
            ) : saveDraftMutation.isSuccess ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            ) : (
              <Save className="w-3.5 h-3.5 text-primary" />
            )}
            <span>
              {saveDraftMutation.isPending
                ? 'Menyimpan Draft...'
                : saveDraftMutation.isSuccess
                ? 'Draft Tersimpan!'
                : 'Save Draft to Database'}
            </span>
          </Button>

          <Button
            size="sm"
            onClick={handlePublishToServer}
            disabled={publishMutation.isPending}
            className="w-full h-8 text-xs bg-primary hover:bg-primary/90 text-white font-medium gap-1.5 shadow-md shadow-primary/20"
          >
            {publishMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : publishMutation.isSuccess ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            ) : (
              <CloudUpload className="w-3.5 h-3.5" />
            )}
            <span>
              {publishMutation.isPending
                ? 'Publishing...'
                : publishMutation.isSuccess
                ? 'Published!'
                : 'Publish to Community'}
            </span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setResetDialogOpen(true)}
            className="w-full h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            <span>Clear Grid</span>
          </Button>
        </div>

        {/* Upload Prop Dialog */}
        <Dialog open={uploadPropOpen} onOpenChange={setUploadPropOpen}>
          <DialogContent className="bg-muted/40 border-border text-foreground sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base text-primary flex items-center gap-2">
                <Box className="w-4 h-4" />
                Upload Custom 3D Prop (.GLB)
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Pilih model 3D berkas .glb. Thumbnail asli akan langsung di-render otomatis.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div>
                <Label className="text-xs text-foreground">File 3D (.glb)</Label>
                <Input
                  type="file"
                  accept=".glb"
                  onChange={handlePropFileChange}
                  className="mt-1 bg-background border-border text-xs cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-foreground">
                    Texture / Palette Atlas (.png, .jpg)
                  </Label>
                  <span className="text-[10px] text-primary font-mono">Opsional / Rekomendasi</span>
                </div>
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handlePropTextureFileChange}
                  className="mt-1 bg-background border-border text-xs cursor-pointer"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Lampirkan gambar tekstur palet jika model 3D Anda tidak memiliki tekstur internal (misal: colormap.png) agar tidak putih polos.
                </p>
              </div>

              {/* Real Thumbnail Snapshot Preview */}
              {isProcessingProp ? (
                <div className="h-32 border border-border rounded flex flex-col items-center justify-center gap-2 bg-background">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  <span className="text-xs text-muted-foreground">Rendering real 3D thumbnail...</span>
                </div>
              ) : propThumbPreview ? (
                <div className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-background">
                  <img
                    src={propThumbPreview}
                    alt="Thumbnail preview"
                    className="w-20 h-20 rounded object-cover border border-primary/40 bg-muted/40"
                  />
                  <div className="space-y-1">
                    <Badge variant="outline" className="border-primary text-primary text-[10px]">
                      Auto-Generated 3D Snapshot
                    </Badge>
                    <p className="text-[11px] text-muted-foreground">
                      Thumbnail siap disimpan ke katalog server.
                    </p>
                  </div>
                </div>
              ) : null}

              <div>
                <Label className="text-xs text-foreground">Nama Objek</Label>
                <Input
                  value={propNameInput}
                  onChange={(e) => setPropNameInput(e.target.value)}
                  placeholder="e.g. Iron Golem Statue"
                  className="mt-1 h-8 bg-background border-border text-xs"
                />
              </div>

              <div>
                <Label className="text-xs text-foreground">Deskripsi (Opsional)</Label>
                <Input
                  value={propDescInput}
                  onChange={(e) => setPropDescInput(e.target.value)}
                  placeholder="e.g. Ancient guardian statue from ruins"
                  className="mt-1 h-8 bg-background border-border text-xs"
                />
              </div>

              {/* Multi-tile Footprint Selector */}
              <div className="space-y-1.5 p-2.5 rounded-lg border border-border bg-background">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-foreground">Default Footprint Luas Tile</Label>
                  <Badge variant="outline" className="border-primary/50 text-primary font-mono text-[10px]">
                    {propTileWidth} x {propTileDepth} Tile
                  </Badge>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: '1x1 (Standard)', w: 1, d: 1 },
                    { label: '2x2 (Sedang)', w: 2, d: 2 },
                    { label: '3x3 (Besar)', w: 3, d: 3 },
                    { label: '4x4 (Raksasa)', w: 4, d: 4 },
                  ].map((preset) => (
                    <Button
                      key={preset.label}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPropTileWidth(preset.w);
                        setPropTileDepth(preset.d);
                      }}
                      className={`h-7 text-[10px] px-1 ${
                        propTileWidth === preset.w && propTileDepth === preset.d
                          ? 'bg-primary/30 border-primary text-primary font-bold'
                          : 'border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Model 3D otomatis disesuaikan (auto-scale) agar pas menempati luas tile yang dipilih.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUploadPropOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitPropUpload}
                disabled={!propFile || !propNameInput.trim() || isProcessingProp}
                className="text-xs bg-primary hover:bg-primary/90 text-white"
              >
                {isProcessingProp ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                ) : null}
                Tambahkan ke Katalog
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Upload Floor Material Dialog */}
        <Dialog open={uploadFloorOpen} onOpenChange={setUploadFloorOpen}>
          <DialogContent className="bg-muted/40 border-border text-foreground sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base text-primary flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Upload Custom Floor Texture
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Pilih file gambar tekstur (PNG, JPG, WebP) untuk ubin lantai kustom.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div>
                <Label className="text-xs text-foreground">File Gambar Tekstur</Label>
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFloorFileChange}
                  className="mt-1 bg-background border-border text-xs cursor-pointer"
                />
              </div>

              {/* Realtime 3D Interactive Texture Viewport Preview */}
              {floorPreviewUrl ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-primary font-medium">3D Tile Live Preview</Label>
                    <Badge variant="outline" className="border-primary/50 text-primary text-[10px] font-mono">
                      Scale: {floorRepeatScale.toFixed(2)}x
                    </Badge>
                  </div>
                  <TexturePreviewViewport
                    textureUrl={floorPreviewUrl}
                    repeatScale={floorRepeatScale}
                    className="w-full h-44"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Preview 3D interaktif real-time: kerapatan pola ubin langsung berubah saat slider digeser.
                  </p>
                </div>
              ) : isProcessingFloor ? (
                <div className="h-32 border border-border rounded flex flex-col items-center justify-center gap-2 bg-background">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  <span className="text-xs text-muted-foreground">Loading texture file...</span>
                </div>
              ) : null}

              {/* Tiling Repeat / Zoom Setting Slider */}
              <div className="space-y-2.5 p-3 rounded-lg border border-border bg-background">
                <div className="flex justify-between items-center">
                  <Label className="text-xs text-foreground">Texture Zoom / Tiling Slider</Label>
                  <Badge variant="outline" className="border-primary/40 text-primary text-[10px] font-mono">
                    {floorRepeatScale.toFixed(2)}x {floorRepeatScale > 1 ? '(Zoom Out / Lebih Rapat)' : floorRepeatScale < 1 ? '(Zoom In / Lebih Besar)' : '(Normal 1:1)'}
                  </Badge>
                </div>
                <Slider
                  min={0.1}
                  max={4.0}
                  step={0.05}
                  value={[floorRepeatScale]}
                  onValueChange={(val) => {
                    const nextVal = Array.isArray(val) ? val[0] : val;
                    if (typeof nextVal === 'number') {
                      handleRepeatScaleChange(Number(nextVal.toFixed(2)));
                    }
                  }}
                  className="py-1 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                  <span>0.1x (Zoom In Max)</span>
                  <span>1.0x (Normal)</span>
                  <span>4.0x (Zoom Out Max)</span>
                </div>
              </div>

              <div>
                <Label className="text-xs text-foreground">Nama Material</Label>
                <Input
                  value={floorNameInput}
                  onChange={(e) => setFloorNameInput(e.target.value)}
                  placeholder="e.g. Lava Cracks"
                  className="mt-1 h-8 bg-background border-border text-xs"
                />
              </div>

              <div>
                <Label className="text-xs text-foreground">Deskripsi (Opsional)</Label>
                <Input
                  value={floorDescInput}
                  onChange={(e) => setFloorDescInput(e.target.value)}
                  placeholder="e.g. Molten rock fissures with glow"
                  className="mt-1 h-8 bg-background border-border text-xs"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUploadFloorOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitFloorUpload}
                disabled={!floorFile || !floorNameInput.trim() || isProcessingFloor}
                className="text-xs bg-primary hover:bg-primary/90 text-white"
              >
                {isProcessingFloor ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                ) : null}
                Tambahkan ke Katalog
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Soft Remove Confirmation Dialog */}
        <Dialog
          open={removeDialogState.open}
          onOpenChange={(open) =>
            setRemoveDialogState((prev) => ({ ...prev, open }))
          }
        >
          <DialogContent className="bg-muted/40 border-border text-foreground sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base text-destructive flex items-center gap-2">
                Hapus dari Katalog?
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Aset <strong>"{removeDialogState.name}"</strong> akan di-remove dari menu pilihan
                (soft remove). Objek yang sudah pernah diletakkan di grid tidak akan rusak dan
                tetap menggunakan fallback visual.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setRemoveDialogState((prev) => ({ ...prev, open: false }))
                }
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={confirmRemoveAsset}
                className="text-xs bg-destructive hover:bg-destructive/90 text-white"
              >
                Ya, Hapus Aset
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reset Map Dialog */}
        <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
          <DialogContent className="bg-muted/40 border-border text-foreground sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-sm">Reset entire map canvas?</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                This will clear all ground tiles, walls, props, spawners, and portals.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="ghost" size="sm" onClick={() => setResetDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  resetMap();
                  setResetDialogOpen(false);
                }}
              >
                Reset Grid
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </aside>

      {/* Floating Draggable Asset Palette Window */}
      <FloatingPaletteWindow
        onOpenUploadFloor={() => setUploadFloorOpen(true)}
        onOpenUploadProp={() => setUploadPropOpen(true)}
        onRequestRemove={(item) =>
          setRemoveDialogState({
            open: true,
            type: item.type,
            id: item.id,
            name: item.name,
          })
        }
      />

      {/* Floating Draggable Map Settings Window */}
      <FloatingMapSettingsWindow
        isOpen={mapSettingsOpen}
        onClose={() => setMapSettingsOpen(false)}
      />
    </TooltipProvider>
  );
};
