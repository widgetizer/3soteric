import Phaser from 'phaser';

export class Menu extends Phaser.Scene {
    constructor() {
        super('Menu');
    }

    create() {
        const { width, height } = this.scale;

        // Title
        this.add.text(width / 2, height / 3, 'AMBITETRIS', {
            fontSize: '64px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Start Button
        const startBtn = this.add.text(width / 2, height / 2, 'START GAME', {
            fontSize: '32px',
            color: '#00ff00',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        startBtn.on('pointerdown', () => {
            this.scene.start('Game');
        });
        
        startBtn.on('pointerover', () => startBtn.setStyle({ fill: '#ff0' }));
        startBtn.on('pointerout', () => startBtn.setStyle({ fill: '#0f0' }));

        // Settings Button (Placeholder)
        const settingsBtn = this.add.text(width / 2, height / 2 + 80, 'SETTINGS', {
            fontSize: '32px',
            color: '#aaaaaa',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        settingsBtn.on('pointerdown', () => {
            console.log('Settings clicked');
            // TODO: Open settings
        });

         settingsBtn.on('pointerover', () => settingsBtn.setStyle({ fill: '#fff' }));
         settingsBtn.on('pointerout', () => settingsBtn.setStyle({ fill: '#aaa' }));
    }
}
