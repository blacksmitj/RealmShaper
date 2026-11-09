import React, { useMemo } from 'react';
import { getFloorTexture, getStoneWallTexture } from '../utils/proceduralTextures';

const NOOP_RAYCAST = () => null;
export const STONE_BLOCK_HEIGHT = 1.15;

interface BlockStackMeshProps {
  wallHeight: number;
  wallMaterial: number;
  textureVersion?: number;
}

export const BlockStackMesh: React.FC<BlockStackMeshProps> = ({
  wallHeight,
  wallMaterial,
  textureVersion,
}) => {
  const blockTex = useMemo(() => {
    if (wallMaterial > 0) {
      return getFloorTexture(wallMaterial);
    }
    return getStoneWallTexture();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallMaterial, textureVersion]);

  if (wallHeight <= 0) return null;

  return (
    <group>
      {Array.from({ length: wallHeight }).map((_, levelIdx) => {
        const yCenter = levelIdx * STONE_BLOCK_HEIGHT + STONE_BLOCK_HEIGHT * 0.5;
        const scaleXZ = 1.96 - levelIdx * 0.04;
        const isTop = levelIdx === wallHeight - 1;

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
              map={blockTex}
              roughness={0.78}
              metalness={0.04}
              color={isTop ? '#f8fafc' : '#cbd5e1'}
            />
          </mesh>
        );
      })}

      {/* Decorative Top Cap on top of the block stack */}
      <mesh
        position={[0, wallHeight * STONE_BLOCK_HEIGHT + 0.04, 0]}
        castShadow
        receiveShadow
        raycast={NOOP_RAYCAST}
      >
        <boxGeometry
          args={[
            2.02 - (wallHeight - 1) * 0.04,
            0.1,
            2.02 - (wallHeight - 1) * 0.04,
          ]}
        />
        <meshStandardMaterial
          map={blockTex}
          color="#94a3b8"
          roughness={0.7}
        />
      </mesh>
    </group>
  );
};

