# GAME DESIGN DOCUMENT (GDD)
## RealmShaper: Online — Freedom to Play, Freedom to Create

**Version:** 0.2  
**Status:** 3D Foundation Active  
**Genre:** 3D Stylized Low-Poly MMORPG / Dark Fantasy / Retro Anime Chibi  
**Platform:** Android dan iOS  
**Game Engine:** Godot 4.7.2 (3D Jolt Physics, `gl_compatibility`)  
**Target:** Mobile-first 3D MMORPG

---

# 1. GAME VISION

## 1.1 Konsep Utama

Game ini merupakan MMORPG 3D Stylized Low-Poly dengan dunia Dark Fantasy yang memungkinkan pemain tidak hanya menjelajahi dunia 3D dengan sudut pandang kamera orbit bebas 360°, bertarung, dan mengembangkan karakter, tetapi juga ikut menciptakan konten yang memperkaya dunia permainan.

Berbeda dari MMORPG tradisional yang seluruh kontennya dibuat oleh developer, game ini memberikan kesempatan kepada pemain untuk berkontribusi dalam pengembangan dunia melalui sistem Player-Generated Content.

Ada dua filosofi utama:

- **Freedom to Play:** Pemain bebas menentukan perkembangan karakter dan gaya bermain.
- **Freedom to Create:** Pemain dapat berkontribusi menciptakan konten dan membangun dunia permainan.

## 1.2 Tujuan Pengalaman Pemain

Pemain diharapkan merasakan bahwa:

1. Karakter yang dimiliki merupakan hasil keputusan dan kreativitas sendiri.
2. Tidak ada satu kelas karakter yang membatasi seluruh gaya bermain.
3. Dunia permainan terus berkembang melalui kontribusi komunitas.
4. Karya pemain dapat dinikmati dan digunakan oleh pemain lain.
5. Setiap pemain memiliki kesempatan meninggalkan jejak dalam dunia permainan.

# 2. ART DIRECTION

## 2.1 Visual Style

**3D Stylized Low-Poly / Retro Anime Chibi — Dark Fantasy**

Karakteristik visual:

- Dunia 3D penuh dengan kamera Orbit 360° (Free Yaw Rotation, Pitch Clamp, & Smooth Zoom).
- Karakter & Monster menggunakan model 3D Low-Poly Stylized / Chibi ber-rigging (`Skeleton3D` & `AnimationPlayer`).
- Sistem 3D Equipment Attachment (`BoneAttachment3D`) untuk pergantian senjata, perisai, helm, dan jubah secara real-time.
- Lingkungan medieval dark fantasy 3D modular (lantai batu, pilar gothic, undakan tangga, obor menyala dengan `OmniLight3D`).
- Efek sihir dan kemampuan dengan pencahayaan kontras di ruang 3D.

Semua aset harus memiliki konsistensi gaya visual low-poly stylized agar konten buatan komunitas tetap menyatu dengan dunia utama dan ringan dijalankan pada perangkat mobile.

## 2.2 Originality

Game mengambil inspirasi dari MMORPG klasik dan dark fantasy modern, tetapi seluruh dunia, karakter, cerita, monster, senjata, dan aset harus memiliki identitas orisinal.

# 3. CORE PILLAR 1 — FREEDOM TO PLAY

## 3.1 Character Freedom

Pemain memiliki kebebasan untuk mengembangkan karakter tanpa class permanen yang mengunci pilihan permainan.

Karakter dapat berkembang berdasarkan kombinasi:

- Attributes.
- Skills.
- Weapon Mastery.
- Equipment.
- Awakening.
- Specialization.

Tidak ada satu konfigurasi karakter yang diwajibkan untuk seluruh pemain.

## 3.2 Attribute System

Atribut menjadi fondasi pengembangan karakter.

Atribut dasar yang direncanakan:

| Attribute | Fungsi umum |
|---|---|
| STR | Kekuatan fisik |
| AGI | Kelincahan |
| VIT | Ketahanan |
| INT | Kekuatan sihir |
| DEX | Ketepatan dan teknik |
| LUK | Keberuntungan |

Pemain dapat mengalokasikan Attribute Points secara manual.

Detail formula, batas atribut, dan balancing akan ditentukan pada tahap pengembangan sistem RPG.

## 3.3 Flexible Skill System

Pemain bebas mempelajari dan mengombinasikan berbagai jenis skill.

Kategori skill yang direncanakan:

- Weapon Skills.
- Awakening Skills.
- Universal Skills.
- Specialization Skills.

Pemain dapat memiliki banyak skill, tetapi jumlah skill yang dibawa dalam pertempuran dibatasi melalui sistem Skill Loadout.

## 3.4 Weapon Freedom

Tidak ada class permanen yang mengunci penggunaan jenis senjata.

Kategori senjata yang direncanakan meliputi:

- Sword.
- Greatsword.
- Dagger.
- Dual Blades.
- Bow.
- Staff.
- Wand.
- Spear.
- Axe.
- Shield.

Akses terhadap senjata tertentu dapat memiliki persyaratan atribut atau Weapon Mastery.

## 3.5 Character Progression

Karakter berkembang melalui:

- Character Level.
- Attribute Progression.
- Weapon Mastery.
- Skill Development.
- Awakening.
- Equipment.

Level maksimum karakter yang direncanakan adalah Level 99.

Setelah mencapai level maksimum, pemain tetap memiliki aktivitas pengembangan melalui sistem progression lainnya.

# 4. CORE PILLAR 2 — FREEDOM TO CREATE

## 4.1 Player-Generated Content

Pemain dapat membuat, mengembangkan, dan mengirimkan konten untuk menjadi bagian dari ekosistem game.

Sistem Creator Studio merupakan salah satu fitur utama permainan, bukan fitur tambahan.

Konten yang dapat dibuat atau dikontribusikan:

| Content Type | Bentuk kontribusi |
|---|---|
| Map | Area, lingkungan, dungeon |
| Weapon | Desain dan visual senjata |
| Armor | Desain dan visual perlengkapan |
| Monster | Desain makhluk dan karakteristiknya |
| NPC | Karakter dan interaksi |
| Quest | Cerita, misi, dan objective |
| Item | Item baru dan properti visual |
| Environment | Bangunan, dekorasi, dan objek dunia |

Pengembangan setiap kategori akan dilakukan secara bertahap.

## 4.2 Map Creator

Pemain dapat membuat map menggunakan editor visual.

Fitur yang direncanakan:

- Tile-based map editor.
- Terrain painting.
- Object placement.
- Building placement.
- Collision configuration.
- NPC placement.
- Monster placement.
- Spawn point configuration.
- Map testing.
- Map submission.

Map dapat dibuat untuk berbagai kebutuhan:

- Area eksplorasi.
- Dungeon.
- Arena.
- Kota.
- Area komunitas.
- Wilayah khusus.

## 4.3 Weapon Creator

Pemain dapat berkontribusi membuat desain senjata.

Fitur yang direncanakan:

- Sprite editor.
- Weapon appearance configuration.
- Weapon category selection.
- Animation preview.
- Visual testing.
- Submission system.

Atribut dan kekuatan senjata tetap mengikuti aturan game yang ditetapkan developer.

Pemain tidak boleh membuat senjata dengan statistik atau efek yang tidak tervalidasi.

## 4.4 Armor Creator

Pemain dapat membuat desain visual armor.

Fitur yang direncanakan:

- Armor sprite editor.
- Equipment category.
- Character preview.
- Visual customization.
- Animation preview.
- Submission system.

Armor yang dibuat pemain harus mengikuti standar ukuran, format, dan gaya visual game.

## 4.5 Creator Studio

Creator Studio merupakan lingkungan pembuatan konten yang terintegrasi dengan game.

Prinsip desain:

- Visual editor, bukan pemrograman.
- Mudah digunakan oleh pemain non-programmer.
- Template dan komponen siap pakai.
- Preview secara langsung.
- Validasi sebelum submission.
- Sistem versi konten.
- Moderasi dan persetujuan.

Pemain tidak diberikan kemampuan menjalankan kode bebas di server game.

Konten harus menggunakan struktur data dan komponen yang sudah disediakan developer.

# 5. COMMUNITY CREATION & SHARED WORLD BUILDING

Game menggabungkan dua pendekatan kontribusi komunitas.

## 5.1 Community Creation

Pemain membuat konten melalui Creator Studio.

Alur publikasi:

1. Pemain membuat konten.
2. Konten diuji melalui preview.
3. Sistem melakukan validasi teknis.
4. Pemain mengirimkan submission.
5. Konten menjalani moderasi.
6. Developer atau moderator memberikan persetujuan.
7. Konten diterbitkan ke ekosistem game.

Konten dapat dinikmati pemain lain setelah diterbitkan.

## 5.2 Shared World Building

Pemain dapat berkontribusi terhadap perkembangan dunia utama.

Contoh:

- Membuat desain bangunan untuk kota.
- Mengusulkan dungeon baru.
- Membuat area eksplorasi.
- Mendesain dekorasi lingkungan.
- Membuat senjata dan armor untuk dunia utama.

Perubahan dunia utama tidak langsung diterapkan tanpa persetujuan.

Developer tetap memiliki kendali atas konsistensi lore, kualitas, keamanan, keseimbangan, dan arah pengembangan dunia.

## 5.3 Content Governance

Setiap konten komunitas harus memiliki:

- Creator identity.
- Content ownership metadata.
- Version history.
- Validation status.
- Moderation status.
- Publication status.

Developer harus dapat:

- Menyetujui konten.
- Menolak konten.
- Meminta revisi.
- Menonaktifkan konten.
- Mengembalikan versi sebelumnya.

# 6. CORE GAMEPLAY LOOP

Siklus utama permainan:

1. Pemain memasuki dunia.
2. Menjelajahi lingkungan.
3. Melawan monster dan menyelesaikan aktivitas.
4. Memperoleh EXP, item, equipment, dan material.
5. Mengembangkan karakter.
6. Menemukan atau membuat konten baru.
7. Berkontribusi kepada komunitas.
8. Menjelajahi dunia yang terus berkembang.

Aktivitas bermain dan aktivitas menciptakan konten harus saling mendukung.

# 7. WORLD DESIGN

## 7.1 World Concept

Game menggunakan konsep dunia MMORPG bersama yang terdiri dari berbagai wilayah dan map.

Setiap wilayah dapat memiliki:

- Kota.
- Area eksplorasi.
- Dungeon.
- Monster.
- NPC.
- Quest.
- Resource.
- Konten komunitas.

## 7.2 World Structure

Dunia dirancang sebagai persistent shared world dengan pembagian area dan instance server.

Pembagian instance digunakan untuk mengatur kapasitas pemain, performa, dan aktivitas tertentu.

## 7.3 World Expansion

Dunia dapat berkembang melalui dua sumber:

1. Konten resmi yang dibuat developer.
2. Konten komunitas yang telah disetujui.

# 8. MULTIPLAYER

Game merupakan MMORPG online dengan dunia bersama.

Fitur multiplayer yang direncanakan:

- Player interaction.
- Party.
- Guild.
- Cooperative dungeon.
- Boss battle.
- Trading.
- Community activities.
- PvP.

Server bertanggung jawab memvalidasi aktivitas penting seperti movement, combat, item, EXP, dan ekonomi.

# 9. PLATFORM & TECHNICAL DIRECTION

## 9.1 Client

- Engine: Godot 4.7.2.
- Language: GDScript (Strict Static Typing).
- Platform: Android dan iOS (Mobile-first).
- UI: Native Godot UI (Gothic Frame, Safe Area Layout).
- Rendering: 3D gl_compatibility (Low-poly optimized).
- Physics: Jolt Physics 3D.
- Input: Touch-first control (Virtual Joystick, 3D Raycast Tap-to-Move, Orbit Camera Gesture).

## 9.2 Backend

Rancangan teknologi:

- Node.js + TypeScript (Fastify REST API & Admin Services).
- WebSocket gateway untuk sinkronisasi state jaringan.
- **Isolated Game Engine Architecture:** Core tick loop, spatial grid collision, dan kalkulasi combat dirancang independen dari framework web agar mudah dipindahkan ke bahasa performa tinggi (Rust/Go) di masa mendatang bila traffic meningkat.
- PostgreSQL (relational player data, inventory, PGC metadata).
- Redis/Valkey (session cache, leaderboard, spatial instance states).
- S3-compatible object storage (asset maps JSON & sprites PNG).
- Docker deployment.

## 9.3 Content Architecture

Konten pemain harus dipisahkan dari kode inti game.

Konten disimpan dalam format data terstruktur dengan schema validation dan versioning.

Client hanya mengunduh konten yang sudah divalidasi dan diterbitkan.

# 10. DEVELOPMENT PRIORITIES

Pengembangan dilakukan secara bertahap agar kompleksitas proyek dapat dikendalikan.

## Phase 1 — Core Game Prototype

- Isometric movement.
- Character animation.
- Camera.
- Collision.
- Basic map.
- Touch controls.
- Android testing.

## Phase 2 — Core RPG

- Character attributes.
- Weapon system.
- Basic combat.
- Skills.
- Monster.
- EXP and leveling.
- Inventory and equipment.

## Phase 3 — Multiplayer Foundation

- Account system.
- Character persistence.
- Multiplayer movement.
- Player synchronization.
- Map instances.
- Basic server-authoritative combat.

## Phase 4 — Creator Studio Foundation

- Map editor.
- Tile and object placement.
- Content schema.
- Preview and testing.
- Content submission.
- Validation system.

## Phase 5 — Player Contribution

- Weapon Creator.
- Armor Creator.
- Monster Creator.
- Quest Creator.
- Moderation system.
- Community content publishing.

## Phase 6 — Shared World

- Community-created world areas.
- Approved map integration.
- Content discovery.
- Community participation.
- World expansion.

# 11. DESIGN PRINCIPLES

Semua fitur baru harus mengikuti prinsip berikut:

1. Kebebasan pemain tidak boleh dibatasi oleh class permanen.
2. Pemain harus memiliki banyak kemungkinan membangun karakter.
3. Konten buatan pemain harus memiliki standar kualitas.
4. Developer tetap mengendalikan keseimbangan dan integritas dunia.
5. Creator Studio harus dapat digunakan tanpa kemampuan coding.
6. Konten komunitas tidak boleh membahayakan keamanan server.
7. Game harus dioptimalkan untuk perangkat mobile.
8. Sistem harus dapat dikembangkan tanpa merombak fondasi utama.

# 12. OUT OF SCOPE FOR THIS VERSION

Hal-hal berikut belum ditetapkan secara final:

- Formula damage dan combat.
- EXP curve.
- Attribute scaling.
- Drop rate.
- Equipment stat scaling.
- Skill balancing.
- Awakening requirements.
- Enhancement success rate.
- Economy balancing.
- PvP rules.
- Guild systems.
- Creator reward and revenue sharing.
- Content voting and monetization.
- Detail moderation workflow.

Semua hal tersebut akan dirancang ketika fondasi gameplay dan Creator Studio sudah lebih jelas.

# 13. INITIAL SUCCESS CRITERIA

Versi awal dianggap berhasil apabila:

1. Pemain dapat membuat dan mengembangkan karakter.
2. Pemain dapat menjelajahi map isometrik di perangkat Android.
3. Pemain dapat memainkan konten multiplayer dasar.
4. Pemain dapat membuat map melalui Creator Studio.
5. Map dapat diuji sebelum dikirim.
6. Konten dapat divalidasi dan disetujui.
7. Pemain lain dapat memainkan map yang telah diterbitkan.

**Target utama vertical slice:** satu pemain membuat map sederhana, mengirimkannya, map disetujui, kemudian pemain lain dapat masuk dan memainkannya.

---

**END OF GDD v0.1**

Dokumen ini merupakan fondasi desain awal. Detail mekanik dan balancing akan dikembangkan setelah core gameplay dan Creator Studio memiliki prototipe yang dapat diuji.