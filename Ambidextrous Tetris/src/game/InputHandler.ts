import Phaser from 'phaser';

export const Action = {
    MOVE_LEFT: 0,
    MOVE_RIGHT: 1,
    MOVE_DOWN: 2,
    ROTATE_CW: 3,
    ROTATE_CCW: 4,
    DROP: 5,
    RESTART: 6,
    PAUSE: 7
} as const;

export type Action = typeof Action[keyof typeof Action];

export class InputHandler {
    private scene: Phaser.Scene;
    
    private keyDownListener: (event: KeyboardEvent) => void;
    private keyUpListener: (event: KeyboardEvent) => void;

    private keysHeld: Set<string> = new Set();
    private moveTimers: Map<string, number> = new Map();

    private readonly REPEAT_DELAY_MS = 200; // DAS: Delay before auto-repeat starts
    private readonly REPEAT_RATE_MS = 50;   // ARR: Interval between repeats (Fast for drop)

    // Keys that support continuous holding
    private readonly CONTINUOUS_KEYS = new Set([
        'KeyA', 'KeyD', 'KeyS',
        'ArrowLeft', 'ArrowRight', 'ArrowDown'
    ]);

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.keyDownListener = this.handleKeyDown.bind(this);
        this.keyUpListener = this.handleKeyUp.bind(this);

        window.addEventListener('keydown', this.keyDownListener);
        window.addEventListener('keyup', this.keyUpListener);
    }

    private handleKeyDown(event: KeyboardEvent) {
        if (!this.keysHeld.has(event.code)) {
            this.keysHeld.add(event.code);
            
            // Trigger immediate action
            this.dispatchAction(event.code);

            // Init timer for continuous keys
            if (this.CONTINUOUS_KEYS.has(event.code)) {
                this.moveTimers.set(event.code, this.REPEAT_DELAY_MS);
            }
        }
    }

    private handleKeyUp(event: KeyboardEvent) {
        this.keysHeld.delete(event.code);
        this.moveTimers.delete(event.code);
    }

    update(_time: number, delta: number) {
        for (const code of this.keysHeld) {
            if (this.CONTINUOUS_KEYS.has(code)) {
                let timer = this.moveTimers.get(code) || 0;
                timer -= delta;
                
                if (timer <= 0) {
                    this.dispatchAction(code);
                    this.moveTimers.set(code, this.REPEAT_RATE_MS);
                } else {
                    this.moveTimers.set(code, timer);
                }
            }
        }
    }

    private dispatchAction(code: string) {
        // Player 1
        if (code === 'KeyA') this.scene.events.emit('p1-move', Action.MOVE_LEFT);
        if (code === 'KeyD') this.scene.events.emit('p1-move', Action.MOVE_RIGHT);
        if (code === 'KeyS') this.scene.events.emit('p1-move', Action.MOVE_DOWN);
        if (code === 'KeyQ') this.scene.events.emit('p1-rotate', Action.ROTATE_CCW);
        if (code === 'KeyE') this.scene.events.emit('p1-rotate', Action.ROTATE_CW);

        // Player 2
        if (code === 'ArrowLeft') this.scene.events.emit('p2-move', Action.MOVE_LEFT);
        if (code === 'ArrowRight') this.scene.events.emit('p2-move', Action.MOVE_RIGHT);
        if (code === 'ArrowDown') this.scene.events.emit('p2-move', Action.MOVE_DOWN);
        if (code === 'ArrowUp') this.scene.events.emit('p2-rotate', Action.ROTATE_CW); 
        if (code === 'KeyM') this.scene.events.emit('p2-rotate', Action.ROTATE_CCW); 
        
        // Global
        if (code === 'KeyR') this.scene.events.emit('game-restart', Action.RESTART);
        if (code === 'KeyP' || code === 'Escape') this.scene.events.emit('game-pause', Action.PAUSE);
    }
    
    destroy() {
         window.removeEventListener('keydown', this.keyDownListener);
         window.removeEventListener('keyup', this.keyUpListener);
    }
}
