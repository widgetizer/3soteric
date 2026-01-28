import Phaser from 'phaser';

export const Action = {
    // Player 1
    P1_MOVE_LEFT: 0,
    P1_MOVE_RIGHT: 1,
    P1_MOVE_DOWN: 2,
    P1_ROTATE_CW: 3,
    P1_ROTATE_CCW: 4,

    // Player 2
    P2_MOVE_LEFT: 5,
    P2_MOVE_RIGHT: 6,
    P2_MOVE_DOWN: 7,
    P2_ROTATE_CW: 8,
    P2_ROTATE_CCW: 9,

    // Global
    GAME_RESTART: 10,
    GAME_PAUSE: 11
} as const;

export type Action = typeof Action[keyof typeof Action];

export const DEFAULT_CONTROLS: Record<string, Action> = {
    // Player 1
    'KeyA': Action.P1_MOVE_LEFT,
    'KeyD': Action.P1_MOVE_RIGHT,
    'KeyS': Action.P1_MOVE_DOWN,
    'KeyQ': Action.P1_ROTATE_CCW,
    'KeyE': Action.P1_ROTATE_CW,

    // Player 2
    'ArrowLeft': Action.P2_MOVE_LEFT,
    'ArrowRight': Action.P2_MOVE_RIGHT,
    'ArrowDown': Action.P2_MOVE_DOWN,
    'ArrowUp': Action.P2_ROTATE_CW,
    'KeyM': Action.P2_ROTATE_CCW,

    // Global
    'KeyR': Action.GAME_RESTART,
    'KeyP': Action.GAME_PAUSE,
    'Escape': Action.GAME_PAUSE
};

export const CONTINUOUS_ACTIONS = new Set<Action>([
    Action.P1_MOVE_LEFT, Action.P1_MOVE_RIGHT, Action.P1_MOVE_DOWN,
    Action.P2_MOVE_LEFT, Action.P2_MOVE_RIGHT, Action.P2_MOVE_DOWN
]);

// Helper for UI grouping
export const BINDABLE_ACTIONS = [
    { label: 'Move Left', action: Action.P1_MOVE_LEFT, group: 'Left Hand' },
    { label: 'Move Right', action: Action.P1_MOVE_RIGHT, group: 'Left Hand' },
    { label: 'Move Down', action: Action.P1_MOVE_DOWN, group: 'Left Hand' },
    { label: 'Rotate CW', action: Action.P1_ROTATE_CW, group: 'Left Hand' },
    { label: 'Rotate CCW', action: Action.P1_ROTATE_CCW, group: 'Left Hand' },
    
    { label: 'Move Left', action: Action.P2_MOVE_LEFT, group: 'Right Hand' },
    { label: 'Move Right', action: Action.P2_MOVE_RIGHT, group: 'Right Hand' },
    { label: 'Move Down', action: Action.P2_MOVE_DOWN, group: 'Right Hand' },
    { label: 'Rotate CW', action: Action.P2_ROTATE_CW, group: 'Right Hand' },
    { label: 'Rotate CCW', action: Action.P2_ROTATE_CCW, group: 'Right Hand' },
];

export class InputHandler {
    private scene: Phaser.Scene;
    
    private keyDownListener: (event: KeyboardEvent) => void;
    private keyUpListener: (event: KeyboardEvent) => void;

    private keysHeld: Set<string> = new Set();
    private moveTimers: Map<string, number> = new Map();

    private readonly REPEAT_DELAY_MS = 200; 
    private readonly REPEAT_RATE_MS = 50;   

    // Map KeyCode -> Action
    private keyMap: Map<string, Action> = new Map();

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.keyDownListener = this.handleKeyDown.bind(this);
        this.keyUpListener = this.handleKeyUp.bind(this);

        this.loadBindings();

        window.addEventListener('keydown', this.keyDownListener);
        window.addEventListener('keyup', this.keyUpListener);
    }

    public loadBindings() {
        this.keyMap.clear();
        
        const saved = localStorage.getItem('keyBindings');
        let bindings = DEFAULT_CONTROLS;

        if (saved) {
            try {
                bindings = JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse keybindings", e);
            }
        }

        for (const [key, action] of Object.entries(bindings)) {
            this.keyMap.set(key, action as Action);
        }
    }

    public bindKey(key: string, action: Action) {
        // Enforce: Remove this action from any other key first (one-to-one)
        this.keyMap.forEach((val, k) => {
            if (val === action) this.keyMap.delete(k);
        });
        
        this.keyMap.set(key, action);
    }

    public getBindings(): Record<string, Action> {
        const out: Record<string, Action> = {};
        this.keyMap.forEach((action, key) => {
            out[key] = action;
        });
        return out;
    }

    public saveBindings() {
        localStorage.setItem('keyBindings', JSON.stringify(this.getBindings()));
    }

    private handleKeyDown(event: KeyboardEvent) {
        const action = this.keyMap.get(event.code);
        
        if (action !== undefined && !this.keysHeld.has(event.code)) {
            this.keysHeld.add(event.code);
            
            this.dispatchAction(action);

            if (CONTINUOUS_ACTIONS.has(action)) {
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
            const action = this.keyMap.get(code);
            if (action !== undefined && CONTINUOUS_ACTIONS.has(action)) {
                let timer = this.moveTimers.get(code) || 0;
                timer -= delta;
                
                if (timer <= 0) {
                    this.dispatchAction(action);
                    this.moveTimers.set(code, this.REPEAT_RATE_MS);
                } else {
                    this.moveTimers.set(code, timer);
                }
            }
        }
    }

    private dispatchAction(action: Action) {
        this.scene.events.emit('action', action);
    }
    
    destroy() {
         window.removeEventListener('keydown', this.keyDownListener);
         window.removeEventListener('keyup', this.keyUpListener);
    }
}
