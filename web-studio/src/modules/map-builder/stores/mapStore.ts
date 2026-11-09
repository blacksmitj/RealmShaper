import { create } from 'zustand';
import type { ToolMode, MapData, SpawnerData, PortalData, PropData } from '../types/map.types';

interface MapState {
  mapId: string;
  mapName: string;
  width: number;
  height: number;
  groundLayer: number[];
  collisionLayer: number[];
  spawners: SpawnerData[];
  portals: PortalData[];
  props: PropData[];

  // Editor UI State
  activeTool: ToolMode;
  selectedFloorType: number;
  selectedSpawnerType: string;
  selectedPropPrefab: string;
  portalTargetMapId: string;
  portalLabel: string;
  isDragging: boolean;

  // Actions
  setMapMeta: (id: string, name: string) => void;
  setDimensions: (width: number, height: number) => void;
  setActiveTool: (tool: ToolMode) => void;
  setSelectedFloorType: (floorType: number) => void;
  setSelectedSpawnerType: (type: string) => void;
  setSelectedPropPrefab: (prefab: string) => void;
  setPortalConfig: (targetMapId: string, label: string) => void;

  paintTile: (x: number, y: number) => void;
  eraseAt: (x: number, y: number) => void;
  loadFromMapData: (data: MapData) => void;
  exportToMapData: () => MapData;
  resetMap: () => void;
}

const DEFAULT_WIDTH = 16;
const DEFAULT_HEIGHT = 16;

const createInitialGround = (w: number, h: number): number[] => {
  const arr = new Array(w * h).fill(2); // 2 = dungeon floor
  // border with walls
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (x === 0 || x === w - 1 || y === 0 || y === h - 1) {
        arr[y * w + x] = 1; // 1 = border/stone wall
      }
    }
  }
  return arr;
};

const createInitialCollision = (w: number, h: number): number[] => {
  const arr = new Array(w * h).fill(0);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (x === 0 || x === w - 1 || y === 0 || y === h - 1) {
        arr[y * w + x] = 1;
      }
    }
  }
  return arr;
};

export const useMapStore = create<MapState>((set, get) => ({
  mapId: 'custom_dungeon_01',
  mapName: 'Forgotten Catacombs',
  width: DEFAULT_WIDTH,
  height: DEFAULT_HEIGHT,
  groundLayer: createInitialGround(DEFAULT_WIDTH, DEFAULT_HEIGHT),
  collisionLayer: createInitialCollision(DEFAULT_WIDTH, DEFAULT_HEIGHT),
  spawners: [
    { id: 'spawn_1', type: 'dummy', x: 7, y: 7 },
    { id: 'spawn_2', type: 'dummy', x: 8, y: 8 },
  ],
  portals: [
    { id: 'portal_1', grid_x: 8.0, grid_y: 14.0, target_map_id: 'main_city', label: 'To Main Sanctuary' }
  ],
  props: [],

  activeTool: 'floor',
  selectedFloorType: 2,
  selectedSpawnerType: 'dummy',
  selectedPropPrefab: 'pillar',
  portalTargetMapId: 'main_city',
  portalLabel: 'Realm Gate',
  isDragging: false,

  setMapMeta: (mapId, mapName) => set({ mapId, mapName }),

  setDimensions: (width, height) => set((state) => {
    const newGround = new Array(width * height).fill(2);
    const newCol = new Array(width * height).fill(0);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (x < state.width && y < state.height) {
          const oldIdx = y * state.width + x;
          const newIdx = y * width + x;
          newGround[newIdx] = state.groundLayer[oldIdx] ?? 2;
          newCol[newIdx] = state.collisionLayer[oldIdx] ?? 0;
        } else if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
          const newIdx = y * width + x;
          newGround[newIdx] = 1;
          newCol[newIdx] = 1;
        }
      }
    }

    return {
      width,
      height,
      groundLayer: newGround,
      collisionLayer: newCol,
      spawners: state.spawners.filter((s) => s.x < width && s.y < height),
      portals: state.portals.filter((p) => p.grid_x < width && p.grid_y < height),
      props: state.props.filter((p) => p.grid_x < width && p.grid_y < height),
    };
  }),

  setActiveTool: (tool) => set({ activeTool: tool }),
  setSelectedFloorType: (floorType) => set({ selectedFloorType: floorType }),
  setSelectedSpawnerType: (type) => set({ selectedSpawnerType: type }),
  setSelectedPropPrefab: (prefab) => set({ selectedPropPrefab: prefab }),
  setPortalConfig: (portalTargetMapId, portalLabel) => set({ portalTargetMapId, portalLabel }),

  paintTile: (x, y) => {
    const { width, height, activeTool, selectedFloorType, groundLayer, collisionLayer, spawners, portals, props, selectedSpawnerType, selectedPropPrefab, portalTargetMapId, portalLabel } = get();
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = y * width + x;

    if (activeTool === 'floor') {
      const newGround = [...groundLayer];
      newGround[idx] = selectedFloorType;
      const newCol = [...collisionLayer];
      newCol[idx] = 0; // floors are walkable
      set({ groundLayer: newGround, collisionLayer: newCol });
    } else if (activeTool === 'wall') {
      const newCol = [...collisionLayer];
      newCol[idx] = 1;
      set({ collisionLayer: newCol });
    } else if (activeTool === 'spawner') {
      const filtered = spawners.filter((s) => !(s.x === x && s.y === y));
      set({ spawners: [...filtered, { id: `spawn_${Date.now()}_${Math.random()}`, type: selectedSpawnerType, x, y }] });
    } else if (activeTool === 'portal') {
      const filtered = portals.filter((p) => !(Math.round(p.grid_x) === x && Math.round(p.grid_y) === y));
      set({ portals: [...filtered, { id: `portal_${Date.now()}`, grid_x: x, grid_y: y, target_map_id: portalTargetMapId, label: portalLabel }] });
    } else if (activeTool === 'prop') {
      const filtered = props.filter((p) => !(p.grid_x === x && p.grid_y === y));
      set({ props: [...filtered, { id: `prop_${Date.now()}`, prefab_id: selectedPropPrefab, grid_x: x, grid_y: y, rotation_deg: 0 }] });
    } else if (activeTool === 'eraser') {
      get().eraseAt(x, y);
    }
  },

  eraseAt: (x, y) => {
    const { width, height, groundLayer, collisionLayer, spawners, portals, props } = get();
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = y * width + x;

    const newGround = [...groundLayer];
    newGround[idx] = 0; // empty
    const newCol = [...collisionLayer];
    newCol[idx] = 0;

    set({
      groundLayer: newGround,
      collisionLayer: newCol,
      spawners: spawners.filter((s) => !(s.x === x && s.y === y)),
      portals: portals.filter((p) => !(Math.round(p.grid_x) === x && Math.round(p.grid_y) === y)),
      props: props.filter((p) => !(p.grid_x === x && p.grid_y === y)),
    });
  },

  loadFromMapData: (data: MapData) => {
    const width = data.width || 16;
    const height = data.height || 16;
    const groundLayer = data.layers?.ground || createInitialGround(width, height);
    const collisionLayer = data.layers?.collision || createInitialCollision(width, height);

    const spawners: SpawnerData[] = (data.spawners || []).map((s, i) => ({
      id: `spawn_${i}`,
      type: s.type || 'dummy',
      x: s.x,
      y: s.y,
    }));

    const portals: PortalData[] = (data.portals || []).map((p, i) => ({
      id: `portal_${i}`,
      grid_x: p.grid_x,
      grid_y: p.grid_y,
      target_map_id: p.target_map_id || 'main_city',
      label: p.label || 'Realm Gate',
    }));

    const props: PropData[] = (data.props || []).map((pr, i) => ({
      id: `prop_${i}`,
      prefab_id: pr.prefab_id || 'pillar',
      grid_x: pr.grid_x,
      grid_y: pr.grid_y,
      rotation_deg: pr.rotation_deg || 0,
    }));

    set({
      mapId: data.map_id || 'imported_map',
      mapName: data.name || 'Unnamed Realm',
      width,
      height,
      groundLayer,
      collisionLayer,
      spawners,
      portals,
      props,
    });
  },

  exportToMapData: () => {
    const state = get();
    return {
      map_id: state.mapId,
      name: state.mapName,
      tile_width: 64,
      tile_height: 32,
      width: state.width,
      height: state.height,
      layers: {
        ground: state.groundLayer,
        collision: state.collisionLayer,
      },
      spawners: state.spawners.map((s) => ({ type: s.type, x: s.x, y: s.y })),
      portals: state.portals.map((p) => ({
        grid_x: p.grid_x,
        grid_y: p.grid_y,
        target_map_id: p.target_map_id,
        label: p.label,
      })),
      props: state.props.map((pr) => ({
        prefab_id: pr.prefab_id,
        grid_x: pr.grid_x,
        grid_y: pr.grid_y,
        rotation_deg: pr.rotation_deg,
      })),
    };
  },

  resetMap: () => set({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    groundLayer: createInitialGround(DEFAULT_WIDTH, DEFAULT_HEIGHT),
    collisionLayer: createInitialCollision(DEFAULT_WIDTH, DEFAULT_HEIGHT),
    spawners: [],
    portals: [],
    props: [],
  }),
}));

