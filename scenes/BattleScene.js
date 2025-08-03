export default class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BattleScene' });
    }

    init(data) {
        this.playerData = data.character;
        this.playerSkills = data.skills || [];
        this.enemyData = data.enemy;
    }

    preload() {
        this.load.atlas('player_knight', 'https://labs.phaser.io/assets/animations/knight.png', 'https://labs.phaser.io/assets/animations/knight.json');
        this.load.spritesheet('enemy_mummy', 'https://labs.phaser.io/assets/sprites/metalslug_mummy37x45.png', { frameWidth: 37, frameHeight: 45 });
        
        this.load.spritesheet('fire_anim', 'assets/fire_animation.png', { frameWidth: 400, frameHeight: 2000 });
        
        this.load.image('bg_forest', 'assets/background.png');
        this.load.image('bg_cave', 'assets/background_cave.webp');
        this.load.image('bg_nightwood', 'assets/background_nightwood.jpg');

        this.load.audio('battle_music', 'assets/battle_music.mp3');
    }

    create() {
        this.bgm = this.sound.add('battle_music', { loop: true, volume: 0.5 });
        this.bgm.play();

        const bg = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, this.enemyData.backgroundKey);
        const scaleX = this.cameras.main.width / bg.width;
        const scaleY = this.cameras.main.height / bg.height;
        const scale = Math.max(scaleX, scaleY);
        bg.setScale(scale).setScrollFactor(0);

        this.state = 'IDLE';
        this.isBattleOver = false;
        this.timeScale = 1; 
        this.MOVEMENT_SPEED = 150;

        this.battleLog = [];
        this.logGroup = this.add.group();
        this.drawLogPanel();

        this.createStatusEffectTextures();

        const groundLevel = this.enemyData.groundLevel || 150;
        const characterY = this.cameras.main.height - groundLevel;

        // --- PERBAIKAN: Tanah tak terlihat sekarang berada di posisi kaki karakter ---
        let ground = this.add.rectangle(this.cameras.main.width / 2, characterY, this.cameras.main.width, 32, 0x000000, 0).setOrigin(0.5, 0);
        this.physics.add.existing(ground, true);

        const totalStats = this.calculateTotalStats();
        this.player = this.physics.add.sprite(300, characterY, this.playerData.key);
        // --- PERBAIKAN: Set origin ke tengah-bawah ---
        this.player.setOrigin(0.5, 1);
        this.player.setTint(this.playerData.tint).setScale(2);
        this.player.setBounce(0.1).setCollideWorldBounds(true);
        this.physics.add.collider(this.player, ground);
        this.player.maxHp = totalStats.hp;
        this.player.hp = this.player.maxHp;
        this.player.agi = totalStats.agi;
        this.player.originalX = this.player.x;
        this.player.attackDamage = totalStats.atk;
        this.player.skills = this.playerSkills.map(s => ({ ...s, currentCooldown: 0 }));
        this.player.statusEffects = [];
        this.player.effectIcons = [];
        this.player.name = this.playerData.name;

        this.enemy = this.physics.add.sprite(this.cameras.main.width - 300, characterY, this.enemyData.key);
        // --- PERBAIKAN: Set origin ke tengah-bawah ---
        this.enemy.setOrigin(0.5, 1);
        this.enemy.setTint(this.enemyData.tint).setScale(2);
        this.enemy.setBounce(0.1).setCollideWorldBounds(true);
        this.physics.add.collider(this.enemy, ground);
        this.enemy.maxHp = this.enemyData.stats.hp;
        this.enemy.hp = this.enemy.maxHp;
        this.enemy.agi = this.enemyData.stats.agi;
        this.enemy.originalX = this.enemy.x;
        this.enemy.attackDamage = this.enemyData.stats.atk;
        this.enemy.skills = this.enemyData.skills.map(s => ({ ...s, currentCooldown: 0 }));
        this.enemy.statusEffects = [];
        this.enemy.effectIcons = [];
        this.enemy.name = this.enemyData.name;
        this.enemy.setFlipX(true);

        this.playerHealthBar = this.makeHealthBar(100, 40, 0x2ecc71);
        this.enemyHealthBar = this.makeHealthBar(this.cameras.main.width - 300, 40, 0xe74c3c);
        
        this.add.text(100, 20, `${this.playerData.name} - Lv. ${this.playerData.level}`, { fontSize: '18px', fill: '#ffffff' });
        this.add.text(this.cameras.main.width - 300, 20, this.enemyData.name, { fontSize: '18px', fill: '#ffffff' });

        this.createAnims();
        this.createBattleUI(); 

        this.player.anims.play('knight_idle');
        this.enemy.anims.play(this.enemyData.key === 'enemy_mummy' ? 'mummy_idle' : 'knight_idle');
        
        if (this.player.agi >= this.enemy.agi) {
            this.currentTurn = 'player';
        } else {
            this.currentTurn = 'enemy';
        }

        this.time.delayedCall(1000, () => { if (!this.isBattleOver) this.state = 'DECIDING_ACTION'; }, [], this);
    }
    
    // ... (sisa fungsi di BattleScene tetap sama) ...
    // --- (Salin sisa fungsi dari kode sebelumnya: calculateTotalStats, createAnims, createBattleUI, skipBattle, makeHealthBar, updateSkillCooldowns, showFloatingText, playSkillEffect, processStatusEffects, dealDamage, update, endTurn) ---
    calculateTotalStats() {
        const char = this.playerData;
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
            agi: totalAgi
        };
    }

    createAnims() {
        this.anims.create({
            key: 'knight_idle',
            frames: this.anims.generateFrameNames('player_knight', { prefix: 'idle/frame', start: 0, end: 5, zeroPad: 4 }),
            frameRate: 8,
            repeat: -1
        });
        this.anims.create({
            key: 'knight_walk',
            frames: this.anims.generateFrameNames('player_knight', { prefix: 'run/frame', start: 0, end: 5, zeroPad: 4 }),
            frameRate: 8,
            repeat: -1
        });
        this.anims.create({
            key: 'knight_attack',
            frames: this.anims.generateFrameNames('player_knight', { prefix: 'attack_A/frame', start: 0, end: 5, zeroPad: 4 }),
            frameRate: 12
        });

        this.anims.create({ 
            key: 'mummy_walk', 
            frames: this.anims.generateFrameNumbers('enemy_mummy', { start: 0, end: 15 }), 
            frameRate: 20, 
            repeat: -1 
        });
        this.anims.create({ 
            key: 'mummy_idle', 
            frames: [ { key: 'enemy_mummy', frame: 0 } ], 
            frameRate: 20 
        });
        this.anims.create({ 
            key: 'mummy_attack', 
            frames: this.anims.generateFrameNumbers('enemy_mummy', { start: 0, end: 15 }), 
            frameRate: 20
        });

        this.anims.create({ 
            key: 'fire_burn', 
            frames: this.anims.generateFrameNumbers('fire_anim', { start: 0, end: 8 }), 
            frameRate: 15, 
            repeat: -1 
        });
    }

    createBattleUI() {
        const xPos = this.cameras.main.width - 100;
        const yPos1 = 80;
        const yPos2 = 110;

        const speedButton1x = this.add.text(xPos - 40, yPos1, 'x1', { fontSize: '20px', fill: '#ffde00' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        const speedButton2x = this.add.text(xPos, yPos1, 'x2', { fontSize: '20px', fill: '#ffffff' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        const speedButton3x = this.add.text(xPos + 40, yPos1, 'x3', { fontSize: '20px', fill: '#ffffff' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        const skipButton = this.add.text(xPos, yPos2, 'Skip', { fontSize: '20px', fill: '#ff5555' }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        const speedButtons = [speedButton1x, speedButton2x, speedButton3x];

        const setSpeed = (speed, selectedButton) => {
            this.timeScale = speed;
            this.tweens.timeScale = speed;
            this.time.timeScale = speed;
            this.anims.globalTimeScale = speed; 
            speedButtons.forEach(btn => btn.setFill('#ffffff'));
            selectedButton.setFill('#ffde00');
        };

        speedButton1x.on('pointerdown', () => setSpeed(1, speedButton1x));
        speedButton2x.on('pointerdown', () => setSpeed(2, speedButton2x));
        speedButton3x.on('pointerdown', () => setSpeed(3, speedButton3x));
        skipButton.on('pointerdown', () => this.skipBattle());
    }
    
    skipBattle() {
        if (this.isBattleOver) return;
        
        this.isBattleOver = true;
        this.tweens.killAll();

        let simPlayer = { hp: this.player.hp, skills: JSON.parse(JSON.stringify(this.player.skills)) };
        let simEnemy = { hp: this.enemy.hp, skills: JSON.parse(JSON.stringify(this.enemy.skills)) };
        let turn = this.currentTurn;
        let result = '';
        let droppedItem = null;
        
        let turnCounter = 0;
        const MAX_TURNS = 100;

        while (simPlayer.hp > 0 && simEnemy.hp > 0) {
            if (turnCounter > MAX_TURNS) {
                result = 'SERI';
                break;
            }

            if (turn === 'player') {
                let usedSkill = null;
                for (const skill of simPlayer.skills) {
                    if (skill.currentCooldown === 0) {
                        usedSkill = skill;
                        break;
                    }
                }
                
                let damage = this.player.attackDamage;
                if(usedSkill) {
                    damage *= usedSkill.damageMultiplier;
                    usedSkill.currentCooldown = usedSkill.cooldown;
                }
                
                if (Phaser.Math.Between(1, 100) > this.enemy.agi) {
                    simEnemy.hp -= Math.floor(damage);
                }

                simPlayer.skills.forEach(s => { if(s.currentCooldown > 0) s.currentCooldown--; });
                turn = 'enemy';

            } else { 
                let usedSkill = null;
                for (const skill of simEnemy.skills) {
                    if (skill.currentCooldown === 0) {
                        usedSkill = skill;
                        break;
                    }
                }

                let damage = this.enemy.attackDamage;
                if(usedSkill) {
                    damage *= usedSkill.damageMultiplier;
                    usedSkill.currentCooldown = usedSkill.cooldown;
                }

                if (Phaser.Math.Between(1, 100) > this.player.agi) {
                    simPlayer.hp -= Math.floor(damage);
                }

                simEnemy.skills.forEach(s => { if(s.currentCooldown > 0) s.currentCooldown--; });
                turn = 'player';
            }
            turnCounter++;
        }
        
        if (!result) {
            result = simPlayer.hp > 0 ? 'MENANG' : 'KALAH';
        }
        
        if (result === 'MENANG') {
            for (const drop of this.enemyData.dropTable) {
                if (Phaser.Math.Between(1, 100) <= drop.chance) {
                    droppedItem = drop.item;
                    break; 
                }
            }
        }

        this.player.setVisible(false);
        this.enemy.setVisible(false);
        
        let resultColor = '#ffff00';
        if (result === 'MENANG') resultColor = '#00ff00';
        if (result === 'KALAH') resultColor = '#ff0000';

        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, result, { fontSize: '64px', fill: resultColor }).setOrigin(0.5);

        this.time.delayedCall(1500, () => {
            if (this.bgm) this.bgm.stop();
            this.time.timeScale = 1;
            this.anims.globalTimeScale = 1;
            this.scene.start('MainMenuScene', { 
                character: this.playerData, 
                battleResult: result,
                droppedItem: droppedItem,
                goldDrop: result === 'MENANG' ? this.enemyData.gold : 0
            });
        }, [], this);
    }

    makeHealthBar(x, y, color) {
        let bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.5);
        bg.fillRect(0, 0, 200, 20);
        bg.x = x;
        bg.y = y;

        let value = this.add.graphics();
        value.fillStyle(color);
        value.fillRect(0, 0, 200, 20);
        value.x = x;
        value.y = y;

        return { bg: bg, value: value };
    }

    updateSkillCooldowns(character) {
        for (const skill of character.skills) {
            if (skill.currentCooldown > 0) {
                skill.currentCooldown--;
            }
        }
    }
    
    showFloatingText(target, text, color) {
        const floatingText = this.add.text(target.x, target.y - 60, text, { 
            fontFamily: 'Arial', 
            fontSize: '32px', 
            fill: color, 
            fontStyle: 'bold',
            stroke: '#ffffff',
            strokeThickness: 5
        }).setOrigin(0.5);

        this.tweens.add({
            targets: floatingText,
            y: floatingText.y - 100,
            alpha: 0,
            duration: 1500,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                floatingText.destroy();
            }
        });
    }

    playSkillEffect(target, type) {
        if (type === 'slash') {
            const slash = this.add.graphics();
            slash.lineStyle(5, 0xffffff, 1);
            slash.slice(target.x, target.y, 60, Phaser.Math.DegToRad(220), Phaser.Math.DegToRad(320));
            slash.strokePath();
            this.tweens.add({
                targets: slash,
                alpha: 0,
                duration: 250,
                ease: 'Power2',
                onComplete: () => slash.destroy()
            });
        } else if (type === 'impact') {
            const impact = this.add.circle(target.x, target.y, 10, 0xffffff, 0.8);
            this.tweens.add({
                targets: impact,
                scale: 5,
                alpha: 0,
                duration: 300,
                ease: 'Power2',
                onComplete: () => impact.destroy()
            });
        }
    }
    
    drawLogPanel() {
        this.logGroup.clear(true, true);

        const panel = this.add.graphics();
        panel.fillStyle(0x000000, 0.5);
        panel.fillRoundedRect(10, 80, 400, 130, 10);
        this.logGroup.add(panel);

        this.battleLog.forEach((log, index) => {
            const logText = this.add.text(20, 90 + (index * 22), log.text, { fontSize: '16px', fill: log.color });
            logText.setAlpha(1 - (index * 0.15));
            this.logGroup.add(logText);
        });
    }

    addLogMessage(message, color = '#ffffff') {
        this.battleLog.unshift({ text: message, color: color });
        if (this.battleLog.length > 5) {
            this.battleLog.pop();
        }
        this.drawLogPanel();
    }

    createStatusEffectTextures() {
        let graphics = this.add.graphics();
        graphics.fillStyle(0x4dff4d);
        graphics.beginPath();
        graphics.moveTo(16, 0);
        graphics.lineTo(32, 16);
        graphics.lineTo(20, 16);
        graphics.lineTo(20, 32);
        graphics.lineTo(12, 32);
        graphics.lineTo(12, 16);
        graphics.lineTo(0, 16);
        graphics.closePath();
        graphics.fillPath();
        graphics.generateTexture('buff_icon', 32, 32);
        graphics.clear();

        graphics.fillStyle(0x9b59b6);
        graphics.fillCircle(16, 16, 14);
        graphics.generateTexture('debuff_icon', 32, 32);
        graphics.destroy();
    }

    updateStatusEffectIcons(character) {
        character.effectIcons.forEach(icon => icon.destroy());
        character.effectIcons = [];

        character.statusEffects.forEach((effect, index) => {
            let iconKey;
            if (effect.stat === 'atk') {
                iconKey = 'buff_icon';
            } else if (effect.dot) {
                iconKey = 'debuff_icon';
            }

            if (iconKey) {
                const icon = this.add.image(character.x - 20 + (index * 30), character.y - 60, iconKey).setScale(0.8);
                character.effectIcons.push(icon);
            }
        });
    }

    processStatusEffects(character) {
        const effectsToRemove = [];
        character.statusEffects.forEach(effect => {
            if (effect.dot) {
                const damage = effect.dot;
                this.showFloatingText(character, damage, '#9b59b6');
                this.addLogMessage(`${character.name} terkena racun, -${damage} HP`, '#9b59b6');
                character.hp -= damage;
                if (character.hp < 0) character.hp = 0;
                
                const healthPercentage = character.hp / character.maxHp;
                const barToUpdate = (character === this.player) ? this.playerHealthBar : this.enemyHealthBar;
                this.tweens.add({
                    targets: barToUpdate.value,
                    scaleX: healthPercentage,
                    duration: 250,
                    ease: 'Power2'
                });
            }
            
            effect.duration--;
            if (effect.duration <= 0) {
                effectsToRemove.push(effect);
            }
        });

        if (effectsToRemove.length > 0) {
            effectsToRemove.forEach(effect => {
                const index = character.statusEffects.indexOf(effect);
                if (index > -1) {
                    character.statusEffects.splice(index, 1);
                }
            });
            this.updateStatusEffectIcons(character);
        }
    }

    dealDamage(attacker, target, damage, skillName = null) {
        if (!target.active) return;

        let attackBonus = 0;
        attacker.statusEffects.forEach(effect => {
            if (effect.stat === 'atk') {
                attackBonus += effect.amount;
            }
        });
        const totalDamage = damage + attackBonus;

        const dodgeChance = target.agi;
        const roll = Phaser.Math.Between(1, 100);

        if (roll <= dodgeChance) {
            this.showFloatingText(target, 'MISS', '#4d94ff');
            this.addLogMessage(`${target.name} berhasil menghindar!`, '#4d94ff');
            return; 
        }

        const finalDamage = Math.floor(totalDamage);
        this.showFloatingText(target, finalDamage, '#ff4d4d');

        if (skillName) {
            this.addLogMessage(`${attacker.name} menggunakan ${skillName}!`, '#ffde00');
        } else {
            this.addLogMessage(`${attacker.name} menyerang.`);
        }
        
        target.hp -= finalDamage;
        if (target.hp < 0) target.hp = 0;
        
        const healthPercentage = target.hp / target.maxHp;
        const barToUpdate = (target === this.player) ? this.playerHealthBar : this.enemyHealthBar;

        this.tweens.add({
            targets: barToUpdate.value,
            scaleX: healthPercentage,
            duration: 250,
            ease: 'Power2'
        });
        
        this.tweens.add({ targets: target, alpha: 0.2, duration: 150, yoyo: true });

        if (target.hp <= 0) {
            this.isBattleOver = true;
            this.state = 'BATTLE_OVER';
            const result = attacker === this.player ? 'MENANG' : 'KALAH';
            const resultColor = result === 'MENANG' ? '#00ff00' : '#ff0000';
            this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, result, { fontSize: '64px', fill: resultColor }).setOrigin(0.5);
            target.setActive(false).setVisible(false);
            target.body.enable = false;
            
            let droppedItem = null;
            if (result === 'MENANG') {
                for (const drop of this.enemyData.dropTable) {
                    if (Phaser.Math.Between(1, 100) <= drop.chance) {
                        droppedItem = drop.item;
                        break;
                    }
                }
            }

            this.time.delayedCall(2000 / this.timeScale, () => {
                if (this.bgm) this.bgm.stop();
                this.time.timeScale = 1;
                this.anims.globalTimeScale = 1;
                this.scene.start('MainMenuScene', { 
                    character: this.playerData, 
                    battleResult: result,
                    droppedItem: droppedItem,
                    goldDrop: result === 'MENANG' ? this.enemyData.gold : 0
                });
            }, [], this);
        }
    }

    update() {
        if (this.isBattleOver) return;

        if (this.currentTurn === 'player') {
            this.handlePlayerTurn();
        } else {
            this.handleEnemyTurn();
        }
        
        [this.player, this.enemy].forEach(char => {
            char.effectIcons.forEach((icon, index) => {
                icon.x = char.x - 20 + (index * 30);
                icon.y = char.y - 60;
            });
        });
    }
    
    handlePlayerTurn() {
        if (this.state === 'DECIDING_ACTION') {
            this.state = 'WAITING';
            this.processStatusEffects(this.player);
            if (this.player.hp <= 0) return;

            let usedSkill = null;
            for (const skill of this.player.skills) {
                if (skill.currentCooldown === 0) {
                    usedSkill = skill;
                    break;
                }
            }
            this.actionToPerform = usedSkill;

            if (usedSkill && usedSkill.type === 'buff') {
                this.state = 'ATTACKING';
            } else {
                this.state = 'MOVING_FORWARD';
            }
        }
        else if (this.state === 'MOVING_FORWARD') {
            this.player.anims.play('knight_walk', true);
            this.player.setVelocityX(this.MOVEMENT_SPEED * this.timeScale);
            if (this.player.x >= this.enemy.x - 50) {
                this.player.setVelocityX(0);
                this.player.x = this.enemy.x - 50;
                this.state = 'ATTACKING';
            }
        } else if (this.state === 'ATTACKING') {
            this.state = 'WAITING';
            this.player.anims.play('knight_attack', true);
            
            this.player.once('animationcomplete', () => {
                const usedSkill = this.actionToPerform;
                if (usedSkill) {
                    usedSkill.currentCooldown = usedSkill.cooldown;
                    switch(usedSkill.type) {
                        case 'damage':
                            let damageToDeal = this.player.attackDamage * usedSkill.damageMultiplier;
                            if (usedSkill.name === 'Jurus Bola Api') {
                                let fireball = this.add.sprite(this.player.x, this.player.y, 'fire_anim');
                                fireball.setOrigin(0.5, 0.8).play('fire_burn').setScale(0.25);
                                this.tweens.add({
                                    targets: fireball, x: this.enemy.x, y: this.enemy.y, duration: 400, ease: 'Power1',
                                    onComplete: () => {
                                        this.dealDamage(this.player, this.enemy, damageToDeal, usedSkill.name);
                                        fireball.destroy();
                                        if (!this.isBattleOver) this.time.delayedCall(500 / this.timeScale, () => { this.state = 'MOVING_BACK'; }, [], this);
                                    }
                                });
                            } else {
                                this.playSkillEffect(this.enemy, 'slash');
                                this.dealDamage(this.player, this.enemy, damageToDeal, usedSkill.name);
                                if (!this.isBattleOver) this.time.delayedCall(500 / this.timeScale, () => { this.state = 'MOVING_BACK'; }, [], this);
                            }
                            break;
                        case 'buff':
                            this.showFloatingText(this.player, 'ATK UP!', '#4dff4d');
                            this.addLogMessage(`${this.player.name} menggunakan ${usedSkill.name}!`, '#4dff4d');
                            this.player.statusEffects.push({ ...usedSkill.effect, duration: usedSkill.duration });
                            this.updateStatusEffectIcons(this.player);
                            if (!this.isBattleOver) this.time.delayedCall(500 / this.timeScale, () => { this.endTurn(); }, [], this);
                            break;
                        case 'debuff':
                            this.showFloatingText(this.enemy, 'POISONED!', '#9b59b6');
                            this.addLogMessage(`${this.player.name} menggunakan ${usedSkill.name}!`, '#9b59b6');
                            this.enemy.statusEffects.push({ ...usedSkill.effect, duration: usedSkill.duration });
                            this.updateStatusEffectIcons(this.enemy);
                            if (!this.isBattleOver) this.time.delayedCall(500 / this.timeScale, () => { this.state = 'MOVING_BACK'; }, [], this);
                            break;
                    }
                } else {
                    this.dealDamage(this.player, this.enemy, this.player.attackDamage);
                    if (!this.isBattleOver) this.time.delayedCall(500 / this.timeScale, () => { this.state = 'MOVING_BACK'; }, [], this);
                }
            }, this);

        } else if (this.state === 'MOVING_BACK') {
            this.player.anims.play('knight_walk', true);
            this.player.setFlipX(true);
            this.player.setVelocityX(-this.MOVEMENT_SPEED * this.timeScale);
            if (this.player.x <= this.player.originalX) {
                this.player.setVelocityX(0);
                this.player.x = this.player.originalX;
                this.player.setFlipX(false);
                this.endTurn();
            }
        }
    }
    
    handleEnemyTurn() {
        if (this.state === 'DECIDING_ACTION') {
            this.state = 'WAITING';
            this.processStatusEffects(this.enemy);
            if (this.enemy.hp <= 0) return;

            let usedSkill = null;
            for (const skill of this.enemy.skills) {
                if (skill.currentCooldown === 0) {
                    usedSkill = skill;
                    break;
                }
            }
            this.actionToPerform = usedSkill;
            this.state = 'MOVING_FORWARD';
        }
        else if (this.state === 'MOVING_FORWARD') {
            this.enemy.anims.play(this.enemyData.key === 'enemy_mummy' ? 'mummy_walk' : 'knight_walk', true); 
            this.enemy.setVelocityX(-this.MOVEMENT_SPEED * this.timeScale);
            if (this.enemy.x <= this.player.x + 50) {
                this.enemy.setVelocityX(0);
                this.enemy.x = this.player.x + 50;
                this.state = 'ATTACKING';
            }
        } else if (this.state === 'ATTACKING') {
            this.state = 'WAITING';
            this.enemy.anims.play(this.enemyData.key === 'enemy_mummy' ? 'mummy_attack' : 'knight_attack', true);
            
            this.enemy.once('animationcomplete', () => {
                let usedSkill = this.actionToPerform;
                if(usedSkill) {
                    usedSkill.currentCooldown = usedSkill.cooldown;
                    let damageToDeal = this.enemy.attackDamage * usedSkill.damageMultiplier;
                    this.playSkillEffect(this.player, 'impact');
                    this.dealDamage(this.enemy, this.player, damageToDeal, usedSkill.name);
                } else {
                    this.dealDamage(this.enemy, this.player, this.enemy.attackDamage);
                }
                
                if (!this.isBattleOver) {
                    this.time.delayedCall(500 / this.timeScale, () => { this.state = 'MOVING_BACK'; }, [], this);
                }
            }, this);

        } else if (this.state === 'MOVING_BACK') {
            this.enemy.setFlipX(false);
            this.enemy.anims.play(this.enemyData.key === 'enemy_mummy' ? 'mummy_walk' : 'knight_walk', true); 
            this.enemy.setVelocityX(this.MOVEMENT_SPEED * this.timeScale);
            if (this.enemy.x >= this.enemy.originalX) {
                this.enemy.setVelocityX(0);
                this.enemy.x = this.enemy.originalX;
                this.enemy.setFlipX(true);
                this.endTurn();
            }
        }
    }

    endTurn() {
        const activeCharacter = this.currentTurn === 'player' ? this.player : this.enemy;
        activeCharacter.anims.play(activeCharacter.texture.key === 'enemy_mummy' ? 'mummy_idle' : 'knight_idle');
        this.updateSkillCooldowns(activeCharacter);
        this.currentTurn = this.currentTurn === 'player' ? 'enemy' : 'player';
        this.state = 'IDLE';
        this.time.delayedCall(1000 / this.timeScale, () => { if (!this.isBattleOver) this.state = 'DECIDING_ACTION'; }, [], this);
    }
}
