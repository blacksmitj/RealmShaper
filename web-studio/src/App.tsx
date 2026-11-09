import { useState } from 'react';
import { MapCanvas } from './modules/map-builder/components/MapCanvas';
import { MapToolbar } from './modules/map-builder/components/MapToolbar';
import { StatBalancerView } from './modules/stat-alloc/components/StatBalancerView';
import { TextureCanvas } from './modules/tex-painter/components/TextureCanvas';
import { TextureToolbar } from './modules/tex-painter/components/TextureToolbar';
import { QuestGraphCanvas } from './modules/quest-editor/components/QuestGraphCanvas';
import { QuestToolbar } from './modules/quest-editor/components/QuestToolbar';
import { Map, Activity, Palette, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function App() {
  const [activeModule, setActiveModule] = useState<'map' | 'stats' | 'texture' | 'quest'>('map');

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans">
      {/* Top Studio Navigation Bar */}
      <header className="h-11 border-b border-slate-800 bg-slate-950 px-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold tracking-wider text-cyan-400 font-mono">
            REALMSHAPER // CREATOR STUDIO
          </span>
          <div className="h-4 w-px bg-slate-800" />
          <nav className="flex items-center gap-1">
            <Button
              variant={activeModule === 'map' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveModule('map')}
              className={`h-7 px-3 text-xs gap-1.5 ${
                activeModule === 'map'
                  ? 'bg-slate-800 text-cyan-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>3D Map Builder</span>
            </Button>
            <Button
              variant={activeModule === 'stats' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveModule('stats')}
              className={`h-7 px-3 text-xs gap-1.5 ${
                activeModule === 'stats'
                  ? 'bg-slate-800 text-cyan-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Stat Balancer</span>
            </Button>
            <Button
              variant={activeModule === 'texture' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveModule('texture')}
              className={`h-7 px-3 text-xs gap-1.5 ${
                activeModule === 'texture'
                  ? 'bg-slate-800 text-cyan-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>3D Material & Texture</span>
            </Button>
            <Button
              variant={activeModule === 'quest' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveModule('quest')}
              className={`h-7 px-3 text-xs gap-1.5 ${
                activeModule === 'quest'
                  ? 'bg-slate-800 text-cyan-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Quest Graph Editor</span>
            </Button>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 font-mono">
            All 4 Phases Complete (MVP Suite) | Desktop Browser Runtime
          </span>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {activeModule === 'map' && (
          <>
            <MapToolbar />
            <main className="flex-1 h-full relative">
              <MapCanvas />
            </main>
          </>
        )}

        {activeModule === 'stats' && (
          <main className="w-full h-full">
            <StatBalancerView />
          </main>
        )}

        {activeModule === 'texture' && (
          <>
            <TextureToolbar />
            <main className="flex-1 h-full relative">
              <TextureCanvas />
            </main>
          </>
        )}

        {activeModule === 'quest' && (
          <>
            <QuestToolbar />
            <main className="flex-1 h-full relative">
              <QuestGraphCanvas />
            </main>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
