# Game RPG Turn-Based ala Pockie Ninja

Ini adalah proyek game pertarungan 2D yang terinspirasi oleh Pockie Ninja, dibuat menggunakan *framework* [Phaser 3](https://phaser.io/). Game ini memiliki sistem pertarungan otomatis, progresi karakter, dan manajemen item.

## Fitur Utama

* **Pemilihan Karakter**: Memulai permainan dengan memilih satu dari tiga ninja dengan statistik dasar (STR, AGI, STA) yang unik.
* **Progresi Karakter**:
    * **Sistem Level & EXP**: Dapatkan EXP setelah memenangkan pertarungan untuk naik level dan meningkatkan statistik dasar secara permanen.
    * **Sistem Equipment**: Temukan, beli, dan pakai item (Weapon, Armor, Boots) yang memberikan bonus stat.
    * **Sistem Gold & Toko**: Kumpulkan Gold dari musuh untuk membeli equipment baru di toko.
    * **Inventaris & Jual Item**: Kelola item yang didapat di dalam tas dan jual item yang tidak terpakai untuk mendapatkan Gold.
* **Pertarungan Strategis**:
    * **Sistem Stage**: Pilih lawan dari beberapa stage yang tersedia, masing-masing dengan musuh, *drop table*, dan arena pertarungan yang unik.
    * **Jurus dengan Efek Spesial**: Gunakan jurus tipe *damage*, *buff* (meningkatkan stat), dan *debuff* (memberikan racun).
    * **AI Musuh**: Musuh memiliki jurus dan logika sederhana untuk menggunakannya.
* **UI & Polish**:
    * **UI Modern**: Tampilan antarmuka yang rapi dengan *health bar*, panel informasi, *battle log*, dan *tooltip* detail item.
    * **Feedback Visual**: Efek visual untuk serangan, jurus, *item drop*, *level up*, angka *damage* melayang, dan ikon status efek (buff/debuff).
    * **Musik & Aset Bervariasi**: Setiap adegan memiliki musik latar dan visual yang berbeda untuk membangun suasana.
    * **Menu Utama Interaktif**: Tampilan menu utama yang diperbarui menyerupai Pockie Ninja dengan bangunan interaktif sebagai titik akses fitur.
    * **Tooltip Bangunan**: Menampilkan informasi nama dan deskripsi bangunan saat kursor diarahkan ke objek bangunan interaktif.
* **Fitur Kenyamanan**:
    * **Simpan Progres Otomatis**: Progres karakter (level, EXP, Gold, equipment, inventaris) disimpan secara otomatis di browser.
    * **Kontrol Pertarungan**: Fitur percepatan waktu (x1, x2, x3) dan tombol *Skip Battle*.
* **Kode Terstruktur**: Kode dipecah menjadi beberapa file (Data, Scenes) untuk manajemen proyek yang lebih mudah.

## Peningkatan Terbaru

* **Peningkatan UI Menu Utama**: Tata letak menu utama telah disesuaikan agar lebih mirip dengan Pockie Ninja, termasuk penempatan panel info pemain, panel navigasi kanan atas, dan area bangunan interaktif.
* **Bangunan Interaktif Berbasis Gambar**: Teks placeholder untuk bangunan di menu utama telah diganti dengan gambar aset bangunan asli dari Pockie Ninja, dengan efek *hover* yang memperbesar dan menampilkan *tooltip* deskriptif.
* **Manajemen Interaktivitas Modal**: Interaksi dengan elemen di latar belakang (bangunan) kini dinonaktifkan secara otomatis saat panel modal (toko, inventaris, dll.) terbuka, mencegah klik yang tidak disengaja.
* **Perbaikan Stabilitas Scene**: Berbagai perbaikan telah dilakukan untuk mengatasi masalah siklus hidup objek dan animasi Phaser saat transisi antar scene, memastikan pengalaman yang lebih mulus.
* **Cache Busting Aset**: Implementasi *cache busting* untuk aset gambar memastikan bahwa versi terbaru dari gambar selalu dimuat oleh browser.

## Struktur Proyek

Pastikan struktur file dan folder Anda terlihat seperti ini agar game dapat berjalan dengan benar:


.
├── assets/
│   ├── fire_animation.png
│   ├── village_background.png
│   ├── background.png
│   ├── background_cave.png
│   ├── background_nightwood.png
│   ├── menu_music.mp3 (atau .m4a)
│   ├── village_music.mp3 (atau .m4a)
│   ├── battle_music.mp3 (atau .m4a)
│   ├── building_arena.png
│   ├── building_item_shop.png
│   ├── building_dojo.png
│   ├── building_armory.png
│   ├── building_inventory.png
│   ├── building_quest.png
│   ├── building_pet_kenjutsu.png
│   └── (opsional: building_mall.png, building_card_room.png)
├── scenes/
│   ├── BattleScene.js
│   ├── CharacterSelectionScene.js
│   └── MainMenuScene.js
├── data.js
├── game.js
└── index.html


-   `index.html`: File utama untuk membuka game di browser.
-   `game.js`: File utama yang mengkonfigurasi dan memulai game.
-   `data.js`: Menyimpan semua data statis (karakter, musuh, equipment, jurus).
-   `scenes/`: Folder yang berisi semua file adegan game.
-   `assets/`: Folder untuk menyimpan semua aset gambar dan suara.

## Cara Menjalankan Game

Karena game ini memuat file lokal (`assets`), Anda tidak bisa hanya membuka `index.html` langsung dari file explorer karena akan menyebabkan error CORS. Anda **harus** menjalankannya melalui sebuah server web lokal.

Berikut adalah cara termudah untuk melakukannya:

### 1. Menggunakan Ekstensi Live Server (Visual Studio Code)

1.  Buka folder proyek Anda di Visual Studio Code.
2.  Pasang ekstensi bernama **Live Server**.
3.  Setelah terpasang, klik kanan pada file `index.html` dan pilih **"Open with Live Server"**.
4.  Game akan otomatis terbuka di browser Anda dengan alamat seperti `http://127.0.0.1:5500`.

### 2. Menggunakan Python

Jika Anda memiliki Python terpasang di komputer Anda:

1.  Buka terminal atau Command Prompt.
2.  Navigasi ke direktori (folder) proyek game Anda menggunakan perintah `cd`. Contoh: `cd C:\Users\Anda\Desktop\GameProject`.
3.  Jalankan salah satu perintah berikut (tergantung versi Python Anda):

    ```bash
    # Untuk Python 3
    python -m http.server

    # Untuk Python 2
    python -m SimpleHTTPServer
    ```
4.  Buka browser Anda dan kunjungi alamat `http://localhost:8000`.

Game Anda sekarang seharusnya sudah berjalan dengan baik!
