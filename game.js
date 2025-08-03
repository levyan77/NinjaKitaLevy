// Impor semua scene yang sudah kita pisah
import CharacterSelectionScene from './scenes/CharacterSelectionScene.js';
import MainMenuScene from './scenes/MainMenuScene.js';
import BattleScene from './scenes/BattleScene.js';

// --- Konfigurasi Game ---
const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    backgroundColor: '#2d2d2d',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    // Daftarkan semua scene di sini
    scene: [CharacterSelectionScene, MainMenuScene, BattleScene]
};

// Tunggu halaman selesai dimuat, lalu mulai game
window.onload = function() {
    const game = new Phaser.Game(config);
};
