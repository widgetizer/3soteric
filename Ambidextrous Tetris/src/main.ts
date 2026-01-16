import Phaser from 'phaser';
import { Game } from './scenes/Game';
import { Menu } from './scenes/Menu';
import './style.css';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'app',
    backgroundColor: '#1b263b',
    scene: [Menu, Game],
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    }
};

new Phaser.Game(config);
