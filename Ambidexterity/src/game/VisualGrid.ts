import Phaser from 'phaser';

export class VisualGrid {
    private scene: Phaser.Scene;
    private width: number;
    private height: number;
    private cellSize: number;
    private gridGraphics: Phaser.GameObjects.Graphics;

    // Visual references for locked blocks
    private sprites: (Phaser.GameObjects.Sprite | null)[][];
    
    private offsetX: number;
    private offsetY: number;

    constructor(scene: Phaser.Scene, width: number = 14, height: number = 20, cellSize: number = 30) {
        this.scene = scene;
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;

        const totalWidth = width * cellSize;
        const totalHeight = height * cellSize;
        this.offsetX = (this.scene.scale.width - totalWidth) / 2;
        this.offsetY = (this.scene.scale.height - totalHeight) / 2;

        this.gridGraphics = this.scene.add.graphics();
        this.sprites = Array(height).fill(null).map(() => Array(width).fill(null));

        this.drawBackground();
    }

    private drawBackground() {
        this.gridGraphics.clear();
        
        // Match the refined dark gradient from before
        const cTop = 0x161e2e;
        const cBot = 0x0a0e14;
        
        const width = this.width * this.cellSize;
        const height = this.height * this.cellSize;
        
        this.gridGraphics.fillGradientStyle(cTop, cTop, cBot, cBot, 1, 1, 1, 1);
        this.gridGraphics.fillRect(this.offsetX, this.offsetY, width, height);

        // Border
        this.gridGraphics.lineStyle(2, 0x334455, 0.5);
        this.gridGraphics.strokeRect(this.offsetX, this.offsetY, width, height);
    }

    public gridToWorld(x: number, y: number): { x: number, y: number } {
        return {
            x: this.offsetX + x * this.cellSize,
            y: this.offsetY + y * this.cellSize
        };
    }

    public placeBlock(x: number, y: number, color: number, mask: number, isRounded: boolean) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;

        // Destroy previous if exists (though logically shouldn't happen)
        this.sprites[y][x]?.destroy();

        const pos = this.gridToWorld(x, y);
        const textureKey = `block-${isRounded ? 'r' : 's'}-${color.toString(16)}-${mask}`;
        
        // Pre-rendered textures are 30x30, we position them at cell top-left (Phaser default origin 0.5,0.5)
        const s = this.scene.add.sprite(pos.x + 15, pos.y + 15, textureKey);
        this.sprites[y][x] = s;
    }

    public removeLine(y: number) {
        for (let x = 0; x < this.width; x++) {
            if (this.sprites[y][x]) {
                this.sprites[y][x]?.destroy();
                this.sprites[y][x] = null;
            }
        }
    }

    /**
     * Re-renders the entire field based on the engine state.
     * This preserves the "Sausage" fusion by checking neighbors of locked blocks.
     */
    public updateBoardVisuals(logicBoard: number[][], pieces: { x: number, y: number, color: number, isRounded: boolean }[]) {
        // Simple approach: Clear and redraw all blocks
        // (In a high-perf version, we'd only update modified dirty regions)
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.sprites[y][x]?.destroy();
                this.sprites[y][x] = null;
            }
        }

        // We need the colors and roundedness for the locked blocks.
        // For the sake of this clean break, we'll assume pieces passed are the HISTORICAL data.
        // Actually, let's keep it simple: redraw from a provided list of static cells.
        for (const p of pieces) {
            const mask = this.getNeighborMask(p.x, p.y, logicBoard);
            this.placeBlock(p.x, p.y, p.color, mask, p.isRounded);
        }
    }

    private getNeighborMask(x: number, y: number, board: number[][]): number {
        let mask = 0;
        // Top
        if (y > 0 && board[y - 1][x]) mask |= 1;
        // Right
        if (x < this.width - 1 && board[y][x + 1]) mask |= 2;
        // Bottom
        if (y < this.height - 1 && board[y + 1][x]) mask |= 4;
        // Left
        if (x > 0 && board[y][x - 1]) mask |= 8;
        return mask;
    }

    public clear() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.sprites[y][x]?.destroy();
                this.sprites[y][x] = null;
            }
        }
    }

    public getCellSize() { return this.cellSize; }
    public getWidth() { return this.width; }
    public getHeight() { return this.height; }
    public getOffsets() { return { x: this.offsetX, y: this.offsetY }; }
}
