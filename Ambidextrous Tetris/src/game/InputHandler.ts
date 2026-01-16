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
    
    private keyListener: (event: KeyboardEvent) => void;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.keyListener = this.handleKeyDown.bind(this);

        // Use window listener to ensure we catch events even if Phaser focus is iffy,
        // and to handle Restart when game might be paused (though we should handle that carefully).
        window.addEventListener('keydown', this.keyListener);
    }

    private handleKeyDown(event: KeyboardEvent) {
        // Player 1
        if (event.code === 'KeyA') this.scene.events.emit('p1-move', Action.MOVE_LEFT);
        if (event.code === 'KeyD') this.scene.events.emit('p1-move', Action.MOVE_RIGHT);
        if (event.code === 'KeyS') this.scene.events.emit('p1-move', Action.MOVE_DOWN);
        if (event.code === 'KeyQ') this.scene.events.emit('p1-rotate', Action.ROTATE_CCW);
        if (event.code === 'KeyE') this.scene.events.emit('p1-rotate', Action.ROTATE_CW);

        // Player 2
        if (event.code === 'ArrowLeft') this.scene.events.emit('p2-move', Action.MOVE_LEFT);
        if (event.code === 'ArrowRight') this.scene.events.emit('p2-move', Action.MOVE_RIGHT);
        if (event.code === 'ArrowDown') this.scene.events.emit('p2-move', Action.MOVE_DOWN);
        if (event.code === 'ArrowUp') this.scene.events.emit('p2-rotate', Action.ROTATE_CW); 
        if (event.code === 'KeyM') this.scene.events.emit('p2-rotate', Action.ROTATE_CCW); 
        
        // Global
        if (event.code === 'KeyR') this.scene.events.emit('game-restart', Action.RESTART);
        if (event.code === 'KeyP' || event.code === 'Escape') this.scene.events.emit('game-pause', Action.PAUSE);
    }
    
    destroy() {
         window.removeEventListener('keydown', this.keyListener);
    }
}
