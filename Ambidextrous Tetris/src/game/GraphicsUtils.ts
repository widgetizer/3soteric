import Phaser from 'phaser';

export class GraphicsUtils {
    static drawBlock(
        scene: Phaser.Scene,
        g: Phaser.GameObjects.Graphics,
        x: number,
        y: number,
        size: number,
        color: number,
        neighbors: { top: boolean; bottom: boolean; left: boolean; right: boolean } | null,
        isRounded: boolean
    ) {
        g.fillStyle(color, 1);
        
        if (isRounded && neighbors) {
             const radius = 10;
             const half = size / 2;
             
             // Determine corners
             const tl = !neighbors.top && !neighbors.left;
             const tr = !neighbors.top && !neighbors.right;
             const br = !neighbors.bottom && !neighbors.right;
             const bl = !neighbors.bottom && !neighbors.left;

             g.beginPath();
             
              // Top Left
            if (tl) {
                g.moveTo(x - half, y - half + radius);
                g.arc(x - half + radius, y - half + radius, radius, Math.PI, 1.5 * Math.PI); 
            } else {
                g.moveTo(x - half, y - half);
            }

            // Top Right
            if (tr) {
                g.lineTo(x + half - radius, y - half);
                g.arc(x + half - radius, y - half + radius, radius, 1.5 * Math.PI, 0); 
            } else {
                g.lineTo(x + half, y - half);
            }

            // Bottom Right
            if (br) {
                g.lineTo(x + half, y + half - radius);
                g.arc(x + half - radius, y + half - radius, radius, 0, 0.5 * Math.PI); 
            } else {
                g.lineTo(x + half, y + half);
            }

            // Bottom Left
            if (bl) {
                g.lineTo(x - half + radius, y + half);
                g.arc(x - half + radius, y + half - radius, radius, 0.5 * Math.PI, Math.PI); 
            } else {
                g.lineTo(x - half, y + half);
            }

            g.closePath();
            g.fillPath();

        } else {
             // Basic Square
             g.fillRect(x - size/2, y - size/2, size, size);
        }
    }
}
