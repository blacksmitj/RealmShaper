import React, { useMemo } from 'react';
import { getFloorTexture, getStoneWallTexture } from '../utils/proceduralTextures';
import { STONE_BLOCK_HEIGHT } from './BlockStackMesh';

interface VoxelBlockMeshProps {
  x: number;
  y: number; // 0..19
  z: number;
  materialId: number;
  rotationY?: number;
  isSelected?: boolean;
  textureVersion?: number;
  onClick?: (e: any) => void;
  onPointerDown?: (e: any) => void;
}

export const VoxelBlockMesh: React.FC<VoxelBlockMeshProps> = ({
  x,
  y,
  z,
  materialId,
  rotationY = 0,
  isSelected = false,
  textureVersion,
  onClick,
  onPointerDown,
}) => {
  const blockTex = useMemo(() => {
    if (materialId > 0) {
      return getFloorTexture(materialId);
    }
    return getStoneWallTexture();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialId, textureVersion]);

  const yCenter = y * STONE_BLOCK_HEIGHT + STONE_BLOCK_HEIGHT * 0.5;
  const rotRad = (rotationY * Math.PI) / 180;

  return (
    <group
      position={[0, yCenter, 0]}
      rotation={[0, rotRad, 0]}
      userData={{ voxelX: x, voxelY: y, voxelZ: z }}
    >
      <mesh
        castShadow
        receiveShadow
        onClick={onClick}
        onPointerDown={onPointerDown}
      >
        <boxGeometry args={[1.96, STONE_BLOCK_HEIGHT - 0.02, 1.96]} />
        <meshStandardMaterial
          map={blockTex}
          roughness={0.78}
          metalness={0.04}
          color={isSelected ? '#38bdf8' : '#ffffff'}
          emissive={isSelected ? '#0284c7' : '#000000'}
          emissiveIntensity={isSelected ? 0.35 : 0}
        />
      </mesh>

      {/* Selection Wireframe Highlight Box */}
      {isSelected && (
        <mesh>
          <boxGeometry args={[2.02, STONE_BLOCK_HEIGHT + 0.04, 2.02]} />
          <meshBasicMaterial color="#38bdf8" wireframe />
        </mesh>
      )}
    </group>
  );
};
