// --- Daftar Equipment yang Tersedia ---
export const EQUIPMENT = {
    weapon: [
        { name: 'Pedang Kayu', type: 'weapon', stats: { str: 2, agi: 0, sta: 0 }, price: 100 },
        { name: 'Pisau Cepat', type: 'weapon', stats: { str: 1, agi: 1, sta: 0 }, price: 150 }
    ],
    armor: [
        { name: 'Jubah Kain', type: 'armor', stats: { str: 0, agi: 0, sta: 2 }, price: 120 },
        { name: 'Baju Kulit', type: 'armor', stats: { str: 1, agi: 0, sta: 1 }, price: 180 }
    ],
    boots: [
        { name: 'Sepatu Lari', type: 'boots', stats: { str: 0, agi: 2, sta: 0 }, price: 130 },
        { name: 'Sepatu Baja', type: 'boots', stats: { str: 0, agi: -1, sta: 1 }, price: 160 }
    ]
};

// --- Karakter yang Tersedia di Game ---
export const CHARACTERS = [
    { name: 'Ninja Api', key: 'player_knight', tint: 0xff8888, stats: { str: 12, agi: 8, sta: 10 } },
    { name: 'Ninja Angin', key: 'player_knight', tint: 0x88ff88, stats: { str: 8, agi: 12, sta: 10 } },
    { name: 'Ninja Batu', key: 'player_knight', tint: 0x8888ff, stats: { str: 10, agi: 8, sta: 12 } }
];

// --- Daftar Musuh yang Tersedia ---
export const ENEMIES = [
    { 
        name: 'Slime Merah', 
        key: 'player_knight',
        tint: 0xff0000, 
        stats: { hp: 100, atk: 15, agi: 8 },
        skills: [{ name: 'Lompatan Berat', type: 'damage', damageMultiplier: 1.8, cooldown: 2 }],
        dropTable: [
            { item: EQUIPMENT.weapon[0], chance: 50 },
            { item: EQUIPMENT.armor[0], chance: 25 }
        ],
        gold: 25,
        backgroundKey: 'bg_forest',
        groundLevel: 10 // Jarak dari bawah layar
    },
    { 
        name: 'Golem Batu', 
        key: 'player_knight',
        tint: 0xaaaaaa, 
        stats: { hp: 150, atk: 12, agi: 5 },
        skills: [{ name: 'Lemparan Batu', type: 'damage', damageMultiplier: 2.2, cooldown: 3 }],
        dropTable: [
            { item: EQUIPMENT.armor[1], chance: 30 },
            { item: EQUIPMENT.boots[1], chance: 30 }
        ],
        gold: 40,
        backgroundKey: 'bg_cave',
        groundLevel: 120 // Jarak dari bawah layar (lebih tinggi)
    },
    { 
        name: 'Serigala Cepat', 
        key: 'enemy_mummy',
        tint: 0xffffff,
        stats: { hp: 80, atk: 18, agi: 15 },
        skills: [{ name: 'Cakaran Cepat', type: 'damage', damageMultiplier: 1.5, cooldown: 1 }],
        dropTable: [
            { item: EQUIPMENT.weapon[1], chance: 20 },
            { item: EQUIPMENT.boots[0], chance: 40 }
        ],
        gold: 50,
        backgroundKey: 'bg_nightwood',
        groundLevel: 45 // Jarak dari bawah layar
    }
];

// --- Daftar semua jurus yang ada di game ---
export const SKILLS = [
    { name: 'Jurus Bola Api', type: 'damage', damageMultiplier: 2.5, cooldown: 3 },
    { name: 'Pukulan Keras', type: 'damage', damageMultiplier: 1.5, cooldown: 1 },
    { name: 'Fokus Cakra', type: 'buff', effect: { stat: 'atk', amount: 5 }, duration: 3, cooldown: 5 },
    { name: 'Jurus Racun', type: 'debuff', effect: { dot: 10 }, duration: 3, cooldown: 4 }
];
