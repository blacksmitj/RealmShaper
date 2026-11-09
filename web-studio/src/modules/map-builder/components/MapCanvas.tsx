import React, { useRef, useState, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Sun, Moon, Layers, RotateCw, RotateCcw, Paintbrush, SquareDashed, MousePointer } from 'lucide-react';
import { useMapStore } from '../stores/mapStore';
import { getFloorTexture, registerDynamicFloorTexture } from '../utils/proceduralTextures';
import { getBlob } from '@/lib/assetStorage';
import { FLOOR_MATERIALS, PROP_PREFABS } from '../types/map.types';
import { FloorTileMesh } from './FloorTileMesh';
import { BlockStackMesh, STONE_BLOCK_HEIGHT } from './BlockStackMesh';
import { PropMesh3D } from './MedievalProps3D';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Map Builder 3D Viewport — Grid-Aligned 2.0m x 2.0m
// Mouse Controls:
// - Left Click + Drag: Paint / Box Fill across dragged region
// - Scroll Wheel: Zoom In / Out
// - Middle Click (Wheel Click) + Drag: Pan Camera Up / Down / Left / Right (Screen-Space)
// - Right Click + Drag: Orbit / Rotate Camera

interface HoveredCell {
  x: number;
  y: number;
}

const getCompassDirectionLabel = (deg: number): string => {
  const normalized = ((deg % 360) + 360) % 360;
  if (normalized >= 337.5 || normalized < 22.5) return 'South (+Z)';
  if (normalized >= 22.5 && normalized < 67.5) return 'South-West';
  if (normalized >= 67.5 && normalized < 112.5) return 'West (+X)';
  if (normalized >= 112.5 && normalized < 157.5) return 'North-West';
  if (normalized >= 157.5 && normalized < 202.5) return 'North (-Z)';
  if (normalized >= 202.5 && normalized < 247.5) return 'North-East';
  if (normalized >= 247.5 && normalized < 292.5) return 'East (-X)';
  return 'South-East';
};

const GROUND_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const TEMP_INTERSECT = new THREE.Vector3();
const NOOP_RAYCAST = () => null;

export const MapCanvas: React.FC = () => {
  const {
    environmentTheme,
    setEnvironmentTheme,
    activeTool,
    setActiveTool,
    dragPaintMode,
    setDragPaintMode,
    wallStackMode,
    selectedWallHeight,
    selectedPropRotation,
    rotateSelectedProp,
  } = useMapStore();

  const isDay = environmentTheme === 'medieval_day';

  return (
    <div
      className="w-full h-full relative bg-slate-950 overflow-hidden select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      <Canvas
        camera={{ position: [0, 26, 24], fov: 45 }}
        shadows
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <color attach="background" args={[isDay ? '#0f172a' : '#090a10']} />
        <fog attach="fog" args={[isDay ? '#0f172a' : '#090a10', 38, 85]} />

        <ambientLight intensity={isDay ? 0.95 : 0.45} color={isDay ? '#f8fafc' : '#94a3b8'} />
        <hemisphereLight
          args={[
            isDay ? '#bae6fd' : '#312e81',
            isDay ? '#14532d' : '#1e1b4b',
            isDay ? 0.55 : 0.25,
          ]}
        />
        <directionalLight
          position={[16, 28, 18]}
          intensity={isDay ? 1.55 : 0.75}
          color={isDay ? '#fffbeb' : '#c7d2fe'}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight
          position={[0, 10, 0]}
          intensity={isDay ? 0.8 : 1.6}
          color="#ffd166"
          distance={30}
        />

        {/* Dedicated 3D Editor Camera Controls:
            LEFT = Disabled (Reserved exclusively for Left-Click Paint / Area Drag)
            MIDDLE (Wheel Click Drag) = PAN (Move Up/Down/Left/Right)
            RIGHT = ROTATE (Orbit Camera)
            WHEEL = DOLLY (Zoom In / Zoom Out)
        */}
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.06}
          enableZoom
          zoomSpeed={1.2}
          enablePan
          panSpeed={1.15}
          screenSpacePanning
          rotateSpeed={0.85}
          maxPolarAngle={Math.PI / 2.05}
          minDistance={5}
          maxDistance={72}
          mouseButtons={{
            LEFT: -1 as unknown as THREE.MOUSE,
            MIDDLE: THREE.MOUSE.PAN,
            RIGHT: THREE.MOUSE.ROTATE,
          }}
        />

        <Suspense fallback={null}>
          <WorldGridScene />
        </Suspense>
      </Canvas>

      {/* Top-Left Viewport Instructions Overlay */}
      <div className="absolute top-4 left-4 pointer-events-none bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-lg p-3 text-xs text-slate-300 space-y-1.5 shadow-xl">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-cyan-400">3D Viewport Controls (2.0m Grid)</span>
          <Badge variant="outline" className="border-cyan-800 text-cyan-300 text-[10px] h-4 px-1.5">
            {dragPaintMode === 'box' ? 'Box Area Fill' : 'Brush Drag'}
          </Badge>
        </div>
        <p className="text-[11px] text-slate-400">
          <strong className="text-cyan-300">Left Click + Drag:</strong> Apply to dragged region ({dragPaintMode === 'box' ? 'Rectangle Area' : 'Brush Stroke'})
        </p>
        <p className="text-[11px] text-slate-400">
          <strong className="text-slate-200">Scroll Wheel:</strong> Zoom In / Out
        </p>
        <p className="text-[11px] text-slate-400">
          <strong className="text-emerald-300">Wheel Click + Drag:</strong> Pan Move Up / Down / Left / Right
        </p>
        <p className="text-[11px] text-slate-400">
          <strong className="text-amber-300">Right Click + Drag:</strong> Orbit Rotate Camera
        </p>
        {activeTool === 'prop' && (
          <div className="pt-1 mt-1 border-t border-slate-800 text-[11px] text-cyan-300">
            <strong className="text-white">Q / E (or R):</strong> Rotate Prop (±90°, Shift: ±45°) |{' '}
            <strong className="text-slate-200">Alt + Scroll:</strong> Quick Spin
          </div>
        )}
      </div>

      {/* Top-Right Drag Mode, Tool Context & Lighting Bar */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-lg p-1.5 shadow-xl">
        {/* Pointer / Select Tool Trigger */}
        <Button
          variant={activeTool === 'select' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTool('select')}
          title="Select / Cursor Mode [V / Esc]"
          className={`h-7 px-2.5 text-xs gap-1.5 ${
            activeTool === 'select'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-medium'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MousePointer className="w-3.5 h-3.5" />
          <span>Select (V)</span>
        </Button>

        {/* Brush vs Box Area Fill Toggle */}
        <div className="flex items-center gap-1 pr-2 border-r border-slate-800">
          <Button
            variant={dragPaintMode === 'brush' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setDragPaintMode('brush')}
            className={`h-7 px-2.5 text-xs gap-1.5 ${
              dragPaintMode === 'brush'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400'
            }`}
          >
            <Paintbrush className="w-3.5 h-3.5" />
            <span>Brush Drag</span>
          </Button>
          <Button
            variant={dragPaintMode === 'box' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setDragPaintMode('box')}
            className={`h-7 px-2.5 text-xs gap-1.5 ${
              dragPaintMode === 'box'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400'
            }`}
          >
            <SquareDashed className="w-3.5 h-3.5" />
            <span>Box Area Drag</span>
          </Button>
        </div>

        {activeTool === 'wall' && (
          <Badge
            variant="secondary"
            className="bg-amber-950/80 text-amber-300 border-amber-800/60 gap-1"
          >
            <Layers className="w-3 h-3" />
            <span>
              {wallStackMode === 'increment'
                ? 'Stack: +1 per Drag'
                : `Fixed Stack: ${selectedWallHeight}x`}
            </span>
          </Badge>
        )}

        {activeTool === 'prop' && (
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-lg p-0.5 shadow-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => rotateSelectedProp(-90)}
              title="Putar Kiri (-90°) [Q] (Shift: -45°)"
              className="h-7 w-7 p-0 text-slate-400 hover:text-cyan-300 hover:bg-slate-800"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
            <div className="flex flex-col items-center px-1.5 min-w-[56px] select-none">
              <span className="text-[11px] font-mono font-bold text-cyan-300 leading-none">
                {selectedPropRotation}°
              </span>
              <span className="text-[8px] font-mono text-slate-400 leading-none mt-0.5">
                {getCompassDirectionLabel(selectedPropRotation)}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => rotateSelectedProp(90)}
              title="Putar Kanan (+90°) [E / R] (Shift: +45°)"
              className="h-7 w-7 p-0 text-slate-400 hover:text-cyan-300 hover:bg-slate-800"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        <Button
          variant={isDay ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setEnvironmentTheme('medieval_day')}
          className={`h-7 px-2.5 text-xs gap-1.5 ${
            isDay ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400'
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
          <span>Day</span>
        </Button>

        <Button
          variant={!isDay ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setEnvironmentTheme('gothic_night')}
          className={`h-7 px-2.5 text-xs gap-1.5 ${
            !isDay
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
              : 'text-slate-400'
          }`}
        >
          <Moon className="w-3.5 h-3.5" />
          <span>Night</span>
        </Button>
      </div>
    </div>
  );
};

const WorldGridScene: React.FC = () => {
  const {
    width,
    height,
    groundLayer,
    collisionLayer,
    wallMaterialsLayer,
    spawners,
    portals,
    props,
    paintTile,
    paintRegion,
    decreaseWallAt,
    eraseAt,
    activeTool,
    dragPaintMode,
    selectedWallType,
    selectedPropPrefab,
    selectedPropRotation,
    selectedEntity,
    setSelectedEntity,
  } = useMapStore();

  const [hovered, setHovered] = useState<HoveredCell | null>(null);
  const [boxDragStart, setBoxDragStart] = useState<HoveredCell | null>(null);
  const isLeftDraggingRef = useRef(false);
  const isShiftDownRef = useRef(false);
  const paintedCellsInStrokeRef = useRef<Set<string>>(new Set());
  const hoveredRef = useRef<HoveredCell | null>(null);
  hoveredRef.current = hovered;

  // Global Keyboard Shortcuts (Q / E / R) & Wheel Spin (Alt + Wheel)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input, textarea, or contentEditable
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      // V or Escape switches to Select / Pointer Tool
      if (key === 'v' || e.key === 'Escape') {
        const { setActiveTool, setSelectedEntity } = useMapStore.getState();
        setActiveTool('select');
        if (e.key === 'Escape') {
          setSelectedEntity(null);
        }
        return;
      }

      // Delete or Backspace removes selected entity in Select mode
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const { activeTool, selectedEntity, eraseAt, setSelectedEntity } = useMapStore.getState();
        if (activeTool === 'select' && selectedEntity) {
          e.preventDefault();
          eraseAt(selectedEntity.x, selectedEntity.y);
          setSelectedEntity(null);
          return;
        }
      }

      if (key !== 'q' && key !== 'e' && key !== 'r') return;

      const { activeTool, rotateSelectedProp: rotateProp, props, selectedEntity } =
        useMapStore.getState();
      const currentHovered = hoveredRef.current;
      const targetPos = currentHovered || (selectedEntity?.type === 'prop' ? { x: selectedEntity.x, y: selectedEntity.y } : null);
      const hasProp = targetPos
        ? props.some((p) => p.grid_x === targetPos.x && p.grid_y === targetPos.y)
        : false;

      // Only allow rotation if currently in 'prop' tool OR hovering/selecting an existing placed prop!
      // Never auto-switch tool to 'prop' when in floor/wall/eraser/select without a prop.
      if (activeTool !== 'prop' && !hasProp) {
        return;
      }

      e.preventDefault();
      const isShift = e.shiftKey;
      let step = 90;
      if (key === 'q') {
        step = isShift ? -45 : -90;
      } else {
        step = isShift ? 45 : 90;
      }

      rotateProp(step, targetPos);
    };

    const handleWheel = (e: WheelEvent) => {
      if (!e.altKey) return;
      const { activeTool, rotateSelectedProp: rotateProp, props, selectedEntity } =
        useMapStore.getState();
      const currentHovered = hoveredRef.current;
      const targetPos = currentHovered || (selectedEntity?.type === 'prop' ? { x: selectedEntity.x, y: selectedEntity.y } : null);
      const hasProp = targetPos
        ? props.some((p) => p.grid_x === targetPos.x && p.grid_y === targetPos.y)
        : false;

      if (activeTool !== 'prop' && !hasProp) {
        return;
      }

      e.preventDefault();
      const step = e.shiftKey ? 45 : 90;
      const delta = e.deltaY < 0 ? step : -step;
      rotateProp(delta, targetPos);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Dynamic Floor Texture & Custom Prop Model Registration & Cache Sync (with IndexedDB fallback)
  const customFloors = useMapStore((s) => s.customFloors);
  const customProps = useMapStore((s) => s.customProps);
  const updateCustomProp = useMapStore((s) => s.updateCustomProp);
  const [textureVersion, setTextureVersion] = useState(0);

  // Sync custom props blob URLs from IndexedDB if they are revoked or dead after refresh
  useEffect(() => {
    let active = true;
    const loadCustomPropsFromStorage = async () => {
      for (const cp of customProps) {
        if (cp.isCustom) {
          const blob = await getBlob(cp.id);
          if (!active) return;
          if (blob) {
            const freshBlobUrl = URL.createObjectURL(blob);
            updateCustomProp(cp.id, { modelUrl: freshBlobUrl });
          }
        }
      }
    };
    loadCustomPropsFromStorage();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadCustomTextures = async () => {
      let updated = false;
      for (const cf of customFloors) {
        // Blob URL (blob:...) yang tersimpan di localStorage MATI setelah reload halaman.
        // Selalu utamakan file asli dari IndexedDB lalu buat blob URL baru.
        const blob = await getBlob(`custom_floor_${cf.id}`);
        if (!active) return;
        const scale = cf.repeatScale ?? 1.0;
        if (blob) {
          const url = URL.createObjectURL(blob);
          registerDynamicFloorTexture(cf.id, url, scale, () => {
            if (active) setTextureVersion((v) => v + 1);
          });
          updated = true;
        } else if (cf.textureUrl && !cf.textureUrl.startsWith('blob:')) {
          // URL permanen (mis. URL server) masih valid
          registerDynamicFloorTexture(cf.id, cf.textureUrl, scale, () => {
            if (active) setTextureVersion((v) => v + 1);
          });
          updated = true;
        } else {
          console.warn(
            `[MapCanvas] Tekstur custom "${cf.name}" (id ${cf.id}) tidak punya file tersimpan. Upload ulang diperlukan.`
          );
        }
      }
      if (updated && active) {
        setTextureVersion((v) => v + 1);
      }
    };
    loadCustomTextures();
    return () => {
      active = false;
    };
  }, [customFloors]);


  // River water continuous flow
  useFrame((_, delta) => {
    const waterTex = getFloorTexture(7);
    if (waterTex) {
      waterTex.offset.y = (waterTex.offset.y - delta * 0.28) % 1;
      waterTex.offset.x = Math.sin(performance.now() * 0.001) * 0.03;
    }
  });

  // Godot Centered origin calculation:
  const originX = -(width * 2.0) * 0.5 + 1.0;
  const originZ = -(height * 2.0) * 0.5 + 1.0;

  // Mathematical ground plane intersection (never blocked by tall trees, houses, or stacked stone walls)
  const getCellFromRay = (ray: THREE.Ray): HoveredCell | null => {
    const hit = ray.intersectPlane(GROUND_PLANE, TEMP_INTERSECT);
    if (!hit) return null;
    const cellX = Math.round((hit.x - originX) / 2.0);
    const cellY = Math.round((hit.z - originZ) / 2.0);
    if (cellX >= 0 && cellX < width && cellY >= 0 && cellY < height) {
      return { x: cellX, y: cellY };
    }
    return null;
  };

  const applyBrushCellOnce = (cell: HoveredCell, shiftKey: boolean) => {
    const key = `${cell.x}_${cell.y}`;
    if (paintedCellsInStrokeRef.current.has(key)) return;
    paintedCellsInStrokeRef.current.add(key);

    if (activeTool === 'eraser') {
      eraseAt(cell.x, cell.y);
    } else if (activeTool === 'wall' && shiftKey) {
      decreaseWallAt(cell.x, cell.y);
    } else {
      paintTile(cell.x, cell.y, false);
    }
  };

  // Ensure mouse release outside canvas still finalizes box fill or brush stroke cleanly
  useEffect(() => {
    const handleWindowPointerUp = (ev: PointerEvent) => {
      if (ev.button !== 0 || !isLeftDraggingRef.current) return;
      isLeftDraggingRef.current = false;
      paintedCellsInStrokeRef.current.clear();
      setBoxDragStart(null);
    };
    window.addEventListener('pointerup', handleWindowPointerUp);
    return () => window.removeEventListener('pointerup', handleWindowPointerUp);
  }, []);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    // Only Left Click (button === 0) paints or starts area drag
    if (e.button !== 0) return;
    e.stopPropagation();

    const cell = getCellFromRay(e.ray) ?? hovered;
    if (!cell) return;

    if (activeTool === 'select') {
      const existingProp = props.find((p) => p.grid_x === cell.x && p.grid_y === cell.y);
      const customMeta = existingProp
        ? useMapStore.getState().customProps.find((cp) => cp.id === existingProp.prefab_id)
        : null;
      const builtinMeta = existingProp
        ? PROP_PREFABS.find((bp) => bp.id === existingProp.prefab_id)
        : null;

      const idx = cell.y * width + cell.x;
      const floorId = groundLayer[idx] ?? 0;
      const wallH = collisionLayer[idx] ?? 0;
      const floorMeta =
        customFloors.find((cf) => cf.id === floorId) ||
        FLOOR_MATERIALS.find((fm) => fm.id === floorId);

      if (existingProp) {
        setSelectedEntity({
          type: 'prop',
          x: cell.x,
          y: cell.y,
          data: {
            ...existingProp,
            prefabMeta: customMeta || builtinMeta,
          },
        });
      } else {
        setSelectedEntity({
          type: 'tile',
          x: cell.x,
          y: cell.y,
          data: {
            floorId,
            floorName: floorMeta?.name || `Material #${floorId}`,
            wallHeight: wallH,
          },
        });
      }
      return;
    }

    isLeftDraggingRef.current = true;
    isShiftDownRef.current = e.shiftKey;
    paintedCellsInStrokeRef.current.clear();
    setHovered(cell);

    if (dragPaintMode === 'box') {
      setBoxDragStart(cell);
    } else {
      applyBrushCellOnce(cell, e.shiftKey);
    }
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    const cell = getCellFromRay(e.ray);
    if (!cell) {
      if (!isLeftDraggingRef.current) {
        setHovered(null);
      }
      return;
    }

    if (!hovered || hovered.x !== cell.x || hovered.y !== cell.y) {
      setHovered(cell);
    }

    if (isLeftDraggingRef.current && (e.buttons & 1) === 1) {
      if (dragPaintMode === 'brush') {
        applyBrushCellOnce(cell, e.shiftKey);
      }
    }
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    if (e.button !== 0 || !isLeftDraggingRef.current) return;
    e.stopPropagation();

    const endCell = getCellFromRay(e.ray) ?? hovered;
    if (dragPaintMode === 'box' && boxDragStart && endCell) {
      paintRegion(
        boxDragStart.x,
        boxDragStart.y,
        endCell.x,
        endCell.y,
        isShiftDownRef.current || e.shiftKey
      );
    }

    isLeftDraggingRef.current = false;
    paintedCellsInStrokeRef.current.clear();
    setBoxDragStart(null);
  };

  // Pre-calculate tiles for rendering
  const tiles = useMemo(() => {
    const list: Array<{
      x: number;
      y: number;
      posX: number;
      posZ: number;
      floorType: number;
      wallHeight: number;
      wallMaterial: number;
    }> = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const posX = originX + x * 2.0;
        const posZ = originZ + y * 2.0;
        const floorType = groundLayer[idx] ?? 0;
        const wallHeight = Math.max(0, Math.min(5, collisionLayer[idx] ?? 0));
        const wallMaterial =
          wallMaterialsLayer && wallMaterialsLayer[idx] > 0
            ? wallMaterialsLayer[idx]
            : 2; // fallback to 2 (Cobblestone)
        list.push({ x, y, posX, posZ, floorType, wallHeight, wallMaterial });
      }
    }
    return list;
  }, [width, height, groundLayer, collisionLayer, wallMaterialsLayer, originX, originZ]);

  // Calculate active Box Drag selection cells for live preview
  const boxSelectionCells = useMemo(() => {
    if (dragPaintMode !== 'box' || !boxDragStart || !hovered) return [];
    const minX = Math.max(0, Math.min(boxDragStart.x, hovered.x));
    const maxX = Math.min(width - 1, Math.max(boxDragStart.x, hovered.x));
    const minY = Math.max(0, Math.min(boxDragStart.y, hovered.y));
    const maxY = Math.min(height - 1, Math.max(boxDragStart.y, hovered.y));

    const cells: Array<{ x: number; y: number; wallH: number }> = [];
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const wallH = collisionLayer[y * width + x] ?? 0;
        cells.push({ x, y, wallH });
      }
    }
    return cells;
  }, [dragPaintMode, boxDragStart, hovered, width, height, collisionLayer]);

  const hoveredIdx = hovered ? hovered.y * width + hovered.x : -1;
  const hoveredWallHeight = hoveredIdx >= 0 ? (collisionLayer[hoveredIdx] ?? 0) : 0;
  const hoveredProp = hovered
    ? props.find((p) => p.grid_x === hovered.x && p.grid_y === hovered.y)
    : null;
  const activePropRotation = hoveredProp ? hoveredProp.rotation_deg : selectedPropRotation;

  const highlightColor =
    activeTool === 'select'
      ? '#38bdf8'
      : activeTool === 'eraser'
      ? '#ef4444'
      : activeTool === 'wall'
      ? '#f59e0b'
      : '#38bdf8';

  return (
    <group>
      {/* Large Unobstructed Raycasting Hit Surface at y = 0 */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <planeGeometry args={[width * 2.0 + 40, height * 2.0 + 40]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* Subtle Grid Floor Lines (non-blocking raycast) */}
      <gridHelper
        args={[Math.max(width, height) * 2.0, Math.max(width, height), '#334155', '#1e293b']}
        position={[0, 0.01, 0]}
        raycast={NOOP_RAYCAST}
      />

      {/* Render All Textured Floor Tiles & Stacked Stone Blocks */}
      {tiles.map((tile) => {
        const isRiver = tile.floorType === 7;

        return (
          <group key={`${tile.x}_${tile.y}`} position={[tile.posX, 0, tile.posZ]}>
            {/* Textured Floor Tile */}
            {tile.floorType > 0 && (
              <FloorTileMesh
                floorType={tile.floorType}
                isRiver={isRiver}
                textureVersion={textureVersion}
              />
            )}

            {/* Riverbed Stone Rim when tile is River Water */}
            {isRiver && (
              <mesh position={[0, -0.5, 0]} raycast={NOOP_RAYCAST}>
                <boxGeometry args={[1.98, 0.1, 1.98]} />
                <meshStandardMaterial color="#0c4a6e" roughness={0.9} />
              </mesh>
            )}

            {/* Stackable Modular 3D Blocks (Level 1..5) */}
            {tile.wallHeight > 0 && (
              <BlockStackMesh
                wallHeight={tile.wallHeight}
                wallMaterial={tile.wallMaterial}
                textureVersion={textureVersion}
              />
            )}
          </group>
        );
      })}

      {/* Live Box Area Drag Highlight Preview */}
      {boxSelectionCells.length > 0 &&
        boxSelectionCells.map((c) => (
          <mesh
            key={`box_sel_${c.x}_${c.y}`}
            position={[
              originX + c.x * 2.0,
              c.wallH * STONE_BLOCK_HEIGHT + 0.08,
              originZ + c.y * 2.0,
            ]}
            raycast={NOOP_RAYCAST}
          >
            <boxGeometry args={[1.95, 0.16, 1.95]} />
            <meshBasicMaterial
              color={highlightColor}
              transparent
              opacity={0.42}
            />
          </mesh>
        ))}

      {/* Single Hover Cursor Highlight & Ghost Preview */}
      {hovered && (
        <group
          position={[
            originX + hovered.x * 2.0,
            hoveredWallHeight * STONE_BLOCK_HEIGHT + 0.06,
            originZ + hovered.y * 2.0,
          ]}
        >
          <mesh raycast={NOOP_RAYCAST}>
            <boxGeometry args={[2.02, 0.12, 2.02]} />
            <meshBasicMaterial color={highlightColor} wireframe />
          </mesh>

          {/* 3D In-World Compass Ring, Direction Pointer & Prop Preview */}
          {(activeTool === 'prop' || !!hoveredProp || (activeTool === 'select' && selectedEntity?.type === 'prop' && selectedEntity.x === hovered.x && selectedEntity.y === hovered.y)) && !boxDragStart && (
            <group position={[0, 0.02, 0]}>
              {/* Static Compass Outer Ring */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={NOOP_RAYCAST}>
                <ringGeometry args={[0.76, 0.86, 36]} />
                <meshStandardMaterial
                  color="#0891b2"
                  emissive="#06b6d4"
                  emissiveIntensity={0.65}
                  transparent
                  opacity={0.7}
                />
              </mesh>
              {/* Compass Inner Disc Glow */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={NOOP_RAYCAST}>
                <circleGeometry args={[0.76, 36]} />
                <meshBasicMaterial
                  color="#0284c7"
                  transparent
                  opacity={0.14}
                />
              </mesh>

              {/* 4 Cardinal Tick Marks */}
              {[
                { pos: [0, 0.015, 0.81] as const, rot: [0, 0, 0] as const, col: '#38bdf8' },
                { pos: [0.81, 0.015, 0] as const, rot: [0, Math.PI / 2, 0] as const, col: '#94a3b8' },
                { pos: [0, 0.015, -0.81] as const, rot: [0, 0, 0] as const, col: '#94a3b8' },
                { pos: [-0.81, 0.015, 0] as const, rot: [0, Math.PI / 2, 0] as const, col: '#94a3b8' },
              ].map((tick, i) => (
                <mesh
                  key={i}
                  position={tick.pos}
                  rotation={tick.rot}
                  raycast={NOOP_RAYCAST}
                >
                  <boxGeometry args={[0.04, 0.02, 0.14]} />
                  <meshBasicMaterial color={tick.col} />
                </mesh>
              ))}

              {/* Rotated Orientation Group: Front Arrow Pointer + Ghost Prop */}
              <group rotation={[0, (activePropRotation * Math.PI) / 180, 0]}>
                {/* 3D Front Direction Arrow (Points towards +Z) */}
                <group position={[0, 0.025, 0]}>
                  {/* Shaft */}
                  <mesh position={[0, 0, 0.44]} raycast={NOOP_RAYCAST}>
                    <boxGeometry args={[0.07, 0.025, 0.46]} />
                    <meshStandardMaterial
                      color="#38bdf8"
                      emissive="#0284c7"
                      emissiveIntensity={0.9}
                    />
                  </mesh>
                  {/* Arrow Head */}
                  <mesh
                    position={[0, 0, 0.76]}
                    rotation={[Math.PI / 2, 0, 0]}
                    raycast={NOOP_RAYCAST}
                  >
                    <coneGeometry args={[0.16, 0.28, 3]} />
                    <meshStandardMaterial
                      color="#22d3ee"
                      emissive="#06b6d4"
                      emissiveIntensity={1.3}
                    />
                  </mesh>
                </group>

                {/* Render Ghost Prop only if there isn't already a placed prop here and not in select mode */}
                {!hoveredProp && activeTool !== 'select' && (
                  <PropMesh3D
                    prefabId={selectedPropPrefab}
                    modelUrl={
                      useMapStore
                        .getState()
                        .customProps.find((p) => p.id === selectedPropPrefab)?.modelUrl
                    }
                  />
                )}
              </group>
            </group>
          )}

          {/* Ghost Preview of Modular Block when in Block Tool Mode */}
          {activeTool === 'wall' && !boxDragStart && hoveredWallHeight < 5 && (
            <mesh
              position={[0, STONE_BLOCK_HEIGHT * 0.5, 0]}
              raycast={NOOP_RAYCAST}
            >
              <boxGeometry args={[1.94, STONE_BLOCK_HEIGHT - 0.04, 1.94]} />
              <meshStandardMaterial
                map={getFloorTexture(selectedWallType)}
                transparent
                opacity={0.6}
                roughness={0.75}
                color="#fde68a"
              />
            </mesh>
          )}
        </group>
      )}

      {/* Monster Spawners */}
      {spawners.map((spawner) => (
        <group
          key={spawner.id}
          position={[originX + spawner.x * 2.0, 0.7, originZ + spawner.y * 2.0]}
        >
          <mesh castShadow raycast={NOOP_RAYCAST}>
            <cylinderGeometry args={[0.48, 0.68, 1.35, 8]} />
            <meshStandardMaterial
              color="#dc2626"
              emissive="#7f1d1d"
              emissiveIntensity={0.6}
            />
          </mesh>
          <pointLight color="#ef4444" intensity={2} distance={3.5} />
        </group>
      ))}

      {/* Portals */}
      {portals.map((portal) => (
        <group
          key={portal.id}
          position={[originX + portal.grid_x * 2.0, 1.25, originZ + portal.grid_y * 2.0]}
        >
          <mesh castShadow raycast={NOOP_RAYCAST}>
            <torusGeometry args={[0.92, 0.16, 16, 32]} />
            <meshStandardMaterial
              color="#06b6d4"
              emissive="#0891b2"
              emissiveIntensity={0.9}
            />
          </mesh>
          <pointLight color="#22d3ee" intensity={3} distance={5.5} />
        </group>
      ))}

      {/* 3D Props */}
      {props.map((prop) => {
        const idx = prop.grid_y * width + prop.grid_x;
        const stackBaseY = (collisionLayer[idx] ?? 0) * STONE_BLOCK_HEIGHT;
        const customMeta = useMapStore.getState().customProps.find((p) => p.id === prop.prefab_id);
        const isSelected =
          activeTool === 'select' &&
          selectedEntity?.type === 'prop' &&
          selectedEntity.x === prop.grid_x &&
          selectedEntity.y === prop.grid_y;

        return (
          <group
            key={prop.id}
            position={[
              originX + prop.grid_x * 2.0,
              stackBaseY,
              originZ + prop.grid_y * 2.0,
            ]}
            rotation={[0, (prop.rotation_deg * Math.PI) / 180, 0]}
          >
            <PropMesh3D prefabId={prop.prefab_id} modelUrl={customMeta?.modelUrl} />

            {/* Selection Bounding Box Highlight when selected in Select Tool */}
            {isSelected && (
              <mesh position={[0, 0.5, 0]} raycast={NOOP_RAYCAST}>
                <boxGeometry args={[1.9, 1.2, 1.9]} />
                <meshBasicMaterial color="#38bdf8" wireframe />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
};
