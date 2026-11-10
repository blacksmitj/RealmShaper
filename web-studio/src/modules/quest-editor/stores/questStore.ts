import { create } from 'zustand';
import {
  type QuestGraphData,
  type QuestNode,
  type QuestNodeType,
  DEFAULT_QUEST_GRAPH,
} from '../types/quest.types';

export interface QuestListItem {
  id: string;
  questId: string;
  title: string;
  description: string;
  minLevel: number;
  nodeCount: number;
  edgeCount: number;
  graph: QuestGraphData;
  updatedAt: string;
}

const DEFAULT_QUEST_LIST: QuestListItem[] = [
  {
    id: 'quest_item_01',
    questId: 'quest_fallen_catacombs',
    title: 'Purification of the Catacombs',
    description: 'Bantu Priest Althea membasmi prajurit skeleton di Catacombs of the Fallen King.',
    minLevel: 3,
    nodeCount: DEFAULT_QUEST_GRAPH.nodes.length,
    edgeCount: DEFAULT_QUEST_GRAPH.edges.length,
    graph: DEFAULT_QUEST_GRAPH,
    updatedAt: '2026-11-10',
  },
  {
    id: 'quest_item_02',
    questId: 'quest_crypt_shadows',
    title: 'Shadows of the Crypt',
    description: 'Investigate the disturbance inside the ancient catacombs and slay the Awakened Lich.',
    minLevel: 8,
    nodeCount: 6,
    edgeCount: 5,
    graph: {
      ...DEFAULT_QUEST_GRAPH,
      questId: 'quest_crypt_shadows',
      title: 'Shadows of the Crypt',
      description: 'Investigate the disturbance inside the ancient catacombs and slay the Awakened Lich.',
      minLevel: 8,
    },
    updatedAt: '2026-11-09',
  },
];

interface QuestEditorState {
  graph: QuestGraphData;
  selectedNodeId: string | null;
  draggedNodeId: string | null;
  questsList: QuestListItem[];

  setMeta: (title: string, questId: string, description: string, minLevel: number) => void;
  selectNode: (id: string | null) => void;
  addNode: (type: QuestNodeType) => void;
  updateNodeData: (id: string, updates: Partial<QuestNode['data']>, title?: string) => void;
  updateNodePosition: (id: string, x: number, y: number) => void;
  deleteNode: (id: string) => void;
  connectNodes: (fromId: string, toId: string, label?: string) => void;
  deleteEdge: (id: string) => void;
  exportQuestJson: () => string;
  loadQuestJson: (json: any) => void;
  resetToDefault: () => void;

  // List management
  loadQuestById: (id: string) => void;
  saveCurrentQuestToList: () => void;
  deleteQuestFromList: (id: string) => void;
  createNewQuest: () => void;
}

export const useQuestStore = create<QuestEditorState>((set, get) => ({
  graph: DEFAULT_QUEST_GRAPH,
  selectedNodeId: 'node_dialogue_1',
  draggedNodeId: null,
  questsList: DEFAULT_QUEST_LIST,

  setMeta: (title, questId, description, minLevel) =>
    set((state) => ({
      graph: { ...state.graph, title, questId, description, minLevel },
    })),

  selectNode: (id) => set({ selectedNodeId: id }),

  addNode: (type) =>
    set((state) => {
      const id = `node_${Date.now()}`;
      const titles: Record<QuestNodeType, string> = {
        start: 'Quest NPC Start',
        dialogue: 'Dialogue Event',
        kill_objective: 'Combat Objective',
        deliver_item: 'Deliver Item',
        reward: 'Quest Reward',
      };

      const defaultData: Record<QuestNodeType, QuestNode['data']> = {
        start: { label: 'Talk to NPC', speaker: 'Priest Althea', text: 'Blessings traveler. The realm needs your blade.' },
        dialogue: { label: 'Story Dialogue', speaker: 'Priest Althea', text: 'Take this amulet, it will protect you.' },
        kill_objective: { label: 'Purge Monsters', targetMonsterId: 'skeleton_guard_01', requiredCount: 5 },
        deliver_item: { label: 'Deliver Relic', targetNpcId: 'npc_blacksmith' },
        reward: { label: 'Completion Reward', expReward: 500, goldReward: 150, itemRewardId: 'potion_health_large' },
      };

      const newNode: QuestNode = {
        id,
        type,
        title: titles[type],
        x: 300 + Math.random() * 80,
        y: 200 + Math.random() * 80,
        data: defaultData[type],
      };

      return {
        graph: {
          ...state.graph,
          nodes: [...state.graph.nodes, newNode],
        },
        selectedNodeId: id,
      };
    }),

  updateNodeData: (id, updates, title) =>
    set((state) => ({
      graph: {
        ...state.graph,
        nodes: state.graph.nodes.map((node) => {
          if (node.id === id) {
            return {
              ...node,
              title: title ?? node.title,
              data: { ...node.data, ...updates },
            };
          }
          return node;
        }),
      },
    })),

  updateNodePosition: (id, x, y) =>
    set((state) => ({
      graph: {
        ...state.graph,
        nodes: state.graph.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)),
      },
    })),

  deleteNode: (id) =>
    set((state) => ({
      graph: {
        ...state.graph,
        nodes: state.graph.nodes.filter((n) => n.id !== id),
        edges: state.graph.edges.filter((e) => e.fromNodeId !== id && e.toNodeId !== id),
      },
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
    })),

  connectNodes: (fromId, toId, label) =>
    set((state) => {
      if (fromId === toId) return state;
      const exists = state.graph.edges.some((e) => e.fromNodeId === fromId && e.toNodeId === toId);
      if (exists) return state;

      const newEdge = {
        id: `edge_${fromId}_${toId}`,
        fromNodeId: fromId,
        toNodeId: toId,
        conditionLabel: label,
      };

      return {
        graph: {
          ...state.graph,
          edges: [...state.graph.edges, newEdge],
        },
      };
    }),

  deleteEdge: (id) =>
    set((state) => ({
      graph: {
        ...state.graph,
        edges: state.graph.edges.filter((e) => e.id !== id),
      },
    })),

  exportQuestJson: () => {
    return JSON.stringify(get().graph, null, 2);
  },

  loadQuestJson: (json: any) => {
    if (json && json.nodes && json.edges) {
      set({ graph: json, selectedNodeId: null });
    }
  },

  resetToDefault: () => {
    set({ graph: DEFAULT_QUEST_GRAPH, selectedNodeId: null });
  },

  loadQuestById: (id: string) => {
    const item = get().questsList.find((q) => q.id === id);
    if (item) {
      set({ graph: item.graph, selectedNodeId: null });
    }
  },

  saveCurrentQuestToList: () => {
    const s = get();
    const existingIndex = s.questsList.findIndex((q) => q.questId === s.graph.questId);
    const updatedQuest: QuestListItem = {
      id: existingIndex >= 0 ? s.questsList[existingIndex].id : `quest_${Date.now().toString(36)}`,
      questId: s.graph.questId,
      title: s.graph.title,
      description: s.graph.description,
      minLevel: s.graph.minLevel,
      nodeCount: s.graph.nodes.length,
      edgeCount: s.graph.edges.length,
      graph: s.graph,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    if (existingIndex >= 0) {
      const updatedList = [...s.questsList];
      updatedList[existingIndex] = updatedQuest;
      set({ questsList: updatedList });
    } else {
      set({ questsList: [updatedQuest, ...s.questsList] });
    }
  },

  deleteQuestFromList: (id: string) => {
    set((state) => ({
      questsList: state.questsList.filter((q) => q.id !== id),
    }));
  },

  createNewQuest: () => {
    const newId = `quest_${Date.now().toString(36)}`;
    set({
      graph: {
        ...DEFAULT_QUEST_GRAPH,
        questId: newId,
        title: 'New Realm Questline',
        description: 'Describe the objective and narrative arc here.',
      },
      selectedNodeId: null,
    });
  },
}));
