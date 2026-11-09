export type QuestNodeType = 'start' | 'dialogue' | 'kill_objective' | 'deliver_item' | 'reward';

export interface QuestNodeData {
  label: string;
  speaker?: string; // for dialogue
  text?: string; // for dialogue text
  targetMonsterId?: string; // for kill_objective
  requiredCount?: number; // for kill_objective
  targetNpcId?: string; // for deliver_item
  expReward?: number; // for reward
  goldReward?: number; // for reward
  itemRewardId?: string; // for reward
}

export interface QuestNode {
  id: string;
  type: QuestNodeType;
  title: string;
  x: number;
  y: number;
  data: QuestNodeData;
}

export interface QuestEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  conditionLabel?: string; // e.g. "On Accept", "On Quest Complete"
}

export interface QuestGraphData {
  questId: string;
  title: string;
  description: string;
  minLevel: number;
  nodes: QuestNode[];
  edges: QuestEdge[];
  createdAt: string;
}

export const DEFAULT_QUEST_GRAPH: QuestGraphData = {
  questId: 'quest_fallen_catacombs',
  title: 'Purification of the Catacombs',
  description: 'Bantu Priest Althea membasmi prajurit skeleton di Catacombs of the Fallen King.',
  minLevel: 3,
  nodes: [
    {
      id: 'node_start',
      type: 'start',
      title: 'Quest Initiate',
      x: 80,
      y: 180,
      data: {
        label: 'Priest Althea (Sanctuary Altar)',
      },
    },
    {
      id: 'node_dialogue_1',
      type: 'dialogue',
      title: 'Opening Dialogue',
      x: 360,
      y: 160,
      data: {
        label: 'Cry for Help',
        speaker: 'Priest Althea',
        text: 'Jiwa-jiwa prajurit di Catacombs terikat oleh kutukan kuno. Tolong hancurkan manifestasi mereka agar mereka bisa beristirahat dengan damai.',
      },
    },
    {
      id: 'node_kill_1',
      type: 'kill_objective',
      title: 'Combat Task',
      x: 680,
      y: 160,
      data: {
        label: 'Slay Skeletons',
        targetMonsterId: 'custom_skeleton_01',
        requiredCount: 5,
      },
    },
    {
      id: 'node_reward_1',
      type: 'reward',
      title: 'Claim Bounty',
      x: 980,
      y: 180,
      data: {
        label: 'Sanctuary Blessing',
        expReward: 350,
        goldReward: 120,
        itemRewardId: 'silver_necklace',
      },
    },
  ],
  edges: [
    { id: 'edge_1', fromNodeId: 'node_start', toNodeId: 'node_dialogue_1', conditionLabel: 'Interact' },
    { id: 'edge_2', fromNodeId: 'node_dialogue_1', toNodeId: 'node_kill_1', conditionLabel: 'Accept Quest' },
    { id: 'edge_3', fromNodeId: 'node_kill_1', toNodeId: 'node_reward_1', conditionLabel: '5/5 Defeated' },
  ],
  createdAt: new Date().toISOString(),
};

