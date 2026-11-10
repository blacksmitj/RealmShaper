import React from 'react';
import type { LegacyColumnDef } from '@tanstack/react-table/legacy';
import { useMapDrafts, useDeleteMapDraft, useTogglePublishMap } from '@/hooks/usePgcQueries';
import { fetchMapDraftDetail, type MapDraftSummary } from '@/lib/pgcService';
import { useMapStore } from '@/modules/map-builder/stores/mapStore';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Map, Calendar, Grid, Loader2, RefreshCw, Globe, Lock } from 'lucide-react';
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

interface MapsListViewProps {
  onOpenMapEditor: (mapId?: string) => void;
}

export const MapsListView: React.FC<MapsListViewProps> = ({ onOpenMapEditor }) => {
  const { data: drafts = [], isLoading, isFetching, refetch } = useMapDrafts();
  const deleteMutation = useDeleteMapDraft();
  const togglePublishMutation = useTogglePublishMap();
  const resetMap = useMapStore((state) => state.resetMap);
  const loadFromMapData = useMapStore((state) => state.loadFromMapData);

  const [loadingDraftId, setLoadingDraftId] = React.useState<string | null>(null);
  const [publishingDraftId, setPublishingDraftId] = React.useState<string | null>(null);
  const [draftToDelete, setDraftToDelete] = React.useState<MapDraftSummary | null>(null);

  const handleCreateNew = () => {
    resetMap();
    onOpenMapEditor();
  };

  const handleTogglePublish = async (draft: MapDraftSummary) => {
    try {
      setPublishingDraftId(draft.id);
      await togglePublishMutation.mutateAsync({
        id: draft.id,
        isPublished: !draft.is_published,
      });
    } catch {
      alert('Gagal mengubah status publish realm.');
    } finally {
      setPublishingDraftId(null);
    }
  };

  const handleEditDraft = async (draft: MapDraftSummary) => {
    try {
      setLoadingDraftId(draft.id);
      const detail = await fetchMapDraftDetail(draft.id);
      if (detail && detail.map_data) {
        loadFromMapData(detail.map_data);
        onOpenMapEditor(draft.id);
      }
    } catch {
      alert('Gagal mengambil draft peta dari server.');
    } finally {
      setLoadingDraftId(null);
    }
  };

  const confirmDelete = async () => {
    if (!draftToDelete) return;
    try {
      await deleteMutation.mutateAsync(draftToDelete.id);
    } catch {
      alert('Gagal menghapus draft peta.');
    } finally {
      setDraftToDelete(null);
    }
  };

  const columns: LegacyColumnDef<MapDraftSummary, any>[] = [
    {
      accessorKey: 'map_name',
      header: 'Nama Realm / Dungeon',
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Map className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="font-semibold text-foreground text-xs">{item.map_name}</div>
              <div className="text-[10px] text-muted-foreground font-mono">{item.map_id || item.id}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'theme',
      header: 'Tema',
      cell: ({ row }) => {
        const theme = row.original.theme;
        return (
          <Badge variant="outline" className="capitalize text-[11px] font-mono">
            {theme}
          </Badge>
        );
      },
    },
    {
      id: 'publish_status',
      header: 'Status Game',
      cell: ({ row }) => {
        const isPub = row.original.is_published;
        return (
          <Badge
            variant={isPub ? 'default' : 'secondary'}
            className={`text-[10px] font-medium gap-1 ${
              isPub ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'text-muted-foreground'
            }`}
          >
            {isPub ? <Globe className="w-3 h-3 text-emerald-400" /> : <Lock className="w-3 h-3" />}
            {isPub ? 'Published' : 'Draft'}
          </Badge>
        );
      },
    },
    {
      id: 'dimensions',
      header: 'Dimensi Grid',
      cell: ({ row }) => {
        const { width, height } = row.original;
        return (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <Grid className="w-3.5 h-3.5" />
            <span>
              {width} × {height} ({(width * 2).toFixed(0)}m × {(height * 2).toFixed(0)}m)
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'updated_at',
      header: 'Diperbarui',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span>{row.original.updated_at.split('T')[0]}</span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Aksi</div>,
      cell: ({ row }) => {
        const item = row.original;
        const isLoadingThis = loadingDraftId === item.id;
        const isPublishingThis = publishingDraftId === item.id;

        return (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTogglePublish(item)}
              disabled={isPublishingThis}
              className={`h-7 px-2 text-xs gap-1 border ${
                item.is_published
                  ? 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
                  : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
              }`}
            >
              {isPublishingThis ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : item.is_published ? (
                <Lock className="w-3 h-3" />
              ) : (
                <Globe className="w-3 h-3" />
              )}
              <span>{item.is_published ? 'Unpublish' : 'Publish Realm'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditDraft(item)}
              disabled={isLoadingThis}
              className="h-7 px-2.5 text-xs gap-1 border-primary/30 hover:border-primary text-primary"
            >
              {isLoadingThis ? <Loader2 className="w-3 h-3 animate-spin" /> : <Edit className="w-3 h-3" />}
              <span>Buka di 3D Editor</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDraftToDelete(item)}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">3D Modular Map Presets</h2>
          <p className="text-xs text-muted-foreground">
            Kelola peta grid 2.0m, koordinat dungeon, monster spawner, dan prop 3D siap export ke Godot.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8 text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </Button>
          <Button onClick={handleCreateNew} size="sm" className="h-8 text-xs gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            <span>Buat Map Baru</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-48 border border-border/50 rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-xs">Memuat katalog draft peta...</span>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={drafts}
          searchColumn="map_name"
          searchPlaceholder="Cari dungeon atau nama map..."
        />
      )}

      {/* Alert Dialog Delete */}
      <AlertDialog open={!!draftToDelete} onOpenChange={(open) => !open && setDraftToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Draft Peta?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus peta <strong>{draftToDelete?.map_name}</strong>? Tindakan ini tidak dapat
              dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
