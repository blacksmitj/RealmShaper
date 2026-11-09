import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  bigint,
  real,
  jsonb,
  timestamp,
  primaryKey,
  index,
  uniqueIndex
} from 'drizzle-orm/pg-core';

// ---------- Enums ----------
export const equipSlotEnum = pgEnum('equip_slot', ['weapon', 'armor', 'helmet', 'shield', 'accessory']);
export const pgcKindEnum = pgEnum('pgc_kind', ['texture', 'map', 'weapon', 'armor', 'monster', 'prop']);
export const pgcStatusEnum = pgEnum('pgc_status', ['pending_upload', 'uploaded', 'approved', 'rejected']);

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date())
};

// ---------- Accounts (guest-only for now; auth columns added later) ----------
export const accounts = pgTable(
  'accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    guestId: text('guest_id').notNull(),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }).notNull().defaultNow(),
    ...timestamps
  },
  (t) => [uniqueIndex('accounts_guest_id_uq').on(t.guestId)]
);

// ---------- Characters ----------
export const characters = pgTable(
  'characters',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    level: integer('level').notNull().default(1),
    exp: bigint('exp', { mode: 'number' }).notNull().default(0),
    str: integer('str').notNull().default(1),
    agi: integer('agi').notNull().default(1),
    vit: integer('vit').notNull().default(1),
    int: integer('int').notNull().default(1),
    dex: integer('dex').notNull().default(1),
    luk: integer('luk').notNull().default(1),
    statPoints: integer('stat_points').notNull().default(0),
    hp: integer('hp').notNull().default(150),
    maxHp: integer('max_hp').notNull().default(150),
    mapId: text('map_id').notNull().default('test_map'),
    posX: real('pos_x').notNull().default(0),
    posY: real('pos_y').notNull().default(0),
    posZ: real('pos_z').notNull().default(2),
    facing: real('facing').notNull().default(0),
    ...timestamps
  },
  (t) => [uniqueIndex('characters_name_uq').on(t.name), index('characters_account_idx').on(t.accountId)]
);

// ---------- PGC Assets (stored in RustFS) ----------
export const pgcAssets = pgTable(
  'pgc_assets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerAccountId: uuid('owner_account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    kind: pgcKindEnum('kind').notNull(),
    objectKey: text('object_key').notNull(),
    contentType: text('content_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    sha256: text('sha256'),
    status: pgcStatusEnum('status').notNull().default('pending_upload'),
    ...timestamps
  },
  (t) => [index('pgc_assets_owner_idx').on(t.ownerAccountId), index('pgc_assets_status_idx').on(t.status)]
);

// ---------- Item templates ----------
export const itemTemplates = pgTable('item_templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slot: equipSlotEnum('slot').notNull(),
  baseStats: jsonb('base_stats').$type<Record<string, number>>().notNull().default({}),
  pgcAssetId: uuid('pgc_asset_id').references(() => pgcAssets.id, { onDelete: 'set null' }),
  ...timestamps
});

// ---------- Inventory ----------
export const inventoryItems = pgTable(
  'inventory_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    characterId: uuid('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    templateId: text('template_id')
      .notNull()
      .references(() => itemTemplates.id),
    quantity: integer('quantity').notNull().default(1),
    slotIndex: integer('slot_index').notNull(),
    ...timestamps
  },
  (t) => [
    index('inventory_character_idx').on(t.characterId),
    uniqueIndex('inventory_char_slot_uq').on(t.characterId, t.slotIndex)
  ]
);

// ---------- Equipment ----------
export const characterEquipment = pgTable(
  'character_equipment',
  {
    characterId: uuid('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    slot: equipSlotEnum('slot').notNull(),
    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id, { onDelete: 'cascade' })
  },
  (t) => [primaryKey({ columns: [t.characterId, t.slot] })]
);

export type AccountRow = typeof accounts.$inferSelect;
export type CharacterRow = typeof characters.$inferSelect;
export type PgcAssetRow = typeof pgcAssets.$inferSelect;

