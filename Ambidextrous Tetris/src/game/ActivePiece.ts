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
    private ghostContainer: Phaser.GameObjects.Container;
    private blocks: Phaser.GameObjects.Graphics[] = [];
    
    public ghostEnabled: boolean = true;

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

        this.ghostContainer = this.scene.add.container(0, 0);
        this.ghostContainer.setAlpha(0.5); // Global ghost alpha? Or handled in draw
        this.container = this.scene.add.container(0, 0); // Active on top
        this.render();
        this.updatePosition();
    }

    render() {
        this.container.removeAll(true);
        this.ghostContainer.removeAll(true);
        this.blocks = [];
        
        const currentShape = this.getRotatedShape();
        const rows = currentShape.length;
        const cols = currentShape[0].length;
        const blockSize = 30; // No gaps (was 28)

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (currentShape[r][c]) {
                    const x = c * 30 + 15; // Center x
                    const y = r * 30 + 15; // Center y
                    
                    // Render Active Block
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

                    // Render Ghost Block (Only if enabled?)
                    // We render it always and toggle container visibility.
                    // Actually, if disabled, save performance? 
                    // Let's render always for simplicity of updates.
                    const ghostG = this.scene.add.graphics();
                    GraphicsUtils.drawGhostBlock(
                        this.scene,
                        ghostG,
                        x,
                        y,
                        blockSize,
                        neighbors,
                        this.isRounded
                    );
                    this.ghostContainer.add(ghostG);
                }
            }
        }
        
        this.ghostContainer.setVisible(this.ghostEnabled);
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

    rotate(cw: boolean, otherPiece?: ActivePiece) {
        const newRotation = (this.rotation + (cw ? 1 : 3)) % 4; // +3 is equivalent to -1 mod 4

        // Get obstacles from the other piece to check against
        const obstacles = otherPiece ? otherPiece.getOccupiedCells() : [];

        // Basic wall kick (try original, then +/- 1 x)
        // TODO: Implement SRS
        if (!this.checkCollision(this.x, this.y, newRotation, obstacles)) {
            this.rotation = newRotation;
            this.render();
            return;
        }
        // Simple wall kick right
        if (!this.checkCollision(this.x + 1, this.y, newRotation, obstacles)) {
            this.x += 1;
            this.rotation = newRotation;
            this.render();
            this.updatePosition();
            return;
        }
        // Simple wall kick left
        if (!this.checkCollision(this.x - 1, this.y, newRotation, obstacles)) {
            this.x -= 1;
            this.rotation = newRotation;
            this.render();
            this.updatePosition();
            return;
        }
    }

    // Check if the piece at (tx, ty) with trot collides with grid OR obstacles
    checkCollision(tx: number, ty: number, trot: number, obstacles: {x: number, y: number}[] = []): boolean {
        const shape = this.getShapeAtRotation(trot);
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    const wx = tx + c;
                    const wy = ty + r;

                    // Grid Collision
                    if (this.grid.isOccupied(wx, wy)) {
                        return true;
                    }

                    // Obstacle Collision (Other Piece)
                    for (const obs of obstacles) {
                        if (obs.x === wx && obs.y === wy) {
                            return true;
                        }
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
                    // Enforce integer coordinates to prevent floating point mismatch
                    cells.push({ x: Math.round(offsetX + c), y: Math.round(offsetY + r) });
                }
            }
        }
        return cells;
    }

    updateGhost(obstacles: {x: number, y: number}[] = []) {
        if (!this.ghostEnabled) {
            this.ghostContainer.setVisible(false);
            return;
        }
        this.ghostContainer.setVisible(true);

        const dropY = this.getDropY(obstacles);
        const pos = this.grid.gridToWorld(this.x, dropY);
        this.ghostContainer.setPosition(pos.x, pos.y);
    }

    private getDropY(obstacles: {x: number, y: number}[]): number {
        let dy = this.y;
        while (!this.checkCollision(this.x, dy + 1, this.rotation, obstacles)) {
            dy++;
        }
        return dy;
    }

    setShowGhost(enabled: boolean) {
        this.ghostEnabled = enabled;
        this.ghostContainer.setVisible(enabled);
    }

    destroy() {
        this.ghostContainer.destroy();
        this.container.destroy();
    }
}
