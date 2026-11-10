import React, { useRef, useState } from 'react';
import { useQuestStore } from '../stores/questStore';
import type { QuestNode, QuestNodeType } from '../types/quest.types';
import {
  MessageSquare,
  Swords,
  Gift,
  Play,
  Package,
} from 'lucide-react';

const NODE_WIDTH = 220;
const NODE_HEIGHT = 110;

export const QuestGraphCanvas: React.FC = () => {
  const {
    graph,
    selectedNodeId,
    selectNode,
    updateNodePosition,
    connectNodes,
  } = useQuestStore();

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [connectingFromId, setConnectingFromId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const getNodeIcon = (type: QuestNodeType) => {
    switch (type) {
      case 'start':
        return <Play className="w-3.5 h-3.5 text-success" />;
      case 'dialogue':
        return <MessageSquare className="w-3.5 h-3.5 text-primary" />;
      case 'kill_objective':
        return <Swords className="w-3.5 h-3.5 text-destructive" />;
      case 'deliver_item':
        return <Package className="w-3.5 h-3.5 text-warning" />;
      case 'reward':
        return <Gift className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  const handleMouseDownNode = (e: React.MouseEvent, node: QuestNode) => {
    if (connectingFromId) {
      connectNodes(connectingFromId, node.id);
      setConnectingFromId(null);
      return;
    }
    e.stopPropagation();
    selectNode(node.id);
    setDraggingId(node.id);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left - node.x,
        y: e.clientY - rect.top - node.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const newX = Math.max(20, Math.round(e.clientX - rect.left - dragOffset.x));
    const newY = Math.max(20, Math.round(e.clientY - rect.top - dragOffset.y));
    updateNodePosition(draggingId, newX, newY);
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  // Node position lookup map
  const nodeMap = new Map<string, QuestNode>();
  graph.nodes.forEach((n) => nodeMap.set(n.id, n));

  return (
    <div
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={() => {
        selectNode(null);
        setConnectingFromId(null);
      }}
      className="w-full h-full relative overflow-hidden bg-background select-none bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:24px_24px]"
    >
      {/* SVG Connection Lines */}
      <svg className="w-full h-full absolute inset-0 pointer-events-none z-0">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#06b6d4" />
          </marker>
        </defs>

        {graph.edges.map((edge) => {
          const from = nodeMap.get(edge.fromNodeId);
          const to = nodeMap.get(edge.toNodeId);
          if (!from || !to) return null;

          const startX = from.x + NODE_WIDTH;
          const startY = from.y + NODE_HEIGHT / 2;
          const endX = to.x;
          const endY = to.y + NODE_HEIGHT / 2;

          // Smooth Bezier Curve
          const dx = Math.abs(endX - startX) * 0.5;
          const pathD = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;

          return (
            <g key={edge.id}>
              <path
                d={pathD}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
                strokeDasharray="4 2"
                markerEnd="url(#arrowhead)"
                className="opacity-70 transition-all"
              />
              {edge.conditionLabel && (
                <text
                  x={(startX + endX) / 2}
                  y={(startY + endY) / 2 - 8}
                  fill="#94a3b8"
                  fontSize="11"
                  textAnchor="middle"
                  className="font-mono select-none"
                >
                  {edge.conditionLabel}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Render Node Cards */}
      {graph.nodes.map((node) => {
        const isSelected = selectedNodeId === node.id;
        const isConnecting = connectingFromId === node.id;

        return (
          <div
            key={node.id}
            onMouseDown={(e) => handleMouseDownNode(e, node)}
            style={{
              left: `${node.x}px`,
              top: `${node.y}px`,
              width: `${NODE_WIDTH}px`,
              height: `${NODE_HEIGHT}px`,
            }}
            className={`absolute z-10 rounded-xl p-3 cursor-grab active:cursor-grabbing transition-shadow flex flex-col justify-between ${
              isSelected
                ? 'bg-card border-2 border-primary shadow-xl shadow-primary/20'
                : 'bg-card/90 border border-border hover:border-border shadow-lg'
            }`}
          >
            {/* Node Card Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded bg-background border border-border">
                  {getNodeIcon(node.type)}
                </div>
                <span className="text-xs font-bold text-foreground truncate max-w-[120px]">
                  {node.title}
                </span>
              </div>
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                {node.type}
              </span>
            </div>

            {/* Node Card Body Preview */}
            <div className="text-[11px] text-muted-foreground truncate">
              {node.type === 'dialogue' && (
                <p className="italic text-foreground">"{node.data.text || 'Dialogue text'}"</p>
              )}
              {node.type === 'kill_objective' && (
                <p className="text-destructive">
                  Slay {node.data.requiredCount ?? 1}x {node.data.targetMonsterId}
                </p>
              )}
              {node.type === 'reward' && (
                <p className="text-warning">
                  +{node.data.expReward} EXP | +{node.data.goldReward} G
                </p>
              )}
              {node.type === 'start' && (
                <p className="text-success">NPC: {node.data.label}</p>
              )}
              {node.type === 'deliver_item' && (
                <p className="text-warning">To NPC: {node.data.targetNpcId}</p>
              )}
            </div>

            {/* Connect Handle Port */}
            <div className="flex justify-between items-center pt-1 border-t border-border">
              <span className="text-[9px] text-muted-foreground font-mono">Drag to move</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConnectingFromId(isConnecting ? null : node.id);
                }}
                className={`text-[10px] px-2 py-0.5 rounded font-medium transition ${
                  isConnecting
                    ? 'bg-primary text-primary-foreground font-bold animate-pulse'
                    : 'bg-muted text-primary hover:bg-accent'
                }`}
              >
                {isConnecting ? 'Select Target' : 'Connect ➔'}
              </button>
            </div>
          </div>
        );
      })}

      {/* Guide Helper Overlay */}
      <div className="absolute bottom-4 left-4 pointer-events-none bg-card/80 backdrop-blur border border-border rounded-lg p-2.5 text-xs text-foreground space-y-1">
        <p className="font-semibold text-primary">Node-based Quest Graph</p>
        <p>Drag card to rearrange | Click "Connect ➔" to link next stage</p>
        <p>Click card to inspect & modify dialog/objectives in panel</p>
      </div>
    </div>
  );
};

