export type ToolMode = 'floor' | 'wall' | 'eraser' | 'spawner' | 'portal' | 'prop';

export interface SpawnerData {
  id: string;
  type: string; // e.g. 'dummy', 'skeleton', 'boss'
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

export interface PropData {
  id: string;
  prefab_id: string; // e.g. 'pillar', 'torch', 'chest', 'barrel'
  grid_x: number;
  grid_y: number;
  rotation_deg: number; // 0, 90, 180, 270
}

export interface MapData {
  map_id: string;
  name: string;
  tile_width: number;
  tile_height: number;
  width: number;
  height: number;
  layers: {
    ground: number[];
    collision: number[];
  };
  spawners: Array<{ type: string; x: number; y: number }>;
  portals: Array<{ grid_x: number; grid_y: number; target_map_id: string; label: string }>;
  props?: Array<{ prefab_id: string; grid_x: number; grid_y: number; rotation_deg: number }>;
}

