import Phaser from 'phaser';
import { Grid } from '../game/Grid.ts';
import { InputHandler, Action } from '../game/InputHandler.ts';
import { ActivePiece } from '../game/ActivePiece.ts';
import { TETROMINOES, type TetrominoType } from '../game/Tetromino.ts';
import { GraphicsUtils } from '../game/GraphicsUtils.ts';

export class Game extends Phaser.Scene {
    private grid!: Grid;
    private gridWidth: number = 14;
    private ghostsEnabled: boolean = true;
    private p1Piece!: ActivePiece | undefined;
    private p2Piece!: ActivePiece | undefined;
    private score: number = 0;
    private scoreText!: Phaser.GameObjects.Text;
    private p1NextType: TetrominoType = 'I';
    private p2NextType: TetrominoType = 'I';
    private p1NextPreview!: Phaser.GameObjects.Container;
    private p2NextPreview!: Phaser.GameObjects.Container;
    private isPaused: boolean = false;
    private isGameOver: boolean = false;
    private pauseText!: Phaser.GameObjects.Text;
    private inputHandler!: InputHandler;

    constructor() {
        super('Game');
    }

    create() {
        // Reset Game State
        this.score = 0;
        this.totalLines = 0;
        this.dropTimer = 0;
        this.isPaused = false;
        this.isGameOver = false;

        this.events.on('shutdown', this.shutdown, this);

        // Load Settings
        const savedWidth = localStorage.getItem('gridWidth');
        this.gridWidth = savedWidth ? parseInt(savedWidth, 10) : 14;
        this.ghostsEnabled = localStorage.getItem('showGhosts') !== 'false';

        this.grid = new Grid(this, this.gridWidth, 20);
        this.grid.drawGrid();

        // Init next types
        const types: TetrominoType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
        this.p1NextType = types[Math.floor(Math.random() * types.length)];
        this.p2NextType = types[Math.floor(Math.random() * types.length)];

        this.createNextPreviews();

        // Spawn Pieces
        this.p1Piece = this.spawnPiece(this.getSpawnX(true, this.p1NextType), 0);
        this.p2Piece = this.spawnPiece(this.getSpawnX(false, this.p2NextType), 0);

        // Initialize Input
        this.inputHandler = new InputHandler(this);

        // Input Event
        this.events.on('action', this.handleInput, this);
        
        // Restart Event (Optional: could handle inside handleInput but separate event is fine if dispatched manually)
        // Check InputHandler: it emits 'action' with Action.GAME_RESTART
        // So we handle it in handleInput.
        
        // Score UI
        this.scoreText = this.add.text(10, 10, 'Score: 0', { 
            fontFamily: 'Inter',
            fontSize: '24px', 
            color: '#fff',
            stroke: '#0f172a',
            strokeThickness: 2
        });
        
        // Lines UI (Top Right)
        const { width } = this.scale;
        this.linesText = this.add.text(width - 20, 10, 'Lines: 0', { 
            fontFamily: 'Inter',
            fontSize: '24px', 
            color: '#fff',
            stroke: '#0f172a',
            strokeThickness: 2
        }).setOrigin(1, 0);
    }
    
    private totalLines: number = 0;
    private linesText!: Phaser.GameObjects.Text;

    handleInput(action: Action) {
        // Player 1
        if (action === Action.P1_MOVE_LEFT) this.handleMove(this.p1Piece, this.p2Piece, -1, 0);
        else if (action === Action.P1_MOVE_RIGHT) this.handleMove(this.p1Piece, this.p2Piece, 1, 0);
        else if (action === Action.P1_MOVE_DOWN) this.handleMove(this.p1Piece, this.p2Piece, 0, 1);
        else if (action === Action.P1_ROTATE_CCW) this.p1Piece?.rotate(false, this.p2Piece);
        else if (action === Action.P1_ROTATE_CW) this.p1Piece?.rotate(true, this.p2Piece);

        // Player 2
        else if (action === Action.P2_MOVE_LEFT) this.handleMove(this.p2Piece, this.p1Piece, -1, 0);
        else if (action === Action.P2_MOVE_RIGHT) this.handleMove(this.p2Piece, this.p1Piece, 1, 0);
        else if (action === Action.P2_MOVE_DOWN) this.handleMove(this.p2Piece, this.p1Piece, 0, 1);
        else if (action === Action.P2_ROTATE_CCW) this.p2Piece?.rotate(false, this.p1Piece);
        else if (action === Action.P2_ROTATE_CW) this.p2Piece?.rotate(true, this.p1Piece);

        // Global
        else if (action === Action.GAME_RESTART) this.restartGame();
        else if (action === Action.GAME_PAUSE) {
             if (this.isGameOver) {
               this.returnToMenu();
           } else {
               this.togglePause();
           }
        }
    }

    handleMove(mover: ActivePiece | undefined, other: ActivePiece | undefined, dx: number, dy: number) {
        if (this.isPaused || !mover || !other) return;

        if (dx !== 0 || dy !== 0) {
            
            // --- DIAGNOSTIC LOGGING ---
            // Help diagnose why overlap occurs (Collision Check returning False when it should be True)
            if (mover && other) {
                // Only log when pieces are close to avoid spam
                const dist = Math.abs(mover.y - other.y) + Math.abs(mover.x - other.x);
                if (dist < 6) {
                    const willCollide = this.checkPieceCollision(mover, other, dx, dy);
                    const aCells = this.getCellsAt(mover, mover.x + dx, mover.y + dy);
                    const bCells = other.getOccupiedCells();
                    
                    // Manual verification
                    const overlap = aCells.find(ac => bCells.some(bc => ac.x === bc.x && ac.y === bc.y));

                    if (!willCollide && overlap) {
                        console.error("%cCRITICAL: Collision Check Failed but Overlap Exists!", "color: red; font-size: 16px;");
                        console.log("   Mover:", mover === this.p1Piece ? 'P1' : 'P2');
                        console.log("   Attempting Move To:", mover.x + dx, mover.y + dy);
                        console.log("   Other Piece At:", other.x, other.y);
                        console.log("   Overlap Cell:", overlap);
                        console.log("   A Cells (Projected):", JSON.stringify(aCells));
                        console.log("   B Cells (Current):", JSON.stringify(bCells));
                    } else if (!willCollide) {
                         // Log close calls to verify coordinates
                         console.log(`Move Safe: P${mover === this.p1Piece ? '1' : '2'} -> (${mover.x + dx}, ${mover.y + dy}) | Other: (${other.x}, ${other.y})`);
                    }
                }
            }
            // --------------------------

            // Check if move hits the other piece
            if (this.checkPieceCollision(mover, other, dx, dy)) {
                // Pushing logic (Horizontal OR Vertical)
                // Try to move the OTHER piece in the same direction
                if (other.move(dx, dy)) {
                    // If other piece moved, then mover can move
                    mover.move(dx, dy);
                }
            } else {
                mover.move(dx, dy);
                
                // Safety Re-check: Did we just step onto the other piece?
                // This catches rare cases (or bugs) where the initial collision check missed.
                if (this.checkPieceCollision(mover, other, 0, 0)) {
                    // Overlap detected! Revert the move.
                    mover.move(-dx, -dy);
                }
            }
        }
    }

    checkPieceCollision(a: ActivePiece, b: ActivePiece, dx: number, dy: number): boolean {
        // Check if A moved by dx,dy overlaps B
        // We need to know A's cells at new pos vs B's cells at current pos.
        // ActivePiece doesn't expose a simple "will overlap this set of cells" method efficiently, 
        // but we can add 'intersects(otherPiece)' helper.

        // Get A's potential cells
        const aCells = this.getCellsAt(a, a.x + dx, a.y + dy);
        const bCells = b.getOccupiedCells();

        // Check intersection
        for (const ac of aCells) {
            for (const bc of bCells) {
                if (ac.x === bc.x && ac.y === bc.y) return true;
            }
        }
        return false;
    }

    getCellsAt(piece: ActivePiece, targetX: number, targetY: number): { x: number, y: number }[] {
        return piece.getOccupiedCells(targetX, targetY);
    }

    private dropTimer: number = 0;
    private dropInterval: number = 1000; // 1 second drop speed

    update(time: number, delta: number) {
        if (this.isPaused) return;

        // Update Input Handler for continuous key presses (DAS/ARR)
        if (this.inputHandler) {
            this.inputHandler.update(time, delta);
        }

        this.dropTimer += delta;
        if (this.dropTimer >= this.dropInterval) {
            this.dropTimer = 0;
            if (this.p1Piece) this.applyGravity(this.p1Piece);
            if (this.p2Piece) this.applyGravity(this.p2Piece);
        }

        // Update Ghosts after all movement
        const p1Obs = this.p2Piece ? this.p2Piece.getOccupiedCells() : [];
        const p2Obs = this.p1Piece ? this.p1Piece.getOccupiedCells() : [];
        this.p1Piece?.updateGhost(p1Obs);
        this.p2Piece?.updateGhost(p2Obs);
    }

    applyGravity(piece: ActivePiece) {
        // Try moving down
        if (!piece.move(0, 1)) {
            // Collision detected below
            // Lock piece (TODO: Add lock delay)
            this.lockPiece(piece);
        }
    }

    lockPiece(piece: ActivePiece) {
        // Place blocks on grid
        const { linesCleared, animationDuration } = this.grid.placePiece(piece.x, piece.y, piece.getRotatedShape(), piece.color, piece.isRounded);

        if (linesCleared > 0) {
            // Simple scoring
            this.score += 100 * linesCleared * linesCleared;
            this.scoreText.setText(`Score: ${this.score}`);
            
            // Update Lines Counter
            this.totalLines += linesCleared;
            this.linesText.setText(`Lines: ${this.totalLines}`);
        }

        // Destroy active piece visual
        piece.destroy();

        // Check ownership before clearing reference
        const isP1 = (piece === this.p1Piece);

        // Clear reference immediately so update loop skips it
        if (isP1) this.p1Piece = undefined;
        else this.p2Piece = undefined;

        // Respawn new piece with delay if needed
        const spawnDelay = linesCleared > 0 ? animationDuration : 0;

        this.time.delayedCall(spawnDelay, () => {
            if (isP1) {
                this.p1Piece = this.spawnPiece(this.getSpawnX(true, this.p1NextType), 0);
            } else {
                this.p2Piece = this.spawnPiece(this.getSpawnX(false, this.p2NextType), 0);
            }
        });
    }

    getSpawnX(isP1: boolean, type: TetrominoType): number {
        const center = this.gridWidth * (isP1 ? 0.25 : 0.75);
        let offset = 1;
        if (type === 'I') offset = 2;
        // O is 2x2, offset 1 is fine (center 1.5 -> left 0.5? No 2x2 centered is x, x+1. Center is x+0.5).
        // If center is 2.5. X=1.5 -> 1. Occupies 1,2. Center 1.5. Perfectly centered. 
        
        return Math.floor(center - offset);
    }

    spawnPiece(x: number, y: number): ActivePiece {
        let type: TetrominoType;

        // Random types array
        const types: TetrominoType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
        const nextType = types[Math.floor(Math.random() * types.length)];

        if (x < this.gridWidth / 2) {
            // P1
            type = this.p1NextType;
            this.p1NextType = nextType;
            if (this.p1NextPreview) this.updatePreview(this.p1NextPreview, this.p1NextType);
        } else {
            // P2
            type = this.p2NextType;
            this.p2NextType = nextType;
            if (this.p2NextPreview) this.updatePreview(this.p2NextPreview, this.p2NextType);
        }

        const isRounded = (x < this.gridWidth / 2); // P1 is left side
        const piece = new ActivePiece(this, this.grid, x, y, type, isRounded);
        piece.setShowGhost(this.ghostsEnabled);

        // Check game over
        if (piece.checkCollision(x, y, 0)) {
            console.log("GAME OVER");
            this.isGameOver = true;
            // Stop game
            this.scene.pause();
            const { width, height } = this.scale;
            this.add.text(width/2, height/2, 'GAME OVER', { 
                fontFamily: 'Outfit',
                fontSize: '64px', 
                color: '#ef4444',
                stroke: '#000',
                strokeThickness: 6
            }).setOrigin(0.5);
            this.add.text(width/2, height/2 + 80, 'Press R to Restart', { 
                fontFamily: 'Inter',
                fontSize: '32px', 
                color: '#ffffff' 
            }).setOrigin(0.5);
            this.add.text(width/2, height/2 + 130, 'Press ESC for Menu', { 
                fontFamily: 'Inter',
                fontSize: '24px', 
                color: '#94a3b8' 
            }).setOrigin(0.5);
        }
        return piece;
    }

    createNextPreviews() {
        this.p1NextPreview = this.add.container(50, 100);
        this.p2NextPreview = this.add.container(650, 100);

        // this.add.text(50, 70, 'P1 Next', { fontSize: '16px', color: '#fff' });
        // this.add.text(650, 70, 'P2 Next', { fontSize: '16px', color: '#fff' });

        this.updatePreview(this.p1NextPreview, this.p1NextType);
        this.updatePreview(this.p2NextPreview, this.p2NextType);
    }

    updatePreview(container: Phaser.GameObjects.Container, type: TetrominoType) {
        container.removeAll(true);
        const def = TETROMINOES[type];
        const shape = def.shape;
        const color = def.color;
        const rows = shape.length;
        const cols = shape[0].length;
        const isRounded = (container === this.p1NextPreview); // P1 is rounded
        const blockSize = 20; // Exact fit for 20px spacing (was 18)

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (shape[r][c]) {
                     const x = c * 20 + 10;
                     const y = r * 20 + 10;

                     const g = this.add.graphics();
                     
                     // Helper logic for neighbors in static shape
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
                        this,
                        g,
                        x,
                        y,
                        blockSize,
                        color,
                        neighbors,
                        isRounded
                    );

                    container.add(g);
                }
            }
        }
    }

    restartGame() {
        console.log('Restarting Game...');
        this.scene.restart();
    }

    shutdown() {
        if (this.inputHandler) {
            this.inputHandler.destroy();
        }
    }

    returnToMenu() {
        if (this.inputHandler) {
            this.inputHandler.destroy();
        }
        this.scene.start('Menu');
    }

    togglePause() {
        if (this.isPaused) {
            this.isPaused = false;
            this.physics.resume(); // If using physics, but we are manual
            if (this.pauseText) this.pauseText.destroy();
        } else {
            this.isPaused = true;
            this.physics.pause();
            const { width, height } = this.scale;
            this.pauseText = this.add.text(width / 2, height / 2, 'PAUSED', { 
                fontFamily: 'Outfit',
                fontSize: '64px', 
                color: '#fff',
                stroke: '#0f172a',
                strokeThickness: 4
            }).setOrigin(0.5);
        }
    }
}


