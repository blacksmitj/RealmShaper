import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useTextureStore } from '../stores/textureStore';

interface ModelViewerProps {
  modelName: 'Knight' | 'Barbarian' | 'Rogue' | 'chest';
}

const ModelMesh: React.FC<ModelViewerProps> = ({ modelName }) => {
  const { scene } = useGLTF(`/models/${modelName}.glb`);
  const groupRef = useRef<THREE.Group>(null);
  const { preset, autoRotate } = useTextureStore();

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.4;
    }
  });

  // Apply custom material properties dynamically to model meshes
  useEffect(() => {
    if (!scene) return;
    const cloned = scene.clone();

    cloned.traverse((child: any) => {
      if (child.isMesh && child.material) {
        // Clone material so it doesn't affect other instances
        const mat = child.material.clone() as THREE.MeshStandardMaterial;
        const { primary, accent } = preset.materialSlots;

        // Apply primary tint & PBR properties
        mat.color = new THREE.Color(primary.colorTint);
        mat.roughness = primary.roughness;
        mat.metalness = primary.metalness;

        if (accent.emissiveIntensity > 0) {
          mat.emissive = new THREE.Color(accent.emissiveColor);
          mat.emissiveIntensity = accent.emissiveIntensity;
        }

        child.material = mat;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    if (groupRef.current) {
      // Clear previous children
      while (groupRef.current.children.length > 0) {
        groupRef.current.remove(groupRef.current.children[0]);
      }
      groupRef.current.add(cloned);
    }
  }, [scene, preset.materialSlots, modelName]);

  return <group ref={groupRef} position={[0, -1.0, 0]} scale={[1.4, 1.4, 1.4]} />;
};

export const TextureCanvas: React.FC = () => {
  const { preset } = useTextureStore();

  return (
    <div className="w-full h-full relative bg-slate-950 overflow-hidden">
      <Canvas
        camera={{ position: [0, 1.5, 4.0], fov: 45 }}
        shadows
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight
          position={[5, 10, 7]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[-4, 3, -2]} intensity={2.0} color="#06b6d4" distance={10} />
        <pointLight position={[4, 2, 2]} intensity={1.5} color="#f59e0b" distance={10} />

        {/* Studio Pedestal / Ground */}
        <mesh position={[0, -1.02, 0]} receiveShadow>
          <cylinderGeometry args={[2.5, 2.7, 0.2, 32]} />
          <meshStandardMaterial color="#0f172a" roughness={0.6} metalness={0.4} />
        </mesh>

        <React.Suspense
          fallback={
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="#06b6d4" wireframe />
            </mesh>
          }
        >
          <ModelMesh modelName={preset.targetModel} />
        </React.Suspense>

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.05}
          minDistance={1.5}
          maxDistance={10}
          target={[0, 0.2, 0]}
        />
      </Canvas>

      <div className="absolute top-4 left-4 pointer-events-none bg-slate-900/80 backdrop-blur border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 space-y-1">
        <p className="font-semibold text-cyan-400">3D Material / Shader Preview</p>
        <p>Target: {preset.targetModel}.glb</p>
        <p>Drag to Rotate | Scroll to Zoom</p>
      </div>
    </div>
  );
};

