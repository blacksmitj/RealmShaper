import React from 'react';
import type { LegacyColumnDef } from '@tanstack/react-table/legacy';
import { useStatStore, type MonsterListItem } from '../stores/statStore';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Skull, Shield, Swords, Footprints, Heart, Calendar } from 'lucide-react';
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

interface MonsterListViewProps {
  onOpenStatEditor: (monsterId?: string) => void;
}

export const MonsterListView: React.FC<MonsterListViewProps> = ({ onOpenStatEditor }) => {
  const monsters = useStatStore((state) => state.monstersList);
  const loadMonsterById = useStatStore((state) => state.loadMonsterById);
  const deleteMonster = useStatStore((state) => state.deleteMonsterFromList);
  const createNew = useStatStore((state) => state.createNewMonster);

  const [monsterToDelete, setMonsterToDelete] = React.useState<MonsterListItem | null>(null);

  const handleEdit = (id: string) => {
    loadMonsterById(id);
    onOpenStatEditor(id);
  };

  const handleCreate = () => {
    createNew();
    onOpenStatEditor();
  };

  const confirmDelete = () => {
    if (monsterToDelete) {
      deleteMonster(monsterToDelete.id);
      setMonsterToDelete(null);
    }
  };

  const columns: LegacyColumnDef<MonsterListItem>[] = [
    {
      accessorKey: 'name',
      header: 'Monster / Boss Name',
      cell: ({ row }) => {
        const item = row.original;
        const tierColor =
          item.tier === 'boss'
            ? 'bg-destructive/15 text-destructive border-destructive/30'
            : item.tier === 'elite'
            ? 'bg-amber-500/15 text-amber-500 border-amber-500/30'
            : 'bg-primary/15 text-primary border-primary/30';

        return (
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded border flex items-center justify-center shrink-0 ${tierColor}`}>
              <Skull className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-foreground text-xs">{item.name}</div>
              <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1.5">
                <span>Lv.{item.level}</span>
                <span>•</span>
                <span className="capitalize">{item.behavior}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'tier',
      header: 'Tier',
      cell: ({ row }) => {
        const tier = row.original.tier;
        return (
          <Badge
            variant={tier === 'boss' ? 'destructive' : tier === 'elite' ? 'secondary' : 'outline'}
            className="capitalize text-[11px] font-mono tracking-wide"
          >
            {tier}
          </Badge>
        );
      },
    },
    {
      id: 'combatStats',
      header: 'Combat Derived Stats',
      cell: ({ row }) => {
        const { maxHp, attackDamage, defense, moveSpeed } = row.original;
        return (
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1 text-red-400" title="Max HP">
              <Heart className="w-3 h-3" />
              {maxHp}
            </span>
            <span className="flex items-center gap-1 text-amber-400" title="Attack Damage">
              <Swords className="w-3 h-3" />
              {attackDamage}
            </span>
            <span className="flex items-center gap-1 text-blue-400" title="Defense">
              <Shield className="w-3 h-3" />
              {defense}
            </span>
            <span className="flex items-center gap-1 text-emerald-400" title="Speed">
              <Footprints className="w-3 h-3" />
              {moveSpeed}m/s
            </span>
          </div>
        );
      },
    },
    {
      id: 'allocation',
      header: 'Atribut (S/A/V/I/D/L)',
      cell: ({ row }) => {
        const { str, agi, vit, int, dex, luk } = row.original;
        return (
          <span className="text-[11px] font-mono text-muted-foreground">
            {str}/{agi}/{vit}/{int}/{dex}/{luk}
          </span>
        );
      },
    },
    {
      accessorKey: 'updatedAt',
      header: 'Diperbarui',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Calendar className="w-3 h-3" />
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
              <span>Buka Balancer</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMonsterToDelete(item)}
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
          <h2 className="text-lg font-bold tracking-tight text-foreground">Monster Stat Balancer Catalog</h2>
          <p className="text-xs text-muted-foreground">
            Katalog monster dengan validasi Server-Authoritative Stat Budget & simulasi formula tempur deterministik.
          </p>
        </div>
        <Button onClick={handleCreate} size="sm" className="h-8 text-xs gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Monster Baru</span>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={monsters}
        searchColumn="name"
        searchPlaceholder="Cari nama monster atau boss..."
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!monsterToDelete} onOpenChange={(open) => !open && setMonsterToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Monster Preset?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus monster <strong>{monsterToDelete?.name}</strong> dari katalog?
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
