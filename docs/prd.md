# GAME PRODUCT REQUIREMENTS DOCUMENT (PRD)

**Project:** RealmShaper: Online (3D Stylized Low-Poly MMORPG)  
**Version:** 2.0  
**Status:** 3D Architecture Active  
**Target Platform:** Android dan iOS  
**Game Engine:** Godot 4.7.2 (3D Jolt Physics, `gl_compatibility`)  
**Genre:** 3D MMORPG / Dark Fantasy Adventure / Sandbox  
**Perspective:** 3D Free-Orbit Camera (360° Yaw, Pitch Clamp, Zoom)

---

# 1. Product Vision

## 1.1 Visi Produk

Membangun game MMORPG 3D Stylized Low-Poly / Chibi dengan dunia online yang terus berkembang, tempat pemain tidak hanya menjelajahi dunia 3D, bertarung, dan meningkatkan karakter, tetapi juga berkontribusi langsung dalam membangun dunia game.

Pemain dapat:
- Menjelajahi dunia fantasy 3D yang luas dengan kamera putar bebas 360°.
- Mengembangkan karakter dan kemampuannya.
- Melawan monster dan boss 3D.
- Berinteraksi dan bermain bersama pemain lain.
- Merakit map 3D modular, menyesuaikan tekstur/material senjata & armor 3D, merancang monster, skill, dan quest.
- Membagikan karya kepada komunitas.
- Memainkan dan memberikan penilaian terhadap konten buatan pemain.

## 1.2 Prinsip Utama

1. **Persistent World:** dunia game berkembang secara berkelanjutan.
2. **Player Creativity:** pemain memiliki alat untuk menciptakan konten.
3. **Community Driven:** komunitas berkontribusi terhadap perkembangan dunia.
4. **Fair Progression:** perkembangan karakter harus adil dan seimbang.
5. **Mobile First:** pengalaman bermain dirancang khusus untuk perangkat mobile.
6. **Extensible Architecture:** sistem harus dapat dikembangkan tanpa membangun ulang fondasi game.

---

# 2. Target Platform dan Pengguna

## 2.1 Platform

| Platform | Prioritas | Peran Ekosistem |
|---|---|---|
| Android | Primary | Game Client 3D Runtime (Godot 4.7) |
| iOS | Primary | Game Client 3D Runtime (Godot 4.7) |
| Web Desktop (PC/Mac) | Primary | **Creator Studio Portal** (`web-studio/`: 3D Modular Map Builder, 3D Texture/Material Customizer, Quest & Stat Balancer) |
| Web Internal (Admin/GM) | Primary (Secured) | **GameOps & Security Dashboard** (`web-admin/`: Pemantauan Ekonomi, Anti-Cheat, Log Audit, Approval PGC) |
| Windows / Mac Native | Secondary | Tidak termasuk target game client utama |

Aplikasi Web terbagi menjadi dua portal terisolasi demi keamanan:
1. `web-studio`: Workstation publik kreator untuk merancang map 3D modular, mewarnai tekstur/palet model 3D, dan menyusun quest.
2. `web-admin`: Dashboard privat terisolasi (IP-whitelisted & 2FA) khusus tim GameOps untuk memantau sirkulasi ekonomi, anomali cheat, investigasi transaksi, dan moderasi konten.

Klien mobile (`client`) difokuskan 100% untuk pengalaman bermain MMORPG 3D yang responsif dan enteng.

## 2.2 Target Pengguna

- Pemain MMORPG yang menyukai eksplorasi dan progression.
- Pemain yang menyukai RPG fantasy dan social gameplay.
- Kreator yang ingin membuat map dan konten game.
- Komunitas yang ingin berkolaborasi mengembangkan dunia.

## 2.3 Target Kapasitas

- Target awal: 100 pemain online bersamaan.
- Target pengembangan: 1.000 pemain online bersamaan.
- Kapasitas awal map instance: 10–30 pemain, dapat disesuaikan berdasarkan hasil pengujian.

---

# 3. Core Gameplay Loop

Siklus utama permainan:

1. Pemain memasuki dunia.
2. Menjelajahi map dan menemukan lokasi baru.
3. Melawan monster dan menyelesaikan quest.
4. Mendapatkan EXP, equipment, dan reward.
5. Mengembangkan karakter.
6. Berinteraksi dengan pemain lain.
7. Mengunjungi map dan memainkan konten buatan komunitas.
8. Membuat atau berkontribusi pada konten baru.

Gameplay harus memberikan alasan kepada pemain untuk terus menjelajah, berkembang, berinteraksi, dan menciptakan sesuatu.

---

# 4. World System

## 4.1 Dunia Game

Game menggunakan dunia fantasy 3D penuh dengan kamera Free-Orbit 360°.

Dunia terdiri dari:
- Town / Safe Zone.
- Field / Exploration Area.
- Dungeon.
- Boss Area.
- Special Event Area.
- Player-Created World.

## 4.2 Map System

Setiap map memiliki:
- Map identifier.
- Nama dan deskripsi.
- Ukuran dan konfigurasi grid.
- Terrain dan environment.
- Collision dan navigasi.
- Monster spawn points.
- NPC.
- Portal dan koneksi antarmap.
- Batas jumlah pemain.
- Aturan gameplay.

## 4.3 World Navigation

Pemain dapat:
- Berjalan bebas menggunakan kontrol touchscreen.
- Berpindah antarmap melalui portal.
- Menemukan area tersembunyi.
- Mengakses dungeon dan area khusus.
- Mengunjungi map buatan pemain yang telah dipublikasikan.

## 4.4 World Persistence

Dunia utama memiliki identitas dan perkembangan yang berkelanjutan.

Konten resmi dan konten komunitas harus memiliki mekanisme versi dan pembaruan tanpa mengganggu progres pemain.

---

# 5. Character System

## 5.1 Character Creation

Pemain dapat membuat karakter dengan:
- Nama karakter.
- Pilihan penampilan.
- Gender presentation (TBD).
- Pilihan karakter awal.
- Pilihan kelas awal (TBD).

## 5.2 Character Attributes

Atribut karakter dapat mencakup:
- HP.
- MP / Mana.
- STR.
- AGI.
- VIT.
- INT.
- DEX.
- LUK.

Daftar atribut dan formula final akan ditentukan pada Game Design Document.

## 5.3 Character Progression

Pemain dapat:
- Mendapatkan EXP.
- Menaikkan level.
- Mendapatkan attribute points.
- Membuka skill.
- Mengembangkan build karakter.
- Menggunakan equipment yang lebih baik.

## 5.4 Character Customization

Sistem penampilan dapat mencakup:
- Hair style.
- Hair color.
- Costume.
- Weapon appearance.
- Accessories.
- Character animations.

---

# 6. Combat System

## 6.1 Combat Gameplay

Combat menggunakan sistem real-time.

Pemain dapat:
- Menyerang monster.
- Menggunakan skill.
- Menghindari serangan.
- Menggunakan item.
- Melawan boss.
- Bekerja sama dengan pemain lain.

## 6.2 Skill System

Skill memiliki:
- Nama dan deskripsi.
- Skill category.
- Damage atau effect.
- Mana cost.
- Cooldown.
- Targeting type.
- Animation dan visual effect.
- Level requirement.

## 6.3 Monster System

Setiap monster memiliki:
- Identifier.
- Nama.
- Level.
- HP dan atribut.
- AI behavior.
- Attack pattern.
- Drop table.
- EXP reward.
- Spawn configuration.

## 6.4 Boss System

Boss dapat memiliki:
- Multiple attack patterns.
- Phase transitions.
- Area attacks.
- Special mechanics.
- Unique rewards.

---

# 7. Item dan Equipment System

## 7.1 Item Categories

- Weapon.
- Armor.
- Headgear.
- Accessories.
- Consumables.
- Materials.
- Quest Items.
- Special Items.

## 7.2 Inventory

Pemain dapat:
- Mengambil item.
- Menyimpan item.
- Menggunakan consumables.
- Memindahkan item.
- Menggunakan equipment.
- Membuang item sesuai aturan game.

## 7.3 Equipment

Equipment memiliki:
- Rarity.
- Level requirement.
- Base attributes.
- Optional modifiers.
- Durability (TBD).
- Visual representation.

## 7.4 Economy

Sistem ekonomi dapat mencakup:
- In-game currency.
- NPC shop.
- Player trading.
- Marketplace.
- Item crafting.

Seluruh transaksi harus tervalidasi oleh server.

---

# 8. Quest dan Progression System

Jenis quest:
- Main Quest.
- Side Quest.
- Daily Quest.
- Weekly Quest.
- Exploration Quest.
- Community Quest.

Quest dapat memiliki:
- Objectives.
- Conditions.
- Rewards.
- Prerequisites.
- Completion status.
- Narrative content.

Quest buatan pemain harus melalui validasi dan moderasi sebelum dapat dipublikasikan.

---

# 9. Multiplayer dan Social System

## 9.1 Multiplayer

Pemain dapat:
- Melihat pemain lain.
- Berjalan bersama.
- Melawan monster bersama.
- Membentuk party.
- Mengunjungi map yang sama.
- Berinteraksi secara real-time.

## 9.2 Social Features

- Friend list.
- Party.
- Guild.
- Chat.
- Player profile.
- Online status.
- Player trading.

## 9.3 Server Authority

Server menjadi sumber kebenaran untuk:
- Player position validation.
- Combat calculation.
- EXP.
- Item drops.
- Inventory.
- Currency.
- Trading.
- Character progression.

Client tidak boleh menentukan sendiri hasil transaksi atau reward.

---

# 10. Player-Generated Content (CORE FEATURE)

Fitur ini merupakan pembeda utama produk.

Pemain dapat membuat konten yang nantinya bisa dimainkan oleh pemain lain.

## 10.1 Creator Studio

Creator Studio harus tersedia langsung di dalam game client.

Fitur utamanya:

### Map Editor
- Membuat map baru.
- Mengatur ukuran map.
- Menempatkan terrain.
- Mengatur obstacle.
- Mengatur collision.
- Menempatkan NPC.
- Menentukan monster spawn.
- Membuat portal.
- Mengatur titik awal pemain.

### Sprite dan Asset Editor
- Mengimpor aset gambar yang didukung.
- Mengatur sprite sheet.
- Mengatur animation frames.
- Mengatur ukuran dan pivot.
- Melihat preview animasi.

### Monster Editor
- Membuat monster.
- Mengatur atribut.
- Memilih sprite.
- Mengatur animasi.
- Mengatur AI behavior dari template yang tersedia.
- Mengatur reward dan drop table.

### Item dan Equipment Editor
- Membuat item.
- Mengatur icon.
- Mengatur kategori.
- Mengatur atribut.
- Mengatur rarity.
- Mengatur level requirement.

### Skill Editor
- Membuat skill dari template.
- Mengatur damage dan effect.
- Mengatur cooldown.
- Mengatur targeting.
- Mengatur visual effect.

### Quest Editor
- Membuat quest.
- Mengatur objective.
- Menentukan prerequisite.
- Mengatur reward.
- Mengatur dialog NPC.

## 10.2 Data-Driven Content

Konten buatan pemain tidak boleh menjalankan arbitrary code.

Seluruh konten menggunakan konfigurasi terstruktur dan schema yang tervalidasi.

Contohnya:
- Map menggunakan konfigurasi terrain dan object.
- Monster menggunakan atribut dan behavior template.
- Skill menggunakan effect template.
- Quest menggunakan objective dan condition template.

## 10.3 Test Play

Sebelum mengirim konten, kreator dapat:
- Memainkan map sendiri.
- Menguji collision.
- Menguji monster.
- Menguji quest.
- Memeriksa error.
- Memperbaiki konten.

## 10.4 Content Submission

Kreator dapat mengirimkan konten ke komunitas.

Status konten:
1. Draft.
2. Submitted.
3. Under Review.
4. Approved.
5. Published.
6. Rejected.
7. Archived.

## 10.5 Community Voting

Pemain dapat:
- Melihat konten komunitas.
- Mencoba konten.
- Memberikan rating.
- Memberikan feedback.
- Melaporkan konten bermasalah.

Voting tidak boleh menjadi satu-satunya mekanisme penentuan kelayakan publikasi.

## 10.6 Moderation

Konten harus melewati:
- Schema validation.
- Asset validation.
- Content moderation.
- Gameplay validation.
- Balance review bila diperlukan.

Developer dan moderator memiliki kewenangan untuk:
- Menyetujui konten.
- Menolak konten.
- Mengembalikan konten untuk revisi.
- Menghapus konten yang melanggar aturan.
- Menonaktifkan versi yang bermasalah.

## 10.7 Content Versioning

Setiap konten memiliki:
- Content ID.
- Creator ID.
- Version.
- Created timestamp.
- Updated timestamp.
- Approval status.
- Published version.

Perubahan konten yang sudah dipublikasikan harus menghasilkan versi baru dan tidak langsung mengubah versi aktif tanpa validasi.

---

# 11. Community Platform

Website komunitas bukan tempat bermain game.

Fungsinya:
- Menampilkan konten buatan pemain.
- Menampilkan profil kreator.
- Menampilkan popular content.
- Menampilkan leaderboard kreator.
- Menampilkan update game.
- Menampilkan panduan.
- Mendukung diskusi dan feedback.

Website harus terintegrasi dengan identitas akun game.

---

# 12. Admin Dashboard

Admin dashboard digunakan oleh developer dan moderator untuk:

- Mengelola akun pemain.
- Mengelola laporan pemain.
- Memoderasi konten.
- Meninjau submission.
- Mengelola konten resmi.
- Mengelola monster dan item.
- Melihat aktivitas komunitas.
- Melihat statistik game.
- Mengelola versi konten.
- Melakukan rollback konten.

Hak akses admin harus berbasis role dan permission.

---

# 13. Monetization

Model monetisasi belum ditetapkan.

Prinsip yang harus dipertahankan:
- Tidak merusak keseimbangan gameplay.
- Tidak menjadikan kemenangan bergantung pada pembayaran.
- Tidak memaksa pemain membeli item untuk menikmati konten utama.
- Transparan terhadap pembelian.

Model yang dapat dievaluasi:
- Cosmetic items.
- Character skins.
- Optional convenience features.
- Premium account features.

Detail ekonomi dan monetisasi akan dibuat pada dokumen terpisah.

---

# 14. Security dan Fair Play

Sistem harus memiliki:
- Server-side validation.
- Anti-cheat architecture.
- Rate limiting.
- Account security.
- Trade validation.
- Content moderation.
- Asset validation.
- Audit log.
- Abuse reporting.

Konten buatan pemain tidak boleh dapat mengeksekusi script atau kode arbitrer pada server maupun client.

---

# 15. User Interface dan User Experience

## 15.1 Design Direction

Arah visual:
- 3D Stylized Low-Poly / Retro Anime Chibi.
- Dark Fantasy RPG.
- 3D Free-Orbit Camera (360° Yaw, Pitch Clamp, Smooth Zoom).
- Rigged 3D Character & Monster Models (.glb) with 3D Socket Equipment.
- Readable gothic interface pada layar mobile.
- Konsistensi visual antara dunia game dan UI.

## 15.2 Mobile Controls

Kontrol utama:
- Virtual joystick.
- Attack button.
- Skill buttons.
- Interaction button.
- Inventory shortcut.
- Map shortcut.

UI harus mendukung berbagai ukuran dan rasio layar Android dan iOS.

## 15.3 Accessibility

- Pengaturan ukuran UI.
- Pengaturan audio.
- Pengaturan kontrol.
- Pengaturan kualitas grafis.
- Pengaturan bahasa.

---

# 16. Non-Functional Requirements

## Performance
- Target 60 FPS pada perangkat yang memenuhi spesifikasi minimum.
- Tetap playable pada perangkat Android kelas menengah.
- Menghindari penggunaan memori berlebihan.
- Optimasi rendering, sprite, animasi, dan network traffic.

## Scalability
- Target awal 100 concurrent players.
- Arsitektur dapat dikembangkan menuju 1.000 concurrent players.
- Dunia mendukung pemisahan map instance.

## Reliability
- Character progression tersimpan secara persisten.
- Transaksi item dan currency harus aman.
- Kegagalan koneksi tidak boleh menyebabkan duplikasi reward atau item.

## Compatibility
- Android dan iOS.
- Berbagai ukuran layar.
- Dukungan koneksi jaringan mobile yang tidak selalu stabil.

---

# 17. MVP Scope

MVP bertujuan membuktikan fondasi gameplay dan multiplayer sebelum membangun seluruh MMORPG.

## MVP Phase 1 — Playable Prototype
- 3D Modular Gothic Map.
- Player character 3D (.glb rigged).
- Free 3D Movement with Camera-Relative Direction.
- Character animations (Idle, Walk, Attack, Hurt, Death).
- OrbitCamera 360° Follow.
- Jolt Physics 3D Collision.
- Mobile Touch Joystick & Tap-to-Move.
- Android build.

## MVP Phase 2 — Basic RPG
- Character attributes.
- Monster.
- Combat.
- HP dan EXP.
- Basic skill.
- Inventory.
- Equipment.

## MVP Phase 3 — Online World
- Account authentication.
- Multiplayer connection.
- Other player synchronization.
- Map instances.
- Server-authoritative movement.
- Basic chat.

## MVP Phase 4 — Creator Foundation
- Map editor.
- Terrain placement.
- Object placement.
- Save/load map.
- Test play.
- Content submission.

## MVP Phase 5 — Community Content
- Content moderation.
- Community discovery.
- Rating dan voting.
- Published content.
- Versioning.

---

# 18. Success Metrics

Indikator keberhasilan produk:

## Gameplay
- Pemain dapat menyelesaikan onboarding.
- Pemain dapat menjelajahi dunia tanpa masalah performa.
- Pemain dapat berkembang dan menyelesaikan aktivitas RPG.

## Multiplayer
- Pemain dapat bermain bersama secara stabil.
- Tidak terjadi duplikasi transaksi penting.
- Sinkronisasi pemain memenuhi target latency yang ditetapkan saat pengujian.

## Creator Ecosystem
- Pemain berhasil membuat map.
- Map berhasil divalidasi.
- Map dapat dimainkan oleh pemain lain.
- Kreator mendapatkan feedback dari komunitas.

## Retention
- Day 1 Retention.
- Day 7 Retention.
- Day 30 Retention.
- Average Session Duration.
- Creator Participation Rate.

Target angka final akan ditentukan setelah closed testing.

---

# 19. Risks dan Constraints

| Risiko | Mitigasi |
|---|---|
| Scope terlalu besar | Pengembangan bertahap berdasarkan MVP |
| Performa mobile | Profiling sejak prototype |
| Multiplayer tidak stabil | Server-authoritative architecture |
| Konten pemain tidak aman | Schema validation dan moderation |
| Game economy tidak seimbang | Server-side rules dan monitoring |
| Asset tidak konsisten | Asset guidelines dan validation |
| Pengembangan terlalu kompleks | Modular architecture dan milestone |

---

# 19. Game Operations & Security Dashboard (web-admin)

Modul internal terisolasi untuk tim pengembang dan Game Master (GM) guna menjaga integritas ekonomi, keamanan server, dan moderasi konten.

## 19.1 Pemantauan Ekonomi Real-Time (Economic Health)
- **Gold Sink vs. Gold Faucet:** Visualisasi rasio mata uang yang tercipta (drop monster, quest reward) terhadap mata uang yang dimusnahkan (fee upgrade, pajak pasar, consumable NPC).
- **Total Money & Item Supply:** Metrik agregat persediaan item langka dan total uang beredar dengan pemicu peringatan otomatis (*automated alerts*) jika terjadi lonjakan abnormal (indikasi *duplication exploit*).
- **Top Wealth Tracking:** Pemantauan daftar 50 akun terkaya untuk mendeteksi bot farming atau akun penampung (*mule accounts*).

## 19.2 Deteksi Anomali & Anti-Cheat (Anomaly Detection)
- **Speed & Position Verification:** Log peringatan jika pergerakan pemain di WebSocket server melampaui `BASE_SPEED` teoritis.
- **Combat Sanity Check:** Audit otomatis bila damage per detik (DPS) pemain melampaui kapasitas maksimum stat senjata/atribut yang terdaftar di server.
- **Packet Rate Limiting:** Pendeteksian dan auto-quarantine terhadap klien yang melakukan spamming payload trade, inventory swap, atau interaksi loot.

## 19.3 Audit Trail & Transaction Logging
- **Immutable Transaction Logs:** Riwayat lengkap pertukaran item/gold: ID pengirim, ID penerima, timestamp, IP address, koordinat map, dan asal perolehan item.
- **Rollback & Account Action Tools:** Panel tindakan cepat: freeze account, mute, inventory rollback, ban akun, dan penalty flag.

## 19.4 Content Moderation & Approval Queue
- **PGC Review Pipeline:** Verifikasi visual terhadap sprite, map layout, dan teks dialog quest dari `web-studio` sebelum dirilis ke public realm.
- **Player Report Management:** Pengelolaan tiket laporan dari pemain mobile terhadap konten atau perilaku melanggar.

---

# 20. Open Decisions (TBD)

Hal-hal yang belum diputuskan dan harus dibahas sebelum implementasi fitur terkait:

1. Nama resmi game.
2. Tema dan lore dunia.
3. Gaya visual final: pixel art atau stylized 2D.
4. Sistem kelas karakter.
5. Formula atribut dan progression.
6. Sistem combat dan targeting.
7. Sistem trading dan ekonomi.
8. Sistem PvP.
9. Sistem guild.
10. Sistem monetisasi.
11. Batasan ukuran map buatan pemain.
12. Mekanisme reward untuk kreator.
13. Aturan kepemilikan dan lisensi aset buatan pemain.
14. Kebijakan konten komunitas.
15. Batas minimum spesifikasi perangkat.

---

# 21. Product Definition of Done

Produk dianggap mencapai fondasi MMORPG yang direncanakan apabila:

- Game dapat dimainkan di Android dan iOS.
- Pemain dapat membuat dan mengembangkan karakter.
- Pemain dapat menjelajahi dunia bersama pemain lain.
- Sistem combat dan progression berjalan konsisten.
- Item dan ekonomi tervalidasi server.
- Pemain dapat membuat konten melalui Creator Studio.
- Konten dapat diuji, dikirim, dimoderasi, dan dipublikasikan.
- Pemain lain dapat menemukan dan memainkan konten komunitas.
- Sistem dapat berkembang tanpa mengorbankan stabilitas dan keamanan.

---

**Dokumen ini merupakan Game PRD induk.** Detail teknis implementasi, database schema, API contract, network protocol, dan deployment akan didefinisikan dalam Technical PRD dan dokumen turunannya.