import React, { useRef, useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useMapStore } from '../stores/mapStore';

// Map Builder 3D Viewport — Grid-Aligned 2.0m x 2.0m with Godot 4.7 DungeonEnvironmentBuilder3D logic

interface HoveredCell {
  x: number;
  y: number;
}

export const MapCanvas: React.FC = () => {
  return (
    <div className="w-full h-full relative bg-slate-950 overflow-hidden">
      <Canvas
        camera={{ position: [0, 24, 20], fov: 45 }}
        shadows
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[10, 25, 15]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[0, 8, 0]} intensity={1.5} color="#ffd166" distance={25} />

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2.05} // prevent going underneath the floor
          minDistance={5}
          maxDistance={60}
        />

        <WorldGridScene />
      </Canvas>

      {/* Viewport Info Overlay */}
      <div className="absolute top-4 left-4 pointer-events-none bg-slate-900/80 backdrop-blur border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 space-y-1">
        <p className="font-semibold text-amber-400">3D Grid Viewport (2.0m Snap)</p>
        <p>Left Click: Paint / Place Item</p>
        <p>Right Click + Drag: Orbit / Rotate Camera</p>
        <p>Scroll: Zoom In/Out</p>
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
    eraseAt,
    activeTool,
  } = useMapStore();

  const [hovered, setHovered] = useState<HoveredCell | null>(null);
  const isMouseDownRef = useRef(false);

  // Godot Centered origin calculation:
  // origin_x = -(width * 2.0) * 0.5 + 1.0
  // origin_z = -(height * 2.0) * 0.5 + 1.0
  const originX = -(width * 2.0) * 0.5 + 1.0;
  const originZ = -(height * 2.0) * 0.5 + 1.0;

  // Grid Plane Raycast Interaction
  const handlePointerDown = (e: any) => {
    if (e.button !== 0) return; // only left click paints
    e.stopPropagation();
    isMouseDownRef.current = true;
    if (hovered) {
      if (activeTool === 'eraser') {
        eraseAt(hovered.x, hovered.y);
      } else {
        paintTile(hovered.x, hovered.y);
      }
    }
  };

  const handlePointerMove = (e: any) => {
    e.stopPropagation();
    const intersect = e.point;
    // Map intersection 3D coordinate back to grid cell
    const cellX = Math.round((intersect.x - originX) / 2.0);
    const cellY = Math.round((intersect.z - originZ) / 2.0);

    if (cellX >= 0 && cellX < width && cellY >= 0 && cellY < height) {
      if (!hovered || hovered.x !== cellX || hovered.y !== cellY) {
        setHovered({ x: cellX, y: cellY });
        if (isMouseDownRef.current) {
          if (activeTool === 'eraser') {
            eraseAt(cellX, cellY);
          } else {
            paintTile(cellX, cellY);
          }
        }
      }
    } else {
      setHovered(null);
    }
  };

  const handlePointerUp = () => {
    isMouseDownRef.current = false;
  };

  // Pre-calculate tiles for rendering
  const tiles = useMemo(() => {
    const list: Array<{ x: number; y: number; posX: number; posZ: number; floorType: number; isWall: boolean }> = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const posX = originX + x * 2.0;
        const posZ = originZ + y * 2.0;
        const floorType = groundLayer[idx] ?? 0;
        const isWall = collisionLayer[idx] === 1;
        list.push({ x, y, posX, posZ, floorType, isWall });
      }
    }
    return list;
  }, [width, height, groundLayer, collisionLayer, originX, originZ]);

  return (
    <group
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => {
        isMouseDownRef.current = false;
        setHovered(null);
      }}
    >
      {/* Invisible Raycasting Hit Surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[width * 2.0 + 4, height * 2.0 + 4]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* Grid Floor Visualizer */}
      <gridHelper
        args={[Math.max(width, height) * 2.0, Math.max(width, height), '#334155', '#1e293b']}
        position={[0, -0.01, 0]}
      />

      {/* Render Tiles */}
      {tiles.map((tile) => (
        <group key={`${tile.x}_${tile.y}`} position={[tile.posX, 0, tile.posZ]}>
          {/* Floor Mesh */}
          {tile.floorType > 0 && (
            <mesh position={[0, -0.2, 0]} receiveShadow>
              <boxGeometry args={[1.96, 0.4, 1.96]} />
              <meshStandardMaterial
                color={
                  tile.floorType === 1
                    ? '#1e2430' // border stone
                    : tile.floorType === 3
                    ? '#382b22' // dirt / pathway
                    : tile.floorType === 4
                    ? '#451a1a' // carpet / blood stone
                    : tile.floorType === 5
                    ? '#1b3b3a' // moss stone
                    : '#2c3345' // regular gothic floor
                }
                roughness={0.8}
              />
            </mesh>
          )}

          {/* Wall Mesh */}
          {tile.isWall && (
            <mesh position={[0, 1.75, 0]} castShadow receiveShadow>
              <boxGeometry args={[1.96, 3.5, 1.96]} />
              <meshStandardMaterial color="#4a4252" roughness={0.6} />
            </mesh>
          )}
        </group>
      ))}

      {/* Hover Cursor Highlight */}
      {hovered && (
        <mesh position={[originX + hovered.x * 2.0, 0.05, originZ + hovered.y * 2.0]}>
          <boxGeometry args={[2.0, 0.1, 2.0]} />
          <meshBasicMaterial
            color={activeTool === 'eraser' ? '#ef4444' : '#38bdf8'}
            wireframe
          />
        </mesh>
      )}

      {/* Monster Spawners */}
      {spawners.map((spawner) => (
        <group
          key={spawner.id}
          position={[originX + spawner.x * 2.0, 0.8, originZ + spawner.y * 2.0]}
        >
          <mesh castShadow>
            <cylinderGeometry args={[0.5, 0.7, 1.4, 8]} />
            <meshStandardMaterial color="#dc2626" emissive="#7f1d1d" emissiveIntensity={0.5} />
          </mesh>
          <pointLight color="#ef4444" intensity={2} distance={3} />
        </group>
      ))}

      {/* Portals */}
      {portals.map((portal) => (
        <group
          key={portal.id}
          position={[originX + portal.grid_x * 2.0, 1.2, originZ + portal.grid_y * 2.0]}
        >
          <mesh castShadow>
            <torusGeometry args={[0.9, 0.15, 16, 32]} />
            <meshStandardMaterial color="#06b6d4" emissive="#0891b2" emissiveIntensity={0.8} />
          </mesh>
          <pointLight color="#22d3ee" intensity={3} distance={5} />
        </group>
      ))}

      {/* Props */}
      {props.map((prop) => (
        <group
          key={prop.id}
          position={[originX + prop.grid_x * 2.0, 0.75, originZ + prop.grid_y * 2.0]}
          rotation={[0, (prop.rotation_deg * Math.PI) / 180, 0]}
        >
          <mesh castShadow>
            <boxGeometry args={[0.8, 1.5, 0.8]} />
            <meshStandardMaterial color="#78716c" roughness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  );
};
