import React from 'react';
import type { LegacyColumnDef } from '@tanstack/react-table/legacy';
import { type EquipmentItem, INITIAL_EQUIPMENT_DATA } from '@/types/equipment.types';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Swords, Shield, Plus, Calendar, Sparkles } from 'lucide-react';

export const EquipmentListView: React.FC = () => {
  const [items, setItems] = React.useState<EquipmentItem[]>(INITIAL_EQUIPMENT_DATA);
  const [typeFilter, setTypeFilter] = React.useState<'all' | 'weapon' | 'armor'>('all');

  const filteredItems = React.useMemo(() => {
    if (typeFilter === 'all') return items;
    return items.filter((item) => item.type === typeFilter);
  }, [items, typeFilter]);

  const handleAddNewDummy = () => {
    const isWeapon = Math.random() > 0.5;
    const newItem: EquipmentItem = isWeapon
      ? {
          id: `wp_custom_${Date.now().toString(36)}`,
          name: 'Custom Elemental Blade',
          type: 'weapon',
          category: 'greatsword',
          tier: 'rare',
          baseAttack: 22,
          attackSpeed: 1.1,
          range: 2.4,
          modelPath: 'res://assets/models/adventurers/sword_2handed_color.gltf',
          creator: 'PlayerStudio',
          updatedAt: new Date().toISOString().split('T')[0],
        }
      : {
          id: `ar_custom_${Date.now().toString(36)}`,
          name: 'Custom Guardian Mail',
          type: 'armor',
          category: 'chest',
          tier: 'epic',
          defense: 25,
          hpBonus: 140,
          speedBonus: 0.05,
          modelPath: 'res://assets/models/armor/plate_knight.glb',
          creator: 'PlayerStudio',
          updatedAt: new Date().toISOString().split('T')[0],
        };

    setItems((prev) => [newItem, ...prev]);
  };

  const columns: LegacyColumnDef<EquipmentItem>[] = [
    {
      accessorKey: 'name',
      header: 'Nama Equipment',
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded border flex items-center justify-center shrink-0 ${
                item.type === 'weapon'
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                  : 'bg-blue-500/10 border-blue-500/20 text-blue-500'
              }`}
            >
              {item.type === 'weapon' ? <Swords className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
            </div>
            <div>
              <div className="font-semibold text-foreground text-xs">{item.name}</div>
              <div className="text-[10px] text-muted-foreground font-mono">{item.id}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'type',
      header: 'Kategori Slot',
      cell: ({ row }) => {
        const { type, category } = row.original;
        return (
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-[11px] font-mono capitalize">
              {type}
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">({category})</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'tier',
      header: 'Tier / Rarity',
      cell: ({ row }) => {
        const tier = row.original.tier;
        const color =
          tier === 'legendary'
            ? 'bg-amber-500/15 text-amber-500 border-amber-500/30'
            : tier === 'epic'
            ? 'bg-purple-500/15 text-purple-500 border-purple-500/30'
            : tier === 'rare'
            ? 'bg-blue-500/15 text-blue-500 border-blue-500/30'
            : 'bg-muted text-muted-foreground border-border';

        return (
          <Badge className={`capitalize text-[11px] font-mono border ${color}`}>
            <Sparkles className="w-2.5 h-2.5 mr-1" />
            {tier}
          </Badge>
        );
      },
    },
    {
      id: 'stats',
      header: 'Combat Modifier',
      cell: ({ row }) => {
        const item = row.original;
        if (item.type === 'weapon') {
          return (
            <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
              <span className="text-amber-400">Atk +{item.baseAttack}</span>
              <span>Spd {item.attackSpeed}s</span>
              <span>Range {item.range}m</span>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
            <span className="text-blue-400">Def +{item.defense}</span>
            <span className="text-red-400">HP +{item.hpBonus}</span>
            {item.speedBonus ? <span>Spd {item.speedBonus > 0 ? `+${item.speedBonus}` : item.speedBonus}</span> : null}
          </div>
        );
      },
    },
    {
      accessorKey: 'modelPath',
      header: '3D Godot Socket Path',
      cell: ({ row }) => (
        <span className="text-[11px] font-mono text-muted-foreground/80 max-w-xs truncate block" title={row.original.modelPath}>
          {row.original.modelPath}
        </span>
      ),
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
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">Weapon & Armor Catalog</h2>
          <p className="text-xs text-muted-foreground">
            Daftar senjata dan perisai dengan socket model 3D Godot (.gltf/.glb) dan kalkulasi base stats.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-border rounded-md p-0.5 bg-muted/40">
            <Button
              variant={typeFilter === 'all' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setTypeFilter('all')}
              className="h-7 text-xs px-2.5"
            >
              Semua
            </Button>
            <Button
              variant={typeFilter === 'weapon' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setTypeFilter('weapon')}
              className="h-7 text-xs px-2.5"
            >
              Senjata
            </Button>
            <Button
              variant={typeFilter === 'armor' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setTypeFilter('armor')}
              className="h-7 text-xs px-2.5"
            >
              Armor
            </Button>
          </div>
          <Button onClick={handleAddNewDummy} size="sm" className="h-8 text-xs gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Equipment</span>
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredItems}
        searchColumn="name"
        searchPlaceholder="Cari senjata atau armor..."
      />
    </div>
  );
};
