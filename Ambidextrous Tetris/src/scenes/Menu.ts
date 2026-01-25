import Phaser from 'phaser';

export class Menu extends Phaser.Scene {
    private settingsContainer!: Phaser.GameObjects.Container;
    private gridWidthText!: Phaser.GameObjects.Text;
    private currentGridWidth: number = 14;

    constructor() {
        super('Menu');
    }

    create() {
        const { width, height } = this.scale;

        // Initialize Settings
        const saved = localStorage.getItem('gridWidth');
        this.currentGridWidth = saved ? parseInt(saved, 10) : 14;

        // Title
        this.add.text(width / 2, height / 3, 'AMBITETRIS', {
            fontSize: '64px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 3 + 40, '(it\'s ambidextrous Tetris)', {
            fontSize: '24px',
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

        // Settings Button
        const settingsBtn = this.add.text(width / 2, height / 2 + 80, 'SETTINGS', {
            fontSize: '32px',
            color: '#aaaaaa',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        settingsBtn.on('pointerdown', () => {
            this.settingsContainer.setVisible(true);
        });

         settingsBtn.on('pointerover', () => settingsBtn.setStyle({ fill: '#fff' }));
         settingsBtn.on('pointerout', () => settingsBtn.setStyle({ fill: '#aaa' }));

         this.createSettingsUI();
    }

    createSettingsUI() {
        const { width, height } = this.scale;
        this.settingsContainer = this.add.container(0, 0).setVisible(false).setDepth(10);
        
        // Background dimmer (blocks clicks)
        const bg = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.8)
            .setInteractive();
            
        // Panel
        const panel = this.add.rectangle(width/2, height/2, 500, 400, 0x222222).setStrokeStyle(2, 0xffffff);
        
        // Title
        const title = this.add.text(width/2, height/2 - 150, 'SETTINGS', { fontSize: '32px', fontStyle: 'bold' }).setOrigin(0.5);

        // Grid Width Section
        this.gridWidthText = this.add.text(width / 2, height / 2 - 50, `Grid Width: ${this.currentGridWidth}`, { fontSize: '24px' }).setOrigin(0.5);
        
        // Slider Track
        const trackWidth = 300;
        const trackX = width/2 - trackWidth/2;
        const trackY = height/2;
        const track = this.add.rectangle(width/2, trackY, trackWidth, 4, 0x888888);
        
        // Slider Handle
        const min = 10;
        const max = 16;
        const ratio = (this.currentGridWidth - min) / (max - min);
        const handleX = trackX + (ratio * trackWidth);
        const handle = this.add.circle(handleX, trackY, 15, 0x00ff00).setInteractive({ draggable: true });
        
        // Labels for min/max
        const minLabel = this.add.text(trackX - 30, trackY, '10', { fontSize: '20px' }).setOrigin(0.5);
        const maxLabel = this.add.text(trackX + trackWidth + 30, trackY, '16', { fontSize: '20px' }).setOrigin(0.5);

        handle.on('drag', (_pointer: any, dragX: number, _dragY: number) => {
            // Clamp X
            const newX = Phaser.Math.Clamp(dragX, trackX, trackX + trackWidth);
            handle.x = newX;
            
            // Calculate Value (10 to 16)
            const r = (newX - trackX) / trackWidth;
            const val = Math.round(min + r * (max - min));
            
            if (val !== this.currentGridWidth) {
                this.currentGridWidth = val;
                this.gridWidthText.setText(`Grid Width: ${val}`);
                localStorage.setItem('gridWidth', val.toString());
            }
        });
        
        // Ghost Toggle
        const ghostsEnabled = localStorage.getItem('showGhosts') !== 'false'; // Default true
        let currentGhostState = ghostsEnabled;

        const ghostText = this.add.text(width/2, height/2 + 60, `Show Ghosts: ${currentGhostState ? 'ON' : 'OFF'}`, {
             fontSize: '24px',
             color: currentGhostState ? '#00ff00' : '#888888'
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
             currentGhostState = !currentGhostState;
             ghostText.setText(`Show Ghosts: ${currentGhostState ? 'ON' : 'OFF'}`);
             ghostText.setColor(currentGhostState ? '#00ff00' : '#888888');
             localStorage.setItem('showGhosts', currentGhostState.toString());
        });

        // Close Button
        const closeBtn = this.add.text(width/2, height/2 + 120, 'CLOSE', { 
            fontSize: '24px', 
            color: '#000000',
            backgroundColor: '#ffffff', 
            padding: { x: 20, y: 10 } 
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.settingsContainer.setVisible(false));

        this.settingsContainer.add([bg, panel, title, this.gridWidthText, track, minLabel, maxLabel, handle, ghostText, closeBtn]);
    }
}
