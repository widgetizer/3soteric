import Phaser from 'phaser';
import { PhysicsEngine, type Actor, type Intent } from '../game/PhysicsEngine';
import { VisualGrid } from '../game/VisualGrid';
import { VisualPiece } from '../game/VisualPiece';
import { InputHandler, Action } from '../game/InputHandler';
import { TETROMINOES, type TetrominoType, rotateMatrix } from '../game/Tetromino';

export class Game extends Phaser.Scene {
    private physicsEngine!: PhysicsEngine;
    private grid!: VisualGrid;
    private inputHandler!: InputHandler;

    private p1!: { visual: VisualPiece; type: TetrominoType; state: Actor; isRounded: boolean; color: number };
    private p2!: { visual: VisualPiece; type: TetrominoType; state: Actor; isRounded: boolean; color: number };

    private gravityTimer: number = 0;
    private gravityInterval: number = 1000;

    // Track locked logic data to persist colors/styles in VisualGrid
    private lockedPieces: { x: number, y: number, color: number, isRounded: boolean }[] = [];

    // Pending intents for the current frame
    private pendingIntents: Map<string, Intent> = new Map();

    constructor() {
        super('Game');
    }

    create() {
        // Initialize Visuals
        this.grid = new VisualGrid(this, 14, 20);
        
        // Initialize Physics (Matches Grid dimensions)
        this.physicsEngine = new PhysicsEngine(14, 20);

        // Initialize Input
        this.inputHandler = new InputHandler(this);
        this.events.on('action', (action: Action) => this.handleAction(action), this);

        // Spawn Starting Pieces
        this.spawnHand('p1', true);
        this.spawnHand('p2', false);

        // Reset Timers
        this.gravityTimer = 0;
        this.lockedPieces = [];
    }

    handleAction(action: Action) {
        const intentP1 = this.getOrInitIntent('p1');
        const intentP2 = this.getOrInitIntent('p2');

        switch (action) {
            case Action.P1_MOVE_LEFT: intentP1.dx = -1; break;
            case Action.P1_MOVE_RIGHT: intentP1.dx = 1; break;
            case Action.P1_MOVE_DOWN: intentP1.dy = 1; break;
            case Action.P1_ROTATE_CW: intentP1.dr = 1; break;
            case Action.P1_ROTATE_CCW: intentP1.dr = -1; break;
            case Action.P2_MOVE_LEFT: intentP2.dx = -1; break;
            case Action.P2_MOVE_RIGHT: intentP2.dx = 1; break;
            case Action.P2_MOVE_DOWN: intentP2.dy = 1; break;
            case Action.P2_ROTATE_CW: intentP2.dr = 1; break;
            case Action.P2_ROTATE_CCW: intentP2.dr = -1; break;
        }
    }

    private getOrInitIntent(id: string): Intent {
        if (!this.pendingIntents.has(id)) {
            this.pendingIntents.set(id, { dx: 0, dy: 0, dr: 0 });
        }
        return this.pendingIntents.get(id)!;
    }

    private spawnHand(id: string, isRounded: boolean) {
        const types: TetrominoType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
        const type = types[Math.floor(Math.random() * types.length)];
        const def = TETROMINOES[type];
        
        const startX = id === 'p1' ? 3 : 9;
        const state: Actor = { id, x: startX, y: 0, shape: def.shape, rotation: 0 };
        const visual = new VisualPiece(this, this.grid, id, type, startX, 0, isRounded);
        
        const hand = { visual, type, state, isRounded, color: def.color };
        if (id === 'p1') this.p1 = hand;
        else this.p2 = hand;
    }

    update(time: number, delta: number) {
        this.inputHandler.update(time, delta);

        // --- 1. COLLECT GRAVITY ---
        this.gravityTimer += delta;
        if (this.gravityTimer >= this.gravityInterval) {
            this.gravityTimer = 0;
            this.getOrInitIntent('p1').dy = 1;
            this.getOrInitIntent('p2').dy = 1;
        }

        // --- 2. RESOLVE PHYSICS ---
        const results = this.physicsEngine.resolve([this.p1.state, this.p2.state], this.pendingIntents);

        // --- 3. APPLY RESULTS ---
        const actors = [this.p1, this.p2];
        for (const p of actors) {
            const result = results.get(p.state.id);
            if (!result) continue;

            const intent = this.pendingIntents.get(p.state.id);
            
            // Check Landing
            if (intent && intent.dy === 1 && result.y === p.state.y) {
                 this.lockPiece(p);
                 continue;
            }

            // Apply Rotations to logical shape
            if (result.rotation !== p.state.rotation) {
                const diff = (result.rotation - p.state.rotation + 4) % 4;
                for(let i=0; i<diff; i++) p.state.shape = rotateMatrix(p.state.shape);
            }

            p.state.x = result.x;
            p.state.y = result.y;
            p.state.rotation = result.rotation;
            
            const ghostY = this.physicsEngine.getGhostY(p.state);
            p.visual.updateVisuals(p.state.x, p.state.y, p.state.rotation, ghostY);
        }

        this.pendingIntents.clear();
    }

    private lockPiece(p: { visual: VisualPiece; type: TetrominoType; state: Actor; isRounded: boolean; color: number }) {
        const cells = this.physicsEngine.lockActor(p.state);
        p.visual.destroy();

        for (const cell of cells) {
            this.lockedPieces.push({ x: cell.x, y: cell.y, color: p.color, isRounded: p.isRounded });
        }

        const lines = this.physicsEngine.clearFullLines();
        if (lines.length > 0) {
            this.physicsEngine.shiftLines(lines);
            this.lockedPieces = this.lockedPieces.filter(lp => !lines.includes(lp.y));
            for (const line of lines) {
                for (const lp of this.lockedPieces) {
                    if (lp.y < line) lp.y++;
                }
            }
        }

        this.grid.updateBoardVisuals(this.physicsEngine.getBoard(), this.lockedPieces);
        this.spawnHand(p.state.id, p.isRounded);
    }
}
