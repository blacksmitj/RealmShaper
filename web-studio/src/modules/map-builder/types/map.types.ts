export type ToolMode = 'select' | 'floor' | 'wall' | 'eraser' | 'spawner' | 'portal' | 'prop';

export type DragPaintMode = 'brush' | 'box';

export type WallStackMode = 'increment' | 'fixed';

export type EnvironmentTheme = 'medieval_day' | 'gothic_night';

export type MapPresetId =
  | 'medieval_town'
  | 'catacombs'
  | 'walled_dirt'
  | 'walled_meadow'
  | 'walled_arena'
  | 'open_plain'
  | 'river_gorge'
  | 'mountain_canyon';

export interface TerrainTemplateMeta {
  id: MapPresetId;
  name: string;
  category: 'walled' | 'open' | 'natural';
  description: string;
  floorMaterialId: number;
  wallMaterialId: number;
  hasWalls: boolean;
  minWallHeight?: number;
  maxWallHeight?: number;
  theme: EnvironmentTheme;
}

export const TERRAIN_TEMPLATES: readonly TerrainTemplateMeta[] = [
  {
    id: 'walled_dirt',
    name: 'Walled Dirt Basin',
    category: 'walled',
    description: 'Tanah lapang bersih dengan benteng tebing acak (tinggi 4-7) di sekelilingnya.',
    floorMaterialId: 3, // Dirt Pathway
    wallMaterialId: 5, // Mossy Ancient Ruins
    hasWalls: true,
    minWallHeight: 4,
    maxWallHeight: 7,
    theme: 'medieval_day',
  },
  {
    id: 'walled_meadow',
    name: 'Walled Green Meadow',
    category: 'walled',
    description: 'Padang rumput hijau subur dikelilingi pagar balok batu berlumut acak (tinggi 3-6).',
    floorMaterialId: 6, // Lush Grass Meadow
    wallMaterialId: 5, // Mossy Ancient Ruins
    hasWalls: true,
    minWallHeight: 3,
    maxWallHeight: 6,
    theme: 'medieval_day',
  },
  {
    id: 'walled_arena',
    name: 'Walled Stone Arena',
    category: 'walled',
    description: 'Ubin batu kastil gelap dengan dinding batu benteng kokoh bertingkat (tinggi 4-6).',
    floorMaterialId: 2, // Medieval Cobblestone
    wallMaterialId: 1, // Fortress Border Stone
    hasWalls: true,
    minWallHeight: 4,
    maxWallHeight: 6,
    theme: 'gothic_night',
  },
  {
    id: 'open_plain',
    name: 'Flat Open Plain',
    category: 'open',
    description: 'Dataran rumput luas tanpa dinding pembatas pinggir sama sekali.',
    floorMaterialId: 6, // Lush Grass
    wallMaterialId: 0,
    hasWalls: false,
    theme: 'medieval_day',
  },
  {
    id: 'river_gorge',
    name: 'River Gorge (Lembah Sungai)',
    category: 'natural',
    description: 'Lembah rumput hijau bertebing batu dengan aliran sungai air berliku di tengahnya.',
    floorMaterialId: 6, // Grass
    wallMaterialId: 5, // Mossy Stone
    hasWalls: true,
    minWallHeight: 4,
    maxWallHeight: 7,
    theme: 'medieval_day',
  },
  {
    id: 'mountain_canyon',
    name: 'Mountain Canyon (Ngarai Tebing)',
    category: 'natural',
    description: 'Jalur ngarai tanah berbatu dengan dinding tebing batu tinggi masif (tinggi 5-8).',
    floorMaterialId: 3, // Dirt
    wallMaterialId: 1, // Fortress Border Stone
    hasWalls: true,
    minWallHeight: 5,
    maxWallHeight: 8,
    theme: 'medieval_day',
  },
] as const;

export interface FloorMaterialMeta {
  id: number;
  name: string;
  category: 'town' | 'nature' | 'dungeon' | 'custom';
  swatchColor: string;
  description: string;
  isCustom?: boolean;
  textureUrl?: string;
  thumbnailUrl?: string;
  assetId?: string;
  repeatScale?: number; // 0.5 to 8.0 (default 1.0)
}

export interface PropPrefabMeta {
  id: string;
  name: string;
  category: 'nature' | 'medieval' | 'dungeon' | 'custom';
  description: string;
  isCustom?: boolean;
  modelUrl?: string;
  thumbnailUrl?: string;
  assetId?: string;
  tileWidth?: number; // Jumlah tile arah X (default 1)
  tileDepth?: number; // Jumlah tile arah Y/Z (default 1)
  scaleMultiplier?: number; // Fine-tune scale (default 1.0)
}

export const FLOOR_MATERIALS: readonly FloorMaterialMeta[] = [
  {
    id: 2,
    name: 'Medieval Cobblestone',
    category: 'town',
    swatchColor: '#64748b',
    description: 'Paved medieval town road & plaza stones',
  },
  {
    id: 6,
    name: 'Lush Grass Meadow',
    category: 'nature',
    swatchColor: '#22c55e',
    description: 'Verdant green grass field with natural blades',
  },
  {
    id: 7,
    name: 'River Water (Flowing)',
    category: 'nature',
    swatchColor: '#0ea5e9',
    description: 'Animated flowing river stream with ripples',
  },
  {
    id: 3,
    name: 'Dirt Pathway',
    category: 'nature',
    swatchColor: '#92400e',
    description: 'Compacted earth trail with pebbles',
  },
  {
    id: 8,
    name: 'Timber Wood Deck',
    category: 'town',
    swatchColor: '#b45309',
    description: 'Stained oak planks for piers & town squares',
  },
  {
    id: 1,
    name: 'Fortress Border Stone',
    category: 'dungeon',
    swatchColor: '#334155',
    description: 'Heavy dark ashlar masonry slabs',
  },
  {
    id: 4,
    name: 'Royal Crimson Carpet',
    category: 'town',
    swatchColor: '#991b1b',
    description: 'Ornate woven red runner with gold trim',
  },
  {
    id: 5,
    name: 'Mossy Ancient Ruins',
    category: 'dungeon',
    swatchColor: '#115e59',
    description: 'Weathered temple stones overgrown with moss',
  },
] as const;

export const PROP_PREFABS: readonly PropPrefabMeta[] = [
  {
    id: 'oak_tree',
    name: 'Oak Tree (Pohon Rindang)',
    category: 'nature',
    description: 'Lush deciduous oak tree with layered foliage canopy',
  },
  {
    id: 'pine_tree',
    name: 'Pine Tree (Pohon Cemara)',
    category: 'nature',
    description: 'Tall evergreen conifer tree for forests & hills',
  },
  {
    id: 'grass_tuft',
    name: '3D Grass & Wildflowers',
    category: 'nature',
    description: 'Walkable 3D grass blades with colorful wildflowers',
  },
  {
    id: 'wood_bridge',
    name: 'Wooden River Bridge',
    category: 'nature',
    description: 'Arched timber bridge with side railings for crossing rivers',
  },
  {
    id: 'tudor_house',
    name: 'Medieval Tudor House',
    category: 'medieval',
    description: 'Half-timbered medieval house with pitched roof & warm windows',
  },
  {
    id: 'town_fountain',
    name: 'Town Plaza Fountain',
    category: 'medieval',
    description: 'Octagonal stone basin with tiered water spout',
  },
  {
    id: 'street_lantern',
    name: 'Wrought Iron Street Lantern',
    category: 'medieval',
    description: 'Tall iron lamppost casting warm medieval street light',
  },
  {
    id: 'market_stall',
    name: 'Medieval Market Stall',
    category: 'medieval',
    description: 'Merchant booth with striped canopy & crates',
  },
  {
    id: 'wood_fence',
    name: 'Timber & Stone Fence',
    category: 'medieval',
    description: 'Rustic wooden rail fence with stone posts',
  },
  {
    id: 'pillar',
    name: 'Gothic Stone Pillar',
    category: 'dungeon',
    description: 'Fluted stone column with gold trim ring',
  },
  {
    id: 'torch',
    name: 'Standing Brazier Torch',
    category: 'dungeon',
    description: 'Lit fire brazier with warm flickering glow',
  },
  {
    id: 'chest',
    name: 'Treasure Chest',
    category: 'dungeon',
    description: 'Iron-bound wooden loot chest with gold lock',
  },
  {
    id: 'barrel',
    name: 'Tavern Oak Barrel',
    category: 'dungeon',
    description: 'Hooped wooden storage cask',
  },
] as const;

export interface SpawnerData {
  id: string;
  type: string; // e.g. 'dummy', 'skeleton_warrior', 'dark_cultist', 'dungeon_boss'
  x: number;
  y: number;
}

export interface PortalData {
  id: string;
  grid_x: number;
  grid_y: number;
  target_map_id: string;
  label: string;
}

export type SnapFace = 'top' | 'bottom' | 'north' | 'south' | 'east' | 'west';

export interface VoxelBlockData {
  id: string; // e.g. "x_y_z"
  x: number;
  y: number; // 0..19
  z: number;
  material_id: number;
  rotation_y?: number; // 0, 90, 180, 270
}

export interface PropData {
  id?: string;
  prefab_id: string;
  grid_x: number;
  grid_y: number;
  grid_z?: number; // vertical voxel level (0..20, default 0)
  snap_face?: SnapFace; // face attached to (default 'top')
  rotation_deg: number; // 0, 90, 180, 270
  tile_width?: number; // default 1
  tile_depth?: number; // default 1
  scale_multiplier?: number; // default 1.0
}

export interface MapData {
  map_id: string;
  name: string;
  tile_width: number;
  tile_height: number;
  width: number;
  height: number;
  max_height?: number; // 20 tiles
  layers: {
    ground: number[];
    collision: number[];
    wall_materials?: number[];
  };
  voxel_blocks?: VoxelBlockData[];
  spawners: Array<{ type: string; x: number; y: number }>;
  portals: Array<{ grid_x: number; grid_y: number; target_map_id: string; label: string }>;
  props?: Array<PropData>;
}
