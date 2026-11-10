import React, { useState } from 'react';
import {
  Map,
  Plus,
  Copy,
  Trash2,
  Calendar,
  Grid,
  Loader2,
  ArrowRight,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import {
  useMapDrafts,
  useDeleteMapDraft,
  useSaveMapDraft,
} from '@/hooks/usePgcQueries';
import { fetchMapDraftDetail, type MapDraftSummary } from '@/lib/pgcService';
import { useMapStore } from '@/modules/map-builder/stores/mapStore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface MapDashboardProps {
  onOpenMapBuilder: () => void;
}

export const MapDashboard: React.FC<MapDashboardProps> = ({ onOpenMapBuilder }) => {
  const { data: drafts = [], isLoading, isFetching, refetch } = useMapDrafts();
  const deleteMutation = useDeleteMapDraft();
  const saveMutation = useSaveMapDraft();

  const resetMap = useMapStore((state) => state.resetMap);
  const loadFromMapData = useMapStore((state) => state.loadFromMapData);

  const [loadingDraftId, setLoadingDraftId] = useState<string | null>(null);
  const [draftToDelete, setDraftToDelete] = useState<MapDraftSummary | null>(null);

  // 1. Buat Peta Baru (Clean / Reset Canvas)
  const handleCreateNewMap = () => {
    resetMap();
    onOpenMapBuilder();
  };

  // 2. Buka / Edit Draft Peta
  const handleOpenDraft = async (draftSummary: MapDraftSummary) => {
    try {
      setLoadingDraftId(draftSummary.id);
      const detail = await fetchMapDraftDetail(draftSummary.id);
      if (detail && detail.map_data) {
        loadFromMapData(detail.map_data);
        onOpenMapBuilder();
      }
    } catch {
      alert('Gagal memuat detail draft peta dari server.');
    } finally {
      setLoadingDraftId(null);
    }
  };

  // 3. Duplikasi Draft
  const handleDuplicateDraft = async (draftSummary: MapDraftSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setLoadingDraftId(draftSummary.id);
      const detail = await fetchMapDraftDetail(draftSummary.id);
      if (detail && detail.map_data) {
        const newMapId = `${detail.map_id}_copy_${Math.floor(Math.random() * 1000)}`;
        const newMapName = `${detail.map_name} (Copy)`;
        const duplicatedData = {
          ...detail.map_data,
          map_id: newMapId,
          name: newMapName,
        };
        await saveMutation.mutateAsync({
          mapId: newMapId,
          mapName: newMapName,
          mapData: duplicatedData,
        });
      }
    } catch {
      alert('Gagal menduplikasi peta.');
    } finally {
      setLoadingDraftId(null);
    }
  };

  // 4. Konfirmasi & Hapus Draft
  const handleConfirmDelete = async () => {
    if (!draftToDelete) return;
    try {
      await deleteMutation.mutateAsync(draftToDelete.id);
    } catch {
      alert('Gagal menghapus draft peta.');
    } finally {
      setDraftToDelete(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      {/* Header Banner */}
      <div className="border-b border-border bg-card/40 px-8 py-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Map className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-foreground font-heading">
              Creator Hub & My Maps
            </h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Kelola, buka, atau buat level 3D modular baru untuk RealmShaper: Online.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8 text-xs bg-muted/30 border-border text-foreground hover:bg-muted"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? 'animate-spin text-primary' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={handleCreateNewMap}
            className="h-8 text-xs bg-primary hover:bg-primary/90 text-white font-medium gap-1.5 shadow-md shadow-primary/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Map</span>
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <ScrollArea className="flex-1 px-8 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[360px] text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <p className="text-xs">Memuat daftar draft peta dari database...</p>
          </div>
        ) : drafts.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[380px] border border-dashed border-border rounded-2xl bg-card/20 p-8 text-center max-w-xl mx-auto my-12">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
              <FolderOpen className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground font-heading mb-1">
              Belum Ada Peta yang Tersimpan
            </h3>
            <p className="text-xs text-muted-foreground mb-6 max-w-sm">
              Anda belum menyimpan draft peta apa pun ke database. Klik tombol di bawah untuk mulai mendesain peta 3D pertama Anda!
            </p>
            <Button
              size="sm"
              onClick={handleCreateNewMap}
              className="h-8.5 px-4 text-xs bg-primary hover:bg-primary/90 text-white font-medium gap-1.5 shadow-md shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Map</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-12">
            {drafts.map((draft) => {
              const isItemBusy = loadingDraftId === draft.id;
              const formattedDate = new Date(draft.updated_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <Card
                  key={draft.id}
                  className="group relative bg-card border-border hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 cursor-pointer flex flex-col justify-between"
                  onClick={() => handleOpenDraft(draft)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-sm font-semibold truncate text-foreground group-hover:text-primary transition-colors">
                          {draft.map_name || 'Untitled Map'}
                        </CardTitle>
                        <CardDescription className="text-[11px] font-mono text-muted-foreground truncate">
                          ID: {draft.map_id}
                        </CardDescription>
                      </div>

                      <Badge
                        variant="secondary"
                        className="text-[10px] font-mono uppercase bg-primary/10 text-primary border-primary/20"
                      >
                        {draft.theme || 'dungeon'}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pb-3 space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Grid className="w-3.5 h-3.5 text-muted-foreground/80" />
                        <span>Grid Size</span>
                      </span>
                      <span className="font-mono font-medium text-foreground">
                        {draft.width} × {draft.height}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground/80" />
                        <span>Terakhir Diedit</span>
                      </span>
                      <span className="text-[11px] text-foreground">
                        {formattedDate}
                      </span>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-2 border-t border-border/60 flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDuplicateDraft(draft, e)}
                        disabled={isItemBusy}
                        className="w-7 h-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                        title="Duplikasi Draft"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDraftToDelete(draft);
                        }}
                        disabled={isItemBusy}
                        className="w-7 h-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Hapus Draft"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isItemBusy}
                      className="h-7 text-xs text-primary group-hover:bg-primary group-hover:text-white transition-all gap-1 font-medium px-2.5"
                    >
                      {isItemBusy ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <span>Buka Editor</span>
                          <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!draftToDelete} onOpenChange={(open) => !open && setDraftToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Draft Peta?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Peta{' '}
              <strong className="text-foreground">{draftToDelete?.map_name}</strong> ({draftToDelete?.map_id}) akan
              dihapus secara permanen dari database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              <span>Hapus Peta</span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
