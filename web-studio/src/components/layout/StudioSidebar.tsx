import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Map,
  Skull,
  GitBranch,
  Swords,
  Box,
  Compass,
  Sparkles,
} from 'lucide-react';

export type DashboardTab = 'overview' | 'maps' | 'monsters' | 'quests' | 'equipment';

interface StudioSidebarProps {
  currentTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  onOpenMapEditor: () => void;
  onOpenStatEditor: () => void;
  onOpenQuestEditor: () => void;
}

export const StudioSidebar: React.FC<StudioSidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenMapEditor,
  onOpenStatEditor,
  onOpenQuestEditor,
}) => {
  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      {/* Header: Project Brand & Switcher */}
      <SidebarHeader className="border-b border-border p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black text-sm">
                RS
              </div>
              <div className="grid flex-1 text-left text-xs leading-tight">
                <span className="truncate font-bold tracking-wider font-mono text-foreground">
                  REALMSHAPER
                </span>
                <span className="truncate text-[10px] text-muted-foreground font-mono">
                  CREATOR STUDIO
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation Group */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase">
            Workstation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Overview */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentTab === 'overview'}
                  tooltip="Dashboard Umum"
                  onClick={() => onSelectTab('overview')}
                >
                  <LayoutDashboard className="size-4" />
                  <span>Dashboard Umum</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* 1. List Map */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentTab === 'maps'}
                  tooltip="List 3D Maps"
                  onClick={() => onSelectTab('maps')}
                >
                  <Map className="size-4" />
                  <span>List 3D Maps</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* 2. List Stat Balancer / Monsters */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentTab === 'monsters'}
                  tooltip="List Stat Balancer (Monster)"
                  onClick={() => onSelectTab('monsters')}
                >
                  <Skull className="size-4" />
                  <span>List Stat Balancer</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* 3. Quest Graph List */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentTab === 'quests'}
                  tooltip="Quest Graph List"
                  onClick={() => onSelectTab('quests')}
                >
                  <GitBranch className="size-4" />
                  <span>Quest Graph List</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* 4. List Weapon & Armor */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentTab === 'equipment'}
                  tooltip="Weapon & Armor"
                  onClick={() => onSelectTab('equipment')}
                >
                  <Swords className="size-4" />
                  <span>Weapon & Armor</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Launch Direct Fullscreen Editors Group */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase">
            Direct 3D Editors
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Buka 3D Map Builder"
                  onClick={onOpenMapEditor}
                  className="text-primary hover:text-primary"
                >
                  <Box className="size-4" />
                  <span>3D Map Builder</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Buka Stat Studio"
                  onClick={onOpenStatEditor}
                  className="text-amber-500 hover:text-amber-400"
                >
                  <Compass className="size-4" />
                  <span>Stat Studio</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Buka Quest Canvas"
                  onClick={onOpenQuestEditor}
                  className="text-blue-500 hover:text-blue-400"
                >
                  <Sparkles className="size-4" />
                  <span>Quest Graph Studio</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer: User profile in sidebar-07 style */}
      <SidebarFooter className="border-t border-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="gap-2">
              <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xs">
                GA
              </div>
              <div className="grid flex-1 text-left text-xs leading-tight">
                <span className="truncate font-semibold text-foreground">GrandArchitect</span>
                <span className="truncate text-[10px] text-muted-foreground font-mono">
                  creator@realmshaper.io
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* Rail for collapsing to icon */}
      <SidebarRail />
    </Sidebar>
  );
};

