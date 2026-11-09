# AGENTS.md — RealmShaper: Web Creator Studio (`web-studio/`)

Pedoman operasional, standar arsitektur, dan aturan ketat ini **WAJIB** dipatuhi oleh seluruh AI agent/asisten saat membaca, merancang, atau memodifikasi kode di dalam direktori `d:\Godot\mmorpg\web-studio\`.

Dokumen ini melengkapi aturan global di root [`AGENTS.md`](../AGENTS.md) dengan spesifikasi teknis mendalam khusus untuk **Web Creator Studio**.

---

## 1. Peran & Visi Web Creator Studio

- **Nama Aplikasi:** RealmShaper // Creator Studio (`web-studio`)
- **Target Runtime:** Desktop Web Browser (Public Creator Workstation)
- **Fungsi Utama:** Memberikan peralatan visual bagi pemain/kreator untuk merancang **Player-Generated Content (PGC)** tanpa pernah menulis kode mentah (zero raw code execution), yang meliputi:
  1. **3D Modular Map Builder (`map-builder`):** Editor level berbasis grid 3D (2.0m × 2.0m snap) untuk lantai, dinding/collision, monster spawner, portal antarmap, dan prop 3D.
  2. **Monster Stat Balancer (`stat-alloc`):** Alokator atribut monster (STR, AGI, VIT, INT, DEX, LUK) dengan sistem **Server-Authoritative Stat Budget** dan simulasi kalkulasi tempur deterministik secara *real-time*.
  3. **3D Material & Texture Customizer (`tex-painter`):** Editor palet PBR (Color Tint, Roughness, Metalness, Emissive Glow) 3-slot (`primary`, `secondary`, `accent`) dengan preview model 3D `.glb` interaktif.
  4. **Quest Graph Editor (`quest-editor`):** Visual node-based editor (DAG) untuk menyusun alur dialog NPC, objektif pembunuhan monster (`kill_objective`), pengantaran item (`deliver_item`), dan *reward*.

---

## 2. Daftar Teknologi Lengkap (Tech Stack Inventory)

Seluruh pengembangan di dalam `web-studio/` menggunakan stack modern berikut (sesuai `package.json` dan konfigurasi proyek):

### 2.1 Core & Build Tooling
- **Framework UI:** React `^19.3.1` & React DOM `^19.3.1` (menggunakan `react-jsx` runtime).
- **Bahasa Pemrograman:** TypeScript `~7.0.2` (Strict Mode, `verbatimModuleSyntax: true`, `erasableSyntaxOnly: true`, target `ES2023`).
- **Build Tool & Bundler:** Vite `^8.3.6` dengan `@vitejs/plugin-react` `^6.1.2`.
- **Linter:** Oxlint `^1.90.0` (konfigurasi di `.oxlintrc.json` dengan plugin `react`, `typescript`, `oxc`).

### 2.2 Styling, Design System & UI Primitives
- **CSS Engine:** Tailwind CSS v4 (`tailwindcss` `^4.3.5` + `@tailwindcss/vite` `^4.3.5`) menggunakan sintaks `@import "tailwindcss";` dan `@theme inline` dengan sistem warna `oklch(...)` di `src/index.css`.
- **UI Component System:** **Shadcn UI** (`shadcn` `^4.23.0`, `@shadcn/react` `^0.3.1`) dengan style **`base-vega`** (`components.json`).
- **Headless UI Primitives:** **Base UI** (`@base-ui/react` `^1.9.0`) — **PERHATIAN:** Komponen Shadcn di proyek ini dibangun di atas `@base-ui/react` (bukan `@radix-ui/*`).
- **Styling Utilities:** `class-variance-authority` (`cva` `^0.7.1`), `cn` (`^0.5.2`), `tw-animate-css` (`^1.4.0`).
- **Typography & Icons:** `@fontsource-variable/inter` (`Inter Variable`), `lucide-react` (`^1.70.0`).

### 2.3 3D Rendering & WebGL Viewport
- **3D Engine:** Three.js (`three` `^0.187.0` + `@types/three` `^0.187.0`).
- **React 3D Renderer:** React Three Fiber / R3F (`@react-three/fiber` `^9.8.2`).
- **R3F Helpers & Loaders:** `@react-three/drei` `^10.7.9` (`OrbitControls`, `useGLTF`, dll.).

### 2.4 State Management & Data Visualization / Rich UI
- **State Management:** **Zustand** (`zustand` `^5.1.0`) — setiap modul memiliki store terisolasi di folder `stores/`.
- **Layout & Panels:** `react-resizable-panels` (`^4.19.1`), `cmdk` (`^1.1.1`), `embla-carousel-react` (`^8.6.0`).
- **Charts & Analytics:** `recharts` (`3.8.0`).
- **Syntax Highlighting (JSON/Code Preview):** `shiki` (`^4.6.0`).
- **Form & Date Utilities:** `date-fns` (`^4.4.0`), `react-day-picker` (`^10.0.2`), `input-otp` (`^1.5.0`).

---

## 3. Struktur Direktori `web-studio/`

Semua file baru wajib mengikuti konvensi modular berbasis fitur (*feature-based modules*) berikut:

```text
d:\Godot\mmorpg\web-studio\
├── public/
│   └── models/                  # Model 3D (.glb) statis untuk preview (Knight.glb, Barbarian.glb, Rogue.glb, chest.glb)
├── src/
│   ├── components/
│   │   └── ui/                  # Komponen Shadcn UI (@base-ui/react primitives)
│   ├── hooks/                   # Custom React hooks global (use-mobile.ts, use-highlighted-code.ts)
│   ├── lib/                     # Utility functions & helper (utils.ts, highlighter.tsx)
│   ├── modules/                 # 4 Modul Utama Creator Studio (Isolated Feature Modules)
│   │   ├── map-builder/
│   │   │   ├── components/      # MapCanvas.tsx (R3F 3D Grid), MapToolbar.tsx
│   │   │   ├── stores/          # mapStore.ts (Zustand state & JSON export)
│   │   │   └── types/           # map.types.ts
│   │   ├── stat-alloc/
│   │   │   ├── components/      # StatBalancerView.tsx
│   │   │   ├── stores/          # statStore.ts (Zustand state & budget validation)
│   │   │   └── types/           # stat.types.ts (MONSTER_BUDGET_CONFIG, computeDerivedStats)
│   │   ├── tex-painter/
│   │   │   ├── components/      # TextureCanvas.tsx (R3F GLTF viewer), TextureToolbar.tsx
│   │   │   ├── stores/          # textureStore.ts
│   │   │   └── types/           # texture.types.ts (TexturePreset, MaterialConfig)
│   │   └── quest-editor/
│   │       ├── components/      # QuestGraphCanvas.tsx (SVG + Node Editor), QuestToolbar.tsx
│   │       ├── stores/          # questStore.ts
│   │       └── types/           # quest.types.ts (QuestGraphData, QuestNode, QuestEdge)
│   ├── App.tsx                  # Shell navigasi utama Creator Studio
│   ├── index.css                # Tailwind v4 & CSS Variables theme definition
│   └── main.tsx                 # React DOM entry point
├── .oxlintrc.json               # Konfigurasi linter Oxlint
├── components.json              # Konfigurasi Shadcn UI (style: base-vega)
├── package.json
├── tsconfig.app.json            # Konfigurasi TypeScript aplikasi (path alias @/* -> ./src/*)
└── vite.config.ts
```

---

## 4. Aturan Ketat (Strict Rules) untuk AI Agent

### 4.1 Larangan Eksekusi Package Installer & Wajib Cek Dokumentasi via MCP Context7 / Shadcn
1. **DILARANG Menjalankan Package Installer Secara Langsung:**
   - Sesuai aturan proyek, AI Agent **DILARANG** mengeksekusi perintah instalasi atau inisialisasi CLI interaktif seperti `pnpm add`, `pnpm install`, `npm install`, `npx shadcn@latest add`, atau `pnpm dlx shadcn@latest add` karena berisiko *hang* pada prompt TTY.
   - Bila membutuhkan package npm baru atau komponen Shadcn baru yang belum ada di `src/components/ui/`, **instruksikan perintah exact-nya kepada USER** untuk dijalankan secara manual di terminal lokal mereka.
2. **WAJIB Cek MCP `context7` Setiap Kali Menggunakan / Menginstal Package Baru:**
   - Sebelum menginstruksikan instalasi package baru atau menulis kode integrasi untuk library apa pun (seperti `@react-three/fiber`, `@react-three/drei`, `three`, `zustand`, `@base-ui/react`, `recharts`, `shiki`, atau library baru), Agent **WAJIB** memanggil MCP tool **`context7`**:
     1. Panggil `resolve-library-id` untuk mendapatkan ID library yang tepat.
     2. Panggil `query-docs` untuk memeriksa API terbaru sesuai versi di `package.json`.
   - Dilarang menebak atau mengasumsikan API versi lama (misalnya perbedaan React 19, Tailwind v4, Zustand v5, R3F v9, atau Base UI v1).
3. **Gunakan MCP `shadcn` untuk Inspeksi & Penambahan Komponen UI:**
   - Bila membutuhkan referensi contoh, properti, atau command instalasi komponen Shadcn, gunakan MCP server **`shadcn`** (`search_items_in_registries`, `view_items_in_registries`, `get_item_examples_from_registries`, `get_add_command_for_items`).

### 4.2 Strict Shadcn-First UI Policy (`@/components/ui/*` + `@base-ui/react`)
1. **Wajib Gunakan Komponen Shadcn (`@/components/ui/*`):**
   - Seluruh elemen antarmuka pengguna (Button, Input, Textarea, Select, Slider, Switch, Tabs, Dialog, Sheet, Popover, Tooltip, Card, Badge, ScrollArea, Resizable, Separator, Table, dll.) **WAJIB** menggunakan komponen dari `@/components/ui/*`.
   - **DILARANG** membuat elemen kontrol standar dengan tag HTML mentah (`<button>`, `<input type="text">`, `<select>`, `<textarea>`) di dalam toolbar, form, atau inspector panel. Apabila ada kode lama yang masih memakai tag HTML mentah untuk form/tombol, wajib di-refactor ke komponen `@/components/ui/*` saat disentuh.
   - *Pengecualian terbatas:* Elemen `<canvas>` WebGL (R3F), elemen `<svg>` untuk garis konektor node graph, atau `<input type="color">` / `<input type="file">` tersembunyi yang dibungkus komponen UI.
2. **Perhatikan API `@base-ui/react` (`base-vega` Style):**
   - Komponen di `src/components/ui/` menggunakan **`@base-ui/react`**, **BUKAN** `@radix-ui/react-*`.
   - Perhatikan perbedaan prop antara Base UI dan Radix UI:
     - Base UI menggunakan prop `render={<CustomElement />}` untuk *composition/polymorphism*, **bukan** `asChild`.
     - Pada `Slider` (`@base-ui/react/slider`), event `onValueChange` dapat mengirimkan `number | readonly number[]`, sehingga selalu lakukan pengecekan `Array.isArray(val) ? val[0] : val`.
     - Pada `Select` (`@base-ui/react/select`), `onValueChange` mengirimkan `(value: any, eventDetails) => void` di mana `value` bisa bernilai `null`.
   - Selalu baca file komponen terkait di `src/components/ui/<component>.tsx` sebelum menggunakannya agar tipe props 100% akurat.

### 4.3 Standar TypeScript & Linting (`tsconfig.app.json` & `.oxlintrc.json`)
- **Path Alias:** Selalu gunakan `@/` untuk mengimpor dari `src/` pada lintas folder (contoh: `import { Button } from '@/components/ui/button'`).
- **`verbatimModuleSyntax: true` & `erasableSyntaxOnly: true`:**
  - Wajib menggunakan `import type { ... }` untuk semua impor yang hanya berupa tipe/interface TypeScript.
  - Dilarang menggunakan fitur TypeScript yang tidak *erasable* seperti `enum` runtime atau `namespace`; gunakan *union types* (`export type ToolMode = 'floor' | 'wall' ...`) dan objek `as const`.
- **Zero Unused Variables:** `noUnusedLocals` dan `noUnusedParameters` aktif secara ketat. Jangan tinggalkan import atau variabel yang tidak terpakai.

---

## 5. Kontrak Data & Paritas Deterministik (Godot 4.7 Client & Fastify Server)

Semua output JSON dari `web-studio` dikonsumsi secara langsung oleh klien Godot (`client/`) dan divalidasi oleh backend (`server/`). Agent **DILARANG** mengubah struktur field JSON atau rumus matematika tanpa menyelaraskannya di ketiga platform:

### 5.1 Kontrak 3D Modular Map (`MapData`)
- **Ukuran Grid & Snap:** Setiap sel grid berukuran **2.0m × 2.0m** (`tile_width: 2`, `tile_height: 2`), selaras dengan `DungeonEnvironmentBuilder3D.gd` di klien Godot.
- **Rumus Origin Terpusat (Centered Origin):**
  $$\text{originX} = -(\text{width} \times 2.0) \times 0.5 + 1.0$$
  $$\text{originZ} = -(\text{height} \times 2.0) \times 0.5 + 1.0$$
- **Struktur Layer:** `layers.ground` (1D array sepanjang `width * height`, nilai `0` = kosong, `1..5` = tipe lantai) dan `layers.collision` (`0` = walkable, `1` = dinding).

### 5.2 Kontrak Monster Stat Budget (`MonsterStats`)
- **Larangan Free-Form Stat:** Kreator tidak pernah menginput `maxHp` atau `attackDamage` secara langsung; mereka hanya mengalokasikan poin atribut (`str`, `agi`, `vit`, `int`, `dex`, `luk`) di dalam batas anggaran (*Stat Budget*).
- **Rumus Maksimum Budget (`calculateMaxBudget`):**
  - `basePoints = 30`, `pointsPerLevel = 5`
  - Multiplier Tier: `normal = 1.0`, `elite = 1.5`, `boss = 3.0`
  - $\text{maxBudget} = \lfloor (30 + (\text{level} - 1) \times 5) \times \text{tierMultiplier} \rfloor$
- **Rumus Derived Combat Stats (`computeDerivedStats`):**
  - `tierHpMultiplier`: `normal = 1.0`, `elite = 2.0`, `boss = 5.0`
  - `maxHp = Math.floor((100 + level * 25 + vit * 12) * tierHpMultiplier)`
  - `attackDamage = Math.floor(10 + level * 4 + str * 3)`
  - `defense = Math.floor(5 + vit * 1.5)`
  - `moveSpeed = Number((2.8 + agi * 0.05).toFixed(2))`
  - `expReward = Math.floor((30 + level * 15) * tierHpMultiplier)`

### 5.3 Kontrak 3D Material Preset (`TexturePreset`)
- Menggunakan 3 slot material standar (`primary`, `secondary`, `accent`).
- Setiap slot memiliki `MaterialConfig`: `colorTint` (Hex), `roughness` (`0.0 - 1.0`), `metalness` (`0.0 - 1.0`), `emissiveColor` (Hex), dan `emissiveIntensity` (`0.0 - 2.0`).
- Model target (`.glb` di `public/models/`) wajib di-*clone* material dan scene-nya saat di-render di React Three Fiber agar mutasi material tidak merusak cache global `useGLTF`.

### 5.4 Kontrak Quest Graph (`QuestGraphData`)
- Berupa Directed Acyclic Graph (DAG) yang terdiri dari `nodes` (`start`, `dialogue`, `kill_objective`, `deliver_item`, `reward`) dan `edges` (`fromNodeId`, `toNodeId`, `conditionLabel`).

---

## 6. Verification Checklist (Quality Gate Wajib)

Sebelum menyatakan tugas di dalam `web-studio/` selesai, AI Agent **WAJIB** memeriksa dan menjalankan verifikasi berikut:

- [ ] **Context7 & Shadcn MCP Check:** Apakah dokumentasi library baru telah dicek via `context7` dan komponen UI telah dicek via `shadcn` MCP?
- [ ] **No Direct CLI Install:** Apakah instalasi package/komponen baru diserahkan kepada User (tidak dijalankan langsung oleh Agent)?
- [ ] **Strict Shadcn Components:** Apakah seluruh tombol, input, select, slider, dan panel sudah menggunakan komponen dari `@/components/ui/*` (tanpa native `<button>`/`<input>`/`<select>` mentah untuk UI)?
- [ ] **Base UI Prop Compatibility:** Apakah penggunaan komponen `@/components/ui/*` sudah sesuai dengan tipe `@base-ui/react` (mis. tanpa prop `asChild` milik Radix)?
- [ ] **Linter Check (`oxlint`):** Jalankan perintah berikut di sandbox dan pastikan **0 warnings & 0 errors**:
  ```powershell
  pnpm --dir web-studio run lint
  ```
- [ ] **Typecheck & Production Build (`tsc -b && vite build`):** Jalankan perintah berikut dan pastikan proses kompilasi TypeScript dan bundling Vite berhasil tanpa error:
  ```powershell
  pnpm --dir web-studio run build
  ```

