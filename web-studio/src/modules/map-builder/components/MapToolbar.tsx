import React, { useRef, useState, useMemo } from 'react';
import {
  MousePointer,
  Layers,
  Square,
  Skull,
  DoorOpen,
  Box,
  Eraser,
  Download,
  Upload,
  RotateCcw,
  RotateCw,
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
import {
  generateGlbThumbnail,
  generateTextureThumbnail,
} from '@/lib/thumbnailGenerator';
import { packGlbWithTexture } from '@/lib/glbPacker';
import { uploadPgcAsset } from '@/lib/pgcService';
import { registerDynamicFloorTexture } from '../utils/proceduralTextures';
import { FloatingPaletteWindow } from './FloatingPaletteWindow';
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
    loadFromMapData,
    resetMap,
    mapId,
    mapName,
    setMapMeta,
    customProps,
    customFloors,
    addCustomProp,
    removeCustomProp,
    addCustomFloor,
    removeCustomFloor,
  } = useMapStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  // Upload Prop Dialog
  const [uploadPropOpen, setUploadPropOpen] = useState(false);
  const [propNameInput, setPropNameInput] = useState('');
  const [propDescInput, setPropDescInput] = useState('');
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

  const handlePublishToServer = () => {
    const mapData = exportToMapData();
    publishMutation.mutate({
      kind: 'map',
      contentType: 'application/json',
      data: JSON.stringify(mapData, null, 2),
    });
  };

  const handleExportJson = () => {
    const data = exportToMapData();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.map_id || 'map_export'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        loadFromMapData(parsed);
      } catch {
        alert('Invalid map JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
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
      };

      addCustomProp(newProp);
      setUploadPropOpen(false);
      setPropFile(null);
      setPropTextureFile(null);
      setPropNameInput('');
      setPropDescInput('');
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
      <aside className="w-72 h-full bg-slate-950/95 border-r border-slate-800/80 flex flex-col shrink-0 select-none backdrop-blur-md z-10">
        {/* Top Header & Map Metadata */}
        <div className="p-3.5 border-b border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400/50" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                3D Map Architect
              </h2>
            </div>
            <Badge variant="outline" className="border-slate-800 text-[10px] text-slate-400 font-mono">
              {width}x{height} Grid
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] text-slate-400">Map ID</Label>
              <Input
                value={mapId}
                onChange={(e) => setMapMeta(e.target.value, mapName)}
                className="h-7 text-xs bg-slate-900 border-slate-800 text-slate-200"
              />
            </div>
            <div>
              <Label className="text-[10px] text-slate-400">Map Name</Label>
              <Input
                value={mapName}
                onChange={(e) => setMapMeta(mapId, e.target.value)}
                className="h-7 text-xs bg-slate-900 border-slate-800 text-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Scrollable Tool Panel */}
        <ScrollArea className="flex-1 p-3.5">
          <div className="space-y-4">
            {/* Primary Tool Selector */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-slate-400">Tool Mode</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {tools.map((t) => {
                  const isActive = activeTool === t.id;
                  return (
                    <Tooltip key={t.id}>
                      <TooltipTrigger
                        onClick={() => setActiveTool(t.id)}
                        className={`h-9 flex items-center justify-start gap-2 px-2.5 rounded-md transition-all text-left cursor-pointer ${
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

              {/* Left-Click Drag Mode */}
              <div className="pt-2 space-y-1.5">
                <Label className="text-[11px] font-medium text-slate-400">
                  Drag Application
                </Label>
                <div className="grid grid-cols-2 gap-1.5">
                  <Button
                    variant={dragPaintMode === 'brush' ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => setDragPaintMode('brush')}
                    className={`h-7.5 text-xs gap-1.5 ${
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
                    className={`h-7.5 text-xs gap-1.5 ${
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

            {/* TOOL CONTEXT: Select / Pointer Inspector */}
            {activeTool === 'select' && (
              <div className="p-2.5 rounded-lg border border-slate-800/80 bg-slate-900/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <MousePointer className="w-3.5 h-3.5 text-cyan-400" />
                    <Label className="text-[11px] font-medium text-slate-200">
                      Cursor Inspector
                    </Label>
                  </div>
                  <Badge variant="outline" className="text-[9px] border-cyan-500/40 text-cyan-300">
                    Mode V
                  </Badge>
                </div>

                {selectedEntity ? (
                  <div className="space-y-2 p-2 rounded bg-slate-950/80 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-cyan-300 uppercase tracking-wide">
                        {selectedEntity.type}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        Grid ({selectedEntity.x}, {selectedEntity.y})
                      </span>
                    </div>

                    {selectedEntity.type === 'prop' && selectedEntity.data && (
                      <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
                        <div className="text-xs text-slate-200 font-medium">
                          {selectedEntity.data.prefabMeta?.name || selectedEntity.data.prefab_id}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>Rotation:</span>
                          <span className="font-mono text-cyan-300 font-bold">
                            {selectedEntity.data.rotation_deg}°
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 pt-1">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => rotateSelectedProp(90)}
                            className="h-6 text-[10px] flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 gap-1"
                          >
                            <RotateCw className="w-3 h-3" />
                            Rotate (R)
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              eraseAt(selectedEntity.x, selectedEntity.y);
                              setSelectedEntity(null);
                            }}
                            className="h-6 text-[10px] px-2 bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800"
                          >
                            <Eraser className="w-3 h-3" />
                            Hapus
                          </Button>
                        </div>
                      </div>
                    )}

                    {selectedEntity.type === 'tile' && selectedEntity.data && (
                      <div className="space-y-1 pt-1 border-t border-slate-800/80 text-[10px]">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Floor:</span>
                          <span className="text-slate-200 font-medium">{selectedEntity.data.floorName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Wall Stack:</span>
                          <span className="text-amber-300 font-mono font-medium">
                            {selectedEntity.data.wallHeight}x
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 leading-relaxed italic">
                    Klik pada prop atau tile di canvas untuk melihat info, memutar prop (R), atau menghapusnya.
                  </p>
                )}
              </div>
            )}

            {/* Context Status Banner: Current Active Item */}
            {(activeTool === 'floor' || activeTool === 'wall' || activeTool === 'prop') && (
              <div className="p-2.5 rounded-lg border border-slate-800/80 bg-slate-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-medium text-slate-400">
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
                        ? 'border-amber-500/40 text-amber-300'
                        : 'border-cyan-500/40 text-cyan-300'
                    }`}
                  >
                    Palette Active
                  </Badge>
                </div>

                <div className="flex items-center gap-2.5 p-1.5 rounded bg-slate-950 border border-slate-800/80">
                  {activeTool === 'floor' ? (
                    currentFloorMeta?.thumbnailUrl ? (
                      <img
                        src={currentFloorMeta.thumbnailUrl}
                        alt="Current floor"
                        className="w-7 h-7 rounded object-cover border border-cyan-500/30"
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
                        className="w-7 h-7 rounded object-cover border border-amber-500/30"
                      />
                    ) : (
                      <span
                        className="w-7 h-7 rounded shrink-0 border border-amber-400/40 shadow-inner flex items-center justify-center font-bold text-xs text-white"
                        style={{ backgroundColor: currentWallMeta?.swatchColor || '#64748b' }}
                      >
                        {selectedWallType}
                      </span>
                    )
                  ) : currentPropMeta?.thumbnailUrl ? (
                    <img
                      src={currentPropMeta.thumbnailUrl}
                      alt="Current prop"
                      className="w-7 h-7 rounded object-cover border border-cyan-500/30"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded bg-slate-900 border border-slate-800 flex items-center justify-center">
                      <Box className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-slate-200 truncate">
                      {activeTool === 'floor'
                        ? currentFloorMeta?.name || 'Default Floor'
                        : activeTool === 'wall'
                        ? currentWallMeta?.name || 'Default Block Skin'
                        : currentPropMeta?.name || 'Default Prop'}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      Pilih dari Floating Palette Window
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TOOL CONTEXT 1: Prop Orientation (Rotation Angle) */}
            {activeTool === 'prop' && (
              <div className="pt-2 space-y-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-[11px] font-medium text-slate-300">
                      Prop Orientation
                    </Label>
                    <span className="text-[9px] font-mono text-slate-500 bg-slate-900 border border-slate-800 px-1 rounded">
                      Q / E
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => rotateSelectedProp(-90)}
                      title="Rotate -90° [Q] (Shift: -45°)"
                      className="h-6 w-6 p-0 text-slate-400 hover:text-cyan-300 hover:bg-slate-800"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                    <span className="text-[11px] font-mono font-bold text-cyan-400 min-w-[32px] text-center">
                      {selectedPropRotation}°
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => rotateSelectedProp(90)}
                      title="Rotate +90° [E / R] (Shift: +45°)"
                      className="h-6 w-6 p-0 text-slate-400 hover:text-cyan-300 hover:bg-slate-800"
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
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
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
              <div className="pt-3 space-y-3 border-t border-slate-800/80">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-medium text-slate-300">
                    Block Stacking Behavior
                  </Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <Button
                      variant={wallStackMode === 'increment' ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => setWallStackMode('increment')}
                      className={`h-7.5 text-xs gap-1.5 ${
                        wallStackMode === 'increment'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
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
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Fixed</span>
                    </Button>
                  </div>
                </div>

                {wallStackMode === 'increment' ? (
                  <div className="rounded-md bg-slate-900/80 border border-slate-800 p-2.5 text-[11px] text-slate-300 space-y-1">
                    <p className="font-medium text-amber-300">Interactive Block Stacking:</p>
                    <p className="text-slate-400">
                      • <strong>Left Click</strong>: Stack block with active material (1 to 5).
                    </p>
                    <p className="text-slate-400">
                      • <strong>Shift + Click</strong>: Lower block (-1).
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-[11px] text-slate-400">Target Height</Label>
                      <Badge variant="outline" className="border-amber-700 text-amber-300 font-mono text-[10px]">
                        {selectedWallHeight}x ({(selectedWallHeight * 1.15).toFixed(1)}m)
                      </Badge>
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <Button
                          key={lvl}
                          variant={selectedWallHeight === lvl ? 'secondary' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedWallHeight(lvl)}
                          className={`h-7 text-xs font-mono ${
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

            {/* TOOL CONTEXT 3: Monster Spawner */}
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
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
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
              <div className="pt-3 space-y-2.5 border-t border-slate-800/80">
                <Label className="text-[11px] font-medium text-slate-300">
                  Portal Destination
                </Label>
                <div>
                  <Label className="text-[10px] text-slate-400">Target Map ID</Label>
                  <Input
                    value={portalTargetMapId}
                    onChange={(e) => setPortalConfig(e.target.value, portalLabel)}
                    placeholder="e.g. catacombs_01"
                    className="h-7.5 text-xs bg-slate-900 border-slate-800 text-slate-200"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-slate-400">HUD Portal Label</Label>
                  <Input
                    value={portalLabel}
                    onChange={(e) => setPortalConfig(portalTargetMapId, e.target.value)}
                    placeholder="e.g. Enter Catacombs"
                    className="h-7.5 text-xs bg-slate-900 border-slate-800 text-slate-200"
                  />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950 space-y-2">
          <div className="grid grid-cols-2 gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportJson}
              className="h-7.5 text-xs bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              <span>Export</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-7.5 text-xs bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
            >
              <Upload className="w-3.5 h-3.5 mr-1" />
              <span>Import</span>
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportJson}
              accept=".json"
              className="hidden"
            />
          </div>

          <Button
            size="sm"
            onClick={handlePublishToServer}
            disabled={publishMutation.isPending}
            className="w-full h-8 text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-medium gap-1.5 shadow-md shadow-cyan-950"
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
            className="w-full h-7 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            <span>Clear Grid</span>
          </Button>
        </div>

        {/* Upload Prop Dialog */}
        <Dialog open={uploadPropOpen} onOpenChange={setUploadPropOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-slate-200 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base text-cyan-300 flex items-center gap-2">
                <Box className="w-4 h-4" />
                Upload Custom 3D Prop (.GLB)
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Pilih model 3D berkas .glb. Thumbnail asli akan langsung di-render otomatis.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div>
                <Label className="text-xs text-slate-300">File 3D (.glb)</Label>
                <Input
                  type="file"
                  accept=".glb"
                  onChange={handlePropFileChange}
                  className="mt-1 bg-slate-950 border-slate-800 text-xs cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-slate-300">
                    Texture / Palette Atlas (.png, .jpg)
                  </Label>
                  <span className="text-[10px] text-cyan-400 font-mono">Opsional / Rekomendasi</span>
                </div>
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handlePropTextureFileChange}
                  className="mt-1 bg-slate-950 border-slate-800 text-xs cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Lampirkan gambar tekstur palet jika model 3D Anda tidak memiliki tekstur internal (misal: colormap.png) agar tidak putih polos.
                </p>
              </div>

              {/* Real Thumbnail Snapshot Preview */}
              {isProcessingProp ? (
                <div className="h-32 border border-slate-800 rounded flex flex-col items-center justify-center gap-2 bg-slate-950">
                  <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                  <span className="text-xs text-slate-400">Rendering real 3D thumbnail...</span>
                </div>
              ) : propThumbPreview ? (
                <div className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-800 bg-slate-950">
                  <img
                    src={propThumbPreview}
                    alt="Thumbnail preview"
                    className="w-20 h-20 rounded object-cover border border-cyan-500/40 bg-slate-900"
                  />
                  <div className="space-y-1">
                    <Badge variant="outline" className="border-cyan-500 text-cyan-300 text-[10px]">
                      Auto-Generated 3D Snapshot
                    </Badge>
                    <p className="text-[11px] text-slate-400">
                      Thumbnail siap disimpan ke katalog server.
                    </p>
                  </div>
                </div>
              ) : null}

              <div>
                <Label className="text-xs text-slate-300">Nama Objek</Label>
                <Input
                  value={propNameInput}
                  onChange={(e) => setPropNameInput(e.target.value)}
                  placeholder="e.g. Iron Golem Statue"
                  className="mt-1 h-8 bg-slate-950 border-slate-800 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs text-slate-300">Deskripsi (Opsional)</Label>
                <Input
                  value={propDescInput}
                  onChange={(e) => setPropDescInput(e.target.value)}
                  placeholder="e.g. Ancient guardian statue from ruins"
                  className="mt-1 h-8 bg-slate-950 border-slate-800 text-xs"
                />
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
                className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white"
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
          <DialogContent className="bg-slate-900 border-slate-800 text-slate-200 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base text-cyan-300 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Upload Custom Floor Texture
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Pilih file gambar tekstur (PNG, JPG, WebP) untuk ubin lantai kustom.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div>
                <Label className="text-xs text-slate-300">File Gambar Tekstur</Label>
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFloorFileChange}
                  className="mt-1 bg-slate-950 border-slate-800 text-xs cursor-pointer"
                />
              </div>

              {/* Realtime 3D Interactive Texture Viewport Preview */}
              {floorPreviewUrl ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-cyan-300 font-medium">3D Tile Live Preview</Label>
                    <Badge variant="outline" className="border-cyan-500/50 text-cyan-300 text-[10px] font-mono">
                      Scale: {floorRepeatScale.toFixed(2)}x
                    </Badge>
                  </div>
                  <TexturePreviewViewport
                    textureUrl={floorPreviewUrl}
                    repeatScale={floorRepeatScale}
                    className="w-full h-44"
                  />
                  <p className="text-[11px] text-slate-400">
                    Preview 3D interaktif real-time: kerapatan pola ubin langsung berubah saat slider digeser.
                  </p>
                </div>
              ) : isProcessingFloor ? (
                <div className="h-32 border border-slate-800 rounded flex flex-col items-center justify-center gap-2 bg-slate-950">
                  <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                  <span className="text-xs text-slate-400">Loading texture file...</span>
                </div>
              ) : null}

              {/* Tiling Repeat / Zoom Setting Slider */}
              <div className="space-y-2.5 p-3 rounded-lg border border-slate-800 bg-slate-950">
                <div className="flex justify-between items-center">
                  <Label className="text-xs text-slate-300">Texture Zoom / Tiling Slider</Label>
                  <Badge variant="outline" className="border-cyan-500/40 text-cyan-300 text-[10px] font-mono">
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
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0.1x (Zoom In Max)</span>
                  <span>1.0x (Normal)</span>
                  <span>4.0x (Zoom Out Max)</span>
                </div>
              </div>

              <div>
                <Label className="text-xs text-slate-300">Nama Material</Label>
                <Input
                  value={floorNameInput}
                  onChange={(e) => setFloorNameInput(e.target.value)}
                  placeholder="e.g. Lava Cracks"
                  className="mt-1 h-8 bg-slate-950 border-slate-800 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs text-slate-300">Deskripsi (Opsional)</Label>
                <Input
                  value={floorDescInput}
                  onChange={(e) => setFloorDescInput(e.target.value)}
                  placeholder="e.g. Molten rock fissures with glow"
                  className="mt-1 h-8 bg-slate-950 border-slate-800 text-xs"
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
                className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white"
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
          <DialogContent className="bg-slate-900 border-slate-800 text-slate-200 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base text-rose-400 flex items-center gap-2">
                Hapus dari Katalog?
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
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
                className="text-xs bg-rose-600 hover:bg-rose-500 text-white"
              >
                Ya, Hapus Aset
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reset Map Dialog */}
        <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-slate-200 sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-sm">Reset entire map canvas?</DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
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
    </TooltipProvider>
  );
};
