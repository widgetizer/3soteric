import Phaser from 'phaser';
import { type TetrominoType } from './Tetromino';
import { VisualGrid } from './VisualGrid';

export class VisualPiece {
    private scene: Phaser.Scene;
    private grid: VisualGrid;
    
    public id: string;
    public type: TetrominoType;
    public rotation: number = 0;
    public isRounded: boolean;
    
    // The single sprite representing the whole piece (pre-rendered)
    private sprite: Phaser.GameObjects.Sprite;
    
    // Ghost sprite (same texture, modified alpha/tint)
    private ghost: Phaser.GameObjects.Sprite;

    constructor(scene: Phaser.Scene, grid: VisualGrid, id: string, type: TetrominoType, x: number, y: number, isRounded: boolean) {
        this.scene = scene;
        this.grid = grid;
        this.id = id;
        this.type = type;
        this.isRounded = isRounded;

        const textureKey = this.getTextureKey();
        const worldPos = this.grid.gridToWorld(x, y);

        // Piece Sprite
        this.sprite = this.scene.add.sprite(worldPos.x, worldPos.y, textureKey).setOrigin(0, 0);
        
        // Ghost Sprite
        this.ghost = this.scene.add.sprite(worldPos.x, worldPos.y, textureKey).setOrigin(0, 0);
        this.ghost.setAlpha(0.3).setDepth(-1);
    }

    private getTextureKey(rot: number = this.rotation): string {
        return `active-${this.isRounded ? 'r' : 's'}-${this.type}-${rot}`;
    }

    public updateVisuals(x: number, y: number, rotation: number, ghostY: number) {
        this.rotation = rotation;
        const textureKey = this.getTextureKey();
        
        // Update Main Piece
        const pos = this.grid.gridToWorld(x, y);
        this.sprite.setTexture(textureKey);
        this.sprite.setPosition(pos.x, pos.y);

        // Update Ghost
        const gPos = this.grid.gridToWorld(x, ghostY);
        this.ghost.setTexture(textureKey);
        this.ghost.setPosition(gPos.x, gPos.y);
        
        // Dynamic Ghost effects (Optional: pulse, etc)
    }

    public setVisible(visible: boolean) {
        this.sprite.setVisible(visible);
        this.ghost.setVisible(visible);
    }

    public destroy() {
        this.sprite.destroy();
        this.ghost.destroy();
    }
}
