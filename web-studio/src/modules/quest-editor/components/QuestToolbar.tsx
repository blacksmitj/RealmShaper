import React from 'react';
import {
  GitBranch,
  Plus,
  Trash2,
  Download,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useQuestStore } from '../stores/questStore';
import type { QuestNodeType } from '../types/quest.types';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

export const QuestToolbar: React.FC = () => {
  const {
    graph,
    selectedNodeId,
    setMeta,
    addNode,
    updateNodeData,
    deleteNode,
    exportQuestJson,
    resetToDefault,
  } = useQuestStore();

  const selectedNode = graph.nodes.find((n) => n.id === selectedNodeId);

  const handleExport = () => {
    const jsonStr = exportQuestJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${graph.questId}_tree.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const nodeTemplates: Array<{ type: QuestNodeType; label: string }> = [
    { type: 'dialogue', label: '+ Dialogue Line' },
    { type: 'kill_objective', label: '+ Kill Monster Target' },
    { type: 'deliver_item', label: '+ Deliver Item' },
    { type: 'reward', label: '+ Claim Reward' },
  ];

  return (
    <aside className="w-84 bg-card/95 border-r border-border flex flex-col h-full z-10 select-none shadow-2xl backdrop-blur">
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary">
              <GitBranch className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-xs tracking-wider text-foreground uppercase">
                Quest Graph Editor
              </h1>
              <p className="text-[10px] text-muted-foreground">Node-based Visual Story Builder</p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono border border-primary/20">
            Phase 4
          </span>
        </div>
      </div>

      {/* Quest Metadata */}
      <div className="p-4 border-b border-border space-y-3 bg-muted/20">
        <div>
          <label className="text-[11px] font-medium text-muted-foreground block mb-1">
            Quest ID (Identifier)
          </label>
          <input
            type="text"
            value={graph.questId}
            onChange={(e) => setMeta(graph.title, e.target.value, graph.description, graph.minLevel)}
            className="w-full bg-muted/40 border border-border rounded px-2.5 py-1.5 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div>
          <label className="text-[11px] font-medium text-muted-foreground block mb-1">
            Quest Title
          </label>
          <input
            type="text"
            value={graph.title}
            onChange={(e) => setMeta(e.target.value, graph.questId, graph.description, graph.minLevel)}
            className="w-full bg-muted/40 border border-border rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Min Level Slider */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Required Level</span>
            <span className="font-mono text-primary font-bold">Lv. {graph.minLevel}</span>
          </div>
          <Slider
            value={[graph.minLevel]}
            min={1}
            max={50}
            step={1}
            onValueChange={(val) => {
              const lv = Array.isArray(val) ? val[0] : val;
              if (typeof lv === 'number') setMeta(graph.title, graph.questId, graph.description, lv);
            }}
          />
        </div>
      </div>

      {/* Node Inspector or Palette */}
      <div className="p-4 border-b border-border flex-1 overflow-y-auto space-y-4">
        {selectedNode ? (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Node Inspector
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteNode(selectedNode.id)}
                className="h-6 px-2 text-destructive hover:text-destructive hover:bg-destructive/10 text-[10px] gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </Button>
            </div>

            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">Stage Title</label>
              <input
                type="text"
                value={selectedNode.title}
                onChange={(e) => updateNodeData(selectedNode.id, {}, e.target.value)}
                className="w-full bg-muted/40 border border-border rounded px-2.5 py-1.5 text-xs text-foreground"
              />
            </div>

            {selectedNode.type === 'dialogue' && (
              <>
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">Speaker NPC</label>
                  <input
                    type="text"
                    value={selectedNode.data.speaker || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { speaker: e.target.value })}
                    className="w-full bg-muted/40 border border-border rounded px-2.5 py-1.5 text-xs text-foreground"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">Dialogue Script</label>
                  <textarea
                    rows={4}
                    value={selectedNode.data.text || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { text: e.target.value })}
                    className="w-full bg-muted/40 border border-border rounded p-2 text-xs text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </>
            )}

            {selectedNode.type === 'kill_objective' && (
              <>
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">Target Monster ID</label>
                  <input
                    type="text"
                    value={selectedNode.data.targetMonsterId || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { targetMonsterId: e.target.value })}
                    placeholder="e.g. custom_skeleton_01"
                    className="w-full bg-muted/40 border border-border rounded px-2.5 py-1.5 text-xs text-foreground font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">Required Kill Count</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={selectedNode.data.requiredCount || 1}
                    onChange={(e) => updateNodeData(selectedNode.id, { requiredCount: parseInt(e.target.value) || 1 })}
                    className="w-full bg-muted/40 border border-border rounded px-2.5 py-1.5 text-xs text-foreground font-mono"
                  />
                </div>
              </>
            )}

            {selectedNode.type === 'reward' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-1">EXP Bounty</label>
                    <input
                      type="number"
                      value={selectedNode.data.expReward || 0}
                      onChange={(e) => updateNodeData(selectedNode.id, { expReward: parseInt(e.target.value) || 0 })}
                      className="w-full bg-muted/40 border border-border rounded px-2.5 py-1.5 text-xs text-foreground font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-1">Gold Reward</label>
                    <input
                      type="number"
                      value={selectedNode.data.goldReward || 0}
                      onChange={(e) => updateNodeData(selectedNode.id, { goldReward: parseInt(e.target.value) || 0 })}
                      className="w-full bg-muted/40 border border-border rounded px-2.5 py-1.5 text-xs text-foreground font-mono"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase block">
              Add Graph Stage
            </label>
            <div className="grid grid-cols-1 gap-2">
              {nodeTemplates.map((t) => (
                <button
                  key={t.type}
                  onClick={() => addNode(t.type)}
                  className="p-2.5 rounded-lg bg-muted/40 border border-border text-left hover:border-primary/40 hover:bg-muted text-xs text-foreground font-medium transition flex items-center justify-between group"
                >
                  <span>{t.label}</span>
                  <Plus className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground italic pt-2">
              Klik kartu node di canvas untuk melihat dan mengubah dialog atau objective.
            </p>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-border space-y-2 bg-muted/40/30">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefault}
            className="bg-muted/40 border-border hover:bg-muted text-foreground text-xs gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Tree</span>
          </Button>
          <Button
            size="sm"
            onClick={handleExport}
            className="bg-primary hover:bg-primary/90 text-white text-xs gap-1.5 shadow-md shadow-primary/20 font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Quest</span>
          </Button>
        </div>
      </div>
    </aside>
  );
};

