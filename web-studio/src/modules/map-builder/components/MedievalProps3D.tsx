import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import {
  getTudorWallTexture,
  getRoofShingleTexture,
  getWoodPlankTexture,
  getCanopyStripeTexture,
  getStoneWallTexture,
} from '../utils/proceduralTextures';

import * as THREE from 'three';

interface PropMesh3DProps {
  prefabId: string;
  modelUrl?: string;
  tileWidth?: number;
  tileDepth?: number;
  scaleMultiplier?: number;
}

class PropErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn('[PropMesh3D] Gagal memuat model 3D custom, menampilkan fallback:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const DynamicGlbProp: React.FC<{
  url: string;
  tileWidth: number;
  tileDepth: number;
  scaleMultiplier: number;
}> = ({ url, tileWidth, tileDepth, scaleMultiplier }) => {
  const { scene } = useGLTF(url);
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const maxHorizontalDim = Math.max(size.x, size.z, 0.001);

    // 1 Tile = 2.0 meter/unit di MapCanvas
    // Target ukuran horizontal adalah min(tileWidth, tileDepth) * 2.0 * margin(0.95)
    const targetSize = Math.max(tileWidth, tileDepth) * 2.0 * 0.95;
    const baseFitScale = targetSize / maxHorizontalDim;
    const finalScale = baseFitScale * scaleMultiplier;

    // Center pivot horizontal model
    const center = box.getCenter(new THREE.Vector3());
    clone.position.x = -center.x * finalScale;
    clone.position.z = -center.z * finalScale;
    clone.position.y = -box.min.y * finalScale; // Alas duduk rata di tanah

    clone.scale.set(finalScale, finalScale, finalScale);
    return clone;
  }, [scene, tileWidth, tileDepth, scaleMultiplier]);

  return <primitive object={clonedScene} />;
};

export const PropMesh3D: React.FC<PropMesh3DProps> = ({
  prefabId,
  modelUrl,
  tileWidth = 1,
  tileDepth = 1,
  scaleMultiplier = 1.0,
}) => {
  const tudorWallTex = useMemo(() => getTudorWallTexture(), []);
  const roofTex = useMemo(() => getRoofShingleTexture(), []);
  const woodTex = useMemo(() => getWoodPlankTexture(), []);
  const canopyTex = useMemo(() => getCanopyStripeTexture(), []);
  const stoneTex = useMemo(() => getStoneWallTexture(), []);

  if (modelUrl) {
    return (
      <PropErrorBoundary
        fallback={
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[tileWidth * 1.8, 1, tileDepth * 1.8]} />
            <meshStandardMaterial color="#ef4444" roughness={0.8} />
          </mesh>
        }
      >
        <React.Suspense
          fallback={
            <mesh position={[0, 0.5, 0]}>
              <boxGeometry args={[tileWidth * 1.8, 1, tileDepth * 1.8]} />
              <meshStandardMaterial color="#6366f1" wireframe />
            </mesh>
          }
        >
          <DynamicGlbProp
            url={modelUrl}
            tileWidth={tileWidth}
            tileDepth={tileDepth}
            scaleMultiplier={scaleMultiplier}
          />
        </React.Suspense>
      </PropErrorBoundary>
    );
  }

  switch (prefabId) {
    case 'oak_tree':
      return (
        <group>
          {/* Tree Trunk */}
          <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.2, 0.34, 1.8, 8]} />
            <meshStandardMaterial color="#5c3a21" roughness={0.9} />
          </mesh>
          {/* Layered Lush Canopy */}
          <mesh position={[0, 2.3, 0]} castShadow receiveShadow>
            <dodecahedronGeometry args={[1.15, 1]} />
            <meshStandardMaterial color="#22c55e" roughness={0.75} />
          </mesh>
          <mesh position={[-0.55, 1.95, 0.35]} castShadow receiveShadow>
            <dodecahedronGeometry args={[0.75, 1]} />
            <meshStandardMaterial color="#16a34a" roughness={0.8} />
          </mesh>
          <mesh position={[0.55, 2.0, -0.3]} castShadow receiveShadow>
            <dodecahedronGeometry args={[0.8, 1]} />
            <meshStandardMaterial color="#15803d" roughness={0.8} />
          </mesh>
          <mesh position={[0, 3.0, 0]} castShadow receiveShadow>
            <dodecahedronGeometry args={[0.7, 1]} />
            <meshStandardMaterial color="#4ade80" roughness={0.7} />
          </mesh>
        </group>
      );

    case 'pine_tree':
      return (
        <group>
          {/* Trunk */}
          <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.16, 0.26, 1.4, 7]} />
            <meshStandardMaterial color="#4a2f1b" roughness={0.9} />
          </mesh>
          {/* 3-Tier Pine Cones */}
          <mesh position={[0, 1.65, 0]} castShadow receiveShadow>
            <coneGeometry args={[1.1, 1.5, 8]} />
            <meshStandardMaterial color="#14532d" roughness={0.8} />
          </mesh>
          <mesh position={[0, 2.55, 0]} castShadow receiveShadow>
            <coneGeometry args={[0.85, 1.4, 8]} />
            <meshStandardMaterial color="#166534" roughness={0.8} />
          </mesh>
          <mesh position={[0, 3.35, 0]} castShadow receiveShadow>
            <coneGeometry args={[0.58, 1.2, 8]} />
            <meshStandardMaterial color="#15803d" roughness={0.75} />
          </mesh>
        </group>
      );

    case 'grass_tuft':
      return (
        <group>
          {/* Clump of 3D grass blades */}
          {[
            { pos: [0, 0.25, 0] as const, rot: [0.15, 0, -0.15] as const, h: 0.55, c: '#22c55e' },
            { pos: [-0.35, 0.22, 0.25] as const, rot: [-0.2, 0.5, 0.2] as const, h: 0.48, c: '#4ade80' },
            { pos: [0.35, 0.24, -0.2] as const, rot: [0.2, -0.4, -0.2] as const, h: 0.5, c: '#16a34a' },
            { pos: [-0.25, 0.2, -0.35] as const, rot: [-0.15, 0.8, -0.1] as const, h: 0.42, c: '#22c55e' },
            { pos: [0.28, 0.22, 0.32] as const, rot: [0.18, -0.6, 0.15] as const, h: 0.46, c: '#4ade80' },
          ].map((blade, idx) => (
            <mesh key={idx} position={blade.pos} rotation={blade.rot} castShadow>
              <coneGeometry args={[0.14, blade.h, 4]} />
              <meshStandardMaterial color={blade.c} roughness={0.7} />
            </mesh>
          ))}
          {/* Tiny medieval wildflowers */}
          <mesh position={[-0.2, 0.48, 0.15]}>
            <sphereGeometry args={[0.07, 6, 6]} />
            <meshStandardMaterial color="#facc15" emissive="#ca8a04" emissiveIntensity={0.2} />
          </mesh>
          <mesh position={[0.25, 0.44, -0.15]}>
            <sphereGeometry args={[0.065, 6, 6]} />
            <meshStandardMaterial color="#f472b6" />
          </mesh>
        </group>
      );

    case 'wood_bridge':
      return (
        <group>
          {/* Bridge Deck Planks */}
          <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.98, 0.16, 1.98]} />
            <meshStandardMaterial map={woodTex} roughness={0.85} />
          </mesh>
          {/* Left & Right Corner Posts */}
          {[
            [-0.86, 0.48, -0.82],
            [0.86, 0.48, -0.82],
            [-0.86, 0.48, 0.82],
            [0.86, 0.48, 0.82],
          ].map((p, idx) => (
            <mesh key={idx} position={[p[0] ?? 0, p[1] ?? 0, p[2] ?? 0]} castShadow>
              <boxGeometry args={[0.16, 0.75, 0.16]} />
              <meshStandardMaterial color="#451a03" roughness={0.9} />
            </mesh>
          ))}
          {/* Handrails along Z axis (left & right sides) */}
          <mesh position={[-0.86, 0.72, 0]} castShadow>
            <boxGeometry args={[0.12, 0.1, 1.96]} />
            <meshStandardMaterial color="#78350f" roughness={0.85} />
          </mesh>
          <mesh position={[0.86, 0.72, 0]} castShadow>
            <boxGeometry args={[0.12, 0.1, 1.96]} />
            <meshStandardMaterial color="#78350f" roughness={0.85} />
          </mesh>
        </group>
      );

    case 'tudor_house':
      return (
        <group>
          {/* Stone Foundation Base */}
          <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.88, 0.5, 1.88]} />
            <meshStandardMaterial map={stoneTex} roughness={0.85} />
          </mesh>
          {/* Half-Timbered Main Story */}
          <mesh position={[0, 1.35, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.78, 1.7, 1.78]} />
            <meshStandardMaterial map={tudorWallTex} roughness={0.75} />
          </mesh>
          {/* Steep Medieval Pitched Roof */}
          <mesh position={[0, 2.85, 0]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
            <coneGeometry args={[1.65, 1.45, 4]} />
            <meshStandardMaterial map={roofTex} roughness={0.7} />
          </mesh>
          {/* Brick Chimney */}
          <mesh position={[0.55, 2.95, -0.45]} castShadow>
            <boxGeometry args={[0.32, 1.1, 0.32]} />
            <meshStandardMaterial color="#7f1d1d" roughness={0.85} />
          </mesh>
          {/* Wooden Door (Front +Z) */}
          <mesh position={[0, 0.65, 0.9]}>
            <boxGeometry args={[0.48, 0.85, 0.06]} />
            <meshStandardMaterial color="#451a03" roughness={0.9} />
          </mesh>
          {/* Warm Lit Medieval Windows */}
          <mesh position={[-0.5, 1.45, 0.9]}>
            <boxGeometry args={[0.36, 0.42, 0.05]} />
            <meshStandardMaterial
              color="#fef08a"
              emissive="#f59e0b"
              emissiveIntensity={1.1}
            />
          </mesh>
          <mesh position={[0.5, 1.45, 0.9]}>
            <boxGeometry args={[0.36, 0.42, 0.05]} />
            <meshStandardMaterial
              color="#fef08a"
              emissive="#f59e0b"
              emissiveIntensity={1.1}
            />
          </mesh>
        </group>
      );

    case 'town_fountain':
      return (
        <group>
          {/* Outer Octagonal Stone Basin */}
          <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.95, 1.02, 0.56, 8]} />
            <meshStandardMaterial map={stoneTex} roughness={0.75} />
          </mesh>
          {/* Sparkling Fountain Water Pool */}
          <mesh position={[0, 0.48, 0]}>
            <cylinderGeometry args={[0.8, 0.8, 0.2, 8]} />
            <meshStandardMaterial
              color="#38bdf8"
              emissive="#0284c7"
              emissiveIntensity={0.35}
              roughness={0.15}
              metalness={0.2}
            />
          </mesh>
          {/* Center Pedestal Column */}
          <mesh position={[0, 0.95, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.3, 1.2, 8]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.6} />
          </mesh>
          {/* Upper Bowl */}
          <mesh position={[0, 1.45, 0]} castShadow>
            <cylinderGeometry args={[0.52, 0.25, 0.25, 8]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.6} />
          </mesh>
          {/* Water Crest Spout */}
          <mesh position={[0, 1.75, 0]}>
            <sphereGeometry args={[0.22, 8, 8]} />
            <meshStandardMaterial
              color="#7dd3fc"
              emissive="#38bdf8"
              emissiveIntensity={0.6}
              roughness={0.1}
            />
          </mesh>
        </group>
      );

    case 'street_lantern':
      return (
        <group>
          {/* Stone Base Pedestal */}
          <mesh position={[0, 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.28, 0.4, 8]} />
            <meshStandardMaterial color="#475569" roughness={0.8} />
          </mesh>
          {/* Iron Post */}
          <mesh position={[0, 1.35, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.09, 2.3, 8]} />
            <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.35} />
          </mesh>
          {/* Horizontal Arm */}
          <mesh position={[0.25, 2.4, 0]} castShadow>
            <boxGeometry args={[0.6, 0.08, 0.08]} />
            <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.35} />
          </mesh>
          {/* Glowing Lantern Cage */}
          <mesh position={[0.46, 2.15, 0]}>
            <boxGeometry args={[0.26, 0.36, 0.26]} />
            <meshStandardMaterial
              color="#fde047"
              emissive="#f59e0b"
              emissiveIntensity={1.6}
            />
          </mesh>
          <pointLight position={[0.46, 2.0, 0]} color="#fbbf24" intensity={2.2} distance={7} />
        </group>
      );

    case 'market_stall':
      return (
        <group>
          {/* Counter Table */}
          <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.7, 0.75, 1.1]} />
            <meshStandardMaterial map={woodTex} roughness={0.85} />
          </mesh>
          {/* 4 Support Poles */}
          {[
            [-0.78, 1.15, -0.48],
            [0.78, 1.15, -0.48],
            [-0.78, 1.15, 0.48],
            [0.78, 1.15, 0.48],
          ].map((p, idx) => (
            <mesh key={idx} position={[p[0] ?? 0, p[1] ?? 0, p[2] ?? 0]} castShadow>
              <cylinderGeometry args={[0.05, 0.05, 1.9, 6]} />
              <meshStandardMaterial color="#451a03" roughness={0.9} />
            </mesh>
          ))}
          {/* Slanted Striped Canopy Awning */}
          <mesh position={[0, 2.05, 0]} rotation={[0.2, 0, 0]} castShadow>
            <boxGeometry args={[1.88, 0.12, 1.38]} />
            <meshStandardMaterial map={canopyTex} roughness={0.6} />
          </mesh>
        </group>
      );

    case 'wood_fence':
      return (
        <group>
          {/* Stone End Pillars */}
          <mesh position={[-0.75, 0.45, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.32, 0.9, 0.32]} />
            <meshStandardMaterial map={stoneTex} roughness={0.8} />
          </mesh>
          <mesh position={[0.75, 0.45, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.32, 0.9, 0.32]} />
            <meshStandardMaterial map={stoneTex} roughness={0.8} />
          </mesh>
          {/* Two Timber Rails */}
          <mesh position={[0, 0.65, 0]} castShadow>
            <boxGeometry args={[1.5, 0.12, 0.1]} />
            <meshStandardMaterial color="#78350f" roughness={0.85} />
          </mesh>
          <mesh position={[0, 0.32, 0]} castShadow>
            <boxGeometry args={[1.5, 0.12, 0.1]} />
            <meshStandardMaterial color="#78350f" roughness={0.85} />
          </mesh>
        </group>
      );

    case 'pillar':
      return (
        <group>
          <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.1, 0.5, 1.1]} />
            <meshStandardMaterial map={stoneTex} roughness={0.8} />
          </mesh>
          <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.42, 0.46, 2.4, 8]} />
            <meshStandardMaterial map={stoneTex} roughness={0.75} />
          </mesh>
          <mesh position={[0, 2.85, 0]} castShadow>
            <cylinderGeometry args={[0.54, 0.54, 0.22, 8]} />
            <meshStandardMaterial color="#d97706" metalness={0.6} roughness={0.35} />
          </mesh>
        </group>
      );

    case 'torch':
      return (
        <group>
          <mesh position={[0, 0.65, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.22, 1.3, 8]} />
            <meshStandardMaterial color="#27272a" metalness={0.6} roughness={0.5} />
          </mesh>
          <mesh position={[0, 1.4, 0]}>
            <sphereGeometry args={[0.22, 8, 8]} />
            <meshStandardMaterial
              color="#fb923c"
              emissive="#ea580c"
              emissiveIntensity={2.0}
            />
          </mesh>
          <pointLight position={[0, 1.55, 0]} color="#fb923c" intensity={2.0} distance={6} />
        </group>
      );

    case 'chest':
      return (
        <group>
          <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.95, 0.65, 0.65]} />
            <meshStandardMaterial color="#78350f" roughness={0.75} />
          </mesh>
          <mesh position={[0, 0.42, 0.33]}>
            <boxGeometry args={[0.18, 0.24, 0.06]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      );

    case 'barrel':
    default:
      return (
        <group>
          <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.42, 0.42, 1.1, 10]} />
            <meshStandardMaterial color="#78350f" roughness={0.8} />
          </mesh>
        </group>
      );
  }
};

