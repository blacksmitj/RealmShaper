import { useState, useEffect } from 'react';
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import { EditorLayout, type EditorMode } from './components/editor/EditorLayout';
import type { DashboardTab } from './components/layout/StudioSidebar';

export function App() {
  const [currentTab, setCurrentTab] = useState<DashboardTab>('overview');
  const [editorMode, setEditorMode] = useState<EditorMode | null>(null);

  // Sinkronisasi sederhana dengan Hash URL browser (memudahkan bookmark & refresh)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('/editor/')) {
        const mode = hash.split('/')[2] as EditorMode;
        if (['map', 'stats', 'quest'].includes(mode)) {
          setEditorMode(mode);
          return;
        }
      }
      setEditorMode(null);
      if (['overview', 'maps', 'monsters', 'quests', 'equipment'].includes(hash)) {
        setCurrentTab(hash as DashboardTab);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectTab = (tab: DashboardTab) => {
    setCurrentTab(tab);
    window.location.hash = tab;
  };

  const handleOpenEditor = (mode: EditorMode) => {
    setEditorMode(mode);
    window.location.hash = `/editor/${mode}`;
  };

  const handleExitEditor = () => {
    setEditorMode(null);
    window.location.hash = currentTab;
  };

  if (editorMode) {
    return <EditorLayout mode={editorMode} onExit={handleExitEditor} />;
  }

  return (
    <DashboardLayout
      currentTab={currentTab}
      onSelectTab={handleSelectTab}
      onOpenMapEditor={() => handleOpenEditor('map')}
      onOpenStatEditor={() => handleOpenEditor('stats')}
      onOpenQuestEditor={() => handleOpenEditor('quest')}
    />
  );
}

export default App;
