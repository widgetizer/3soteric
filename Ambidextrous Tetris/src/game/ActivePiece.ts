import Phaser from 'phaser';
import { type TetrominoType, TETROMINOES } from './Tetromino';
import { Grid } from './Grid';
import { GraphicsUtils } from './GraphicsUtils';


export class ActivePiece {
    private scene: Phaser.Scene;
    private grid: Grid;
    public x: number;
    public y: number;
    public type: TetrominoType;
    public rotation: number; // 0, 1, 2, 3
    public shape: number[][];
    public color: number;
    private container: Phaser.GameObjects.Container;
    private blocks: Phaser.GameObjects.Graphics[] = [];

    public isRounded: boolean;

    constructor(scene: Phaser.Scene, grid: Grid, x: number, y: number, type: TetrominoType, isRounded: boolean = false) {
        this.scene = scene;
        this.grid = grid;
        this.x = x;
        this.y = y;
        this.type = type;
        this.rotation = 0;
        this.isRounded = isRounded;

        const def = TETROMINOES[type];
        this.color = def.color;
        this.shape = def.shape;

        this.container = this.scene.add.container(0, 0);
        this.render();
        this.updatePosition();
    }

    render() {
        this.container.removeAll(true);
        this.blocks = [];
        const currentShape = this.getRotatedShape();
        const rows = currentShape.length;
        const cols = currentShape[0].length;
        const blockSize = 28;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (currentShape[r][c]) {
                    const x = c * 30 + 15; // Center x
                    const y = r * 30 + 15; // Center y
                    
                    const g = this.scene.add.graphics();
                    
                    // Neighbor checks (within the shape)
                    const hasTop = (r > 0) && !!currentShape[r - 1][c];
                    const hasBottom = (r < rows - 1) && !!currentShape[r + 1][c];
                    const hasLeft = (c > 0) && !!currentShape[r][c - 1];
                    const hasRight = (c < cols - 1) && !!currentShape[r][c + 1];

                    const neighbors = {
                        top: hasTop,
                        bottom: hasBottom,
                        left: hasLeft,
                        right: hasRight
                    };

                    GraphicsUtils.drawBlock(
                        this.scene,
                        g,
                        x, // local coordinates in container
                        y,
                        blockSize,
                        this.color,
                        neighbors,
                        this.isRounded
                    );

                    this.container.add(g);
                    this.blocks.push(g);
                }
            }
        }
    }

    updatePosition() {
        const pos = this.grid.gridToWorld(this.x, this.y);
        this.container.setPosition(pos.x, pos.y);
    }

    getRotatedShape(): number[][] {
        let shape = this.shape;
        for (let i = 0; i < this.rotation; i++) {
            shape = this.rotateMatrix(shape);
        }
        return shape;
    }

    rotateMatrix(matrix: number[][]): number[][] {
        const N = matrix.length;
        const result = Array(N).fill(0).map(() => Array(N).fill(0));
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                result[j][N - 1 - i] = matrix[i][j];
            }
        }
        return result;
    }

    move(dx: number, dy: number): boolean {
        // Optimistic move check
        if (!this.checkCollision(this.x + dx, this.y + dy, this.rotation)) {
            this.x += dx;
            this.y += dy;
            this.updatePosition();
            return true;
        }
        return false;
    }

    rotate(cw: boolean) {
        const newRotation = (this.rotation + (cw ? 1 : 3)) % 4; // +3 is equivalent to -1 mod 4

        // Basic wall kick (try original, then +/- 1 x)
        // TODO: Implement SRS
        if (!this.checkCollision(this.x, this.y, newRotation)) {
            this.rotation = newRotation;
            this.render();
            return;
        }
        // Simple wall kick right
        if (!this.checkCollision(this.x + 1, this.y, newRotation)) {
            this.x += 1;
            this.rotation = newRotation;
            this.render();
            this.updatePosition();
            return;
        }
        // Simple wall kick left
        if (!this.checkCollision(this.x - 1, this.y, newRotation)) {
            this.x -= 1;
            this.rotation = newRotation;
            this.render();
            this.updatePosition();
            return;
        }
    }

    // Check if the piece at (tx, ty) with trot collides with grid
    checkCollision(tx: number, ty: number, trot: number): boolean {
        const shape = this.getShapeAtRotation(trot);
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    if (this.grid.isOccupied(tx + c, ty + r)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    private getShapeAtRotation(rot: number): number[][] {
        let shape = this.shape;
        for (let i = 0; i < rot; i++) {
            shape = this.rotateMatrix(shape);
        }
        return shape;
    }

    // Helper for collision with other piece
    getOccupiedCells(offsetX: number = this.x, offsetY: number = this.y): { x: number, y: number }[] {
        const cells: { x: number, y: number }[] = [];
        const shape = this.getRotatedShape();
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    cells.push({ x: offsetX + c, y: offsetY + r });
                }
            }
        }
        return cells;
    }

    destroy() {
        this.container.destroy();
    }
}
