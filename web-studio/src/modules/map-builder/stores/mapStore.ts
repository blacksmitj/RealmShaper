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
  FloorMaterialMeta,
  PropPrefabMeta,
  VoxelBlockData,
} from '../types/map.types';
import { FLOOR_MATERIALS, PROP_PREFABS } from '../types/map.types';

const CUSTOM_PROPS_KEY = 'realmshaper_custom_props';
const CUSTOM_FLOORS_KEY = 'realmshaper_custom_floors';

function loadStoredCustomProps(): PropPrefabMeta[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PROPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadStoredCustomFloors(): FloorMaterialMeta[] {
  try {
    const raw = localStorage.getItem(CUSTOM_FLOORS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

interface MapState {
  mapId: string;
  mapName: string;
  width: number;
  height: number;
  groundLayer: number[];
  collisionLayer: number[];
  wallMaterialsLayer: number[];
  voxelBlocks: Record<string, VoxelBlockData>; // key: "x_y_z"
  spawners: SpawnerData[];
  portals: PortalData[];
  props: PropData[];

  // Dynamic Catalog State
  customProps: PropPrefabMeta[];
  customFloors: FloorMaterialMeta[];
  addCustomProp: (prop: PropPrefabMeta) => void;
  updateCustomProp: (id: string, updates: Partial<PropPrefabMeta>) => void;
  removeCustomProp: (id: string) => void;
  addCustomFloor: (floor: FloorMaterialMeta) => void;
  updateCustomFloor: (id: number, updates: Partial<FloorMaterialMeta>) => void;
  removeCustomFloor: (id: number) => void;

  // Editor UI State
  activeTool: ToolMode;
  dragPaintMode: DragPaintMode;
  selectedFloorType: number;
  selectedWallType: number;
  wallStackMode: WallStackMode;
  selectedWallHeight: number;
  selectedSpawnerType: string;
  selectedPropPrefab: string;
  selectedPropRotation: number;
  selectedEntity: {
    type: 'prop' | 'tile' | 'spawner' | 'portal' | 'block';
    x: number;
    y: number;
    z?: number;
    data?: any;
  } | null;
  selectedBlockId: string | null;
  activeVoxelY: number; // 0..19 slice/focus level
  setActiveVoxelY: (y: number) => void;
  setVoxelBlock: (x: number, y: number, z: number, materialId: number, rotationY?: number) => void;
  removeVoxelBlock: (x: number, y: number, z: number) => void;
  rotateVoxelBlock: (x: number, y: number, z: number, deltaDeg?: number) => void;
  updateVoxelBlockMaterial: (x: number, y: number, z: number, materialId: number) => void;
  portalTargetMapId: string;
  portalLabel: string;
  environmentTheme: EnvironmentTheme;
  isDragging: boolean;

  movingPropId: string | null;
  setMovingPropId: (id: string | null) => void;
  movePropTo: (propId: string, targetX: number, targetY: number) => boolean;

  // Actions
  setMapMeta: (id: string, name: string) => void;
  setDimensions: (width: number, height: number, defaultFloorId?: number) => void;
  setActiveTool: (tool: ToolMode) => void;
  setSelectedEntity: (
    entity: {
      type: 'prop' | 'tile' | 'spawner' | 'portal' | 'block';
      x: number;
      y: number;
      z?: number;
      data?: any;
    } | null
  ) => void;
  setDragPaintMode: (mode: DragPaintMode) => void;
  setSelectedFloorType: (floorType: number) => void;
  setSelectedWallType: (wallType: number) => void;
  setWallStackMode: (mode: WallStackMode) => void;
  setSelectedWallHeight: (height: number) => void;
  setSelectedSpawnerType: (type: string) => void;
  setSelectedPropPrefab: (prefab: string) => void;
  setSelectedPropRotation: (deg: number) => void;
  rotateSelectedProp: (deltaDeg?: number, targetGridPos?: { x: number; y: number } | null) => void;
  updatePropConfig: (
    propId: string,
    updates: {
      tile_width?: number;
      tile_depth?: number;
      scale_multiplier?: number;
      rotation_deg?: number;
    }
  ) => void;
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
  wallMaterialsLayer: number[];
  voxelBlocks: Record<string, VoxelBlockData>; // key: "x_y_z"
  spawners: SpawnerData[];
  portals: PortalData[];
  props: PropData[];
  environmentTheme: EnvironmentTheme;
} => {
  const w = 16;
  const h = 16;
  const ground = new Array(w * h).fill(2);
  const col = new Array(w * h).fill(0);
  const wallMaterials = new Array(w * h).fill(0);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (x === 0 || x === w - 1 || y === 0 || y === h - 1) {
        ground[idx] = 1;
        col[idx] = 2; // 2-level fortress perimeter wall
        wallMaterials[idx] = 1; // Fortress Border Stone
      } else if ((x === 4 || x === 11) && (y === 4 || y === 11)) {
        ground[idx] = 1;
        col[idx] = 3; // Tall stacked stone pillars
        wallMaterials[idx] = 1;
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
    wallMaterialsLayer: wallMaterials,
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
    voxelBlocks: ((): Record<string, VoxelBlockData> => {
      const vb: Record<string, VoxelBlockData> = {};
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = y * w + x;
          const heightLvl = col[idx] ?? 0;
          const mat = wallMaterials[idx] ?? 1;
          for (let lvl = 0; lvl < heightLvl; lvl++) {
            const k = `${x}_${lvl}_${y}`;
            vb[k] = { id: k, x, y: lvl, z: y, material_id: mat, rotation_y: 0 };
          }
        }
      }
      return vb;
    })(),
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
  wallMaterialsLayer: number[];
  voxelBlocks: Record<string, VoxelBlockData>; // key: "x_y_z"
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
  const wallMaterials = new Array(w * h).fill(0);
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
        wallMaterials[idx] = 1; // Fortress Border Stone
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
    wallMaterialsLayer: wallMaterials,
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
    voxelBlocks: ((): Record<string, VoxelBlockData> => {
      const vb: Record<string, VoxelBlockData> = {};
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = y * w + x;
          const heightLvl = col[idx] ?? 0;
          const mat = wallMaterials[idx] ?? 2;
          for (let lvl = 0; lvl < heightLvl; lvl++) {
            const k = `${x}_${lvl}_${y}`;
            vb[k] = { id: k, x, y: lvl, z: y, material_id: mat, rotation_y: 0 };
          }
        }
      }
      return vb;
    })(),
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
  wallMaterialsLayer: initialPreset.wallMaterialsLayer,
  spawners: initialPreset.spawners,
  portals: initialPreset.portals,
  props: initialPreset.props,
  voxelBlocks: (initialPreset as any).voxelBlocks ?? {},
  selectedBlockId: null,
  activeVoxelY: 0,
  setActiveVoxelY: (y: number) => set({ activeVoxelY: Math.max(0, Math.min(19, Math.round(y))) }),

  activeTool: 'floor',
  dragPaintMode: 'brush',
  selectedFloorType: 2,
  selectedWallType: 2,
  wallStackMode: 'increment',
  selectedWallHeight: 1,
  selectedSpawnerType: 'dummy',
  selectedPropPrefab: 'oak_tree',
  selectedPropRotation: 0,
  selectedEntity: null,
  portalTargetMapId: 'main_city',
  portalLabel: 'Realm Gate',
  environmentTheme: initialPreset.environmentTheme,
  isDragging: false,

  customProps: loadStoredCustomProps(),
  customFloors: loadStoredCustomFloors(),

  addCustomProp: (prop) =>
    set((state) => {
      const next = [prop, ...state.customProps.filter((p) => p.id !== prop.id)];
      try {
        localStorage.setItem(CUSTOM_PROPS_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return { customProps: next, selectedPropPrefab: prop.id };
    }),

  updateCustomProp: (id, updates) =>
    set((state) => {
      const next = state.customProps.map((p) => (p.id === id ? { ...p, ...updates } : p));
      try {
        localStorage.setItem(CUSTOM_PROPS_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return { customProps: next };
    }),

  removeCustomProp: (id) =>
    set((state) => {
      const next = state.customProps.filter((p) => p.id !== id);
      try {
        localStorage.setItem(CUSTOM_PROPS_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return {
        customProps: next,
        selectedPropPrefab:
          state.selectedPropPrefab === id ? (PROP_PREFABS[0]?.id ?? 'oak_tree') : state.selectedPropPrefab,
      };
    }),

  addCustomFloor: (floor) =>
    set((state) => {
      const next = [floor, ...state.customFloors.filter((f) => f.id !== floor.id)];
      try {
        localStorage.setItem(CUSTOM_FLOORS_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return { customFloors: next, selectedFloorType: floor.id };
    }),

  updateCustomFloor: (id, updates) =>
    set((state) => {
      const next = state.customFloors.map((f) => (f.id === id ? { ...f, ...updates } : f));
      try {
        localStorage.setItem(CUSTOM_FLOORS_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return { customFloors: next };
    }),

  removeCustomFloor: (id) =>
    set((state) => {
      const next = state.customFloors.filter((f) => f.id !== id);
      try {
        localStorage.setItem(CUSTOM_FLOORS_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return {
        customFloors: next,
        selectedFloorType:
          state.selectedFloorType === id ? (FLOOR_MATERIALS[0]?.id ?? 2) : state.selectedFloorType,
      };
    }),

  movingPropId: null,
  setMovingPropId: (id) => set({ movingPropId: id }),
  movePropTo: (propId, targetX, targetY) => {
    const { width, height, props, customProps, selectedEntity } = get();
    const propToMove = props.find((p) => p.id === propId);
    if (!propToMove) return false;

    const allPropsMeta = [...customProps, ...PROP_PREFABS];
    const meta = allPropsMeta.find((m) => m.id === propToMove.prefab_id);
    const w = propToMove.tile_width ?? meta?.tileWidth ?? 1;
    const d = propToMove.tile_depth ?? meta?.tileDepth ?? 1;

    // Boundary check
    if (targetX < 0 || targetX + w > width || targetY < 0 || targetY + d > height) {
      return false;
    }

    // Check overlap with other props
    const otherProps = props.filter((p) => p.id !== propId);
    const overlaps = otherProps.some((p) => {
      const otherMeta = allPropsMeta.find((m) => m.id === p.prefab_id);
      const ow = p.tile_width ?? otherMeta?.tileWidth ?? 1;
      const od = p.tile_depth ?? otherMeta?.tileDepth ?? 1;
      return (
        targetX < p.grid_x + ow &&
        targetX + w > p.grid_x &&
        targetY < p.grid_y + od &&
        targetY + d > p.grid_y
      );
    });

    if (overlaps) return false;

    const updatedProps = props.map((p) =>
      p.id === propId ? { ...p, grid_x: targetX, grid_y: targetY } : p
    );

    const nextSelectedEntity =
      selectedEntity && selectedEntity.type === 'prop' && selectedEntity.data?.id === propId
        ? {
            ...selectedEntity,
            x: targetX,
            y: targetY,
            data: { ...selectedEntity.data, grid_x: targetX, grid_y: targetY },
          }
        : selectedEntity;

    set({
      props: updatedProps,
      selectedEntity: nextSelectedEntity,
      movingPropId: null,
    });
    return true;
  },

  setVoxelBlock: (x, y, z, materialId, rotationY = 0) => {
    const { width, height, voxelBlocks, collisionLayer, wallMaterialsLayer } = get();
    if (x < 0 || x >= width || z < 0 || z >= height || y < 0 || y >= 20) return;
    const blockKey = `${x}_${y}_${z}`;
    const nextBlocks = {
      ...voxelBlocks,
      [blockKey]: {
        id: blockKey,
        x,
        y,
        z,
        material_id: materialId,
        rotation_y: rotationY,
      },
    };

    // Sinkronisasi layer 2.5D untuk backward-compatibility jika y berada di tumpukan
    const idx = z * width + x;
    const nextCol = [...collisionLayer];
    const nextWallMat = [...wallMaterialsLayer];
    if (y >= (nextCol[idx] ?? 0)) {
      nextCol[idx] = Math.min(20, y + 1);
      nextWallMat[idx] = materialId;
    }

    set({
      voxelBlocks: nextBlocks,
      collisionLayer: nextCol,
      wallMaterialsLayer: nextWallMat,
    });
  },

  removeVoxelBlock: (x, y, z) => {
    const { width, voxelBlocks, selectedBlockId, selectedEntity, collisionLayer } = get();
    const blockKey = `${x}_${y}_${z}`;
    if (!voxelBlocks[blockKey]) return;

    const nextBlocks = { ...voxelBlocks };
    delete nextBlocks[blockKey];

    // Recalculate max height at (x, z) for 2.5D collisionLayer
    let maxH = 0;
    for (let checkY = 19; checkY >= 0; checkY--) {
      if (nextBlocks[`${x}_${checkY}_${z}`]) {
        maxH = checkY + 1;
        break;
      }
    }
    const idx = z * width + x;
    const nextCol = [...collisionLayer];
    nextCol[idx] = maxH;

    const shouldClearSelection =
      selectedBlockId === blockKey ||
      (selectedEntity?.type === 'block' &&
        selectedEntity.x === x &&
        selectedEntity.y === z &&
        selectedEntity.z === y);

    set({
      voxelBlocks: nextBlocks,
      collisionLayer: nextCol,
      selectedBlockId: shouldClearSelection ? null : selectedBlockId,
      selectedEntity: shouldClearSelection ? null : selectedEntity,
    });
  },

  rotateVoxelBlock: (x, y, z, deltaDeg = 90) => {
    const { voxelBlocks } = get();
    const blockKey = `${x}_${y}_${z}`;
    const target = voxelBlocks[blockKey];
    if (!target) return;

    const currentRot = target.rotation_y ?? 0;
    const newRot = (((currentRot + deltaDeg) % 360) + 360) % 360;

    set({
      voxelBlocks: {
        ...voxelBlocks,
        [blockKey]: {
          ...target,
          rotation_y: newRot,
        },
      },
    });
  },

  updateVoxelBlockMaterial: (x, y, z, materialId) => {
    const { voxelBlocks, wallMaterialsLayer, width } = get();
    const blockKey = `${x}_${y}_${z}`;
    const target = voxelBlocks[blockKey];
    if (!target) return;

    const nextWallMat = [...wallMaterialsLayer];
    const idx = z * width + x;
    nextWallMat[idx] = materialId;

    set({
      voxelBlocks: {
        ...voxelBlocks,
        [blockKey]: {
          ...target,
          material_id: materialId,
        },
      },
      wallMaterialsLayer: nextWallMat,
    });
  },

  setMapMeta: (mapId, mapName) => set({ mapId, mapName }),

  setDimensions: (width, height, defaultFloorId = 6) =>
    set((state) => {
      const fillFloor = defaultFloorId ?? 6;
      const newGround = new Array(width * height).fill(fillFloor);
      const newCol = new Array(width * height).fill(0);
      const newWallMaterials = new Array(width * height).fill(0);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (x < state.width && y < state.height) {
            const oldIdx = y * state.width + x;
            const newIdx = y * width + x;
            newGround[newIdx] = state.groundLayer[oldIdx] ?? fillFloor;
            newCol[newIdx] = state.collisionLayer[oldIdx] ?? 0;
            newWallMaterials[newIdx] = state.wallMaterialsLayer[oldIdx] ?? 0;
          }
        }
      }

      return {
        width,
        height,
        groundLayer: newGround,
        collisionLayer: newCol,
        wallMaterialsLayer: newWallMaterials,
        spawners: state.spawners.filter((s) => s.x < width && s.y < height),
        portals: state.portals.filter((p) => p.grid_x < width && p.grid_y < height),
        props: state.props.filter((p) => p.grid_x < width && p.grid_y < height),
      };
    }),

  setActiveTool: (tool) => {
    if (tool !== 'select') {
      set({ activeTool: tool, selectedEntity: null });
    } else {
      set({ activeTool: tool });
    }
  },
  setSelectedEntity: (selectedEntity) => set({ selectedEntity }),
  setDragPaintMode: (dragPaintMode) => set({ dragPaintMode }),
  setSelectedFloorType: (floorType) => set({ selectedFloorType: floorType }),
  setSelectedWallType: (wallType) => set({ selectedWallType: wallType }),
  setWallStackMode: (wallStackMode) => set({ wallStackMode }),
  setSelectedWallHeight: (selectedWallHeight) =>
    set({ selectedWallHeight: Math.max(1, Math.min(20, selectedWallHeight)) }),
  setSelectedSpawnerType: (type) => set({ selectedSpawnerType: type }),
  setSelectedPropPrefab: (prefab) => set({ selectedPropPrefab: prefab }),
  setSelectedPropRotation: (deg) => set({ selectedPropRotation: ((deg % 360) + 360) % 360 }),
  updatePropConfig: (propId, updates) => {
    const { props, selectedEntity } = get();
    const updatedProps = props.map((p) => (p.id === propId ? { ...p, ...updates } : p));
    const nextSelectedEntity =
      selectedEntity && selectedEntity.type === 'prop' && selectedEntity.data?.id === propId
        ? { ...selectedEntity, data: { ...selectedEntity.data, ...updates } }
        : selectedEntity;
    set({ props: updatedProps, selectedEntity: nextSelectedEntity });
  },
  rotateSelectedProp: (deltaDeg = 90, targetGridPos = null) => {
    const { props, selectedPropRotation, selectedEntity } = get();
    const resolvedPos = targetGridPos || (selectedEntity?.type === 'prop' ? { x: selectedEntity.x, y: selectedEntity.y } : null);
    const currentProp = resolvedPos
      ? props.find(
          (p) =>
            Math.round(p.grid_x) === Math.round(resolvedPos.x) &&
            Math.round(p.grid_y) === Math.round(resolvedPos.y)
        )
      : null;
    const baseRotation = currentProp ? currentProp.rotation_deg : selectedPropRotation;
    const newRotation = (((baseRotation + deltaDeg) % 360) + 360) % 360;

    if (resolvedPos && currentProp) {
      const updatedProps = props.map((p) =>
        Math.round(p.grid_x) === Math.round(resolvedPos.x) &&
        Math.round(p.grid_y) === Math.round(resolvedPos.y)
          ? { ...p, rotation_deg: newRotation }
          : p
      );
      set({
        props: updatedProps,
        selectedPropRotation: newRotation,
        selectedEntity:
          selectedEntity?.type === 'prop' &&
          selectedEntity.x === currentProp.grid_x &&
          selectedEntity.y === currentProp.grid_y
            ? { ...selectedEntity, data: { ...selectedEntity.data, rotation_deg: newRotation } }
            : selectedEntity,
      });
      return;
    }

    set({ selectedPropRotation: newRotation });
  },
  setPortalConfig: (portalTargetMapId, portalLabel) => set({ portalTargetMapId, portalLabel }),
  setEnvironmentTheme: (environmentTheme) => set({ environmentTheme }),

  paintTile: (x, y) => {
    const {
      width,
      height,
      activeTool,
      selectedFloorType,
      selectedWallType,
      wallStackMode,
      selectedWallHeight,
      groundLayer,
      collisionLayer,
      wallMaterialsLayer,
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
    if (activeTool === 'select') return;
    const idx = y * width + x;

    if (activeTool === 'floor') {
      const newGround = [...groundLayer];
      newGround[idx] = selectedFloorType;
      const newCol = [...collisionLayer];
      newCol[idx] = 0; // Painting floor clears block stack on that tile
      const newWallMaterials = [...wallMaterialsLayer];
      newWallMaterials[idx] = 0;

      // Bersihkan juga voxelBlocks pada kolom x, y
      const { voxelBlocks } = get();
      const nextVoxelBlocks = { ...voxelBlocks };
      for (let checkY = 0; checkY < 20; checkY++) {
        delete nextVoxelBlocks[`${x}_${checkY}_${y}`];
      }

      set({
        groundLayer: newGround,
        collisionLayer: newCol,
        wallMaterialsLayer: newWallMaterials,
        voxelBlocks: nextVoxelBlocks,
      });
    } else if (activeTool === 'wall') {
      const newCol = [...collisionLayer];
      const newWallMaterials = [...wallMaterialsLayer];
      const currentHeight = newCol[idx] ?? 0;
      let targetHeight = 1;

      if (wallStackMode === 'increment') {
        // Stack block higher (+1 per cell per stroke, capped at 20)
        targetHeight = Math.min(20, currentHeight + 1);
        newCol[idx] = targetHeight;
      } else {
        targetHeight = Math.min(20, Math.max(1, selectedWallHeight));
        newCol[idx] = targetHeight;
      }
      newWallMaterials[idx] = selectedWallType;

      // Sinkronkan ke voxelBlocks
      const { voxelBlocks } = get();
      const nextVoxelBlocks = { ...voxelBlocks };
      for (let lvl = 0; lvl < targetHeight; lvl++) {
        const k = `${x}_${lvl}_${y}`;
        if (!nextVoxelBlocks[k]) {
          nextVoxelBlocks[k] = {
            id: k,
            x,
            y: lvl,
            z: y,
            material_id: selectedWallType,
            rotation_y: 0,
          };
        } else {
          nextVoxelBlocks[k].material_id = selectedWallType;
        }
      }

      // Ensure there is a ground tile under stacked blocks
      const newGround = [...groundLayer];
      if ((newGround[idx] ?? 0) === 0) {
        newGround[idx] = 1;
      }
      set({
        collisionLayer: newCol,
        groundLayer: newGround,
        wallMaterialsLayer: newWallMaterials,
        voxelBlocks: nextVoxelBlocks,
      });
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
      const allPropsMeta = [...get().customProps, ...PROP_PREFABS];
      const targetMeta = allPropsMeta.find((p) => p.id === selectedPropPrefab);
      const propW = targetMeta?.tileWidth || 1;
      const propD = targetMeta?.tileDepth || 1;
      const scaleMult = targetMeta?.scaleMultiplier || 1.0;

      // Filter out props that overlap with this placement's footprint
      const filtered = props.filter((p) => {
        const otherMeta = allPropsMeta.find((meta) => meta.id === p.prefab_id);
        const otherW = p.tile_width ?? otherMeta?.tileWidth ?? 1;
        const otherD = p.tile_depth ?? otherMeta?.tileDepth ?? 1;

        const overlaps =
          x < p.grid_x + otherW &&
          x + propW > p.grid_x &&
          y < p.grid_y + otherD &&
          y + propD > p.grid_y;

        return !overlaps;
      });

      set({
        props: [
          ...filtered,
          {
            id: `prop_${Date.now()}_${Math.random()}`,
            prefab_id: selectedPropPrefab,
            grid_x: x,
            grid_y: y,
            rotation_deg: selectedPropRotation,
            tile_width: propW,
            tile_depth: propD,
            scale_multiplier: scaleMult,
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
      selectedWallType,
      wallStackMode,
      selectedWallHeight,
      groundLayer,
      collisionLayer,
      wallMaterialsLayer,
      spawners,
      portals,
      props,
      selectedSpawnerType,
      selectedPropPrefab,
      selectedPropRotation,
      portalTargetMapId,
      portalLabel,
    } = get();

    if (activeTool === 'select') return;

    const minX = Math.max(0, Math.min(x1, x2));
    const maxX = Math.min(width - 1, Math.max(x1, x2));
    const minY = Math.max(0, Math.min(y1, y2));
    const maxY = Math.min(height - 1, Math.max(y1, y2));

    const newGround = [...groundLayer];
    const newCol = [...collisionLayer];
    const newWallMaterials = [...wallMaterialsLayer];
    let newSpawners = [...spawners];
    let newPortals = [...portals];
    let newProps = [...props];

    const inRegion = (cx: number, cy: number) =>
      cx >= minX && cx <= maxX && cy >= minY && cy <= maxY;

    if (activeTool === 'eraser') {
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const idx = y * width + x;
          newCol[idx] = 0;
          newWallMaterials[idx] = 0;
        }
      }
      newSpawners = newSpawners.filter((s) => !inRegion(s.x, s.y));
      newPortals = newPortals.filter((p) => !inRegion(Math.round(p.grid_x), Math.round(p.grid_y)));
      newProps = newProps.filter((pr) => !inRegion(pr.grid_x, pr.grid_y));
      set({
        collisionLayer: newCol,
        wallMaterialsLayer: newWallMaterials,
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
          newWallMaterials[idx] = 0;
        }
      }
      set({ groundLayer: newGround, collisionLayer: newCol, wallMaterialsLayer: newWallMaterials });
      return;
    }

    if (activeTool === 'wall') {
      const { voxelBlocks } = get();
      const nextVoxelBlocks = { ...voxelBlocks };
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const idx = y * width + x;
          const current = newCol[idx] ?? 0;
          let targetHeight = 1;
          if (isShiftKey) {
            targetHeight = Math.max(0, current - 1);
            newCol[idx] = targetHeight;
            if (targetHeight === 0) {
              newWallMaterials[idx] = 0;
            }
            delete nextVoxelBlocks[`${x}_${targetHeight}_${y}`];
          } else if (wallStackMode === 'increment') {
            targetHeight = Math.min(20, current + 1);
            newCol[idx] = targetHeight;
            newWallMaterials[idx] = selectedWallType;
          } else {
            targetHeight = Math.min(20, Math.max(1, selectedWallHeight));
            newCol[idx] = targetHeight;
            newWallMaterials[idx] = selectedWallType;
          }

          if (!isShiftKey) {
            for (let lvl = 0; lvl < targetHeight; lvl++) {
              const k = `${x}_${lvl}_${y}`;
              nextVoxelBlocks[k] = {
                id: k,
                x,
                y: lvl,
                z: y,
                material_id: selectedWallType,
                rotation_y: 0,
              };
            }
          }

          if ((newGround[idx] ?? 0) === 0 && (newCol[idx] ?? 0) > 0) {
            newGround[idx] = 1;
          }
        }
      }
      set({
        collisionLayer: newCol,
        groundLayer: newGround,
        wallMaterialsLayer: newWallMaterials,
        voxelBlocks: nextVoxelBlocks,
      });
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
    const { width, height, collisionLayer, wallMaterialsLayer } = get();
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = y * width + x;
    const current = collisionLayer[idx] ?? 0;
    if (current > 0) {
      const newCol = [...collisionLayer];
      const newWallMaterials = [...wallMaterialsLayer];
      newCol[idx] = current - 1;
      if (newCol[idx] === 0) {
        newWallMaterials[idx] = 0;
      }
      set({ collisionLayer: newCol, wallMaterialsLayer: newWallMaterials });
    }
  },

  eraseAt: (x, y) => {
    const { width, height, collisionLayer, wallMaterialsLayer, spawners, portals, props, customProps } = get();
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = y * width + x;

    const newCol = [...collisionLayer];
    const newWallMaterials = [...wallMaterialsLayer];
    newCol[idx] = 0;
    newWallMaterials[idx] = 0;

    const allPropsMeta = [...customProps, ...PROP_PREFABS];

    set({
      collisionLayer: newCol,
      wallMaterialsLayer: newWallMaterials,
      spawners: spawners.filter((s) => !(s.x === x && s.y === y)),
      portals: portals.filter((p) => !(Math.round(p.grid_x) === x && Math.round(p.grid_y) === y)),
      props: props.filter((p) => {
        const meta = allPropsMeta.find((m) => m.id === p.prefab_id);
        const w = p.tile_width ?? meta?.tileWidth ?? 1;
        const d = p.tile_depth ?? meta?.tileDepth ?? 1;
        const inside = x >= p.grid_x && x < p.grid_x + w && y >= p.grid_y && y < p.grid_y + d;
        return !inside;
      }),
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
      wallMaterialsLayer: preset.wallMaterialsLayer,
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
    const rawWallMaterials = data.layers?.wall_materials;
    const wallMaterialsLayer = new Array(width * height).fill(0);

    for (let i = 0; i < width * height; i++) {
      if (rawWallMaterials && rawWallMaterials[i] != null && rawWallMaterials[i] > 0) {
        wallMaterialsLayer[i] = rawWallMaterials[i];
      } else if ((collisionLayer[i] ?? 0) > 0) {
        // Fallback for legacy maps where wall_materials wasn't saved: default to 2 (Cobblestone)
        wallMaterialsLayer[i] = 2;
      }
    }

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

    // Inisialisasi atau migrasi voxel_blocks
    const voxelBlocks: Record<string, VoxelBlockData> = {};
    if (data.voxel_blocks && Array.isArray(data.voxel_blocks)) {
      for (const vb of data.voxel_blocks) {
        voxelBlocks[`${vb.x}_${vb.y}_${vb.z}`] = vb;
      }
    } else {
      // Auto-migrate dari collisionLayer 2.5D
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          const colHeight = collisionLayer[idx] ?? 0;
          const matId = wallMaterialsLayer[idx] ?? 2;
          for (let lvl = 0; lvl < colHeight; lvl++) {
            const k = `${x}_${lvl}_${y}`;
            voxelBlocks[k] = {
              id: k,
              x,
              y: lvl,
              z: y,
              material_id: matId,
              rotation_y: 0,
            };
          }
        }
      }
    }

    set({
      mapId: data.map_id || 'imported_map',
      mapName: data.name || 'Unnamed Realm',
      width,
      height,
      groundLayer,
      collisionLayer,
      wallMaterialsLayer,
      voxelBlocks,
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
      max_height: 20,
      layers: {
        ground: state.groundLayer,
        collision: state.collisionLayer,
        wall_materials: state.wallMaterialsLayer,
      },
      voxel_blocks: Object.values(state.voxelBlocks),
      spawners: state.spawners.map((s) => ({ type: s.type, x: s.x, y: s.y })),
      portals: state.portals.map((p) => ({
        grid_x: p.grid_x,
        grid_y: p.grid_y,
        target_map_id: p.target_map_id,
        label: p.label,
      })),
      props: state.props.map((pr) => ({
        id: pr.id,
        prefab_id: pr.prefab_id,
        grid_x: pr.grid_x,
        grid_y: pr.grid_y,
        grid_z: pr.grid_z ?? 0,
        snap_face: pr.snap_face ?? 'top',
        rotation_deg: pr.rotation_deg,
        tile_width: pr.tile_width,
        tile_depth: pr.tile_depth,
        scale_multiplier: pr.scale_multiplier,
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
      wallMaterialsLayer: preset.wallMaterialsLayer,
      spawners: preset.spawners,
      portals: preset.portals,
      props: preset.props,
      environmentTheme: preset.environmentTheme,
    });
  },
}));
