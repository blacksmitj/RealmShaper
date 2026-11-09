import React, { useMemo } from 'react';
import { getFloorTexture } from '../utils/proceduralTextures';

const NOOP_RAYCAST = () => null;

interface FloorTileMeshProps {
  floorType: number;
  isRiver: boolean;
  textureVersion?: number;
}

export const FloorTileMesh: React.FC<FloorTileMeshProps> = ({
  floorType,
  isRiver,
  textureVersion,
}) => {
  // Directly acquire the texture (procedural or dynamic from memory/blob)
  const texture = useMemo(() => {
    return getFloorTexture(floorType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [floorType, textureVersion]);

  return (
    <mesh
      position={[0, isRiver ? -0.3 : -0.2, 0]}
      receiveShadow
      raycast={NOOP_RAYCAST}
    >
      <boxGeometry args={[1.98, isRiver ? 0.32 : 0.4, 1.98]} />
      <meshStandardMaterial
        map={texture}
        color="#ffffff"
        roughness={isRiver ? 0.18 : 0.82}
        metalness={isRiver ? 0.25 : 0.05}
      />
    </mesh>
  );
};
