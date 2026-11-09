# AGENTS.md — RealmShaper: Online

Pedoman dan aturan operasional ini wajib dipatuhi oleh seluruh AI agent/asisten saat membaca, merancang, atau memodifikasi kode dan arsitektur proyek **RealmShaper: Online**.

---

## 1. Project Overview & Context

- **Game Title:** RealmShaper: Online
- **Genre:** 3D Stylized Low-Poly MMORPG / Dark Fantasy / Retro Anime Chibi / Sandbox
- **Perspective & Camera:** 3D Free-Orbit Camera (360° Yaw Rotation, Pitch Clamp, Smooth Zoom)
- **Engine Client:** Godot 4.7.2 (GDScript, Jolt Physics 3D, `gl_compatibility`)
  - **Godot GUI Binary:** `D:\software\godot.exe`
  - **Godot CLI / Console Binary:** `D:\software\godot_console.exe`
- **Target Platform:** Android & iOS (Mobile-first)
- **Target Backend:** Node.js + TypeScript (Fastify, WebSocket, PostgreSQL, Redis, S3-compatible storage)
- **Core Pillars:**
  1. *Freedom to Play:* Classless progression, weapon mastery, flexible attribute allocation (STR, AGI, VIT, INT, DEX, LUK), awakening.
  2. *Freedom to Create:* Player-Generated Content (PGC), Web Creator Studio (3D modular map builder, 3D weapon/armor texture & material customizer, monster stat balancer, quest builder), shared world expansion.

---

## 2. Directory Structure Conventions

Semua file harus diletakkan pada folder yang semestinya:

```text
d:\Godot\mmorpg\
├── client/              # Godot Engine 4.7.2 project root (Mobile 3D Client Runtime)
│   ├── .godot/
│   ├── assets/          # 3D Models (.glb/.gltf), textures, audio, fonts, UI assets
│   │   ├── models/      # KayKit / Low-poly rigged characters, skeletons, weapons & dungeon props
│   │   ├── data/        # Local JSON map presets
│   │   └── ui/          # Mobile HUD frames, joystick & action button textures
│   ├── resources/       # Custom Godot .tres resources (WeaponData, ArmorData)
│   ├── scenes/          # .tscn scene files (modular & isolated 3D & UI scenes)
│   │   ├── core/        # OrbitCamera3D.tscn
│   │   ├── entities/    # Player3D.tscn, DummyMonster3D.tscn
│   │   ├── ui/          # GothicPlayerHUD.tscn, TouchControls.tscn, CommunityPortalDialog.tscn
│   │   └── world/       # TestMap3D.tscn & 3D realm scenes
│   ├── scripts/         # .gd script files
│   │   ├── autoload/    # EventBus.gd
│   │   ├── components/  # HealthComponent.gd, StatsComponent.gd, HitboxComponent.gd (Area3D), HurtboxComponent.gd (Area3D)
│   │   ├── core/        # OrbitCamera3D.gd, DynamicTextureLoader.gd
│   │   ├── entities/    # PlayerController3D.gd, CharacterVisualizer3D.gd, DummyMonster3D.gd, RemotePlayer3D.gd
│   │   ├── network/     # NetworkManager.gd, WorldEntityManager.gd (Node3D)
│   │   ├── resources/   # WeaponData.gd, ArmorData.gd
│   │   ├── ui/          # Mobile HUD, touch joystick, 3D raycast tap-to-move, DamageNumber.gd (Label3D)
│   │   └── world/       # DungeonEnvironmentBuilder3D.gd, MapPortal.gd (Area3D)
│   └── project.godot
├── server/              # Backend services (Node.js/TS, Fastify, WebSocket, DB)
│   ├── src/
│   │   ├── api/         # REST API for auth, moderation, web studio uploads (Fastify)
│   │   ├── game-engine/ # ISOLATED Game Loop, Spatial Grid, Tick System & Combat Math
│   │   ├── gateway/     # WebSocket connection manager & packet serialization
│   │   └── models/      # PostgreSQL & Redis schemas (stat budget, PGC metadata)
├── web-studio/          # Web Creator Studio (React/Vite/TS for Desktop Browser - PUBLIC)
│   ├── src/
│   │   ├── map-builder/ # 3D Modular Grid Map & Prop placement editor
│   │   ├── tex-painter/ # 3D Material/Palette & Texture customizer for weapons, armor, & monsters
│   │   ├── stat-alloc/  # Stat budget balancer (enforced limits)
│   │   └── quest-editor/# Node-based visual quest & dialogue builder
├── web-admin/           # GameOps & Security Dashboard (React/TS - INTERNAL & SECURED)
│   ├── src/
│   │   ├── economy/     # Gold sink/faucet & total supply monitors
│   │   ├── anticheat/   # Anomaly detection, speed/DPS alerts, inspect tools
│   │   ├── logs/        # Transaction audit trails & user action history
│   │   └── moderation/  # PGC review queue & approval pipeline
├── docs/                # Dokumentasi proyek (GDD & PRD)
│   ├── gdd.md
│   └── prd.md
└── AGENTS.md            # File ini (agent guidelines)
```

---

## 3. Strict Rules & Anti-Hallucination Guidelines

1. **Gunakan MCP Context7 Sebelum Mengasumsikan API Godot 4.7:**
   - Dilarang menebak atau menggunakan sintaks Godot 3 (seperti `KinematicBody`, `Spatial`, `yield()`, `connect("signal", target, "method")`).
   - Selalu validasi API 3D Godot 4 terbaru (`Node3D`, `CharacterBody3D`, `SpringArm3D`, `BoneAttachment3D`, `Area3D`, `Label3D`, `OmniLight3D`, `await`, `callable.connect()`).
   - Bila ragu mengenai API GDScript atau library backend, gunakan MCP tool `context7` (`resolve-library-id` lalu `query-docs`).

2. **Pure 3D World & Rigged Low-Poly Entities (No Legacy 2D World Code):**
   - Seluruh dunia, karakter, monster, hitbox/hurtbox, dan portal menggunakan node 3D (`Node3D`, `CharacterBody3D`, `Area3D`).
   - Karakter dan monster menggunakan model `.glb` / `.gltf` low-poly ber-rigging (`Skeleton3D` + `AnimationPlayer` + `BoneAttachment3D` untuk socket senjata/perisai/helm).
   - Node 2D (`Control` / `CanvasLayer`) **hanya** digunakan untuk antarmuka pengguna (HUD, Virtual Joystick, Dialog).

3. **Server-Authoritative First:**
   - Klien (Godot) **TIDAK PERNAH** memvalidasi transaksi item, EXP, damage akhir, atau inventaris secara otoritatif.
   - Klien hanya memprediksi input (client-side prediction) dan menampilkan state yang dikonfirmasi server.
   - PGC (Player-Generated Content) wajib melewati validasi skema data; klien tidak boleh mengeksekusi kode mentah buatan pemain.

4. **Mobile-First Constraints for 3D Game Client:**
   - Client Godot murni difokuskan sebagai game player & runtime 3D yang ringan.
   - Semua kontrol mobile dioptimalkan untuk layar sentuh (virtual joystick camera-relative, 3D ground-plane raycast untuk tap-to-move, orbit camera drag, dan tombol aksi kombat).
   - Gunakan model 3D low-poly dengan tekstur atlas terkompresi dan batasi jumlah real-time shadow lampu agar hemat baterai dan stabil 60 FPS di perangkat Android/iOS (`gl_compatibility`).

5. **Web Creator Studio Separation & Stat Budgeting:**
   - Pembuatan konten kompleks (3D Modular Map Builder, Texture/Material Customizer, Monster Stat Balancer, Node Quest Editor) berada di aplikasi Web terpisah (`web-studio/`).
   - Keseimbangan data PGC (monster/senjata) menggunakan konsep **Preset / Stat Budget**: kreator hanya mengalokasikan poin dari limit server yang aman, dilarang inject formula bebas.
   - Format map 3D diexport sebagai data terstruktur (JSON koordinat grid 3D + ID prefab prop modular) yang di-instansiasi oleh klien Godot secara deterministik.

6. **Isolated Game Loop Architecture (Fastify + Future-Ready Portability):**
   - Logika tick pertempuran, spatial grid, entity state, dan kalkulasi damage diletakkan di `server/src/game-engine/` secara terisolasi (pure domain logic tanpa dependensi ketat ke framework web/Fastify).
   - `gateway/` hanya bertugas menerima paket WebSocket dan meneruskannya ke `game-engine`.

7. **Larangan Eksekusi Package Installer / Interactive CLI oleh Agent (Wajib Manual oleh User):**
   - Agent **DILARANG** menjalankan perintah installer package atau init CLI interaktif (seperti `pnpm add`, `npm install`, `pnpm dlx shadcn`, `npx create-...`, dsb.) karena berisiko hang/timeout akibat menunggu prompt TTY non-interaktif dan permission delay.
   - Setiap penambahan dependency atau inisialisasi CLI eksternal **WAJIB diinstruksikan kepada USER** untuk dijalankan secara manual di terminal lokal user.
   - Agent hanya bertugas menyediakan script, konfigurasi kode, struktur file, dan logika implementasi setelah package terpasang.

---

## 4. GDScript Coding Standards (Godot Official)

Setiap script GDScript (`.gd`) wajib mematuhi standar resmi Godot 4:

### 4.1 Strict Typing
- Wajib menyertakan tipe data eksplisit pada variabel, parameter fungsi, dan return type.
```gdscript
# Benar
var player_health: int = 100
const BASE_SPEED: float = 6.5

func calculate_damage(base_attack: int, defense: int) -> int:
    return maxi(1, base_attack - defense)
```

### 4.2 Naming Conventions
- **Classes & Nodes:** `PascalCase` (contoh: `PlayerController3D`, `OrbitCamera3D`)
- **Variables & Functions:** `snake_case` (contoh: `move_speed`, `_on_hit_received()`)
- **Constants & Enums:** `UPPER_SNAKE_CASE` (contoh: `MAX_LEVEL`, `ActionState.ATTACK`)
- **Private Variables / Helpers:** Diawali tanda underscore `_` (contoh: `_play_anim()`)

### 4.3 File Structure Order
Setiap file `.gd` harus disusun dari atas ke bawah mengikuti urutan resmi:
```gdscript
01. @tool, @icon
02. class_name
03. extends
04. ## Dokumentasi singkat script

05. signals
06. enums
07. constants
08. static variables
09. @export variables
10. regular variables
11. @onready variables

12. _static_init()
13. static methods
14. overridden built-in virtual methods (_init, _ready, _process, _physics_process)
15. overridden custom methods
16. public methods
17. private/helper methods (_...)
18. inner classes
```

---

## 5. Architectural Patterns

1. **Composition over Deep Inheritance:**
   - Utamakan penggunaan Node/Components modular (`HealthComponent`, `StatsComponent`, `HitboxComponent` Area3D, `HurtboxComponent` Area3D, `CharacterVisualizer3D`) daripada inheritance pohon class yang dalam.
2. **Signal-driven Communication:**
   - *"Call down, signal up"*: Node induk boleh memanggil method milik node anak secara langsung. Node anak **harus** memancarkan sinyal (`signal`) ke node induk.
3. **Event Bus Pattern:**
   - Gunakan Autoload singleton `EventBus.gd` untuk komunikasi lintas scene global (input mobile HUD ke `PlayerController3D`, notifikasi server global, transisi portal).

---

## 6. Engine Binary & Skill Reference (Godot 4.7.2)

### 6.1 Godot Executables (Local Path)
Setiap agent yang perlu menjalankan command headless, import model 3D, atau validasi scene/script **wajib** menggunakan executable lokal yang terpasang:
- **GUI Engine:** `D:\software\godot.exe`
- **CLI / Console Engine (Headless & Testing):** `D:\software\godot_console.exe`

Contoh perintah eksekusi validasi tanpa popup window:
```powershell
& "D:\software\godot_console.exe" --headless --path client --quit
```

### 6.2 Domain Skill `godot-master` (.agents/skills/godot-master)
Proyek ini dilengkapi dengan modul keahlian terintegrasi **`godot-master`** di `d:\Godot\mmorpg\.agents\skills\godot-master\SKILL.md`. Agen wajib merujuk modul keahlian ini saat mendesain fitur 3D, lighting, physics, atau multiplayer.

---

## 7. Verification Checklist Sebelum Mengubah / Menulis Kode

Sebelum menyatakan tugas selesai, agent wajib memeriksa:
- [ ] Apakah path file sudah sesuai dengan struktur `client/` atau `server/`?
- [ ] Apakah semua script GDScript memiliki static typing penuh?
- [ ] Apakah sintaks yang digunakan adalah sintaks resmi Godot 4.x 3D (`Node3D`, `CharacterBody3D`, `Area3D`)?
- [ ] Apakah pengujian sintaks/skrip telah divalidasi menggunakan `D:\software\godot_console.exe --headless --path client --quit`?
- [ ] Apakah ada potensi celah keamanan client-authority untuk logika MMORPG?
- [ ] Apakah dokumen GDD / PRD tetap terjaga konsistensinya dengan kode baru?
