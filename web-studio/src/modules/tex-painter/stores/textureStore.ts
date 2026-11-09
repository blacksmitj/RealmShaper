import { create } from 'zustand';
import { type TexturePreset, type MaterialConfig, DEFAULT_PRESET } from '../types/texture.types';

interface TexturePainterState {
  preset: TexturePreset;
  activeSlot: 'primary' | 'secondary' | 'accent';
  autoRotate: boolean;

  setTargetModel: (model: TexturePreset['targetModel']) => void;
  setName: (name: string) => void;
  setActiveSlot: (slot: 'primary' | 'secondary' | 'accent') => void;
  updateActiveMaterial: (updates: Partial<MaterialConfig>) => void;
  setAutoRotate: (rotate: boolean) => void;
  exportPresetJson: () => string;
  loadPresetJson: (json: any) => void;
  resetToDefault: () => void;
}

export const useTextureStore = create<TexturePainterState>((set, get) => ({
  preset: DEFAULT_PRESET,
  activeSlot: 'primary',
  autoRotate: true,

  setTargetModel: (model) =>
    set((state) => ({
      preset: { ...state.preset, targetModel: model },
    })),

  setName: (name) =>
    set((state) => ({
      preset: { ...state.preset, name },
    })),

  setActiveSlot: (slot) => set({ activeSlot: slot }),

  updateActiveMaterial: (updates) =>
    set((state) => {
      const slot = state.activeSlot;
      const currentSlotMat = state.preset.materialSlots[slot];
      return {
        preset: {
          ...state.preset,
          materialSlots: {
            ...state.preset.materialSlots,
            [slot]: { ...currentSlotMat, ...updates },
          },
        },
      };
    }),

  setAutoRotate: (autoRotate) => set({ autoRotate }),

  exportPresetJson: () => {
    return JSON.stringify(get().preset, null, 2);
  },

  loadPresetJson: (json) => {
    if (!json) return;
    set({
      preset: {
        id: json.id || `preset_${Date.now()}`,
        name: json.name || 'Unnamed Material',
        targetModel: json.targetModel || 'Knight',
        materialSlots: json.materialSlots || DEFAULT_PRESET.materialSlots,
        createdAt: json.createdAt || new Date().toISOString(),
      },
    });
  },

  resetToDefault: () => set({ preset: DEFAULT_PRESET }),
}));

