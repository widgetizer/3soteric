import Phaser from 'phaser';

export class GraphicsUtils {
    static drawBlock(
        _scene: Phaser.Scene,
        g: Phaser.GameObjects.Graphics,
        x: number,
        y: number,
        size: number,
        color: number,
        neighbors: { top: boolean; bottom: boolean; left: boolean; right: boolean } | null,
        isRounded: boolean
    ) {
        // Calculate gradient colors
        const baseC = Phaser.Display.Color.IntegerToColor(color);
        const darkC = Phaser.Display.Color.IntegerToColor(color);
        darkC.darken(35); // Slightly less dark than before for realism

        const colorTL = color;
        const colorBR = darkC.color;
        
        // Calculate midpoint color for TR and BL to create a diagonal gradient effect
        const midR = Math.floor((baseC.red + darkC.red) / 2);
        const midG = Math.floor((baseC.green + darkC.green) / 2);
        const midB = Math.floor((baseC.blue + darkC.blue) / 2);
        const colorMid = Phaser.Display.Color.GetColor(midR, midG, midB);

        // Apply gradient (TL, TR, BL, BR)
        g.fillGradientStyle(colorTL, colorMid, colorMid, colorBR, 1, 1, 1, 1);
        
        if (isRounded && neighbors) {
             const radius = size * 0.36;
             const half = size / 2;
             
             // Realistic Style: Tighter bevels, subtle double-highlight
             const shadowInset = 1.5; // Very thin, sleek shadow rim
             
             // Helper to get corners
             const getCorners = (r: number) => {
                 return {
                     tl: (!neighbors.top && !neighbors.left) ? r : 0,
                     tr: (!neighbors.top && !neighbors.right) ? r : 0,
                     bl: (!neighbors.bottom && !neighbors.left) ? r : 0,
                     br: (!neighbors.bottom && !neighbors.right) ? r : 0
                 };
             };

             // --- Layer 1: Shadow / Base (Full Size) ---
             g.fillStyle(colorBR, 1);
             g.fillRoundedRect(x - half, y - half, size, size, getCorners(radius));

             // --- Layer 2: Main Body (Inset from Bottom & Right) ---
             g.fillStyle(color, 1);
             
             const insetRight = neighbors.right ? 0 : shadowInset;
             const insetBottom = neighbors.bottom ? 0 : shadowInset;
             
             g.fillRoundedRect(
                 x - half, 
                 y - half, 
                 size - insetRight, 
                 size - insetBottom, 
                 getCorners(radius)
             );

             // --- Layer 3: Soft Ambient Highlight (Broad) ---
             g.fillStyle(0xffffff, 0.15); // Very faint
             const ambInset = 2;
             
             const ambLeft = neighbors.left ? 0 : ambInset;
             const ambTop = neighbors.top ? 0 : ambInset;
             const ambRight = neighbors.right ? 0 : ambInset * 2;
             const ambBottom = neighbors.bottom ? 0 : ambInset * 2;

             g.fillRoundedRect(
                 (x - half) + ambLeft,
                 (y - half) + ambTop,
                 size - ambLeft - ambRight,
                 size - ambTop - ambBottom,
                 getCorners(Math.max(0, radius - ambInset))
             );

             // --- Layer 4: Specular Highlight (Sharp, Inner) ---
             // Mimics glossy plastic reflection
             g.fillStyle(0xffffff, 0.25);
             const specInset = 6; // Further in
             
             const specLeft = neighbors.left ? 0 : specInset;
             const specTop = neighbors.top ? 0 : specInset;
             const specRight = neighbors.right ? 0 : specInset * 1.5;
             const specBottom = neighbors.bottom ? 0 : specInset * 1.5;

             g.fillRoundedRect(
                 (x - half) + specLeft,
                 (y - half) + specTop,
                 size - specLeft - specRight,
                 size - specTop - specBottom,
                 getCorners(Math.max(0, radius - specInset))
             );

        } else {
             // Basic Square - Gradient looks great here
             g.fillRect(x - size/2, y - size/2, size, size);
        }
    }

    static drawGhostBlock(
        _scene: Phaser.Scene,
        g: Phaser.GameObjects.Graphics,
        x: number,
        y: number,
        size: number,
        neighbors: { top: boolean; bottom: boolean; left: boolean; right: boolean } | null,
        isRounded: boolean
    ) {
         g.lineStyle(2, 0xffffff, 0.4); // White outline
         g.fillStyle(0xffffff, 0.1);    // Faint white fill

         if (isRounded && neighbors) {
             const radius = size * 0.36;
             const half = size / 2;
             
             const tl = (!neighbors.top && !neighbors.left) ? radius : 0;
             const tr = (!neighbors.top && !neighbors.right) ? radius : 0;
             const bl = (!neighbors.bottom && !neighbors.left) ? radius : 0;
             const br = (!neighbors.bottom && !neighbors.right) ? radius : 0;
             
             g.fillRoundedRect(x - half, y - half, size, size, { tl, tr, bl, br });
             g.strokeRoundedRect(x - half, y - half, size, size, { tl, tr, bl, br });
         } else {
             g.fillRect(x - size/2, y - size/2, size, size);
             g.strokeRect(x - size/2, y - size/2, size, size);
         }
    }
}
