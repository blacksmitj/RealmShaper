import React from 'react';
import { StudioSidebar, type DashboardTab } from '@/components/layout/StudioSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { GeneralOverview } from './GeneralOverview';
import { MapsListView } from '@/modules/map-builder/components/MapsListView';
import { MonsterListView } from '@/modules/stat-alloc/components/MonsterListView';
import { QuestListView } from '@/modules/quest-editor/components/QuestListView';
import { EquipmentListView } from './EquipmentListView';

interface DashboardLayoutProps {
  currentTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  onOpenMapEditor: (mapId?: string) => void;
  onOpenStatEditor: (monsterId?: string) => void;
  onOpenQuestEditor: (questId?: string) => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  currentTab,
  onSelectTab,
  onOpenMapEditor,
  onOpenStatEditor,
  onOpenQuestEditor,
}) => {
  const getTabTitle = (tab: DashboardTab) => {
    switch (tab) {
      case 'overview':
        return 'Dashboard Umum';
      case 'maps':
        return 'List 3D Maps';
      case 'monsters':
        return 'List Stat Balancer (Monster)';
      case 'quests':
        return 'Quest Graph List';
      case 'equipment':
        return 'Weapon & Armor';
      default:
        return 'Dashboard';
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        {/* Sidebar 07 (Collapses to icons) */}
        <StudioSidebar
          currentTab={currentTab}
          onSelectTab={onSelectTab}
          onOpenMapEditor={() => onOpenMapEditor()}
          onOpenStatEditor={() => onOpenStatEditor()}
          onOpenQuestEditor={() => onOpenQuestEditor()}
        />

        {/* Inset Main Content Area */}
        <SidebarInset className="flex flex-col flex-1 h-full min-w-0 overflow-hidden bg-background">
          {/* Top Header with Breadcrumbs & Sidebar Toggle */}
          <header className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4 transition-[width,height] ease-linear">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <span className="text-xs text-muted-foreground font-mono">
                      REALMSHAPER STUDIO
                    </span>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-xs font-semibold text-foreground">
                      {getTabTitle(currentTab)}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          {/* Body Content with Native Scrolling */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/10">
            <div className="max-w-7xl mx-auto">
              {currentTab === 'overview' && (
                <GeneralOverview
                  onNavigate={onSelectTab}
                  onOpenMapEditor={() => onOpenMapEditor()}
                  onOpenStatEditor={() => onOpenStatEditor()}
                  onOpenQuestEditor={() => onOpenQuestEditor()}
                />
              )}

              {currentTab === 'maps' && (
                <MapsListView onOpenMapEditor={(mapId) => onOpenMapEditor(mapId)} />
              )}

              {currentTab === 'monsters' && (
                <MonsterListView onOpenStatEditor={(monsterId) => onOpenStatEditor(monsterId)} />
              )}

              {currentTab === 'quests' && (
                <QuestListView onOpenQuestEditor={(questId) => onOpenQuestEditor(questId)} />
              )}

              {currentTab === 'equipment' && <EquipmentListView />}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

