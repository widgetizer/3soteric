import Phaser from 'phaser';
import { Action, BINDABLE_ACTIONS, DEFAULT_CONTROLS } from '../game/InputHandler';

export class Menu extends Phaser.Scene {
    private settingsContainer!: Phaser.GameObjects.Container;
    private controlsContainer!: Phaser.GameObjects.Container;
    private gridWidthText!: Phaser.GameObjects.Text;
    private currentGridWidth: number = 14;

    constructor() {
        super('Menu');
    }

    create() {
        // Ensure fonts are loaded before rendering UI
        // document.fonts.ready returns a promise that resolves when all fonts have finished loading
        if ((document as any).fonts) {
            (document as any).fonts.ready.then(() => {
                // Check if scene is still active/not destroyed
                if (this.scene.key === 'Menu') {
                    this.setupUI();
                }
            });
        } else {
            this.setupUI();
        }
    }

    setupUI() {
        const { width, height } = this.scale;

        // Initialize Settings
        const saved = localStorage.getItem('gridWidth');
        this.currentGridWidth = saved ? parseInt(saved, 10) : 14;

        // Title
        this.add.text(width / 2, height / 3, 'AMBITETRIS', {
            fontFamily: 'Outfit',
            fontSize: '64px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 3 + 40, "(it's ambidextrous Tetris)", {
            fontFamily: 'Inter',
            fontSize: '20px',
            color: '#94a3b8',
            fontStyle: 'normal'
        }).setOrigin(0.5);

        // Start Button
        const startBtn = this.add.text(width / 2, height / 2, 'START GAME', {
            fontFamily: 'Outfit',
            fontSize: '32px',
            color: '#4ade80',
            backgroundColor: '#0f172a',
            padding: { x: 24, y: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        startBtn.on('pointerdown', () => {
            this.scene.start('Game');
        });
        
        startBtn.on('pointerover', () => startBtn.setStyle({ fill: '#ff0' }));
        startBtn.on('pointerout', () => startBtn.setStyle({ fill: '#4ade80' }));

        // Controls Button
        const controlsBtn = this.add.text(width / 2, height / 2 + 70, 'CONTROLS', {
            fontFamily: 'Outfit',
            fontSize: '32px',
            color: '#ffffff',
            backgroundColor: '#0f172a',
            padding: { x: 24, y: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        controlsBtn.on('pointerdown', () => {
            this.controlsContainer.setVisible(true);
        });

        controlsBtn.on('pointerover', () => controlsBtn.setStyle({ fill: '#ff0' }));
        controlsBtn.on('pointerout', () => controlsBtn.setStyle({ fill: '#fff' }));

        // Settings Button
        const settingsBtn = this.add.text(width / 2, height / 2 + 140, 'SETTINGS', {
            fontFamily: 'Outfit',
            fontSize: '32px',
            color: '#94a3b8',
            backgroundColor: '#0f172a',
            padding: { x: 24, y: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        settingsBtn.on('pointerdown', () => {
            this.settingsContainer.setVisible(true);
        });

         settingsBtn.on('pointerover', () => settingsBtn.setStyle({ fill: '#fff' }));
         settingsBtn.on('pointerout', () => settingsBtn.setStyle({ fill: '#94a3b8' }));

         this.createSettingsUI();
         this.createControlsUI();
    }

    formatKey(raw: string): string {
        return raw.replace('Key', '').replace('Arrow', '').toUpperCase();
    }

    private activeRebindListener: ((e: KeyboardEvent) => void) | null = null;

    cancelRebind() {
        if (this.activeRebindListener) {
            window.removeEventListener('keydown', this.activeRebindListener);
            this.activeRebindListener = null;
        }
    }

    createControlsUI() {
        const { width, height } = this.scale;
        
        // Cleanup existing or initialize
        if (this.controlsContainer) {
            this.controlsContainer.removeAll(true);
        } else {
            this.controlsContainer = this.add.container(0, 0).setVisible(false).setDepth(20);
        }

        const bg = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.9).setInteractive();
        const panel = this.add.rectangle(width/2, height/2, 700, 500, 0x1e293b).setStrokeStyle(2, 0x334155);
        const title = this.add.text(width/2, height/2 - 220, 'CONTROLS', { fontFamily: 'Outfit', fontSize: '32px', fontStyle: 'bold' }).setOrigin(0.5);

        // Subtitle
        const tip = this.add.text(width/2, height/2 - 180, 'Click an action to rebind, then press any key.', { fontFamily: 'Inter', fontSize: '16px', color: '#94a3b8' }).setOrigin(0.5);

        this.controlsContainer.add([bg, panel, title, tip]);

        // Load current config
        const saved = localStorage.getItem('keyBindings');
        let config: Record<string, Action> = saved ? JSON.parse(saved) : DEFAULT_CONTROLS;

        // Group actions
        const groups = ['Left Hand', 'Right Hand'];
        const groupX = [width/2 - 160, width/2 + 160];

        groups.forEach((groupName, gIdx) => {
             const x = groupX[gIdx];
             const groupTitle = this.add.text(x, height/2 - 140, groupName, { fontFamily: 'Outfit', fontSize: '18px', color: '#4ade80' }).setOrigin(0.5);
             this.controlsContainer.add(groupTitle);

             const actions = BINDABLE_ACTIONS.filter(a => a.group === groupName);
             actions.forEach((act, aIdx) => {
                 const y = height/2 - 100 + (aIdx * 35);
                 
                 // Get current key for this action
                 let boundKey = "None";
                 for(const [k, v] of Object.entries(config)) {
                     if (v === act.action) boundKey = this.formatKey(k);
                 }

                 const rowLabel = this.add.text(x, y, act.label, { fontFamily: 'Inter', fontSize: '14px', color: '#94a3b8' }).setOrigin(1, 0.5).setX(x - 10);
                 const rebindBtn = this.add.text(x + 10, y, `[ ${boundKey} ]`, { 
                     fontFamily: 'Inter', 
                     fontSize: '14px', 
                     color: '#ffffff',
                     backgroundColor: '#0f172a',
                     padding: { x: 8, y: 4 }
                 }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

                 rebindBtn.on('pointerdown', () => {
                     // Clear any existing listener first
                     this.cancelRebind();

                     rebindBtn.setText("[ PRESS KEY ]").setColor("#fbbf24");
                     
                     this.activeRebindListener = (e: KeyboardEvent) => {
                         this.cancelRebind(); // Removes itself
                         e.preventDefault();
                         
                         // Update Config
                         const newKey = e.code;
                         const newConfig: Record<string, Action> = {};
                         for (const [k, v] of Object.entries(config)) {
                             // Conflict resolution: remove this key from any other action, and this action from any key
                             if (k !== newKey && v !== act.action) newConfig[k] = v;
                         }
                         newConfig[newKey] = act.action;
                         
                         config = newConfig;
                         localStorage.setItem('keyBindings', JSON.stringify(config));
                         
                         // Refresh UI
                         this.createControlsUI();
                         this.controlsContainer.setVisible(true);
                     };
                     window.addEventListener('keydown', this.activeRebindListener);
                 });

                 this.controlsContainer.add([rowLabel, rebindBtn]);
             });
        });

        const closeBtn = this.add.text(width/2, height/2 + 200, 'SAVE & CLOSE', { 
            fontFamily: 'Outfit',
            fontSize: '24px', 
            color: '#0f172a',
            backgroundColor: '#4ade80', 
            padding: { x: 20, y: 10 } 
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            this.cancelRebind();
            this.controlsContainer.setVisible(false)
        });

        this.controlsContainer.add(closeBtn);
    }

    createSettingsUI() {
        const { width, height } = this.scale;
        
        if (this.settingsContainer) {
            this.settingsContainer.removeAll(true);
        } else {
            this.settingsContainer = this.add.container(0, 0).setVisible(false).setDepth(10);
        }
        
        // Background dimmer (blocks clicks)
        const bg = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.8)
            .setInteractive();
            
        // Panel
        const panel = this.add.rectangle(width/2, height/2, 500, 400, 0x222222).setStrokeStyle(2, 0xffffff);
        
        // Title
        const title = this.add.text(width/2, height/2 - 150, 'SETTINGS', { fontFamily: 'Outfit', fontSize: '32px', fontStyle: 'bold' }).setOrigin(0.5);

        // Grid Width Section
        this.gridWidthText = this.add.text(width / 2, height / 2 - 50, `Grid Width: ${this.currentGridWidth}`, { fontFamily: 'Inter', fontSize: '24px' }).setOrigin(0.5);
        
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
        const minLabel = this.add.text(trackX - 30, trackY, '10', { fontFamily: 'Inter', fontSize: '20px' }).setOrigin(0.5);
        const maxLabel = this.add.text(trackX + trackWidth + 30, trackY, '16', { fontFamily: 'Inter', fontSize: '20px' }).setOrigin(0.5);

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
             fontFamily: 'Inter',
             fontSize: '24px',
             color: currentGhostState ? '#4ade80' : '#64748b'
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
             currentGhostState = !currentGhostState;
             ghostText.setText(`Show Ghosts: ${currentGhostState ? 'ON' : 'OFF'}`);
             ghostText.setColor(currentGhostState ? '#4ade80' : '#64748b');
             localStorage.setItem('showGhosts', currentGhostState.toString());
        });



        // Hold System Toggle (OFF -> PRIVATE -> SHARED)
        const savedHoldMode = localStorage.getItem('holdMode');
        // Migration/Default: 'enableHold' legacy support or default to PRIVATE
        let currentHoldMode = savedHoldMode || 'PRIVATE'; 
        if (savedHoldMode === null && localStorage.getItem('enableHold') === 'false') {
             currentHoldMode = 'OFF';
        }

        const getHoldColor = (mode: string) => {
            if (mode === 'OFF') return '#64748b'; // Slate
            if (mode === 'SHARED') return '#a855f7'; // Purple (Special)
            return '#4ade80'; // Green (Standard)
        };

        const holdText = this.add.text(width / 2, height / 2 + 140, `Hold System: ${currentHoldMode}`, {
            fontFamily: 'Inter',
            fontSize: '24px',
            color: getHoldColor(currentHoldMode)
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            if (currentHoldMode === 'OFF') currentHoldMode = 'PRIVATE';
            else if (currentHoldMode === 'PRIVATE') currentHoldMode = 'SHARED';
            else currentHoldMode = 'OFF';

            holdText.setText(`Hold System: ${currentHoldMode}`);
            holdText.setColor(getHoldColor(currentHoldMode));
            localStorage.setItem('holdMode', currentHoldMode);
        });

        // Close Button
        const closeBtn = this.add.text(width/2, height/2 + 200, 'CLOSE', { 
            fontFamily: 'Outfit',
            fontSize: '24px', 
            color: '#0f172a',
            backgroundColor: '#f8fafc', 
            padding: { x: 20, y: 10 } 
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.settingsContainer.setVisible(false));

        this.settingsContainer.add([bg, panel, title, this.gridWidthText, track, minLabel, maxLabel, handle, ghostText, holdText, closeBtn]);
    }
}
