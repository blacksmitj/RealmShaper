export interface MaterialConfig {
  colorTint: string; // Hex color (e.g. #3b82f6)
  roughness: number; // 0.0 - 1.0
  metalness: number; // 0.0 - 1.0
  emissiveColor: string; // Hex color (e.g. #000000)
  emissiveIntensity: number; // 0.0 - 2.0
}

export interface TexturePreset {
  id: string;
  name: string;
  targetModel: 'Knight' | 'Barbarian' | 'Rogue' | 'chest';
  materialSlots: {
    primary: MaterialConfig;
    secondary: MaterialConfig;
    accent: MaterialConfig;
  };
  createdAt: string;
}

export const DEFAULT_PRESET: TexturePreset = {
  id: 'preset_dark_knight',
  name: 'Abyssal Silver Knight',
  targetModel: 'Knight',
  materialSlots: {
    primary: {
      colorTint: '#475569',
      roughness: 0.35,
      metalness: 0.85,
      emissiveColor: '#000000',
      emissiveIntensity: 0.0,
    },
    secondary: {
      colorTint: '#0f172a',
      roughness: 0.8,
      metalness: 0.2,
      emissiveColor: '#000000',
      emissiveIntensity: 0.0,
    },
    accent: {
      colorTint: '#06b6d4',
      roughness: 0.2,
      metalness: 0.9,
      emissiveColor: '#0891b2',
      emissiveIntensity: 0.8,
    },
  },
  createdAt: new Date().toISOString(),
};

