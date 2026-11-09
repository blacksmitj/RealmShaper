import { create } from 'zustand';
import type {
  ToolMode,
  DragPaintMode,
  WallStackMode,
  EnvironmentTheme,
  MapPresetId,
  MapData,
  SpawnerData,
  PortalData,
  PropData,
} from '../types/map.types';

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
  dragPaintMode: DragPaintMode;
  selectedFloorType: number;
  wallStackMode: WallStackMode;
  selectedWallHeight: number;
  selectedSpawnerType: string;
  selectedPropPrefab: string;
  selectedPropRotation: number;
  portalTargetMapId: string;
  portalLabel: string;
  environmentTheme: EnvironmentTheme;
  isDragging: boolean;

  // Actions
  setMapMeta: (id: string, name: string) => void;
  setDimensions: (width: number, height: number) => void;
  setActiveTool: (tool: ToolMode) => void;
  setDragPaintMode: (mode: DragPaintMode) => void;
  setSelectedFloorType: (floorType: number) => void;
  setWallStackMode: (mode: WallStackMode) => void;
  setSelectedWallHeight: (height: number) => void;
  setSelectedSpawnerType: (type: string) => void;
  setSelectedPropPrefab: (prefab: string) => void;
  setSelectedPropRotation: (deg: number) => void;
  rotateSelectedProp: () => void;
  setPortalConfig: (targetMapId: string, label: string) => void;
  setEnvironmentTheme: (theme: EnvironmentTheme) => void;

  paintTile: (x: number, y: number, isDragPaint?: boolean) => void;
  paintRegion: (x1: number, y1: number, x2: number, y2: number, isShiftKey?: boolean) => void;
  decreaseWallAt: (x: number, y: number) => void;
  eraseAt: (x: number, y: number) => void;
  loadFromMapData: (data: MapData) => void;
  loadPresetMap: (presetId: MapPresetId) => void;
  exportToMapData: () => MapData;
  resetMap: () => void;
}

const DEFAULT_WIDTH = 16;
const DEFAULT_HEIGHT = 16;

const createCatacombsPreset = (): {
  mapId: string;
  mapName: string;
  width: number;
  height: number;
  groundLayer: number[];
  collisionLayer: number[];
  spawners: SpawnerData[];
  portals: PortalData[];
  props: PropData[];
  environmentTheme: EnvironmentTheme;
} => {
  const w = 16;
  const h = 16;
  const ground = new Array(w * h).fill(2);
  const col = new Array(w * h).fill(0);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (x === 0 || x === w - 1 || y === 0 || y === h - 1) {
        ground[idx] = 1;
        col[idx] = 2; // 2-level fortress perimeter wall
      } else if ((x === 4 || x === 11) && (y === 4 || y === 11)) {
        ground[idx] = 1;
        col[idx] = 3; // Tall stacked stone pillars
      } else if (x >= 6 && x <= 9 && y >= 6 && y <= 9) {
        ground[idx] = 4; // Royal crimson carpet center
      } else if (x === 7 || x === 8 || y === 7 || y === 8) {
        ground[idx] = 3; // Pathway
      }
    }
  }

  return {
    mapId: 'custom_dungeon_01',
    mapName: 'Forgotten Catacombs',
    width: w,
    height: h,
    groundLayer: ground,
    collisionLayer: col,
    spawners: [
      { id: 'spawn_1', type: 'skeleton_warrior', x: 7, y: 7 },
      { id: 'spawn_2', type: 'dark_cultist', x: 8, y: 8 },
    ],
    portals: [
      {
        id: 'portal_1',
        grid_x: 8,
        grid_y: 14,
        target_map_id: 'main_city',
        label: 'To Main Sanctuary',
      },
    ],
    props: [
      { id: 'prop_c1', prefab_id: 'torch', grid_x: 5, grid_y: 5, rotation_deg: 0 },
      { id: 'prop_c2', prefab_id: 'torch', grid_x: 10, grid_y: 5, rotation_deg: 0 },
      { id: 'prop_c3', prefab_id: 'chest', grid_x: 7, grid_y: 5, rotation_deg: 0 },
    ],
    environmentTheme: 'gothic_night',
  };
};

const createMedievalRiverTownPreset = (): {
  mapId: string;
  mapName: string;
  width: number;
  height: number;
  groundLayer: number[];
  collisionLayer: number[];
  spawners: SpawnerData[];
  portals: PortalData[];
  props: PropData[];
  environmentTheme: EnvironmentTheme;
} => {
  const w = 18;
  const h = 18;
  // Default lush grass meadow (6)
  const ground = new Array(w * h).fill(6);
  const col = new Array(w * h).fill(0);
  const props: PropData[] = [];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;

      // 1. Winding River flowing North -> South around x = 8..9
      const riverCenter = 8 + Math.round(Math.sin(y * 0.45) * 0.8);
      if (x === riverCenter || x === riverCenter + 1) {
        ground[idx] = 7; // River Water
      }

      // 2. Main East-West Medieval Cobblestone Road across y = 8..9
      if (y === 8 || y === 9) {
        if (ground[idx] !== 7) {
          ground[idx] = 2; // Medieval Cobblestone road
        }
      }

      // 3. West Town Plaza (Cobblestone & Wood Deck)
      if (x >= 3 && x <= 6 && y >= 5 && y <= 12 && ground[idx] !== 7) {
        ground[idx] = 2;
      }

      // 4. River Pier / Timber Dock on East bank
      if (x === 11 && y >= 11 && y <= 14) {
        ground[idx] = 8; // Timber Wood Deck
      }

      // 5. Dirt Trail to East Woods
      if (y === 8 && x >= 11 && x <= 15) {
        ground[idx] = 2;
      }
      if (x === 13 && y >= 4 && y <= 13 && ground[idx] !== 2) {
        ground[idx] = 3; // Dirt path
      }

      // 6. Stacked Stone Cliff / Castle Watchtower Walls on Corners (1..4 levels)
      const isCornerBastion =
        (x <= 1 && y <= 2) ||
        (x >= w - 2 && y <= 2) ||
        (x <= 1 && y >= h - 2) ||
        (x >= w - 2 && y >= h - 2);
      if (isCornerBastion) {
        ground[idx] = 1;
        const distFromEdge = x === 0 || x === w - 1 || y === 0 || y === h - 1 ? 3 : 2;
        const isTowerPeak =
          (x === 0 && y === 0) ||
          (x === w - 1 && y === 0) ||
          (x === 0 && y === h - 1) ||
          (x === w - 1 && y === h - 1);
        col[idx] = isTowerPeak ? 4 : distFromEdge;
      }
    }
  }

  // Place Wooden River Bridges across the river at y = 8 and y = 9
  for (let y = 8; y <= 9; y++) {
    for (let x = 7; x <= 10; x++) {
      if (ground[y * w + x] === 7) {
        props.push({
          id: `bridge_${x}_${y}`,
          prefab_id: 'wood_bridge',
          grid_x: x,
          grid_y: y,
          rotation_deg: 90,
        });
      }
    }
  }

  // Medieval Tudor Houses in Town District
  props.push(
    { id: 'house_1', prefab_id: 'tudor_house', grid_x: 3, grid_y: 4, rotation_deg: 0 },
    { id: 'house_2', prefab_id: 'tudor_house', grid_x: 5, grid_y: 4, rotation_deg: 0 },
    { id: 'house_3', prefab_id: 'tudor_house', grid_x: 3, grid_y: 13, rotation_deg: 180 },
    { id: 'house_4', prefab_id: 'tudor_house', grid_x: 14, grid_y: 5, rotation_deg: 270 }
  );

  // Town Fountain & Market Stalls
  props.push(
    { id: 'fountain_1', prefab_id: 'town_fountain', grid_x: 4, grid_y: 7, rotation_deg: 0 },
    { id: 'stall_1', prefab_id: 'market_stall', grid_x: 6, grid_y: 6, rotation_deg: 270 },
    { id: 'stall_2', prefab_id: 'market_stall', grid_x: 5, grid_y: 11, rotation_deg: 180 }
  );

  // Street Lanterns along the road & bridge
  props.push(
    { id: 'lantern_1', prefab_id: 'street_lantern', grid_x: 6, grid_y: 8, rotation_deg: 0 },
    { id: 'lantern_2', prefab_id: 'street_lantern', grid_x: 11, grid_y: 8, rotation_deg: 180 },
    { id: 'lantern_3', prefab_id: 'street_lantern', grid_x: 3, grid_y: 9, rotation_deg: 0 }
  );

  // Oak Trees, Pine Trees & 3D Grass Tufts along riverbanks & meadows
  props.push(
    { id: 'tree_oak_1', prefab_id: 'oak_tree', grid_x: 12, grid_y: 3, rotation_deg: 0 },
    { id: 'tree_oak_2', prefab_id: 'oak_tree', grid_x: 15, grid_y: 11, rotation_deg: 90 },
    { id: 'tree_oak_3', prefab_id: 'oak_tree', grid_x: 2, grid_y: 10, rotation_deg: 45 },
    { id: 'tree_pine_1', prefab_id: 'pine_tree', grid_x: 15, grid_y: 3, rotation_deg: 0 },
    { id: 'tree_pine_2', prefab_id: 'pine_tree', grid_x: 16, grid_y: 6, rotation_deg: 0 },
    { id: 'tree_pine_3', prefab_id: 'pine_tree', grid_x: 14, grid_y: 14, rotation_deg: 0 },
    { id: 'grass_1', prefab_id: 'grass_tuft', grid_x: 7, grid_y: 4, rotation_deg: 0 },
    { id: 'grass_2', prefab_id: 'grass_tuft', grid_x: 11, grid_y: 5, rotation_deg: 90 },
    { id: 'grass_3', prefab_id: 'grass_tuft', grid_x: 7, grid_y: 12, rotation_deg: 180 },
    { id: 'grass_4', prefab_id: 'grass_tuft', grid_x: 12, grid_y: 13, rotation_deg: 270 },
    { id: 'fence_1', prefab_id: 'wood_fence', grid_x: 12, grid_y: 7, rotation_deg: 0 },
    { id: 'fence_2', prefab_id: 'wood_fence', grid_x: 14, grid_y: 7, rotation_deg: 0 }
  );

  return {
    mapId: 'medieval_river_town_01',
    mapName: 'Oakvale Riverhaven (Medieval Town)',
    width: w,
    height: h,
    groundLayer: ground,
    collisionLayer: col,
    spawners: [
      { id: 'spawn_town_1', type: 'dummy', x: 13, y: 10 },
    ],
    portals: [
      {
        id: 'portal_town_1',
        grid_x: 2,
        grid_y: 8,
        target_map_id: 'custom_dungeon_01',
        label: 'To Catacombs Gate',
      },
    ],
    props,
    environmentTheme: 'medieval_day',
  };
};

const initialPreset = createMedievalRiverTownPreset();

export const useMapStore = create<MapState>((set, get) => ({
  mapId: initialPreset.mapId,
  mapName: initialPreset.mapName,
  width: initialPreset.width,
  height: initialPreset.height,
  groundLayer: initialPreset.groundLayer,
  collisionLayer: initialPreset.collisionLayer,
  spawners: initialPreset.spawners,
  portals: initialPreset.portals,
  props: initialPreset.props,

  activeTool: 'floor',
  dragPaintMode: 'brush',
  selectedFloorType: 2,
  wallStackMode: 'increment',
  selectedWallHeight: 1,
  selectedSpawnerType: 'dummy',
  selectedPropPrefab: 'oak_tree',
  selectedPropRotation: 0,
  portalTargetMapId: 'main_city',
  portalLabel: 'Realm Gate',
  environmentTheme: initialPreset.environmentTheme,
  isDragging: false,

  setMapMeta: (mapId, mapName) => set({ mapId, mapName }),

  setDimensions: (width, height) =>
    set((state) => {
      const newGround = new Array(width * height).fill(6);
      const newCol = new Array(width * height).fill(0);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (x < state.width && y < state.height) {
            const oldIdx = y * state.width + x;
            const newIdx = y * width + x;
            newGround[newIdx] = state.groundLayer[oldIdx] ?? 6;
            newCol[newIdx] = state.collisionLayer[oldIdx] ?? 0;
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
  setDragPaintMode: (dragPaintMode) => set({ dragPaintMode }),
  setSelectedFloorType: (floorType) => set({ selectedFloorType: floorType }),
  setWallStackMode: (wallStackMode) => set({ wallStackMode }),
  setSelectedWallHeight: (selectedWallHeight) =>
    set({ selectedWallHeight: Math.max(1, Math.min(5, selectedWallHeight)) }),
  setSelectedSpawnerType: (type) => set({ selectedSpawnerType: type }),
  setSelectedPropPrefab: (prefab) => set({ selectedPropPrefab: prefab }),
  setSelectedPropRotation: (deg) => set({ selectedPropRotation: ((deg % 360) + 360) % 360 }),
  rotateSelectedProp: () =>
    set((state) => ({ selectedPropRotation: (state.selectedPropRotation + 90) % 360 })),
  setPortalConfig: (portalTargetMapId, portalLabel) => set({ portalTargetMapId, portalLabel }),
  setEnvironmentTheme: (environmentTheme) => set({ environmentTheme }),

  paintTile: (x, y) => {
    const {
      width,
      height,
      activeTool,
      selectedFloorType,
      wallStackMode,
      selectedWallHeight,
      groundLayer,
      collisionLayer,
      spawners,
      portals,
      props,
      selectedSpawnerType,
      selectedPropPrefab,
      selectedPropRotation,
      portalTargetMapId,
      portalLabel,
    } = get();

    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = y * width + x;

    if (activeTool === 'floor') {
      const newGround = [...groundLayer];
      newGround[idx] = selectedFloorType;
      const newCol = [...collisionLayer];
      newCol[idx] = 0; // Painting floor clears stone wall stack on that tile
      set({ groundLayer: newGround, collisionLayer: newCol });
    } else if (activeTool === 'wall') {
      const newCol = [...collisionLayer];
      const currentHeight = newCol[idx] ?? 0;

      if (wallStackMode === 'increment') {
        // Stack stone higher (+1 per cell per stroke, capped at 5)
        newCol[idx] = currentHeight >= 5 ? 5 : currentHeight + 1;
      } else {
        newCol[idx] = selectedWallHeight;
      }

      // Ensure there is a ground tile under stacked stones
      const newGround = [...groundLayer];
      if ((newGround[idx] ?? 0) === 0) {
        newGround[idx] = 1;
      }
      set({ collisionLayer: newCol, groundLayer: newGround });
    } else if (activeTool === 'spawner') {
      const filtered = spawners.filter((s) => !(s.x === x && s.y === y));
      set({
        spawners: [
          ...filtered,
          { id: `spawn_${Date.now()}_${Math.random()}`, type: selectedSpawnerType, x, y },
        ],
      });
    } else if (activeTool === 'portal') {
      const filtered = portals.filter(
        (p) => !(Math.round(p.grid_x) === x && Math.round(p.grid_y) === y)
      );
      set({
        portals: [
          ...filtered,
          {
            id: `portal_${Date.now()}_${Math.random()}`,
            grid_x: x,
            grid_y: y,
            target_map_id: portalTargetMapId,
            label: portalLabel,
          },
        ],
      });
    } else if (activeTool === 'prop') {
      const filtered = props.filter((p) => !(p.grid_x === x && p.grid_y === y));
      set({
        props: [
          ...filtered,
          {
            id: `prop_${Date.now()}_${Math.random()}`,
            prefab_id: selectedPropPrefab,
            grid_x: x,
            grid_y: y,
            rotation_deg: selectedPropRotation,
          },
        ],
      });
    } else if (activeTool === 'eraser') {
      get().eraseAt(x, y);
    }
  },

  paintRegion: (x1, y1, x2, y2, isShiftKey = false) => {
    const {
      width,
      height,
      activeTool,
      selectedFloorType,
      wallStackMode,
      selectedWallHeight,
      groundLayer,
      collisionLayer,
      spawners,
      portals,
      props,
      selectedSpawnerType,
      selectedPropPrefab,
      selectedPropRotation,
      portalTargetMapId,
      portalLabel,
    } = get();

    const minX = Math.max(0, Math.min(x1, x2));
    const maxX = Math.min(width - 1, Math.max(x1, x2));
    const minY = Math.max(0, Math.min(y1, y2));
    const maxY = Math.min(height - 1, Math.max(y1, y2));

    const newGround = [...groundLayer];
    const newCol = [...collisionLayer];
    let newSpawners = [...spawners];
    let newPortals = [...portals];
    let newProps = [...props];

    const inRegion = (cx: number, cy: number) =>
      cx >= minX && cx <= maxX && cy >= minY && cy <= maxY;

    if (activeTool === 'eraser') {
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          newCol[y * width + x] = 0;
        }
      }
      newSpawners = newSpawners.filter((s) => !inRegion(s.x, s.y));
      newPortals = newPortals.filter((p) => !inRegion(Math.round(p.grid_x), Math.round(p.grid_y)));
      newProps = newProps.filter((pr) => !inRegion(pr.grid_x, pr.grid_y));
      set({
        collisionLayer: newCol,
        spawners: newSpawners,
        portals: newPortals,
        props: newProps,
      });
      return;
    }

    if (activeTool === 'floor') {
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const idx = y * width + x;
          newGround[idx] = selectedFloorType;
          newCol[idx] = 0;
        }
      }
      set({ groundLayer: newGround, collisionLayer: newCol });
      return;
    }

    if (activeTool === 'wall') {
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const idx = y * width + x;
          const current = newCol[idx] ?? 0;
          if (isShiftKey) {
            newCol[idx] = Math.max(0, current - 1);
          } else if (wallStackMode === 'increment') {
            newCol[idx] = Math.min(5, current + 1);
          } else {
            newCol[idx] = selectedWallHeight;
          }
          if ((newGround[idx] ?? 0) === 0 && (newCol[idx] ?? 0) > 0) {
            newGround[idx] = 1;
          }
        }
      }
      set({ collisionLayer: newCol, groundLayer: newGround });
      return;
    }

    if (activeTool === 'prop') {
      newProps = newProps.filter((pr) => !inRegion(pr.grid_x, pr.grid_y));
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          newProps.push({
            id: `prop_${Date.now()}_${x}_${y}_${Math.random()}`,
            prefab_id: selectedPropPrefab,
            grid_x: x,
            grid_y: y,
            rotation_deg: selectedPropRotation,
          });
        }
      }
      set({ props: newProps });
      return;
    }

    if (activeTool === 'spawner') {
      newSpawners = newSpawners.filter((s) => !inRegion(s.x, s.y));
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          newSpawners.push({
            id: `spawn_${Date.now()}_${x}_${y}_${Math.random()}`,
            type: selectedSpawnerType,
            x,
            y,
          });
        }
      }
      set({ spawners: newSpawners });
      return;
    }

    if (activeTool === 'portal') {
      newPortals = newPortals.filter((p) => !inRegion(Math.round(p.grid_x), Math.round(p.grid_y)));
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          newPortals.push({
            id: `portal_${Date.now()}_${x}_${y}_${Math.random()}`,
            grid_x: x,
            grid_y: y,
            target_map_id: portalTargetMapId,
            label: portalLabel,
          });
        }
      }
      set({ portals: newPortals });
    }
  },

  decreaseWallAt: (x, y) => {
    const { width, height, collisionLayer } = get();
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = y * width + x;
    const current = collisionLayer[idx] ?? 0;
    if (current > 0) {
      const newCol = [...collisionLayer];
      newCol[idx] = current - 1;
      set({ collisionLayer: newCol });
    }
  },

  eraseAt: (x, y) => {
    const { width, height, collisionLayer, spawners, portals, props } = get();
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = y * width + x;

    const newCol = [...collisionLayer];
    newCol[idx] = 0;

    set({
      collisionLayer: newCol,
      spawners: spawners.filter((s) => !(s.x === x && s.y === y)),
      portals: portals.filter((p) => !(Math.round(p.grid_x) === x && Math.round(p.grid_y) === y)),
      props: props.filter((p) => !(p.grid_x === x && p.grid_y === y)),
    });
  },

  loadPresetMap: (presetId) => {
    const preset =
      presetId === 'medieval_town' ? createMedievalRiverTownPreset() : createCatacombsPreset();
    set({
      mapId: preset.mapId,
      mapName: preset.mapName,
      width: preset.width,
      height: preset.height,
      groundLayer: preset.groundLayer,
      collisionLayer: preset.collisionLayer,
      spawners: preset.spawners,
      portals: preset.portals,
      props: preset.props,
      environmentTheme: preset.environmentTheme,
    });
  },

  loadFromMapData: (data: MapData) => {
    const width = data.width || DEFAULT_WIDTH;
    const height = data.height || DEFAULT_HEIGHT;
    const groundLayer = data.layers?.ground || new Array(width * height).fill(2);
    const collisionLayer = data.layers?.collision || new Array(width * height).fill(0);

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
      tile_width: 2,
      tile_height: 2,
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

  resetMap: () => {
    const preset = createMedievalRiverTownPreset();
    set({
      mapId: preset.mapId,
      mapName: preset.mapName,
      width: preset.width,
      height: preset.height,
      groundLayer: preset.groundLayer,
      collisionLayer: preset.collisionLayer,
      spawners: preset.spawners,
      portals: preset.portals,
      props: preset.props,
      environmentTheme: preset.environmentTheme,
    });
  },
}));
