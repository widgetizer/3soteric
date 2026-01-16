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
        this.gridGraphics.lineStyle(1, 0xFFFFFF, 0.3);

        const startX = this.offsetX;
        const startY = this.offsetY;

        // Vertical lines
        for (let x = 0; x <= this.width; x++) {
            this.gridGraphics.moveTo(startX + x * this.cellSize, startY);
            this.gridGraphics.lineTo(startX + x * this.cellSize, startY + this.height * this.cellSize);
        }

        // Horizontal lines
        for (let y = 0; y <= this.height; y++) {
            this.gridGraphics.moveTo(startX, startY + y * this.cellSize);
            this.gridGraphics.lineTo(startX + this.width * this.cellSize, startY + y * this.cellSize);
        }

        this.gridGraphics.strokePath();
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
        const blockSize = 28;

        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    const bx = x + c;
                    const by = y + r;
                    if (this.isValidPosition(bx, by)) {
                        this.board[by][bx] = color;
                        
                        const pos = this.gridToWorld(bx, by);
                        
                        const g = this.scene.add.graphics();
                        
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
                            pos.x + 15,
                            pos.y + 15,
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
        console.log("Animate clear for rows:", rows);
        // 1. Logical Clear (Immediate, so other player can move into space)
        // We need to shift the board array down.
        // We'll create a new board state but keep the visuals for animation.
        const newBoard = Array(this.height).fill(null).map(() => Array(this.width).fill(0));
        let newY = this.height - 1;
        
        // This mapping tells us where each OLD row went (or -1 if cleared)
        const rowMapping: number[] = Array(this.height).fill(-1);

        for (let y = this.height - 1; y >= 0; y--) {
            if (!rows.includes(y)) {
                newBoard[newY] = [...this.board[y]]; // Copy row
                rowMapping[y] = newY;
                newY--;
            }
        }
        
        // Update logical board immediately
        this.board = newBoard;

        // 2. Visual Animation
        // Animate cleared rows disappearing
        rows.forEach(y => {
            for (let x = 0; x < this.width; x++) {
                const block = this.visualBoard[y][x];
                if (block) {
                    this.scene.tweens.add({
                        targets: block,
                        scaleX: 0,
                        scaleY: 0,
                        alpha: 0,
                        duration: 300,
                        onComplete: () => block.destroy()
                    });
                }
            }
        });

        // Animate remaining rows falling down
        // We need to update visualBoard to match newBoard structure at the END of animation?
        // Actually, we can update the array structure now, but keep the objects references
        
        const newVisualBoard = Array(this.height).fill(null).map(() => Array(this.width).fill(null));
        
        for (let y = 0; y < this.height; y++) {
            const destY = rowMapping[y];
            if (destY !== -1) {
                // Move visual row to new position in array
                for (let x = 0; x < this.width; x++) {
                    const block = this.visualBoard[y][x];
                    if (block) {
                       newVisualBoard[destY][x] = block;
                       // Animate position
                       const newPos = this.gridToWorld(x, destY);
                       this.scene.tweens.add({
                           targets: block,
                           y: newPos.y + 15, // Center offset
                           duration: 300,
                           delay: 100, // Small delay after clear starts
                           ease: 'Bounce.Out' // "impressive"
                       });
                    }
                }
            }
        }
        
        this.visualBoard = newVisualBoard;
    }
}
