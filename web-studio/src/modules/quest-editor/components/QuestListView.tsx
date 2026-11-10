import React from 'react';
import type { LegacyColumnDef } from '@tanstack/react-table/legacy';
import { useQuestStore, type QuestListItem } from '../stores/questStore';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, GitBranch, Calendar, Workflow } from 'lucide-react';
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

interface QuestListViewProps {
  onOpenQuestEditor: (questId?: string) => void;
}

export const QuestListView: React.FC<QuestListViewProps> = ({ onOpenQuestEditor }) => {
  const quests = useQuestStore((state) => state.questsList);
  const loadQuestById = useQuestStore((state) => state.loadQuestById);
  const deleteQuest = useQuestStore((state) => state.deleteQuestFromList);
  const createNewQuest = useQuestStore((state) => state.createNewQuest);

  const [questToDelete, setQuestToDelete] = React.useState<QuestListItem | null>(null);

  const handleEdit = (id: string) => {
    loadQuestById(id);
    onOpenQuestEditor(id);
  };

  const handleCreate = () => {
    createNewQuest();
    onOpenQuestEditor();
  };

  const confirmDelete = () => {
    if (questToDelete) {
      deleteQuest(questToDelete.id);
      setQuestToDelete(null);
    }
  };

  const columns: LegacyColumnDef<QuestListItem>[] = [
    {
      accessorKey: 'title',
      header: 'Judul Quest / Naratif',
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <GitBranch className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="font-semibold text-foreground text-xs">{item.title}</div>
              <div className="text-[10px] text-muted-foreground font-mono">{item.questId}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'description',
      header: 'Deskripsi Objektif',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground line-clamp-1 max-w-sm">
          {row.original.description}
        </span>
      ),
    },
    {
      accessorKey: 'minLevel',
      header: 'Syarat Level',
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[11px] font-mono">
          Min. Lv {row.original.minLevel}
        </Badge>
      ),
    },
    {
      id: 'nodesInfo',
      header: 'Struktur DAG Graph',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
          <Workflow className="w-3.5 h-3.5" />
          <span>
            {row.original.nodeCount} node • {row.original.edgeCount} koneksi
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'updatedAt',
      header: 'Diperbarui',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Calendar className="w-3.5 h-3.5" />
          <span>{row.original.updatedAt}</span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Aksi</div>,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(item.id)}
              className="h-7 px-2.5 text-xs gap-1 border-primary/30 hover:border-primary text-primary"
            >
              <Edit className="w-3 h-3" />
              <span>Buka Node Graph</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuestToDelete(item)}
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
          <h2 className="text-lg font-bold tracking-tight text-foreground">Quest DAG Graph Catalog</h2>
          <p className="text-xs text-muted-foreground">
            Alur dialog NPC, pembunuhan monster, pengantaran item, dan branching quest story MMORPG.
          </p>
        </div>
        <Button onClick={handleCreate} size="sm" className="h-8 text-xs gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          <span>Buat Quest Baru</span>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={quests}
        searchColumn="title"
        searchPlaceholder="Cari judul quest atau ID..."
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!questToDelete} onOpenChange={(open) => !open && setQuestToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Quest Graph?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus alur quest <strong>{questToDelete?.title}</strong>?
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
