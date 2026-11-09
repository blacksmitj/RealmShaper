import { create } from 'zustand';
import {
  type QuestGraphData,
  type QuestNode,
  type QuestNodeType,
  type QuestEdge,
  DEFAULT_QUEST_GRAPH,
} from '../types/quest.types';

interface QuestEditorState {
  graph: QuestGraphData;
  selectedNodeId: string | null;
  draggedNodeId: string | null;

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
}

export const useQuestStore = create<QuestEditorState>((set, get) => ({
  graph: DEFAULT_QUEST_GRAPH,
  selectedNodeId: 'node_dialogue_1',
  draggedNodeId: null,

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
        start: { label: 'Quest Giver NPC' },
        dialogue: { label: 'Dialogue Line', speaker: 'NPC Name', text: 'Tulis dialog cerita di sini...' },
        kill_objective: { label: 'Eliminate Mob', targetMonsterId: 'dummy', requiredCount: 3 },
        deliver_item: { label: 'Deliver Relic', targetNpcId: 'blacksmith' },
        reward: { label: 'Victory Bounty', expReward: 200, goldReward: 50 },
      };

      // Calculate safe spawn position offset
      const x = 200 + (state.graph.nodes.length % 5) * 80;
      const y = 150 + (state.graph.nodes.length % 4) * 60;

      const newNode: QuestNode = {
        id,
        type,
        title: titles[type],
        x,
        y,
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

      const newEdge: QuestEdge = {
        id: `edge_${Date.now()}`,
        fromNodeId: fromId,
        toNodeId: toId,
        conditionLabel: label || 'Next Step',
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

  loadQuestJson: (json) => {
    if (!json) return;
    set({
      graph: {
        questId: json.questId || 'imported_quest',
        title: json.title || 'Custom Quest',
        description: json.description || '',
        minLevel: json.minLevel || 1,
        nodes: json.nodes || DEFAULT_QUEST_GRAPH.nodes,
        edges: json.edges || DEFAULT_QUEST_GRAPH.edges,
        createdAt: json.createdAt || new Date().toISOString(),
      },
    });
  },

  resetToDefault: () => set({ graph: DEFAULT_QUEST_GRAPH, selectedNodeId: 'node_dialogue_1' }),
}));

