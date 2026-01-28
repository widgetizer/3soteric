import { rotateMatrix } from './Tetromino';

export interface Point {
    x: number;
    y: number;
}

export interface Actor {
    id: string;
    x: number;
    y: number;
    shape: number[][]; // Current logical shape
    rotation: number;
}

export interface Intent {
    dx: number;
    dy: number;
    dr: number; // Rotation delta (0, 1, -1)
}

export class PhysicsEngine {
    private width: number;
    private height: number;
    private board: number[][]; // 0: empty, 1: solid block

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.board = Array(height).fill(null).map(() => Array(width).fill(0));
    }

    public getBoard(): number[][] {
        return this.board;
    }

    /**
     * Projects and resolves intents for multiple actors simultaneously.
     * Handles collisions and "Pushing" chains.
     */
    resolve(actors: Actor[], intents: Map<string, Intent>): Map<string, Point & { rotation: number }> {
        const results = new Map<string, Point & { rotation: number }>();
        const projected = new Map<string, Actor>();

        // Step 1: Preliminary Individual Validation (Grid only)
        for (const actor of actors) {
            const intent = intents.get(actor.id) || { dx: 0, dy: 0, dr: 0 };
            
            // Project Rotation
            let nextShape = actor.shape;
            let nextRot = actor.rotation;
            if (intent.dr !== 0) {
                 nextRot = (actor.rotation + intent.dr + 4) % 4;
                 const steps = (intent.dr + 4) % 4;
                 for(let i=0; i<steps; i++) nextShape = rotateMatrix(nextShape);
            }

            // Project XY
            const tx = actor.x + intent.dx;
            const ty = actor.y + intent.dy;

            // Wall/Block collision check
            if (this.checkGridCollision(tx, ty, nextShape)) {
                // Hard block by environment: cancel movement/rotation for this hand
                projected.set(actor.id, { ...actor });
            } else {
                projected.set(actor.id, { id: actor.id, x: tx, y: ty, rotation: nextRot, shape: nextShape });
            }
        }

        // Step 2: Inter-Actor Collision Analysis
        // (Assuming 2 actors p1, p2)
        const a1 = actors[0];
        const a2 = actors[1];
        const p1 = projected.get(a1.id)!;
        const p2 = projected.get(a2.id)!;

        // Check A: Overlap at projected targets
        const targetsOverlap = this.checkActorOverlap(p1, p2);

        // Check B: Path Crossing (Swapping)
        // Happens if P1 moves into P2's original spot AND vice versa
        const pathCrossed = this.checkActorCollision(p1.x, p1.y, p1.shape, a2) && 
                            this.checkActorCollision(p2.x, p2.y, p2.shape, a1);

        if (pathCrossed || targetsOverlap) {
            const i1 = intents.get(a1.id) || { dx: 0, dy: 0, dr: 0 };
            const i2 = intents.get(a2.id) || { dx: 0, dy: 0, dr: 0 };

            // Determine Resolution
            // Case 1: Players moving TOWARDS each other -> Crash/Block
            const movingTowards = (i1.dx > 0 && i2.dx < 0) || (i1.dx < 0 && i2.dx > 0) ||
                                  (i1.dy > 0 && i2.dy < 0) || (i1.dy < 0 && i2.dy > 0);

            if (movingTowards || pathCrossed) {
                // Cancel movement for both
                results.set(a1.id, { x: a1.x, y: a1.y, rotation: a1.rotation });
                results.set(a2.id, { x: a2.x, y: a2.y, rotation: a2.rotation });
            } else {
                // Case 2: One is moving, one is still (Push attempt), or both same dir
                // If they don't overlap at targets, and path didn't cross... we already checked targetsOverlap.
                // If we're here, targetsOverlap is true.
                // We'll block both to keep it safe for now. 
                // TODO: Implement recursive 'Pushing' chain verification
                results.set(a1.id, { x: a1.x, y: a1.y, rotation: a1.rotation });
                results.set(a2.id, { x: a2.x, y: a2.y, rotation: a2.rotation });
            }
        } else {
            // Case 3: Smooth sailing
            results.set(a1.id, { x: p1.x, y: p1.y, rotation: p1.rotation });
            results.set(a2.id, { x: p2.x, y: p2.y, rotation: p2.rotation });
        }

        return results;
    }

    private checkActorOverlap(a: Actor, b: Actor): boolean {
        return this.checkActorCollision(a.x, a.y, a.shape, b);
    }

    private checkActorCollision(ax: number, ay: number, aShape: number[][], b: Actor): boolean {
        const aCells = this.getOccupiedCells(ax, ay, aShape);
        const bCells = this.getOccupiedCells(b.x, b.y, b.shape);

        // Nested loop is fine for small Tetris shapes
        for (const ac of aCells) {
            for (const bc of bCells) {
                if (ac.x === bc.x && ac.y === bc.y) return true;
            }
        }
        return false;
    }

    private getOccupiedCells(x: number, y: number, shape: number[][]): Point[] {
        const cells: Point[] = [];
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) cells.push({ x: x + c, y: y + r });
            }
        }
        return cells;
    }

    // --- Logical Systems ---

    public getGhostY(actor: Actor): number {
        let dy = 0;
        while (!this.checkGridCollision(actor.x, actor.y + dy + 1, actor.shape)) {
            dy++;
        }
        return actor.y + dy;
    }

    public lockActor(actor: Actor) {
        const cells = this.getOccupiedCells(actor.x, actor.y, actor.shape);
        for (const cell of cells) {
            this.setBoardValue(cell.x, cell.y, 1);
        }
        return cells;
    }

    public shiftLines(lines: number[]) {
        const sortedLines = [...lines].sort((a, b) => b - a);
        for (const line of sortedLines) {
            this.board.splice(line, 1);
            this.board.unshift(Array(this.width).fill(0));
        }
    }

    public checkGridCollision(x: number, y: number, shape: number[][]): boolean {
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    const wx = x + c;
                    const wy = y + r;
                    if (wx < 0 || wx >= this.width || wy < 0 || wy >= this.height || this.board[wy][wx]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    public setBoardValue(x: number, y: number, value: number) {
        if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
            this.board[y][x] = value;
        }
    }

    public clearFullLines(): number[] {
        const lines: number[] = [];
        for (let y = 0; y < this.height; y++) {
            if (this.board[y].every(v => v !== 0)) lines.push(y);
        }
        return lines;
    }
}
