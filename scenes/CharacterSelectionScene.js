import { CHARACTERS } from '../data.js';

export default class CharacterSelectionScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CharacterSelectionScene' });
    }

    preload() {
        this.load.atlas('ninja', 'https://labs.phaser.io/assets/animations/knight.png', 'https://labs.phaser.io/assets/animations/knight.json');
        this.load.image('select_bg', 'assets/background_select.jpg');
        this.load.audio('menu_music', 'assets/menu_music.m4a');
    }

    create() {
        const savedCharacter = localStorage.getItem('playerCharacter');
        if (savedCharacter) {
            this.scene.start('MainMenuScene', { character: JSON.parse(savedCharacter) });
            return;
        }

        // --- Logika Audio yang Paling Andal ---
        const menuMusic = this.sound.add('menu_music', { loop: true, volume: 0.5 });
        
        this.input.once('pointerdown', () => {
            if (this.sound.context.state === 'suspended') {
                this.sound.context.resume();
            }
            if (!menuMusic.isPlaying) {
                menuMusic.play();
            }
        }, this);

        const bg = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'select_bg');
        const scaleX = this.cameras.main.width / bg.width;
        const scaleY = this.cameras.main.height / bg.height;
        const scale = Math.max(scaleX, scaleY);
        bg.setScale(scale).setScrollFactor(0);

        const uiPanel = this.add.graphics();
        uiPanel.fillStyle(0x000000, 0.6);
        uiPanel.fillRect(0, 450, this.cameras.main.width, 270);

        this.add.text(this.cameras.main.width / 2, 80, 'Pilih Karaktermu', { fontSize: '48px', fill: '#ffffff', stroke: '#000000', strokeThickness: 6 }).setOrigin(0.5);
        this.nameText = this.add.text(this.cameras.main.width / 2, 480, 'Pilih seorang ninja', { fontSize: '32px', fill: '#ffffff' }).setOrigin(0.5);
        this.statsText = this.add.text(this.cameras.main.width / 2, 540, '', { fontSize: '24px', fill: '#dddddd', align: 'center' }).setOrigin(0.5);

        const selectButton = this.add.text(this.cameras.main.width / 2, 640, 'Pilih Karakter Ini', { fontSize: '32px', fill: '#ffde00', backgroundColor: '#5c5c5c', padding: { x: 20, y: 10 } }).setOrigin(0.5);
        selectButton.setVisible(false).setInteractive({ useHandCursor: true });

        // PERBAIKAN: Pastikan animasi 'idle_animation' dibuat hanya sekali dan gunakan kunci yang sama dengan MainMenuScene
        if (!this.anims.exists('idle_animation')) {
            this.anims.create({
                key: 'idle_animation', // Mengubah 'idle' menjadi 'idle_animation'
                frames: this.anims.generateFrameNames('ninja', { prefix: 'idle/frame', start: 0, end: 5, zeroPad: 4 }),
                frameRate: 8,
                repeat: -1
            });
        }

        CHARACTERS.forEach((char, index) => {
            const xPos = (this.cameras.main.width / 2 - 200) + (index * 200);
            const sprite = this.add.sprite(xPos, 300, char.key).setTint(char.tint).setScale(4);
            sprite.setInteractive({ useHandCursor: true });
            
            // PERBAIKAN: Memainkan animasi dengan kunci 'idle_animation'
            sprite.anims.play('idle_animation');

            sprite.on('pointerdown', () => {
                this.selectedCharacter = char;
                this.nameText.setText(char.name);
                this.statsText.setText(`Strength: ${char.stats.str}\nAgility: ${char.stats.agi}\nStamina: ${char.stats.sta}`);
                selectButton.setVisible(true);
                this.children.list.forEach(c => { 
                    // Hanya set alpha untuk sprite karakter yang relevan
                    if (c instanceof Phaser.GameObjects.Sprite && c.texture.key === 'ninja') {
                        c.setAlpha(0.5);
                    }
                });
                sprite.setAlpha(1.0);
            });
        });

        selectButton.on('pointerdown', () => {
            if (this.selectedCharacter) {
                this.sound.stopAll();
                const newCharacterData = {
                    ...this.selectedCharacter,
                    level: 1,
                    exp: 0,
                    gold: 100,
                    equipment: { weapon: null, armor: null, boots: null },
                    inventory: [],
                    currentHp: this.selectedCharacter.stats.sta * 10 // Inisialisasi currentHp saat karakter baru dipilih
                };
                localStorage.setItem('playerCharacter', JSON.stringify(newCharacterData));
                this.scene.start('MainMenuScene', { character: newCharacterData });
            }
        });
    }
}
