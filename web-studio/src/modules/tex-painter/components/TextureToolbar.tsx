import React from 'react';
import {
  Palette,
  Download,
  RotateCcw,
  Eye,
  Sun,
  Shield,
  Flame,
} from 'lucide-react';
import { useTextureStore } from '../stores/textureStore';
import type { TexturePreset } from '../types/texture.types';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const TextureToolbar: React.FC = () => {
  const {
    preset,
    activeSlot,
    autoRotate,
    setName,
    setTargetModel,
    setActiveSlot,
    updateActiveMaterial,
    setAutoRotate,
    exportPresetJson,
    resetToDefault,
  } = useTextureStore();

  const currentMat = preset.materialSlots[activeSlot];

  const handleExport = () => {
    const jsonStr = exportPresetJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${preset.id}_material.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const presetPalettes = [
    { name: 'Obsidian Knight', primary: '#1e293b', roughness: 0.3, metalness: 0.9, glow: '#06b6d4' },
    { name: 'Bloodforged Gold', primary: '#7f1d1d', roughness: 0.4, metalness: 0.8, glow: '#f59e0b' },
    { name: 'Emerald Sentinel', primary: '#064e3b', roughness: 0.5, metalness: 0.6, glow: '#10b981' },
    { name: 'Royal Platinum', primary: '#e2e8f0', roughness: 0.2, metalness: 0.95, glow: '#38bdf8' },
  ];

  return (
    <aside className="w-84 bg-slate-950/95 border-r border-slate-800 flex flex-col h-full z-10 select-none shadow-2xl backdrop-blur">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-xs tracking-wider text-slate-100 uppercase">
                Texture Painter
              </h1>
              <p className="text-[10px] text-slate-400">3D Material & Palette Customizer</p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 font-mono border border-cyan-800/50">
            Phase 3
          </span>
        </div>
      </div>

      {/* Target Model Selection */}
      <div className="p-4 border-b border-slate-800/80 space-y-3.5 bg-slate-900/20">
        <div>
          <label className="text-[11px] font-medium text-slate-400 block mb-1">
            Preset Name
          </label>
          <input
            type="text"
            value={preset.name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        <div>
          <label className="text-[11px] font-medium text-slate-400 block mb-1">
            3D Rigged Model Target
          </label>
          <Select
            value={preset.targetModel}
            onValueChange={(val) => {
              if (val) setTargetModel(val as TexturePreset['targetModel']);
            }}
          >
            <SelectTrigger className="w-full bg-slate-900 border-slate-800 text-xs text-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-950 border-slate-800 text-slate-200 text-xs">
              <SelectItem value="Knight">KayKit Knight (Armor)</SelectItem>
              <SelectItem value="Barbarian">KayKit Barbarian</SelectItem>
              <SelectItem value="Rogue">KayKit Rogue</SelectItem>
              <SelectItem value="chest">Dungeon Chest (Prop)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Material Slot Tabs */}
      <div className="p-4 border-b border-slate-800/80 flex-1 overflow-y-auto space-y-4">
        <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
          Material Layers
        </label>

        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-800">
          {(['primary', 'secondary', 'accent'] as const).map((slot) => (
            <button
              key={slot}
              onClick={() => setActiveSlot(slot)}
              className={`py-1.5 rounded text-xs capitalize font-medium transition-all ${
                activeSlot === slot
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {slot}
            </button>
          ))}
        </div>

        {/* Color Picker & Properties */}
        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-cyan-400" /> Color Tint
            </span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={currentMat.colorTint}
                onChange={(e) => updateActiveMaterial({ colorTint: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
              />
              <span className="text-xs font-mono text-slate-400 uppercase">
                {currentMat.colorTint}
              </span>
            </div>
          </div>

          {/* Roughness Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Sun className="w-3 h-3 text-slate-500" /> Roughness
              </span>
              <span className="font-mono text-cyan-400 font-semibold">
                {Math.round(currentMat.roughness * 100)}%
              </span>
            </div>
            <Slider
              value={[currentMat.roughness]}
              min={0.0}
              max={1.0}
              step={0.05}
              onValueChange={(val) => {
                const v = Array.isArray(val) ? val[0] : val;
                if (typeof v === 'number') updateActiveMaterial({ roughness: v });
              }}
            />
          </div>

          {/* Metalness Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Shield className="w-3 h-3 text-slate-500" /> Metalness
              </span>
              <span className="font-mono text-cyan-400 font-semibold">
                {Math.round(currentMat.metalness * 100)}%
              </span>
            </div>
            <Slider
              value={[currentMat.metalness]}
              min={0.0}
              max={1.0}
              step={0.05}
              onValueChange={(val) => {
                const v = Array.isArray(val) ? val[0] : val;
                if (typeof v === 'number') updateActiveMaterial({ metalness: v });
              }}
            />
          </div>

          {/* Emissive Glow */}
          <div className="space-y-1.5 pt-1 border-t border-slate-800/60">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-500" /> Emissive Glow
              </span>
              <input
                type="color"
                value={currentMat.emissiveColor}
                onChange={(e) => updateActiveMaterial({ emissiveColor: e.target.value })}
                className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
              />
            </div>
            <Slider
              value={[currentMat.emissiveIntensity]}
              min={0.0}
              max={2.0}
              step={0.1}
              onValueChange={(val) => {
                const v = Array.isArray(val) ? val[0] : val;
                if (typeof v === 'number') updateActiveMaterial({ emissiveIntensity: v });
              }}
            />
          </div>
        </div>

        {/* Quick Style Presets */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
            Quick Palettes
          </label>
          <div className="grid grid-cols-2 gap-2">
            {presetPalettes.map((p) => (
              <button
                key={p.name}
                onClick={() =>
                  updateActiveMaterial({
                    colorTint: p.primary,
                    roughness: p.roughness,
                    metalness: p.metalness,
                    emissiveColor: p.glow,
                    emissiveIntensity: 0.8,
                  })
                }
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-left hover:border-cyan-500/40 transition group"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-slate-700"
                    style={{ backgroundColor: p.primary }}
                  />
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: p.glow }}
                  />
                </div>
                <span className="text-[10px] font-medium text-slate-300 block truncate group-hover:text-cyan-300">
                  {p.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-800/80 space-y-2.5 bg-slate-900/30">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAutoRotate(!autoRotate)}
          className={`w-full text-xs gap-1.5 ${
            autoRotate ? 'border-cyan-500/40 text-cyan-300' : 'text-slate-400'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Auto Turntable: {autoRotate ? 'ON' : 'OFF'}</span>
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefault}
            className="bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300 text-xs gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Default</span>
          </Button>
          <Button
            size="sm"
            onClick={handleExport}
            className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs gap-1.5 shadow-md shadow-cyan-950 font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Material</span>
          </Button>
        </div>
      </div>
    </aside>
  );
};
