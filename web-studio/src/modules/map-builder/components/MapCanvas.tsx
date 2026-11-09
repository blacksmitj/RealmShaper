import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Sun, Moon, Layers, RotateCw, Paintbrush, SquareDashed } from 'lucide-react';
import { useMapStore } from '../stores/mapStore';
import { getFloorTexture, getStoneWallTexture } from '../utils/proceduralTextures';
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

const STONE_BLOCK_HEIGHT = 1.15;
const GROUND_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const TEMP_INTERSECT = new THREE.Vector3();
const NOOP_RAYCAST = () => null;

export const MapCanvas: React.FC = () => {
  const {
    environmentTheme,
    setEnvironmentTheme,
    activeTool,
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

        <WorldGridScene />
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
      </div>

      {/* Top-Right Drag Mode, Tool Context & Lighting Bar */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-lg p-1.5 shadow-xl">
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
          <Button
            variant="outline"
            size="sm"
            onClick={rotateSelectedProp}
            className="h-7 px-2.5 text-xs bg-slate-900 border-slate-700 text-cyan-300 hover:bg-slate-800 gap-1.5"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Rotate ({selectedPropRotation}°)</span>
          </Button>
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
    spawners,
    portals,
    props,
    paintTile,
    paintRegion,
    decreaseWallAt,
    eraseAt,
    activeTool,
    dragPaintMode,
    selectedPropPrefab,
    selectedPropRotation,
  } = useMapStore();

  const [hovered, setHovered] = useState<HoveredCell | null>(null);
  const [boxDragStart, setBoxDragStart] = useState<HoveredCell | null>(null);
  const isLeftDraggingRef = useRef(false);
  const isShiftDownRef = useRef(false);
  const paintedCellsInStrokeRef = useRef<Set<string>>(new Set());

  // Pre-build procedural textures once
  const floorTextures = useMemo(() => {
    const map = new Map<number, THREE.CanvasTexture>();
    for (let id = 1; id <= 8; id++) {
      map.set(id, getFloorTexture(id));
    }
    return map;
  }, []);

  const stoneWallTex = useMemo(() => getStoneWallTexture(), []);

  // Animate river water texture (ID 7) continuously
  useFrame((_, delta) => {
    const waterTex = floorTextures.get(7);
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
    }> = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const posX = originX + x * 2.0;
        const posZ = originZ + y * 2.0;
        const floorType = groundLayer[idx] ?? 0;
        const wallHeight = Math.max(0, Math.min(5, collisionLayer[idx] ?? 0));
        list.push({ x, y, posX, posZ, floorType, wallHeight });
      }
    }
    return list;
  }, [width, height, groundLayer, collisionLayer, originX, originZ]);

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

  const highlightColor =
    activeTool === 'eraser'
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
        const floorTex = floorTextures.get(tile.floorType) ?? floorTextures.get(2);

        return (
          <group key={`${tile.x}_${tile.y}`} position={[tile.posX, 0, tile.posZ]}>
            {/* Textured Floor Tile */}
            {tile.floorType > 0 && (
              <mesh
                position={[0, isRiver ? -0.3 : -0.2, 0]}
                receiveShadow
                raycast={NOOP_RAYCAST}
              >
                <boxGeometry args={[1.98, isRiver ? 0.32 : 0.4, 1.98]} />
                <meshStandardMaterial
                  map={floorTex}
                  roughness={isRiver ? 0.18 : 0.82}
                  metalness={isRiver ? 0.25 : 0.05}
                />
              </mesh>
            )}

            {/* Riverbed Stone Rim when tile is River Water */}
            {isRiver && (
              <mesh position={[0, -0.5, 0]} raycast={NOOP_RAYCAST}>
                <boxGeometry args={[1.98, 0.1, 1.98]} />
                <meshStandardMaterial color="#0c4a6e" roughness={0.9} />
              </mesh>
            )}

            {/* Stackable Stone Blocks (Level 1..5) */}
            {tile.wallHeight > 0 && (
              <group>
                {Array.from({ length: tile.wallHeight }).map((_, levelIdx) => {
                  const yCenter =
                    levelIdx * STONE_BLOCK_HEIGHT + STONE_BLOCK_HEIGHT * 0.5;
                  const scaleXZ = 1.96 - levelIdx * 0.04;
                  return (
                    <mesh
                      key={levelIdx}
                      position={[0, yCenter, 0]}
                      castShadow
                      receiveShadow
                      raycast={NOOP_RAYCAST}
                    >
                      <boxGeometry args={[scaleXZ, STONE_BLOCK_HEIGHT - 0.03, scaleXZ]} />
                      <meshStandardMaterial
                        map={stoneWallTex}
                        roughness={0.75}
                        color={
                          levelIdx === tile.wallHeight - 1 ? '#e2e8f0' : '#cbd5e1'
                        }
                      />
                    </mesh>
                  );
                })}

                {/* Stone Battlement Cap on top of the stack */}
                <mesh
                  position={[0, tile.wallHeight * STONE_BLOCK_HEIGHT + 0.04, 0]}
                  castShadow
                  receiveShadow
                  raycast={NOOP_RAYCAST}
                >
                  <boxGeometry
                    args={[
                      2.02 - (tile.wallHeight - 1) * 0.04,
                      0.1,
                      2.02 - (tile.wallHeight - 1) * 0.04,
                    ]}
                  />
                  <meshStandardMaterial
                    map={stoneWallTex}
                    color="#94a3b8"
                    roughness={0.65}
                  />
                </mesh>
              </group>
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

          {/* Ghost Preview of Prop when in 3D Prop Tool Mode */}
          {activeTool === 'prop' && !boxDragStart && (
            <group
              position={[0, 0, 0]}
              rotation={[0, (selectedPropRotation * Math.PI) / 180, 0]}
            >
              <PropMesh3D prefabId={selectedPropPrefab} />
            </group>
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
            <PropMesh3D prefabId={prop.prefab_id} />
          </group>
        );
      })}
    </group>
  );
};
