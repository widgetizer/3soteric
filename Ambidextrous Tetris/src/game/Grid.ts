import Phaser from 'phaser';
import { GraphicsUtils } from './GraphicsUtils';

export class Grid {
    private scene: Phaser.Scene;
    private width: number;
    private height: number;
    private cellSize: number;
    private gridGraphics: Phaser.GameObjects.Graphics;

    // 0 = empty, 1+ = occupied (color index)
    private board: number[][];
    private visualBoard: (Phaser.GameObjects.Rectangle | Phaser.GameObjects.Graphics | null)[][];
    private offsetX: number;
    private offsetY: number;

    constructor(scene: Phaser.Scene, width: number = 14, height: number = 20, cellSize: number = 30) {
        this.scene = scene;
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;

        // Center the grid
        const totalWidth = width * cellSize;
        const totalHeight = height * cellSize;
        this.offsetX = (this.scene.scale.width - totalWidth) / 2;
        this.offsetY = (this.scene.scale.height - totalHeight) / 2;

        this.gridGraphics = this.scene.add.graphics();
        this.board = Array(height).fill(null).map(() => Array(width).fill(0));
        this.visualBoard = Array(height).fill(null).map(() => Array(width).fill(null));
    }

    drawGrid() {
        this.gridGraphics.clear();
        
        // Background Gradient
        // Stand out against #1b263b (Main BG)
        // Slightly darker vertical gradient: Dark Blue-Grey to Near Black
        const cTop = 0x161e2e;
        const cBot = 0x0a0e14;
        
        const width = this.width * this.cellSize;
        const height = this.height * this.cellSize;
        
        this.gridGraphics.fillGradientStyle(cTop, cTop, cBot, cBot, 1, 1, 1, 1);
        this.gridGraphics.fillRect(this.offsetX, this.offsetY, width, height);

        // Optional: Draw subtle border?
        this.gridGraphics.lineStyle(2, 0x334455, 0.5);
        this.gridGraphics.strokeRect(this.offsetX, this.offsetY, width, height);
    }

    // Convert grid coordinates to world coordinates (for placing pieces)
    gridToWorld(x: number, y: number): { x: number, y: number } {
        return {
            x: this.offsetX + x * this.cellSize,
            y: this.offsetY + y * this.cellSize
        };
    }

    isOccupied(x: number, y: number): boolean {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return true; // Out of bounds is considered occupied (walls)
        }
        return this.board[y][x] !== 0;
    }

    isValidPosition(x: number, y: number): boolean {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    placePiece(x: number, y: number, shape: number[][], color: number, isRounded: boolean = false): { linesCleared: number; animationDuration: number } {
        const rows = shape.length;
        const cols = shape[0].length;
        const blockSize = this.cellSize; // No gaps (was 28)

        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    const bx = x + c;
                    const by = y + r;
                    if (this.isValidPosition(bx, by)) {
                        this.board[by][bx] = color;
                        
                        const pos = this.gridToWorld(bx, by);
                        
                        const g = this.scene.add.graphics();
                        
                        // Position graphics at the center of the cell so scaling works from center
                        g.setPosition(pos.x + 15, pos.y + 15);
                        
                        // Calculate neighbors within the shape to preserve the "fused" look of the piece
                        const hasTop = (r > 0) && !!shape[r - 1][c];
                        const hasBottom = (r < rows - 1) && !!shape[r + 1][c];
                        const hasLeft = (c > 0) && !!shape[r][c - 1];
                        const hasRight = (c < cols - 1) && !!shape[r][c + 1];

                         const neighbors = {
                            top: hasTop,
                            bottom: hasBottom,
                            left: hasLeft,
                            right: hasRight
                        };

                        GraphicsUtils.drawBlock(
                            this.scene,
                            g,
                            0, // Local 0,0 (since g is positioned at center)
                            0, // Local 0,0
                            blockSize,
                            color,
                            neighbors,
                            isRounded
                        );

                        this.visualBoard[by][bx] = g;
                    }
                }
            }
        }
        return this.checkLines();
    }

    checkLines(): { linesCleared: number; animationDuration: number } {
        const fullRows: number[] = [];
        for (let y = 0; y < this.height; y++) {
            if (this.board[y].every(cell => cell !== 0)) {
                fullRows.push(y);
            }
        }

        if (fullRows.length > 0) {
            console.log("Lines cleared:", fullRows);
            this.animateClear(fullRows);
            return { linesCleared: fullRows.length, animationDuration: 500 };
        }
        return { linesCleared: 0, animationDuration: 0 };
    }

    animateClear(rows: number[]) {
        const fadeDuration = 250;
        const moveDuration = 300;
        const cellSize = this.cellSize;

        // 1. Identify blocks -> Fade or Drop
        const blocksToFade: Phaser.GameObjects.Graphics[] = [];
        const blocksToDrop: { g: Phaser.GameObjects.Graphics, dropCount: number }[] = [];
        
        let dropCount = 0;
        
        // Scan from bottom to top
        for (let y = this.height - 1; y >= 0; y--) {
            if (rows.includes(y)) {
                dropCount++;
                for (let x = 0; x < this.width; x++) {
                    const block = this.visualBoard[y][x];
                    if (block instanceof Phaser.GameObjects.Graphics) {
                         blocksToFade.push(block);
                    }
                }
            } else if (dropCount > 0) {
                 // Non-cleared row above a clear, needs to drop
                 for (let x = 0; x < this.width; x++) {
                    const block = this.visualBoard[y][x];
                    if (block instanceof Phaser.GameObjects.Graphics) {
                        blocksToDrop.push({ g: block, dropCount: dropCount });
                    }
                 }
            }
        }

        // 2. Animate Fades (Cleared Rows)
        if (blocksToFade.length > 0) {
            this.scene.tweens.add({
                targets: blocksToFade,
                alpha: 0,
                scale: 0.8, 
                duration: fadeDuration,
                onComplete: (_tween, targets) => {
                    targets.forEach((t: Phaser.GameObjects.Graphics) => t.destroy());
                }
            });
        }

        // 3. Animate Drops (Falling Rows)
        for (const item of blocksToDrop) {
            this.scene.tweens.add({
                targets: item.g,
                y: item.g.y + (item.dropCount * cellSize),
                duration: moveDuration,
                ease: 'Quad.easeOut', 
                delay: 50
            });
        }

        // 4. Update Logic Maps Immediately
        // (We shift the references so future logic looks at the correct board state)
        const newBoard: number[][] = Array(this.height).fill(null).map(() => Array(this.width).fill(0));
        const newVisuals: (Phaser.GameObjects.Rectangle | Phaser.GameObjects.Graphics | null)[][] = Array(this.height).fill(null).map(() => Array(this.width).fill(null));

        let destY = this.height - 1;
        for (let y = this.height - 1; y >= 0; y--) {
            if (!rows.includes(y)) {
                for (let x = 0; x < this.width; x++) {
                    newBoard[destY][x] = this.board[y][x];
                    newVisuals[destY][x] = this.visualBoard[y][x];
                }
                destY--;
            }
        }
        
        this.board = newBoard;
        this.visualBoard = newVisuals;
    }
}
