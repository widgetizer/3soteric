import Phaser from 'phaser';
import { TETROMINOES, type TetrominoType, rotateMatrix } from './Tetromino';

export class TextureGenerator {
    static readonly CELL_SIZE = 30;

    static generateAll(scene: Phaser.Scene) {
        // Generate Active Piece Textures (Rounded & Square)
        Object.keys(TETROMINOES).forEach((typeKey) => {
            const type = typeKey as TetrominoType;
            for (let rot = 0; rot < 4; rot++) {
                this.generatePieceTexture(scene, type, rot, true);  // Rounded (Left Hand)
                this.generatePieceTexture(scene, type, rot, false); // Square (Right Hand)
            }
        });

        // Generate Field Block Textures (7 colors * 16 neighbor states * 2 styles)
        // Neighbors: Bitmask (Top=1, Right=2, Bottom=4, Left=8)
        Object.values(TETROMINOES).forEach(def => {
            for (let mask = 0; mask < 16; mask++) {
                this.generateFieldBlockTexture(scene, def.color, mask, true);
                this.generateFieldBlockTexture(scene, def.color, mask, false);
            }
        });
        
        // Generate Ghost Piece Textures? 
        // Maybe later, for now we can just use piece textures with alpha.
    }

    private static generatePieceTexture(scene: Phaser.Scene, type: TetrominoType, rotation: number, isRounded: boolean) {
        const def = TETROMINOES[type];
        let shape = def.shape;
        for (let i = 0; i < rotation; i++) shape = rotateMatrix(shape);

        const rows = shape.length;
        const cols = shape[0].length;
        const size = rows * this.CELL_SIZE;
        
        const key = `active-${isRounded ? 'r' : 's'}-${type}-${rotation}`;
        const g = scene.make.graphics({ x: 0, y: 0 });

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (shape[r][c]) {
                    const neighbors = {
                        top: r > 0 && !!shape[r-1][c],
                        bottom: r < rows - 1 && !!shape[r+1][c],
                        left: c > 0 && !!shape[r][c-1],
                        right: c < cols - 1 && !!shape[r][c+1]
                    };
                    this.drawBlockToGraphics(g, c * this.CELL_SIZE + 15, r * this.CELL_SIZE + 15, this.CELL_SIZE, def.color, neighbors, isRounded);
                }
            }
        }

        g.generateTexture(key, size, size);
        g.destroy();
    }

    private static generateFieldBlockTexture(scene: Phaser.Scene, color: number, mask: number, isRounded: boolean) {
        const key = `block-${isRounded ? 'r' : 's'}-${color.toString(16)}-${mask}`;
        const g = scene.make.graphics({ x: 0, y: 0 });

        const neighbors = {
            top: (mask & 1) !== 0,
            right: (mask & 2) !== 0,
            bottom: (mask & 4) !== 0,
            left: (mask & 8) !== 0
        };

        this.drawBlockToGraphics(g, 15, 15, this.CELL_SIZE, color, neighbors, isRounded);
        g.generateTexture(key, this.CELL_SIZE, this.CELL_SIZE);
        g.destroy();
    }

    private static drawBlockToGraphics(
        g: Phaser.GameObjects.Graphics,
        x: number,
        y: number,
        size: number,
        color: number,
        neighbors: { top: boolean; bottom: boolean; left: boolean; right: boolean },
        isRounded: boolean
    ) {
        const baseC = Phaser.Display.Color.IntegerToColor(color);
        const darkC = Phaser.Display.Color.IntegerToColor(color).darken(35);
        
        const colorTL = color;
        const colorBR = darkC.color;
        const midR = Math.floor((baseC.red + darkC.red) / 2);
        const midG = Math.floor((baseC.green + darkC.green) / 2);
        const midB = Math.floor((baseC.blue + darkC.blue) / 2);
        const colorMid = Phaser.Display.Color.GetColor(midR, midG, midB);

        const half = size / 2;
        const radius = isRounded ? size * 0.36 : 0;
        const shadowInset = 1.5;

        const getCorners = (r: number) => ({
            tl: (!neighbors.top && !neighbors.left) ? r : 0,
            tr: (!neighbors.top && !neighbors.right) ? r : 0,
            bl: (!neighbors.bottom && !neighbors.left) ? r : 0,
            br: (!neighbors.bottom && !neighbors.right) ? r : 0
        });

        // Background Gradient
        g.fillGradientStyle(colorTL, colorMid, colorMid, colorBR, 1, 1, 1, 1);
        
        if (isRounded) {
            // Layer 1: Shadow
            g.fillStyle(colorBR, 1);
            g.fillRoundedRect(x - half, y - half, size, size, getCorners(radius));

            // Layer 2: Main Body
            g.fillStyle(color, 1);
            const insetR = neighbors.right ? 0 : shadowInset;
            const insetB = neighbors.bottom ? 0 : shadowInset;
            g.fillRoundedRect(x - half, y - half, size - insetR, size - insetB, getCorners(radius));

            // Layer 3: Ambient Highlight
            g.fillStyle(0xffffff, 0.15);
            const amb = 2;
            const al = neighbors.left ? 0 : amb;
            const at = neighbors.top ? 0 : amb;
            const ar = neighbors.right ? 0 : amb * 2;
            const ab = neighbors.bottom ? 0 : amb * 2;
            g.fillRoundedRect(x - half + al, y - half + at, size - al - ar, size - at - ab, getCorners(Math.max(0, radius - amb)));

            // Layer 4: Specular
            g.fillStyle(0xffffff, 0.25);
            const spec = 6;
            const sl = neighbors.left ? 0 : spec;
            const st = neighbors.top ? 0 : spec;
            const sr = neighbors.right ? 0 : spec * 1.5;
            const sb = neighbors.bottom ? 0 : spec * 1.5;
            g.fillRoundedRect(x - half + sl, y - half + st, size - sl - sr, size - st - sb, getCorners(Math.max(0, radius - spec)));
        } else {
            // Faceted Square Style
            g.fillStyle(color, 1);
            g.fillRect(x - half, y - half, size, size);
            
            // Subtle Bevel for squares since we want them to look premium too
            g.lineStyle(1, 0xffffff, 0.2);
            if (!neighbors.top) g.lineBetween(x - half, y - half, x + half, y - half);
            if (!neighbors.left) g.lineBetween(x - half, y - half, x - half, y + half);
            g.lineStyle(1, 0x000000, 0.2);
            if (!neighbors.bottom) g.lineBetween(x - half, y + half, x + half, y + half);
            if (!neighbors.right) g.lineBetween(x + half, y - half, x + half, y + half);
        }
    }
}
