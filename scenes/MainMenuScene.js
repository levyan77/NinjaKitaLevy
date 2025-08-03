import { EQUIPMENT, ENEMIES, SKILLS } from '../data.js';

export default class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
        this.uiElements = {};
        this.currentPanel = null;
        this.buildingObjects = []; // Tambahkan array untuk menyimpan referensi objek bangunan
        this.modalPanelGroup = null; // Tambahkan properti untuk panel modal utama
    }

    init(data) {
        this.character = data.character;
        if (!this.character.equipment) this.character.equipment = { weapon: null, armor: null, boots: null };
        if (!this.character.inventory) this.character.inventory = [];
        if (this.character.gold === undefined) this.character.gold = 100;
        if (!this.character.skills) this.character.skills = [];
        this.selectedSkills = this.character.skills;

        const totalStats = this.calculateTotalStats();
        if (this.character.currentHp === undefined || this.character.currentHp <= 0) {
            this.character.currentHp = totalStats.hp;
        } else {
            this.character.currentHp = Math.min(this.character.currentHp, totalStats.hp);
        }
    }

    preload() {
        this.load.image('village_bg', 'assets/village_background.png?v=' + Date.now());
        this.load.audio('village_music', 'assets/village_music.mp3');
        this.load.atlas('ninja', 'https://labs.phaser.io/assets/animations/knight.png', 'https://labs.io/assets/animations/knight.json');
        
        // --- MEMUAT GAMBAR BANGUNAN ---
        this.load.image('building_arena', 'https://pockie-ninja.sfo3.cdn.digitaloceanspaces.com/assets/public/scenes/village/fire/arena.png');
        this.load.image('building_item_shop', 'https://pockie-ninja.sfo3.cdn.digitaloceanspaces.com/assets/public/scenes/village/fire/shop.png');
        this.load.image('building_dojo', 'https://pockie-ninja.sfo3.cdn.digitaloceanspaces.com/assets/public/scenes/village/fire/hall.png');
        this.load.image('building_armory', 'https://pockie-ninja.sfo3.cdn.digitaloceanspaces.com/assets/public/scenes/village/fire/blacksmith.png');
        this.load.image('building_inventory', 'https://pockie-ninja.sfo3.cdn.digitaloceanspaces.com/assets/public/scenes/village/fire/card.png');
        this.load.image('building_quest', 'https://pockie-ninja.sfo3.cdn.digitaloceanspaces.com/assets/public/scenes/village/fire/quest.png');
        this.load.image('building_pet_kenjutsu', 'https://pockie-ninja.sfo3.cdn.digitaloceanspaces.com/assets/public/scenes/village/fire/kennel.png');
        // Tambahkan URL untuk Mall dan Card Room jika Anda memilikinya
        // this.load.image('building_mall', 'URL_GAMBAR_MALL.png');
        // this.load.image('building_card_room', 'URL_GAMBAR_CARD_ROOM.png');
    }

    create(data) {
        this.sound.play('village_music', { loop: true, volume: 0.5 });

        if (!this.anims.exists('idle_animation')) {
            this.anims.create({
                key: 'idle_animation',
                frames: this.anims.generateFrameNames('ninja', { prefix: 'idle/frame', start: 0, end: 5, zeroPad: 4 }),
                frameRate: 8,
                repeat: -1
            });
        }

        if (data.battleResult === 'MENANG') {
            this.character.exp += 50;
            this.character.gold += data.goldDrop || 0;
            this.checkForLevelUp();
        }

        if (data.droppedItem) {
            const itemExists = this.character.inventory.some(item => item.name === data.droppedItem.name);
            if (!itemExists) {
                this.character.inventory.push(data.droppedItem);
            }
        }

        localStorage.setItem('playerCharacter', JSON.stringify(this.character));

        const bg = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'village_bg');
        const scaleX = this.cameras.main.width / bg.width;
        const scaleY = this.cameras.main.height / bg.height;
        const scale = Math.max(scaleX, scaleY);
        bg.setScale(scale).setScrollFactor(0);

        this.tooltipGroup = this.add.group();

        this.drawMainUI();
        this.drawInteractiveBuildings(); // Ini akan memanggil drawInteractiveBuildings()
        this.drawQuestPanel();
        this.drawChatBox();

        const resetButton = this.add.text(this.cameras.main.width / 2, this.cameras.main.height - 30, 'Ganti Karakter', { fontSize: '20px', fill: '#ffcccc', backgroundColor: '#800000', padding: {x: 10, y: 5} }).setOrigin(0.5);
        resetButton.setInteractive({ useHandCursor: true });
        resetButton.on('pointerdown', () => {
            localStorage.removeItem('playerCharacter');
            this.sound.stopAll();
            this.cleanUpScene();
            this.scene.start('CharacterSelectionScene');
        });

        if (data.droppedItem) {
            this.showItemDropNotification(data.droppedItem);
        } else if (data.battleResult) {
            this.showBattleResultNotification(data.battleResult);
        }
    }

    cleanUpScene() {
        if (this.currentPanel) {
            this.currentPanel.destroy(true, true);
            this.currentPanel = null;
        }
        if (this.uiElements.playerInfoGroup) {
            this.uiElements.playerInfoGroup.destroy(true, true);
            this.uiElements.playerInfoGroup = null;
        }
        if (this.tooltipGroup) {
            this.tooltipGroup.destroy(true, true);
            this.tooltipGroup = null;
        }
        // Hancurkan objek bangunan saat membersihkan scene
        this.buildingObjects.forEach(obj => obj.destroy());
        this.buildingObjects = [];

        // Hancurkan modalPanelGroup jika ada
        if (this.modalPanelGroup) {
            this.modalPanelGroup.destroy(true, true);
            this.modalPanelGroup = null;
        }
    }

    drawMainUI() {
        this.drawPlayerInfo();
        this.drawTopRightNavigation();
    }

    drawPlayerInfo() {
        if (this.uiElements.playerInfoGroup) {
            this.uiElements.playerInfoGroup.destroy(true, true);
        }
        this.uiElements.playerInfoGroup = this.add.group();

        const panelWidth = 320;
        const panelHeight = 150;
        const panelX = 10;
        const panelY = 10;

        const infoPanel = this.add.graphics();
        infoPanel.fillStyle(0x000000, 0.7);
        infoPanel.lineStyle(2, 0x00ff00, 0.8);
        infoPanel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 10);
        infoPanel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 10);
        this.uiElements.playerInfoGroup.add(infoPanel);

        const playerSprite = this.add.sprite(panelX + 110, panelY + 45, 'ninja', 'idle/frame0000').setTint(this.character.tint).setScale(3);
        playerSprite.play('idle_animation');
        playerSprite.setDepth(10);
        this.uiElements.playerInfoGroup.add(playerSprite);

        const nameText = this.add.text(panelX + 150, panelY + 25, `${this.character.name}`, { fontSize: '22px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0, 0.5);
        const levelText = this.add.text(panelX + 150, panelY + 50, `Lv. ${this.character.level}`, { fontSize: '18px', fill: '#ffde00' }).setOrigin(0, 0.5);

        const totalStats = this.calculateTotalStats();

        const hpLabel = this.add.text(panelX + 150, panelY + 75, 'HP:', { fontSize: '16px', fill: '#dddddd' }).setOrigin(0, 0.5);
        const hpBar = this.makeBar(panelX + 185, panelY + 75, 120, 15, 0xff0000, this.character.currentHp, totalStats.hp);
        const hpValueText = this.add.text(panelX + 185 + 60, panelY + 75, `${this.character.currentHp}/${totalStats.hp}`, { fontSize: '12px', fill: '#ffffff' }).setOrigin(0.5, 0.5);

        const expLabel = this.add.text(panelX + 150, panelY + 100, 'EXP:', { fontSize: '16px', fill: '#dddddd' }).setOrigin(0, 0.5);
        const expBar = this.makeBar(panelX + 185, panelY + 100, 120, 15, 0x00aaff, this.character.exp, 100 * this.character.level);
        const expValueText = this.add.text(panelX + 185 + 60, panelY + 100, `${this.character.exp}/${100 * this.character.level}`, { fontSize: '12px', fill: '#ffffff' }).setOrigin(0.5, 0.5);

        const goldText = this.add.text(panelX + 150, panelY + 125, `Gold: ${this.character.gold}`, { fontSize: '18px', fill: '#ffde00' }).setOrigin(0, 0.5);

        this.uiElements.playerInfoGroup.addMultiple([
            nameText, levelText, hpLabel, hpBar.bg, hpBar.value, hpValueText, expLabel, expBar.bg, expBar.value, expValueText, goldText
        ]);
    }

    drawTopRightNavigation() {
        const panelWidth = 180;
        const panelHeight = 200;
        const panelX = this.cameras.main.width - panelWidth - 10;
        const panelY = 10;

        const navPanel = this.add.graphics();
        navPanel.fillStyle(0x000000, 0.7);
        navPanel.lineStyle(2, 0x00ff00, 0.8);
        navPanel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 10);
        navPanel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 10);

        const buttons = [
            { text: 'Fire Village', action: () => console.log('Fire Village clicked') },
            { text: 'World Map', action: () => console.log('World Map clicked') },
            { text: 'Home', action: () => console.log('Home clicked') },
            { text: 'Market', action: () => this.showPanel('shop') },
            { text: 'Settings', action: () => console.log('Settings clicked') },
            { text: 'Log Off', action: () => {
                localStorage.removeItem('playerCharacter');
                this.sound.stopAll();
                this.cleanUpScene();
                this.scene.start('CharacterSelectionScene');
            }}
        ];

        let yOffset = 20;
        buttons.forEach(btn => {
            const button = this.add.text(panelX + panelWidth / 2, panelY + yOffset, btn.text, { 
                fontSize: '15px', 
                fill: '#ffffff', 
                backgroundColor: '#333333', 
                padding: {x: 8, y: 3} 
            }).setOrigin(0.5);
            button.setInteractive({ useHandCursor: true });
            button.on('pointerdown', btn.action);
            button.on('pointerover', () => button.setBackgroundColor('#555555'));
            button.on('pointerout', () => button.setBackgroundColor('#333333'));
            yOffset += 32;
        });
    }

    drawInteractiveBuildings() {
        // Kosongkan array buildingObjects setiap kali digambar ulang
        this.buildingObjects.forEach(obj => obj.destroy());
        this.buildingObjects = [];

        const buildings = [
            { name: 'Item Shop', x: 265, y: 485, action: () => this.showPanel('shop'), key: 'building_item_shop', scale: 0.67, description: 'Beli dan jual item di sini.' },
            { name: 'Dojo', x: 640, y: 480, action: () => this.showPanel('skills'), key: 'building_dojo', scale: 0.67, description: 'Pelajari dan kelola jurusmu.' },
            { name: 'Arena', x: 630, y: 225, action: () => this.showPanel('arena'), key: 'building_arena', scale: 0.67, description: 'Lawan musuh dan dapatkan hadiah!' },
            { name: 'Armory', x: 415, y: 500, action: () => this.showPanel('equipment'), key: 'building_armory', scale: 0.67, description: 'Kelola perlengkapan karaktermu.' },
            { name: 'Inventory', x: 883, y: 333, action: () => this.showPanel('inventory'), key: 'building_inventory', scale: 0.67, description: 'Lihat dan jual item di tasmu.' },
            // { name: 'Mall', x: 650, y: 200, action: () => console.log('Mall clicked'), key: 'building_mall', scale: 0.67, description: 'Kunjungi pusat perbelanjaan premium.' },
            // { name: 'Card Room', x: 800, y: 250, action: () => console.log('Card Room clicked'), key: 'building_card_room', scale: 0.67, description: 'Mainkan kartu dan dapatkan bonus.' },
            { name: 'Quest', x: 628, y: 613, action: () => this.showPanel('quest'), key: 'building_quest', scale: 0.67, description: 'Ambil dan selesaikan misi.' },
            { name: 'Pet/Kenjutsu', x: 841, y: 560, action: () => console.log('Pet/Kenjutsu clicked'), key: 'building_pet_kenjutsu', scale: 0.67, description: 'Latih hewan peliharaan atau jurus pedang.' },
        ];

        buildings.forEach(building => {
            let buildingObject;
            if (building.key && this.textures.exists(building.key)) {
                buildingObject = this.add.image(building.x, building.y, building.key);
                buildingObject.setScale(building.scale !== undefined ? building.scale : 1.0); 
            } else {
                buildingObject = this.add.text(building.x, building.y, building.name, {
                    fontSize: '24px',
                    fill: '#ffde00',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    padding: { x: 10, y: 5 },
                    stroke: '#000',
                    strokeThickness: 2
                });
            }
            
            buildingObject.setOrigin(0.5);
            buildingObject.setInteractive({ useHandCursor: true });
            
            buildingObject.on('pointerdown', building.action);
            buildingObject.on('pointerover', (pointer) => {
                buildingObject.setScale((building.scale !== undefined ? building.scale : 1.0) * 1.1); 
                this.showBuildingTooltip(building.name, building.description, pointer.x, pointer.y);
            });
            buildingObject.on('pointerout', () => {
                buildingObject.setScale(building.scale !== undefined ? building.scale : 1.0); 
                this.hideBuildingTooltip();
            });

            this.buildingObjects.push(buildingObject); // Simpan referensi objek bangunan
        });
    }

    showBuildingTooltip(name, description, pointerX, pointerY) {
        this.hideBuildingTooltip();

        const tooltipTextContent = `${name}\n${description}`;

        const tooltipText = this.add.text(0, 0, tooltipTextContent, { 
            fontSize: '18px', 
            fill: '#ffffff', 
            backgroundColor: 'rgba(0,0,0,0.9)', 
            padding: {x: 10, y: 8}, 
            align: 'center', 
            wordWrap: { width: 200 } 
        });

        let tooltipX = pointerX;
        let tooltipY = pointerY - tooltipText.height / 2 - 20;

        if (tooltipX - tooltipText.width / 2 < 0) {
            tooltipX = tooltipText.width / 2 + 10;
        } else if (tooltipX + tooltipText.width / 2 > this.cameras.main.width) {
            tooltipX = this.cameras.main.width - tooltipText.width / 2 - 10;
        }

        if (tooltipY < 10) {
            tooltipY = pointerY + tooltipText.height / 2 + 20;
        }

        tooltipText.setPosition(tooltipX, tooltipY).setOrigin(0.5);

        this.tooltipGroup.add(tooltipText);
    }

    hideBuildingTooltip() {
        this.tooltipGroup.clear(true, true);
    }

    drawQuestPanel() {
        const panelWidth = 300;
        const panelHeight = 250;
        const panelX = this.cameras.main.width - panelWidth - 10;
        const panelY = this.cameras.main.height - panelHeight - 10;

        const questPanel = this.add.graphics();
        questPanel.fillStyle(0x000000, 0.7);
        questPanel.lineStyle(2, 0x00ff00, 0.8);
        questPanel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 10);
        questPanel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 10);

        this.add.text(panelX + panelWidth / 2, panelY + 20, 'Quest Navigation', { fontSize: '22px', fill: '#ffde00' }).setOrigin(0.5);

        const quests = [
            { name: 'Kalahkan Goblin', status: 'In Progress', progress: '0/5' },
            { name: 'Kumpulkan 10 Gold', status: 'Available', progress: '' }
        ];

        let yOffset = 60;
        quests.forEach(quest => {
            this.add.text(panelX + 20, panelY + yOffset, quest.name, { fontSize: '18px', fill: '#ffffff' });
            this.add.text(panelX + 20, panelY + yOffset + 20, `${quest.status}: ${quest.progress}`, { fontSize: '14px', fill: '#aaaaaa' });
            yOffset += 50;
        });
    }

    drawChatBox() {
        const panelWidth = 400;
        const panelHeight = 150;
        const panelX = 10;
        const panelY = this.cameras.main.height - panelHeight - 10;

        const chatPanel = this.add.graphics();
        chatPanel.fillStyle(0x000000, 0.7);
        chatPanel.lineStyle(2, 0x00ff00, 0.8);
        chatPanel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 10);
        chatPanel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 10);

        this.add.text(panelX + 20, panelY + 10, 'All | World | System', { fontSize: '16px', fill: '#ffffff' });
        this.add.text(panelX + 20, panelY + 40, 'Chat log...', { fontSize: '14px', fill: '#cccccc' });
        this.add.text(panelX + 20, panelY + panelHeight - 30, 'Type message here...', { fontSize: '14px', fill: '#888888' });
    }

    showPanel(panelType) {
        // Sembunyikan tooltip bangunan saat panel modal dibuka
        this.hideBuildingTooltip(); 
        // Nonaktifkan interaktivitas bangunan
        this.setBuildingInteractivity(false);

        // Hancurkan panel sebelumnya jika ada
        if (this.modalPanelGroup) { // Menggunakan this.modalPanelGroup
            this.modalPanelGroup.destroy(true, true);
            this.modalPanelGroup = null;
        }

        const panelX = this.cameras.main.width / 2 - 250;
        const panelY = this.cameras.main.height / 2 - 200;
        const panelWidth = 500;
        const panelHeight = 400;

        // Buat grup baru dan simpan di this.modalPanelGroup
        this.modalPanelGroup = this.add.group(); 

        const panelBg = this.add.graphics();
        panelBg.fillStyle(0x000000, 0.9);
        panelBg.lineStyle(4, 0xffde00, 1);
        panelBg.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 15);
        panelBg.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 15);
        panelBg.setDepth(100); 
        this.modalPanelGroup.add(panelBg); // Menggunakan this.modalPanelGroup

        const closeButton = this.add.text(panelX + panelWidth - 30, panelY + 15, 'X', { fontSize: '24px', fill: '#ff0000', backgroundColor: '#333333', padding: {x: 8, y: 5} }).setOrigin(0.5);
        closeButton.setInteractive({ useHandCursor: true });
        closeButton.on('pointerdown', () => {
            this.modalPanelGroup.destroy(true, true); // Menggunakan this.modalPanelGroup
            this.modalPanelGroup = null;
            this.hideItemTooltip();
            this.setBuildingInteractivity(true); // Aktifkan kembali interaktivitas bangunan
        });
        closeButton.setDepth(101); 
        this.modalPanelGroup.add(closeButton); // Menggunakan this.modalPanelGroup

        let titleText = '';
        let contentY = panelY + 70;

        switch (panelType) {
            case 'shop':
                titleText = 'TOKO SENJATA';
                this.drawShopContent(this.modalPanelGroup, panelX, contentY, panelWidth); // Menggunakan this.modalPanelGroup
                break;
            case 'equipment':
                titleText = 'EQUIPMENT';
                this.drawEquipmentContent(this.modalPanelGroup, panelX, contentY, panelWidth); // Menggunakan this.modalPanelGroup
                break;
            case 'inventory':
                titleText = 'TAS (Klik untuk Jual)';
                this.drawInventoryContent(this.modalPanelGroup, panelX, contentY, panelWidth); // Menggunakan this.modalPanelGroup
                break;
            case 'skills':
                titleText = 'DOJO JURUS';
                this.drawSkillsContent(this.modalPanelGroup, panelX, contentY, panelWidth); // Menggunakan this.modalPanelGroup
                break;
            case 'arena':
                titleText = 'PILIH LAWAN';
                this.drawArenaContent(this.modalPanelGroup, panelX, contentY, panelWidth); // Menggunakan this.modalPanelGroup
                break;
            case 'quest':
                titleText = 'DAFTAR QUEST';
                this.drawQuestListContent(this.modalPanelGroup, panelX, contentY, panelWidth); // Menggunakan this.modalPanelGroup
                break;
        }

        const title = this.add.text(panelX + panelWidth / 2, panelY + 30, titleText, { fontSize: '32px', fill: '#ffde00', fontStyle: 'bold' }).setOrigin(0.5);
        title.setDepth(101);
        this.modalPanelGroup.add(title); // Menggunakan this.modalPanelGroup

        this.currentPanel = this.modalPanelGroup; // currentPanel menunjuk ke modalPanelGroup
    }

    // Fungsi baru untuk mengaktifkan/menonaktifkan interaktivitas bangunan
    setBuildingInteractivity(active) {
        this.buildingObjects.forEach(obj => {
            obj.setInteractive(active);
            if (!active) {
                obj.input.enabled = false; // Pastikan input dinonaktifkan sepenuhnya
                // Kembalikan skala normal jika dinonaktifkan saat hover
                obj.setScale(obj.scale !== undefined ? obj.scale : 1.0); 
            } else {
                obj.input.enabled = true; // Aktifkan kembali input
            }
        });
    }

    drawQuestListContent(panelGroup, panelX, startY, panelWidth) {
        let yPos = startY;
        const quests = [
            { name: 'Kalahkan Goblin', description: 'Kalahkan 5 Goblin di Hutan', status: 'In Progress (0/5)' },
            { name: 'Kumpulkan 10 Gold', description: 'Kumpulkan 10 Gold dari musuh', status: 'Available' },
            { name: 'Temukan Pedang Legendaris', description: 'Temukan Pedang Legendaris di Gua Naga', status: 'Not Started' }
        ];

        if (quests.length === 0) {
            const emptyText = this.add.text(panelX + panelWidth / 2, yPos, 'Tidak ada quest aktif.', { fontSize: '18px', fill: '#888888' }).setOrigin(0.5);
            emptyText.setDepth(101);
            panelGroup.add(emptyText);
        } else {
            quests.forEach(quest => {
                const questNameText = this.add.text(panelX + 20, yPos, quest.name, { fontSize: '20px', fill: '#ffffff', fontStyle: 'bold' });
                const questDescText = this.add.text(panelX + 20, yPos + 25, quest.description, { fontSize: '16px', fill: '#cccccc' });
                const questStatusText = this.add.text(panelX + panelWidth - 20, yPos + 15, quest.status, { fontSize: '16px', fill: '#00ff00' }).setOrigin(1, 0.5);

                questNameText.setDepth(101);
                questDescText.setDepth(101);
                questStatusText.setDepth(101);

                panelGroup.addMultiple([questNameText, questDescText, questStatusText]);
                yPos += 70;
            });
        }
    }

    drawShopContent(panelGroup, panelX, startY, panelWidth) {
        let yPos = startY;
        for (const type in EQUIPMENT) {
            EQUIPMENT[type].forEach(item => {
                const itemText = `${item.name} (${item.price} G)`;
                const buttonElements = this.createInteractiveButton(panelX + panelWidth / 2, yPos, itemText, panelWidth - 40, 45, () => {
                    this.buyItem(item);
                    this.updatePanelContent('shop');
                }, '#fff', item);
                buttonElements.forEach(el => el.setDepth(101)); // Pastikan elemen tombol di atas panel
                panelGroup.addMultiple(buttonElements);
                yPos += 50;
            });
        }
    }

    drawEquipmentContent(panelGroup, panelX, startY, panelWidth) {
        const slots = ['weapon', 'armor', 'boots'];
        let yPos = startY;
        slots.forEach((slot) => {
            const currentItem = this.character.equipment[slot];
            const itemText = currentItem ? currentItem.name : `[${slot}] Kosong`;

            const buttonElements = this.createInteractiveButton(panelX + panelWidth / 2, yPos, itemText, panelWidth - 40, 40, () => {
                this.changeEquipment(slot);
                this.updatePanelContent('equipment');
            }, '#fff', currentItem);
            buttonElements.forEach(el => el.setDepth(101));
            panelGroup.addMultiple(buttonElements);
            yPos += 50;
        });
    }

    drawInventoryContent(panelGroup, panelX, startY, panelWidth) {
        let yPos = startY;
        if (this.character.inventory.length === 0) {
            const emptyText = this.add.text(panelX + panelWidth / 2, yPos, 'Inventaris Kosong', { fontSize: '18px', fill: '#888888' }).setOrigin(0.5);
            emptyText.setDepth(101);
            panelGroup.add(emptyText);
        } else {
            this.character.inventory.forEach((item, index) => {
                const sellPrice = Math.floor(item.price / 2);
                const itemText = `${item.name} (+${sellPrice} G)`;
                const buttonElements = this.createInteractiveButton(panelX + panelWidth / 2, yPos, itemText, panelWidth - 40, 40, () => {
                    this.sellItem(item, index);
                    this.updatePanelContent('inventory');
                }, '#dddddd', item);
                buttonElements.forEach(el => el.setDepth(101));
                panelGroup.addMultiple(buttonElements);
                yPos += 50;
            });
        }
    }

    drawSkillsContent(panelGroup, panelX, startY, panelWidth) {
        let yPos = startY;
        SKILLS.forEach((skill) => {
            const isSelected = this.selectedSkills.some(s => s.name === skill.name);
            const buttonElements = this.createInteractiveButton(panelX + panelWidth / 2, yPos, skill.name, panelWidth - 40, 40, (buttonText) => {
                const skillIndex = this.selectedSkills.findIndex(s => s.name === skill.name);
                if (skillIndex > -1) {
                    this.selectedSkills.splice(skillIndex, 1);
                    buttonText.setFill('#fff');
                } else {
                    if (this.selectedSkills.length < 3) {
                        this.selectedSkills.push(skill);
                        buttonText.setFill('#00ff00');
                    } else {
                        const fullText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 50, 'Skill sudah penuh (maks 3)!', { fontSize: '24px', fill: '#ff0000', backgroundColor: 'rgba(0,0,0,0.7)', padding: {x:10, y:5} }).setOrigin(0.5);
                        fullText.setDepth(101);
                        this.time.delayedCall(1500, () => fullText.destroy());
                    }
                }
                this.character.skills = this.selectedSkills;
                localStorage.setItem('playerCharacter', JSON.stringify(this.character));
            }, isSelected ? '#00ff00' : '#fff', skill);
            buttonElements.forEach(el => el.setDepth(101));
            panelGroup.addMultiple(buttonElements);
            yPos += 50;
        });
    }

    drawArenaContent(panelGroup, panelX, startY, panelWidth) {
        let yPos = startY;
        ENEMIES.forEach((enemy) => {
            const buttonElements = this.createInteractiveButton(panelX + panelWidth / 2, yPos, `Lawan: ${enemy.name}`, panelWidth - 40, 45, () => {
                this.sound.stopAll();
                this.scene.start('BattleScene', {
                    character: this.character,
                    skills: this.selectedSkills,
                    enemy: enemy
                });
            }, '#ff9999');
            buttonElements.forEach(el => el.setDepth(101));
            panelGroup.addMultiple(buttonElements);
            yPos += 55;
        });
    }

    updatePanelContent(panelType) {
        // Ini dipanggil saat konten panel perlu diperbarui, jadi kita perlu menghancurkan dan membuat ulang
        // currentPanel (yang sekarang adalah this.modalPanelGroup)
        if (this.modalPanelGroup) {
            this.modalPanelGroup.destroy(true, true);
            this.modalPanelGroup = null; // Setel kembali ke null setelah dihancurkan
        }

        const panelX = this.cameras.main.width / 2 - 250;
        const panelY = this.cameras.main.height / 2 - 200;
        const panelWidth = 500;
        const panelHeight = 400;

        // Buat grup baru dan simpan di this.modalPanelGroup
        this.modalPanelGroup = this.add.group();

        const panelBg = this.add.graphics();
        panelBg.fillStyle(0x000000, 0.9);
        panelBg.lineStyle(4, 0xffde00, 1);
        panelBg.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 15);
        panelBg.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 15);
        panelBg.setDepth(100);
        this.modalPanelGroup.add(panelBg);

        const closeButton = this.add.text(panelX + panelWidth - 30, panelY + 15, 'X', { fontSize: '24px', fill: '#ff0000', backgroundColor: '#333333', padding: {x: 8, y: 5} }).setOrigin(0.5);
        closeButton.setInteractive({ useHandCursor: true });
        closeButton.on('pointerdown', () => {
            this.modalPanelGroup.destroy(true, true);
            this.modalPanelGroup = null;
            this.hideItemTooltip();
            this.setBuildingInteractivity(true);
        });
        closeButton.setDepth(101);
        this.modalPanelGroup.add(closeButton);

        let titleText = '';
        const contentY = panelY + 70;

        switch (panelType) {
            case 'shop':
                titleText = 'TOKO SENJATA';
                this.drawShopContent(this.modalPanelGroup, panelX, contentY, panelWidth);
                break;
            case 'equipment':
                titleText = 'EQUIPMENT';
                this.drawEquipmentContent(this.modalPanelGroup, panelX, contentY, panelWidth);
                break;
            case 'inventory':
                titleText = 'TAS (Klik untuk Jual)';
                this.drawInventoryContent(this.modalPanelGroup, panelX, contentY, panelWidth);
                break;
            case 'skills':
                titleText = 'DOJO JURUS';
                this.drawSkillsContent(this.modalPanelGroup, panelX, contentY, panelWidth);
                break;
            case 'arena':
                titleText = 'PILIH LAWAN';
                this.drawArenaContent(this.modalPanelGroup, panelX, contentY, panelWidth);
                break;
            case 'quest':
                titleText = 'DAFTAR QUEST';
                this.drawQuestListContent(this.modalPanelGroup, panelX, contentY, panelWidth);
                break;
        }

        const title = this.add.text(panelX + panelWidth / 2, panelY + 30, titleText, { fontSize: '32px', fill: '#ffde00', fontStyle: 'bold' }).setOrigin(0.5);
        title.setDepth(101);
        this.modalPanelGroup.add(title);
        
        // drawPlayerInfo() tidak perlu dipanggil di sini karena sudah dipanggil di create()
        // dan hanya perlu diperbarui jika ada perubahan data pemain yang ditampilkan di panel info utama
    }

    sellItem(itemToSell, indexInInventory) {
        const sellPrice = Math.floor(itemToSell.price / 2);
        this.character.gold += sellPrice;

        for (const slot in this.character.equipment) {
            const equippedItem = this.character.equipment[slot];
            if (equippedItem && equippedItem.name === itemToSell.name) {
                this.character.equipment[slot] = null;
            }
        }

        this.character.inventory.splice(indexInInventory, 1);
        localStorage.setItem('playerCharacter', JSON.stringify(this.character));
        this.drawPlayerInfo();
    }

    buyItem(item) {
        if (this.character.gold >= item.price) {
            this.character.gold -= item.price;
            this.character.inventory.push(item);
            localStorage.setItem('playerCharacter', JSON.stringify(this.character));

            this.drawPlayerInfo();
            const successText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, `Membeli ${item.name}!`, { fontSize: '32px', fill: '#00ff00', backgroundColor: 'rgba(0,0,0,0.7)', padding: {x:10, y:5} }).setOrigin(0.5);
            successText.setDepth(102); // Pastikan notifikasi di atas modal
            this.time.delayedCall(2000, () => successText.destroy());

        } else {
            const failText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, `Gold tidak cukup!`, { fontSize: '32px', fill: '#ff0000', backgroundColor: 'rgba(0,0,0,0.7)', padding: {x:10, y:5} }).setOrigin(0.5);
            failText.setDepth(102); // Pastikan notifikasi di atas modal
            this.time.delayedCall(2000, () => failText.destroy());
        }
    }

    changeEquipment(slot) {
        const ownedItems = this.character.inventory.filter(item => item.type === slot);
        const currentItem = this.character.equipment[slot];

        let currentIndex = -1;
        if (currentItem) {
            currentIndex = ownedItems.findIndex(item => item.name === currentItem.name);
        }

        const nextIndex = currentIndex + 1;
        if (nextIndex < ownedItems.length) {
            this.character.equipment[slot] = ownedItems[nextIndex];
        } else {
            this.character.equipment[slot] = null;
        }

        localStorage.setItem('playerCharacter', JSON.stringify(this.character));
        this.drawPlayerInfo();
    }

    calculateTotalStats() {
        const char = this.character;
        let totalStr = char.stats.str + (char.level - 1);
        let totalAgi = char.stats.agi + Math.floor((char.level - 1) / 2);
        let totalSta = char.stats.sta + (char.level - 1);

        for (const slot in char.equipment) {
            const item = char.equipment[slot];
            if (item) {
                totalStr += item.stats.str;
                totalAgi += item.stats.agi;
                totalSta += item.stats.sta;
            }
        }
        return {
            hp: totalSta * 10,
            atk: totalStr,
            agi: totalAgi,
            currentHp: char.currentHp || (totalSta * 10)
        };
    }

    checkForLevelUp() {
        const requiredExp = 100 * this.character.level;
        if (this.character.exp >= requiredExp) {
            this.character.level++;
            this.character.exp -= requiredExp;

            this.character.stats.str++;
            this.character.stats.sta++;
            if (this.character.level % 2 === 0) {
                this.character.stats.agi++;
            }
            localStorage.setItem('playerCharacter', JSON.stringify(this.character));
            this.drawPlayerInfo();

            const levelUpText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, `LEVEL UP! Lv. ${this.character.level}`, {
                fontSize: '64px', fill: '#ffde00', stroke: '#000', strokeThickness: 8
            }).setOrigin(0.5);
            levelUpText.setDepth(102); // Pastikan notifikasi di atas modal
            this.tweens.add({
                targets: levelUpText,
                scale: 1.2,
                duration: 500,
                yoyo: true,
                onComplete: () => {
                    this.time.delayedCall(2000, () => levelUpText.destroy());
                }
            });
        }
    }

    createInteractiveButton(x, y, text, width, height, onClick, color = '#fff', itemData = null) {
        const buttonBg = this.add.graphics();
        const buttonText = this.add.text(x, y, text, { fontSize: '20px', fill: color }).setOrigin(0.5);

        const drawButton = (bgColor, bgAlpha, borderColor = 0xaaaaaa, borderWidth = 2) => {
            buttonBg.clear();
            buttonBg.fillStyle(bgColor, bgAlpha);
            buttonBg.lineStyle(borderWidth, borderColor, 1);
            buttonBg.fillRoundedRect(x - width/2, y - height/2, width, height, 8);
            buttonBg.strokeRoundedRect(x - width/2, y - height/2, width, height, 8);
        };

        drawButton(0x333333, 0.8, 0x00ff00, 1);

        const hitZone = this.add.zone(x, y, width, height).setInteractive({ useHandCursor: true });

        hitZone.on('pointerover', () => {
            drawButton(0x555555, 1, 0xffff00, 2);
            if (itemData && itemData.name) this.showItemTooltip(itemData, x, y);
        });
        hitZone.on('pointerout', () => {
            drawButton(0x333333, 0.8, 0x00ff00, 1);
            if (itemData && itemData.name) this.hideItemTooltip();
        });
        hitZone.on('pointerdown', () => onClick(buttonText));

        return [buttonBg, buttonText, hitZone];
    }

    showItemTooltip(item, pointerX, pointerY) {
        this.hideItemTooltip();

        const stats = [];
        if (item.stats) {
            if (item.stats.str !== 0) stats.push(`STR: ${item.stats.str > 0 ? '+' : ''}${item.stats.str}`);
            if (item.stats.agi !== 0) stats.push(`AGI: ${item.stats.agi > 0 ? '+' : ''}${item.stats.agi}`);
            if (item.stats.sta !== 0) stats.push(`STA: ${item.stats.sta > 0 ? '+' : ''}${item.stats.sta}`);
        }
        if (item.price !== undefined) {
            stats.push(`Harga: ${item.price} G`);
        }
        if (item.type) {
            stats.push(`Tipe: ${item.type.charAt(0).toUpperCase() + item.type.slice(1)}`);
        }

        const tooltipTextContent = `${item.name}\n${stats.join('\n')}`;

        const tooltipText = this.add.text(0, 0, tooltipTextContent, { fontSize: '16px', fill: '#ffffff', backgroundColor: 'rgba(0,0,0,0.9)', padding: {x: 8, y: 5}, align: 'left' });
        tooltipText.setDepth(102); // Pastikan tooltip di atas modal

        let tooltipX = pointerX + tooltipText.width / 2 + 10;
        let tooltipY = pointerY;

        if (tooltipX + tooltipText.width > this.cameras.main.width) {
            tooltipX = pointerX - tooltipText.width / 2 - 10;
        }
        if (tooltipY + tooltipText.height > this.cameras.main.height) {
            tooltipY = this.cameras.main.height - tooltipText.height - 10;
        }
        if (tooltipY < 0) {
            tooltipY = 10;
        }

        tooltipText.setPosition(tooltipX, tooltipY).setOrigin(0, 0.5);

        this.tooltipGroup.add(tooltipText);
    }

    hideItemTooltip() {
        this.tooltipGroup.clear(true, true);
    }

    makeBar(x, y, width, height, color, currentValue, maxValue) {
        let bg = this.add.graphics();
        let value = this.add.graphics();
        
        bg.fillStyle(0x000000, 0.8);
        bg.fillRect(x, y, width, height);

        value.fillStyle(color);
        const percentage = Math.min(currentValue / maxValue, 1);
        value.fillRect(x, y, width * percentage, height);

        return { bg, value };
    }

    showBattleResultNotification(result) {
        let resultText = '';
        let resultColor = '';
        if (result === 'MENANG') {
            resultText = 'Kamu MENANG!';
            resultColor = '#00ff00';
        } else if (result === 'KALAH') {
            resultText = 'Kamu KALAH!';
            resultColor = '#ff0000';
        } else {
            resultText = 'Pertarungan SERI!';
            resultColor = '#ffff00';
        }

        const battleResultDisplay = this.add.text(this.cameras.main.width / 2, 80, resultText, { fontSize: '48px', fill: resultColor, stroke: '#000', strokeThickness: 6 }).setOrigin(0.5);
        battleResultDisplay.setDepth(102); // Pastikan notifikasi di atas modal
        this.time.delayedCall(3000, () => {
            if(battleResultDisplay) battleResultDisplay.destroy();
        });
    }

    showItemDropNotification(item) {
        const panelX = this.cameras.main.width / 2 - 200;
        const panelY = this.cameras.main.height / 2 - 100;

        const panel = this.add.graphics();
        panel.fillStyle(0x000000, 0.8);
        panel.lineStyle(2, 0xffde00, 1);
        panel.fillRoundedRect(panelX, panelY, 400, 200, 15);
        panel.strokeRoundedRect(panelX, panelY, 400, 200, 15);
        panel.setDepth(102); // Pastikan notifikasi di atas modal

        const title = this.add.text(this.cameras.main.width / 2, panelY + 40, 'ITEM DROP!', { fontSize: '40px', fill: '#ffde00', fontStyle: 'bold' }).setOrigin(0.5);
        const itemName = this.add.text(this.cameras.main.width / 2, panelY + 100, item.name, { fontSize: '32px', fill: '#ffffff' }).setOrigin(0.5);
        title.setDepth(103);
        itemName.setDepth(103);

        const stats = [];
        if (item.stats.str > 0) stats.push(`STR: +${item.stats.str}`);
        if (item.stats.str < 0) stats.push(`STR: ${item.stats.str}`);
        if (item.stats.agi > 0) stats.push(`AGI: +${item.stats.agi}`);
        if (item.stats.agi < 0) stats.push(`AGI: ${item.stats.agi}`);
        if (item.stats.sta > 0) stats.push(`STA: +${item.stats.sta}`);
        if (item.stats.sta < 0) stats.push(`STA: ${item.stats.sta}`);

        const statsText = this.add.text(this.cameras.main.width / 2, panelY + 150, stats.join(' | '), { fontSize: '20px', fill: '#dddddd' }).setOrigin(0.5);
        statsText.setDepth(103);

        const notificationGroup = this.add.group([panel, title, itemName, statsText]);
        notificationGroup.setDepth(102); // Set depth untuk seluruh grup notifikasi

        this.tweens.add({
            targets: notificationGroup.getChildren(),
            alpha: { from: 0, to: 1 },
            scale: { from: 0.8, to: 1 },
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                this.time.delayedCall(3500, () => {
                    this.tweens.add({
                        targets: notificationGroup.getChildren(),
                        alpha: { from: 1, to: 0 },
                        duration: 500,
                        onComplete: () => notificationGroup.destroy(true)
                    });
                });
            }
        });
    }
}
