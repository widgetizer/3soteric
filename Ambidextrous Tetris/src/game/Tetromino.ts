export type TetrominoType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

export const TETROMINOES: Record<TetrominoType, { shape: number[][], color: number }> = {
    I: { shape: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], color: 0x00FFFF }, // Cyan
    J: { shape: [[1, 0, 0], [1, 1, 1], [0, 0, 0]], color: 0x0000FF }, // Blue
    L: { shape: [[0, 0, 1], [1, 1, 1], [0, 0, 0]], color: 0xFFA500 }, // Orange
    O: { shape: [[1, 1], [1, 1]], color: 0xFFFF00 }, // Yellow
    S: { shape: [[0, 1, 1], [1, 1, 0], [0, 0, 0]], color: 0x00FF00 }, // Green
    T: { shape: [[0, 1, 0], [1, 1, 1], [0, 0, 0]], color: 0x800080 }, // Purple
    Z: { shape: [[1, 1, 0], [0, 1, 1], [0, 0, 0]], color: 0xFF0000 }  // Red
};
