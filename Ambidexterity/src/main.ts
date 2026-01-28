import Phaser from 'phaser';
import './style.css';

import { TextureGenerator } from './game/TextureGenerator';

import { Game } from './scenes/Game';

// Placeholder Scenes
class Boot extends Phaser.Scene {
    constructor() { super('Boot'); }
    create() { 
        TextureGenerator.generateAll(this);
        this.scene.start('Menu'); 
    }
}

class Menu extends Phaser.Scene {
    constructor() { super('Menu'); }
    create() {
        const { width, height } = this.scale;
        this.add.text(width / 2, height / 2, 'AMBIDEXTERITY', {
            fontFamily: 'Outfit',
            fontSize: '64px',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        this.add.text(width / 2, height / 2 + 60, 'Press anywhere to begin', {
            fontFamily: 'Inter',
            fontSize: '24px',
            color: '#94a3b8'
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.scene.start('Game');
        });
    }
}

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'app',
    backgroundColor: '#1b263b',
    scene: [Boot, Menu, Game],
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    }
};

new Phaser.Game(config);
