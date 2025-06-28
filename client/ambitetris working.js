// AMBITETRIS //

const BLOCK_SIZE = 32;
const ROWS = 20,
  COLS = 14;
const PLAY_AREA_X_OFFSET = 4; // In blocks
const CORNER_RADIUS = 16; // Adjust as needed for visual appeal
const TETROMINOES = {
  I: {
    color: "#08ffff", // light blue
    blocks: [
      [
        [0, 1],
        [1, 1],
        [2, 1],
        [3, 1],
      ], // 0 deg
      [
        [2, 0],
        [2, 1],
        [2, 2],
        [2, 3],
      ], // 90 deg
      [
        [0, 2],
        [1, 2],
        [2, 2],
        [3, 2],
      ], // 180 deg
      [
        [1, 0],
        [1, 1],
        [1, 2],
        [1, 3],
      ], // 270 deg
    ],
  },
  J: {
    color: "#0000f9", // dark blue
    blocks: [
      [
        [0, 0],
        [0, 1],
        [1, 1],
        [2, 1],
      ],
      [
        [1, 0],
        [2, 0],
        [1, 1],
        [1, 2],
      ],
      [
        [0, 1],
        [1, 1],
        [2, 1],
        [2, 2],
      ],
      [
        [1, 0],
        [1, 1],
        [0, 2],
        [1, 2],
      ],
    ],
  },
  L: {
    color: "#ff9800", // orange
    blocks: [
      [
        [2, 0],
        [0, 1],
        [1, 1],
        [2, 1],
      ],
      [
        [1, 0],
        [1, 1],
        [1, 2],
        [2, 2],
      ],
      [
        [0, 1],
        [1, 1],
        [2, 1],
        [0, 2],
      ],
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [1, 2],
      ],
    ],
  },
  O: {
    color: "#ffff00", // yellow
    blocks: [
      [
        [1, 0],
        [2, 0],
        [1, 1],
        [2, 1],
      ],
      [
        [1, 0],
        [2, 0],
        [1, 1],
        [2, 1],
      ],
      [
        [1, 0],
        [2, 0],
        [1, 1],
        [2, 1],
      ],
      [
        [1, 0],
        [2, 0],
        [1, 1],
        [2, 1],
      ],
    ],
  },
  T: {
    color: "#a000f9", // purple
    blocks: [
      [
        [1, 0],
        [0, 1],
        [1, 1],
        [2, 1],
      ],
      [
        [1, 0],
        [1, 1],
        [2, 1],
        [1, 2],
      ],
      [
        [0, 1],
        [1, 1],
        [2, 1],
        [1, 2],
      ],
      [
        [1, 0],
        [0, 1],
        [1, 1],
        [1, 2],
      ],
    ],
  },
  S: {
    color: "#ff0000", // red
    blocks: [
      [
        [1, 0],
        [2, 0],
        [0, 1],
        [1, 1],
      ],
      [
        [1, 0],
        [1, 1],
        [2, 1],
        [2, 2],
      ],
      [
        [1, 1],
        [2, 1],
        [0, 2],
        [1, 2],
      ],
      [
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 2],
      ],
    ],
  },
  Z: {
    color: "#00c000", // green
    blocks: [
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [2, 1],
      ],
      [
        [2, 0],
        [1, 1],
        [2, 1],
        [1, 2],
      ],
      [
        [0, 1],
        [1, 1],
        [1, 2],
        [2, 2],
      ],
      [
        [1, 0],
        [0, 1],
        [1, 1],
        [0, 2],
      ],
    ],
  },
};

// ---- Helper function to check for neighboring blocks within a shape ----
function isNeighbor(shape, currentBlockLocalPos, dx, dy) {
  const targetX = currentBlockLocalPos[0] + dx;
  const targetY = currentBlockLocalPos[1] + dy;
  return shape.some(
    (blockPos) => blockPos[0] === targetX && blockPos[1] === targetY,
  );
}

// ---- Helper function to determine corner rounding for a block ----
function getCornerRadiiConfig(shape, currentBlockLocalPos, cornerRadius) {
  const radii = { tl: 0, tr: 0, bl: 0, br: 0 };
  // Short alias for isNeighbor
  const hasN = (dx, dy) => isNeighbor(shape, currentBlockLocalPos, dx, dy);

  // Top-left corner: No neighbor Up, No neighbor Left
  if (!hasN(0, -1) && !hasN(-1, 0)) radii.tl = cornerRadius;
  // Top-right corner: No neighbor Up, No neighbor Right
  if (!hasN(0, -1) && !hasN(1, 0)) radii.tr = cornerRadius;
  // Bottom-left corner: No neighbor Down, No neighbor Left
  if (!hasN(0, 1) && !hasN(-1, 0)) radii.bl = cornerRadius;
  // Bottom-right corner: No neighbor Down, No neighbor Right
  if (!hasN(0, 1) && !hasN(1, 0)) radii.br = cornerRadius;

  return radii;
}

// Block texture key format: 'block_[L|R|LG|RG]_[type]_[rotation]_[blockIndex]'
// Example: 'block_LG_I_0_2' for left-side ghost I tetromino, rotation 0, block index 2

// This function will be called during initialization to pre-generate all textures
function preGenerateAllBlockTextures(scene) {
  // Clear any existing textures first
  Object.keys(TETROMINOES).forEach((type) => {
    for (let rotation = 0; rotation < 4; rotation++) {
      for (let blockIndex = 0; blockIndex < 4; blockIndex++) {
        const sides = ["L", "R", "LG", "RG"];
        sides.forEach((side) => {
          const key = `block_${side}_${type}_${rotation}_${blockIndex}`;
          if (scene.textures.exists(key)) scene.textures.remove(key);
        });
      }
    }
  });

  // Generate all possible block textures for all tetromino types, rotations, and blocks
  Object.entries(TETROMINOES).forEach(([type, tet]) => {
    const color = tet.color;
    const baseColor = Phaser.Display.Color.HexStringToColor(color);

    // For each rotation (some pieces have fewer than 4 unique rotations)
    for (let rotation = 0; rotation < tet.blocks.length; rotation++) {
      const shape = tet.blocks[rotation];

      // For each block in this shape
      for (let blockIndex = 0; blockIndex < 4; blockIndex++) {
        const currentBlockLocalPos = shape[blockIndex];
        const radii = getCornerRadiiConfig(
          shape,
          currentBlockLocalPos,
          CORNER_RADIUS,
        );

        // ---- Keys for all 4 variants ----
        const leftKey = `block_L_${type}_${rotation}_${blockIndex}`;
        const rightKey = `block_R_${type}_${rotation}_${blockIndex}`;
        const leftGhostKey = `block_LG_${type}_${rotation}_${blockIndex}`;
        const rightGhostKey = `block_RG_${type}_${rotation}_${blockIndex}`;

        // ---- LEFT SIDE (ACTIVE) - PUFFY GRADIENT STYLE ----
        const rt = scene.add.renderTexture(0, 0, BLOCK_SIZE, BLOCK_SIZE);
        rt.clear(); // Ensure transparent background

        // 1. Draw the base colored rounded rectangle
        const baseGfx = scene.add.graphics();
        baseGfx.fillStyle(baseColor.color);
        baseGfx.fillRoundedRect(0, 0, BLOCK_SIZE, BLOCK_SIZE, radii);
        rt.draw(baseGfx, 0, 0);
        baseGfx.destroy();

        // 2. Create and draw the radial gradient for the "puffy" highlight
        const gradientTextureKey = `gradient_L_${type}_${rotation}_${blockIndex}`;
        if (scene.textures.exists(gradientTextureKey)) {
          scene.textures.remove(gradientTextureKey);
        }
        const canvasTexture = scene.textures.createCanvas(
          gradientTextureKey,
          BLOCK_SIZE,
          BLOCK_SIZE,
        );
        const context = canvasTexture.getContext();
        const lighterColor = Phaser.Display.Color.IntegerToColor(
          Phaser.Display.Color.GetColor(255, 255, 255),
        );
        const gradient = context.createRadialGradient(
          BLOCK_SIZE * 0.3,
          BLOCK_SIZE * 0.3,
          0,
          BLOCK_SIZE / 2,
          BLOCK_SIZE / 2,
          BLOCK_SIZE * 0.8,
        );
        gradient.addColorStop(
          0,
          `rgba(${lighterColor.r}, ${lighterColor.g}, ${lighterColor.b}, 0.5)`,
        );
        gradient.addColorStop(
          1,
          `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0)`,
        );
        context.fillStyle = gradient;
        context.fillRect(0, 0, BLOCK_SIZE, BLOCK_SIZE);
        canvasTexture.refresh();
        rt.draw(gradientTextureKey, 0, 0);
        scene.textures.remove(gradientTextureKey);

        // 3. Draw the border
        const borderGfx = scene.add.graphics();
        borderGfx.lineStyle(1, 0x333333, 0.8);
        borderGfx.strokeRoundedRect(0, 0, BLOCK_SIZE, BLOCK_SIZE, radii);
        rt.draw(borderGfx, 0, 0);
        borderGfx.destroy();

        // 4. Save the combined texture
        rt.saveTexture(leftKey);
        rt.destroy();

        // ---- RIGHT SIDE (ACTIVE) - BEVELED STYLE ----
        const gfxR = scene.add.graphics();
        gfxR.fillStyle(baseColor.color, 1);
        gfxR.fillRect(0, 0, BLOCK_SIZE, BLOCK_SIZE);
        // Top-left highlight
        gfxR.lineStyle(0);
        gfxR.fillStyle(0xffffff, 0.28);
        gfxR.beginPath();
        gfxR.moveTo(0, 0);
        gfxR.lineTo(BLOCK_SIZE, 0);
        gfxR.lineTo(BLOCK_SIZE * 0.7, BLOCK_SIZE * 0.3);
        gfxR.lineTo(BLOCK_SIZE * 0.3, BLOCK_SIZE * 0.3);
        gfxR.lineTo(0, 0);
        gfxR.closePath();
        gfxR.fillPath();
        // Bottom-right shadow
        gfxR.fillStyle(0x000000, 0.18);
        gfxR.beginPath();
        gfxR.moveTo(BLOCK_SIZE, BLOCK_SIZE);
        gfxR.lineTo(0, BLOCK_SIZE);
        gfxR.lineTo(BLOCK_SIZE * 0.3, BLOCK_SIZE * 0.7);
        gfxR.lineTo(BLOCK_SIZE * 0.7, BLOCK_SIZE * 0.7);
        gfxR.lineTo(BLOCK_SIZE, BLOCK_SIZE);
        gfxR.closePath();
        gfxR.fillPath();
        gfxR.lineStyle(2, 0x222222, 1);
        gfxR.strokeRect(0, 0, BLOCK_SIZE, BLOCK_SIZE);
        gfxR.generateTexture(rightKey, BLOCK_SIZE, BLOCK_SIZE);
        gfxR.destroy();

        // ---- LEFT GHOST (LG) - SEMI-TRANSPARENT ROUNDED ----
        const gfxLG = scene.add.graphics();
        gfxLG.fillStyle(0x888888, 0.4); // Semi-transparent gray
        gfxLG.fillRoundedRect(0, 0, BLOCK_SIZE, BLOCK_SIZE, radii);
        gfxLG.lineStyle(1, 0xdddddd, 0.4);
        gfxLG.strokeRoundedRect(0, 0, BLOCK_SIZE, BLOCK_SIZE, radii);
        gfxLG.generateTexture(leftGhostKey, BLOCK_SIZE, BLOCK_SIZE);
        gfxLG.destroy();

        // ---- RIGHT GHOST (RG) - SEMI-TRANSPARENT BEVELED ----
        const gfxRG = scene.add.graphics();
        gfxRG.fillStyle(0x888888, 0.4); // Semi-transparent gray
        gfxRG.fillRect(0, 0, BLOCK_SIZE, BLOCK_SIZE);
        // Highlights and shadows for the ghost, more subtle
        gfxRG.fillStyle(0xffffff, 0.1);
        gfxRG.beginPath();
        gfxRG.moveTo(0, 0);
        gfxRG.lineTo(BLOCK_SIZE, 0);
        gfxRG.lineTo(BLOCK_SIZE * 0.7, BLOCK_SIZE * 0.3);
        gfxRG.lineTo(BLOCK_SIZE * 0.3, BLOCK_SIZE * 0.3);
        gfxRG.lineTo(0, 0);
        gfxRG.closePath();
        gfxRG.fillPath();
        // Shadow
        gfxRG.fillStyle(0x000000, 0.1);
        gfxRG.beginPath();
        gfxRG.moveTo(BLOCK_SIZE, BLOCK_SIZE);
        gfxRG.lineTo(0, BLOCK_SIZE);
        gfxRG.lineTo(BLOCK_SIZE * 0.3, BLOCK_SIZE * 0.7);
        gfxRG.lineTo(BLOCK_SIZE * 0.7, BLOCK_SIZE * 0.7);
        gfxRG.lineTo(BLOCK_SIZE, BLOCK_SIZE);
        gfxRG.closePath();
        gfxRG.fillPath();
        gfxRG.lineStyle(1, 0x222222, 0.5);
        gfxRG.strokeRect(0, 0, BLOCK_SIZE, BLOCK_SIZE);
        gfxRG.generateTexture(rightGhostKey, BLOCK_SIZE, BLOCK_SIZE);
        gfxRG.destroy();
      }
    }
  });

  console.log("Pre-generated all tetromino block textures (including ghosts)");
}

// Helper function to get the appropriate texture key for a tetromino block
function getBlockTextureKey(side, type, rotation, blockIndex, isGhost = false) {
  const sidePrefix = isGhost ? side + "G" : side;
  return `block_${sidePrefix}_${type}_${rotation}_${blockIndex}`;
}

// ---- AmbiClear tracking ----
let lastLockTime = { L: 0, R: 0 };
let lastLockRow = { L: -1, R: -1 };
let ambiClearRows = [];

//
// --- Core Tetromino Logic Functions ---
//
// The following section contains the fundamental functions that govern
// the behavior of tetrominoes within the game. This includes:
//
// - `canPlace`: Determining if a tetromino can be placed at a given
//   position and rotation without collision.
// - Movement functions (`moveTetromino`, `moveDown`): Handling horizontal
//   and vertical movement, including interactions with other pieces.
// - Rotation (`rotateTetromino`): Managing tetromino rotation, including
//   wall kicks.
// - Spawning (`spawnTetromino`, `spawnGhostTetromino`): Creating new
//   tetrominoes and their ghost counterparts.
// - Locking (`lockBothTetrominoes`): Finalizing the position of
//   tetrominoes on the board.
// - Board manipulation (`clearFullLines`): Clearing completed lines
//   and handling associated animations and scoring implications.
// - Sprite updates (`updateTetrominoSprites`, `updateGhostTetromino`):
//   Ensuring the visual representation of tetrominoes matches their
//   logical state.
//
// These functions are crucial for the interactive gameplay loop,
// responding to player input and managing the game state.
//
function canPlace(tetromino, x, y, rotation, otherTetromino) {
  const blocks = TETROMINOES[tetromino.type].blocks[rotation];
  for (let i = 0; i < 4; i++) {
    const bx = x + blocks[i][0];
    const by = y + blocks[i][1];
    if (
      bx < PLAY_AREA_X_OFFSET ||
      bx >= COLS + PLAY_AREA_X_OFFSET ||
      by < 0 ||
      by >= ROWS
    )
      return false;
    if (board[by][bx - PLAY_AREA_X_OFFSET]) return false;
    // Check against other falling tetromino
    if (otherTetromino) {
      // Ensure otherTetromino and its properties are defined before accessing them
      if (
        otherTetromino.type &&
        TETROMINOES[otherTetromino.type] &&
        TETROMINOES[otherTetromino.type].blocks[otherTetromino.rotation]
      ) {
        const otherBlocks =
          TETROMINOES[otherTetromino.type].blocks[otherTetromino.rotation];
        for (let j = 0; j < 4; j++) {
          const obx = otherTetromino.x + otherBlocks[j][0];
          const oby = otherTetromino.y + otherBlocks[j][1];
          if (bx === obx && by === oby) return false;
        }
      }
    }
  }
  return true;
}

//
function moveTetromino(tetromino, dx) {
  const otherTetromino =
    tetromino.side === "L" ? window.rightTetromino : window.leftTetromino;
  const blocks = TETROMINOES[tetromino.type].blocks[tetromino.rotation];
  let canMove = true,
    blockedByOther = false;
  for (let i = 0; i < 4; i++) {
    const bx = tetromino.x + blocks[i][0] + dx;
    const by = tetromino.y + blocks[i][1];
    if (
      bx < PLAY_AREA_X_OFFSET ||
      bx >= COLS + PLAY_AREA_X_OFFSET ||
      (by >= 0 && board[by][bx - PLAY_AREA_X_OFFSET])
    ) {
      canMove = false;
      break;
    }
    // Check for collision with other falling tetromino
    if (
      otherTetromino &&
      otherTetromino.type &&
      TETROMINOES[otherTetromino.type]
    ) {
      const otherBlocks =
        TETROMINOES[otherTetromino.type].blocks[otherTetromino.rotation];
      for (let j = 0; j < 4; j++) {
        if (
          bx === otherTetromino.x + otherBlocks[j][0] &&
          by === otherTetromino.y + otherBlocks[j][1]
        ) {
          blockedByOther = true;
          break;
        }
      }
    }
    if (blockedByOther) break;
  }
  if (canMove && !blockedByOther) {
    tetromino.x += dx;
    updateTetrominoSprites(tetromino);
  } else if (blockedByOther) {
    // --- Mash-off logic ---
    let otherMoveIntent = 0;
    if (otherTetromino.side === "L") {
      otherMoveIntent = leftKeysHeld.right ? 1 : leftKeysHeld.left ? -1 : 0;
    } else {
      otherMoveIntent = cursorsRight.right.isDown
        ? 1
        : cursorsRight.left.isDown
          ? -1
          : 0;
    }
    if (otherMoveIntent === -dx) {
      return;
    }
    let pushed = tryPushOtherHorizontally(otherTetromino, dx);
    if (pushed) {
      tetromino.x += dx;
      updateTetrominoSprites(tetromino);
    }
  }
}

function tryPushOtherHorizontally(tetromino, dx) {
  const blocks = TETROMINOES[tetromino.type].blocks[tetromino.rotation];
  for (let i = 0; i < 4; i++) {
    const bx = tetromino.x + blocks[i][0] + dx;
    const by = tetromino.y + blocks[i][1];
    if (
      bx < PLAY_AREA_X_OFFSET ||
      bx >= COLS + PLAY_AREA_X_OFFSET ||
      (by >= 0 && board[by][bx - PLAY_AREA_X_OFFSET])
    ) {
      return false;
    }
  }
  tetromino.x += dx;
  updateTetrominoSprites(tetromino);
  return true;
}

function moveDown(tetromino, side) {
  const otherTetromino =
    side === "L" ? window.rightTetromino : window.leftTetromino;
  let newY = tetromino.y + 1;
  const blocks = TETROMINOES[tetromino.type].blocks[tetromino.rotation];
  let blockedByBoard = false,
    blockedByOther = false;

  for (let i = 0; i < 4; i++) {
    const bx = tetromino.x + blocks[i][0];
    const by = tetromino.y + blocks[i][1] + 1;
    if (by >= ROWS || (by >= 0 && board[by][bx - PLAY_AREA_X_OFFSET])) {
      blockedByBoard = true;
      break;
    }
    if (
      otherTetromino &&
      otherTetromino.type &&
      TETROMINOES[otherTetromino.type]
    ) {
      const otherBlocks =
        TETROMINOES[otherTetromino.type].blocks[otherTetromino.rotation];
      for (let j = 0; j < 4; j++) {
        if (
          bx === otherTetromino.x + otherBlocks[j][0] &&
          by === otherTetromino.y + otherBlocks[j][1]
        ) {
          blockedByOther = true;
          break;
        }
      }
    }
    if (blockedByOther) break;
  }

  if (!blockedByBoard && !blockedByOther) {
    tetromino.y = newY;
    updateTetrominoSprites(tetromino);
  } else if (blockedByOther) {
    let pushed = tryPushOtherDown(otherTetromino, side === "L" ? "R" : "L");
    if (pushed) {
      tetromino.y = newY;
      updateTetrominoSprites(tetromino);
    } else {
      lockBothTetrominoes(tetromino, otherTetromino);
    }
  } else {
    for (let i = 0; i < 4; i++) {
      const bx = tetromino.x + blocks[i][0];
      const by = tetromino.y + blocks[i][1];
      board[by][bx - PLAY_AREA_X_OFFSET] = {
        type: tetromino.type,
        sprite: tetromino.sprites[i],
        side: tetromino.side,
        lockTime: Date.now(),
      };
    }
    clearFullLines(tetromino.scene);

    let newTet = spawnTetromino(tetromino.scene, side);
    const otherTetAfterSpawn =
      side === "L" ? window.rightTetromino : window.leftTetromino; // Use the one that wasn't just replaced

    if (side === "L") {
      window.leftTetromino = newTet;
    } else {
      window.rightTetromino = newTet;
    }

    // Check for game over after new pieces are in window references
    const currentLeft = window.leftTetromino;
    const currentRight = window.rightTetromino;

    if (
      !canPlace(
        currentLeft,
        currentLeft.x,
        currentLeft.y,
        currentLeft.rotation,
      ) ||
      !canPlace(
        currentRight,
        currentRight.x,
        currentRight.y,
        currentRight.rotation,
      )
    ) {
      alert("Game Over!");
      location.reload();
      return;
    }
  }
}

function tryPushOtherDown(tetromino, side) {
  const blocks = TETROMINOES[tetromino.type].blocks[tetromino.rotation];
  for (let i = 0; i < 4; i++) {
    const bx = tetromino.x + blocks[i][0];
    const by = tetromino.y + blocks[i][1] + 1;
    if (by >= ROWS || (by >= 0 && board[by][bx - PLAY_AREA_X_OFFSET])) {
      return false;
    }
  }
  tetromino.y += 1;
  updateTetrominoSprites(tetromino);
  return true;
}

function lockBothTetrominoes(t1, t2) {
  [t1, t2].forEach((tetromino) => {
    if (!tetromino || !tetromino.type) return; // Safety check
    const blocks = TETROMINOES[tetromino.type].blocks[tetromino.rotation];
    for (let i = 0; i < 4; i++) {
      const bx = tetromino.x + blocks[i][0];
      const by = tetromino.y + blocks[i][1];
      // Ensure by is within board bounds before assignment
      if (
        by >= 0 &&
        by < ROWS &&
        bx >= PLAY_AREA_X_OFFSET &&
        bx < COLS + PLAY_AREA_X_OFFSET
      ) {
        board[by][bx - PLAY_AREA_X_OFFSET] = {
          type: tetromino.type,
          sprite: tetromino.sprites[i],
          side: tetromino.side,
          lockTime: Date.now(),
        };
      }
    }
  });
  clearFullLines(t1.scene || t2.scene);

  // Destroy old ghost sprites
  const scene = t1.scene || t2.scene; // Get scene context

  if (window.leftGhostTetromino && window.leftGhostTetromino.sprites) {
    window.leftGhostTetromino.sprites.forEach((s) => {
      if (s && typeof s.destroy === "function") s.destroy();
    });
  }

  if (window.rightGhostTetromino && window.rightGhostTetromino.sprites) {
    window.rightGhostTetromino.sprites.forEach((s) => {
      if (s && typeof s.destroy === "function") s.destroy();
    });
  }

  let newLeft = spawnTetromino(t1.scene || t2.scene, "L");
  let newRight = spawnTetromino(t1.scene || t2.scene, "R");
  window.leftTetromino = newLeft;
  window.rightTetromino = newRight;

  // Spawn new ghost tetrominoes
  window.leftGhostTetromino = spawnGhostTetromino(
    t1.scene || t2.scene,
    "L",
    window.leftTetromino,
  );
  window.rightGhostTetromino = spawnGhostTetromino(
    t2.scene || t2.scene,
    "R",
    window.rightTetromino,
  );

  if (
    !canPlace(newLeft, newLeft.x, newLeft.y, newLeft.rotation) ||
    !canPlace(newRight, newRight.x, newRight.y, newRight.rotation)
  ) {
    alert("Game Over!");
    location.reload();
  }
}

function updateTetrominoSprites(tetromino, isGhost = false) {
  if (!tetromino || !tetromino.type || !TETROMINOES[tetromino.type]) return; // Safety check

  try {
    const blocks = TETROMINOES[tetromino.type].blocks[tetromino.rotation];
    tetromino.blocks = blocks; // Update current shape based on rotation

    for (let i = 0; i < 4 && i < tetromino.sprites.length; i++) {
      if (!tetromino.sprites[i]) continue; // Safety check for sprite

      // Update sprite position
      const gx = tetromino.x + blocks[i][0];
      const gy = tetromino.y + blocks[i][1];
      tetromino.sprites[i].x = gx * BLOCK_SIZE + BLOCK_SIZE / 2;
      tetromino.sprites[i].y = gy * BLOCK_SIZE + BLOCK_SIZE / 2;

      // Set appearance properties based on ghost status
      if (isGhost) {
        tetromino.sprites[i].setDepth(0);
      } else {
        tetromino.sprites[i].setAlpha(1);
        tetromino.sprites[i].setDepth(1);
      }
    }
  } catch (error) {
    console.error("Error in updateTetrominoSprites:", error);
  }
}

function rotateTetromino(tetromino) {
  if (!tetromino || !tetromino.type) return; // Safety check
  const oldRotation = tetromino.rotation;
  const newRotation = (tetromino.rotation + 1) % 4;
  const otherTetromino =
    tetromino.side === "L" ? window.rightTetromino : window.leftTetromino;

  let canRotate = false;
  let newX = tetromino.x;

  if (
    canPlace(tetromino, tetromino.x, tetromino.y, newRotation, otherTetromino)
  ) {
    canRotate = true;
  } else if (
    canPlace(
      tetromino,
      tetromino.x - 1,
      tetromino.y,
      newRotation,
      otherTetromino,
    )
  ) {
    newX = tetromino.x - 1;
    canRotate = true;
  } else if (
    canPlace(
      tetromino,
      tetromino.x + 1,
      tetromino.y,
      newRotation,
      otherTetromino,
    )
  ) {
    newX = tetromino.x + 1;
    canRotate = true;
  } else if (TETROMINOES[tetromino.type].blocks.length === 4) {
    // Assuming I-piece might need 2-block kicks
    if (
      canPlace(
        tetromino,
        tetromino.x - 2,
        tetromino.y,
        newRotation,
        otherTetromino,
      )
    ) {
      newX = tetromino.x - 2;
      canRotate = true;
    } else if (
      canPlace(
        tetromino,
        tetromino.x + 2,
        tetromino.y,
        newRotation,
        otherTetromino,
      )
    ) {
      newX = tetromino.x + 2;
      canRotate = true;
    }
  }

  if (canRotate) {
    tetromino.x = newX;
    tetromino.rotation = newRotation;
    // Update internal block structure to match new rotation BEFORE generating textures/sprites
    tetromino.blocks = TETROMINOES[tetromino.type].blocks[tetromino.rotation];

    // Rebuild sprites for either left or right tetromino using pre-generated textures
    if (tetromino.sprites) {
      tetromino.sprites.forEach((s) => {
        if (s && typeof s.destroy === "function") s.destroy();
      });
      tetromino.sprites = []; // Clear the array
    }

    // Create new sprites with the appropriate textures for the new rotation
    for (let i = 0; i < 4; i++) {
      const blockLocalPos = tetromino.blocks[i];
      const blockWorldX =
        (tetromino.x + blockLocalPos[0]) * BLOCK_SIZE + BLOCK_SIZE / 2;
      const blockWorldY =
        (tetromino.y + blockLocalPos[1]) * BLOCK_SIZE + BLOCK_SIZE / 2;

      // Use pre-generated texture based on side, type, rotation, and block index
      const textureKey = getBlockTextureKey(
        tetromino.side,
        tetromino.type,
        tetromino.rotation,
        i,
        false, // isGhost = false
      );
      const sprite = tetromino.scene.add.sprite(
        blockWorldX,
        blockWorldY,
        textureKey,
      );
      sprite.setDepth(1);
      tetromino.sprites.push(sprite);
    }

    // Ghost piece handling (common for both L and R active piece rotations)
    let oldGhost, otherActiveTetromino, newGhostRefSetter;

    if (tetromino.side === "L") {
      oldGhost = window.leftGhostTetromino;
      otherActiveTetromino = window.rightTetromino;
      newGhostRefSetter = (newGhost) => {
        window.leftGhostTetromino = newGhost;
      };
    } else {
      // tetromino.side === 'R'
      oldGhost = window.rightGhostTetromino;
      otherActiveTetromino = window.leftTetromino;
      newGhostRefSetter = (newGhost) => {
        window.rightGhostTetromino = newGhost;
      };
    }

    // Ensure active tetromino (tetromino) and oldGhost exist, and scene is available
    if (tetromino && tetromino.scene && oldGhost) {
      // 1. Cleanup old ghost
      if (oldGhost.sprites) {
        oldGhost.sprites.forEach((s) => {
          if (s && typeof s.destroy === "function") s.destroy();
        });
      }

      // 2. Spawn new ghost (using the updated active tetromino)
      const newGhost = spawnGhostTetromino(
        tetromino.scene,
        tetromino.side,
        tetromino,
      );
      newGhostRefSetter(newGhost);

      // 3. Update its position
      // Check if newGhost and its sprites are valid before calling updateGhostTetromino
      if (
        newGhost &&
        newGhost.sprites &&
        newGhost.sprites.length > 0 &&
        typeof updateGhostTetromino === "function"
      ) {
        updateGhostTetromino(tetromino, newGhost, otherActiveTetromino);
      }
    }
  }
}

function spawnTetromino(scene, side) {
  let type;
  if (side === "L") {
    type = leftPreview.shift();
    leftPreview.push(getRandomTetrominoType());
  } else {
    type = rightPreview.shift();
    rightPreview.push(getRandomTetrominoType());
  }

  const tet = TETROMINOES[type];
  const rotation = 0;
  const x = side === "L" ? 4 + 2 : 4 + 9;
  const y = 0;
  const color = tet.color;
  const shape = tet.blocks[rotation];

  const sprites = [];

  for (let i = 0; i < 4; i++) {
    let blockX = (x + shape[i][0]) * BLOCK_SIZE + BLOCK_SIZE / 2;
    let blockY = (y + shape[i][1]) * BLOCK_SIZE + BLOCK_SIZE / 2;

    // Use pre-generated textures for the active piece (isGhost = false)
    const textureKey = getBlockTextureKey(side, type, rotation, i, false);

    if (!scene.textures.exists(textureKey)) {
      console.error(
        `Error: Texture ${textureKey} not found! This should never happen with pre-generated textures.`,
      );
    }

    const sprite = scene.add.sprite(blockX, blockY, textureKey);
    sprite.setDepth(1);
    sprites.push(sprite);
  }

  return {
    type,
    color,
    rotation,
    x,
    y,
    blocks: shape,
    sprites,
    side,
    scene,
  };
}

// --- Ghost Piece Functions ---
function spawnGhostTetromino(scene, side, activeTetromino) {
  if (
    !activeTetromino ||
    !activeTetromino.type ||
    !TETROMINOES[activeTetromino.type]
  ) {
    return { sprites: [] }; // Return a minimal object to prevent errors
  }
  const { type, color, rotation, x, y } = activeTetromino;
  const shape = TETROMINOES[type].blocks[rotation];
  const sprites = [];

  for (let i = 0; i < 4; i++) {
    let blockX = (x + shape[i][0]) * BLOCK_SIZE + BLOCK_SIZE / 2;
    let blockY = (y + shape[i][1]) * BLOCK_SIZE + BLOCK_SIZE / 2;

    // Use pre-generated textures for the ghost piece (isGhost = true)
    const textureKey = getBlockTextureKey(side, type, rotation, i, true);

    if (!scene.textures.exists(textureKey)) {
      console.error(
        `Error: Ghost texture ${textureKey} not found! This should never happen with pre-generated textures.`,
      );
    }

    const sprite = scene.add.sprite(blockX, blockY, textureKey);
    sprite.setDepth(0);
    // No need for alpha or tint, as it's baked into the texture
    sprites.push(sprite);
  }
  return {
    type,
    color,
    rotation,
    x,
    y,
    blocks: shape,
    sprites,
    side,
    scene,
  };
}

function updateGhostTetromino(tetromino, ghostTetromino, otherTetromino) {
  if (
    !tetromino ||
    !ghostTetromino ||
    !tetromino.type ||
    !ghostTetromino.type ||
    !TETROMINOES[tetromino.type] ||
    !ghostTetromino.sprites ||
    ghostTetromino.sprites.some((s) => !s)
  ) {
    return;
  }

  // Sync ghost's state with the active piece.
  // If rotation or type changes, we need to update the textures.
  if (
    ghostTetromino.rotation !== tetromino.rotation ||
    ghostTetromino.type !== tetromino.type
  ) {
    ghostTetromino.rotation = tetromino.rotation;
    ghostTetromino.type = tetromino.type;

    for (let i = 0; i < 4; i++) {
      const textureKey = getBlockTextureKey(
        tetromino.side,
        tetromino.type,
        tetromino.rotation,
        i,
        true, // isGhost = true
      );
      if (ghostTetromino.sprites[i]) {
        ghostTetromino.sprites[i].setTexture(textureKey);
      }
    }
  }

  ghostTetromino.blocks =
    TETROMINOES[tetromino.type].blocks[tetromino.rotation];
  ghostTetromino.x = tetromino.x;

  // Calculate the lowest possible Y position.
  let lowestY = tetromino.y;
  let tempGhostForCheck = { ...tetromino };
  while (
    canPlace(
      tempGhostForCheck,
      tempGhostForCheck.x,
      lowestY + 1,
      tempGhostForCheck.rotation,
      otherTetromino,
    )
  ) {
    lowestY++;
  }
  ghostTetromino.y = lowestY;

  // Update the positions of the ghost sprites.
  updateTetrominoSprites(ghostTetromino, true);
}

let board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
let cursorsLeft, cursorsRight;
let leftTetromino, rightTetromino;
let leftGhostTetromino, rightGhostTetromino; // Added ghost variables
let leftPreview = [],
  rightPreview = [];
let dropTimerLeft = 0,
  dropTimerRight = 0;

let fastDropLeft = false,
  fastDropRight = false;

let moveTimers = {
  left: { left: 0, right: 0 },
  right: { left: 0, right: 0 },
  down: { left: 0, right: 0 },
};
const INITIAL_DELAY = 200;
const REPEAT_INTERVAL = 40;

let leftKeysHeld = { left: false, right: false, down: false };
let paused = false;
let userPaused = false;

function getRandomTetrominoType() {
  const types = Object.keys(TETROMINOES);
  return types[Math.floor(Math.random() * types.length)];
}

function create() {
  const playArea = this.add.graphics();
  playArea.fillStyle(0x222222, 1);
  playArea.fillRect(
    PLAY_AREA_X_OFFSET * BLOCK_SIZE,
    0,
    COLS * BLOCK_SIZE,
    ROWS * BLOCK_SIZE,
  );
  playArea.setDepth(-1);

  // Pre-generate all tetromino block textures
  preGenerateAllBlockTextures(this);

  if (!this.textures.exists("particle")) {
    let canvas = this.textures.createCanvas("particle", 1, 1).getContext("2d");
    canvas.fillStyle = "#fff";
    canvas.fillRect(0, 0, 1, 1);
    this.textures.get("particle").refresh();
  }

  cursorsLeft = this.input.keyboard.addKeys({
    left: "C",
    right: "B",
    down: "V",
    rotate: "G",
  });
  cursorsRight = this.input.keyboard.addKeys({
    left: "J",
    right: "L",
    down: "K",
    rotate: "I",
  });

  this.input.keyboard.on("keydown", function (event) {
    if (
      ["C", "B", "V", "F", "J", "L", "K", "I"].includes(event.key.toUpperCase())
    ) {
      event.preventDefault();
    }
  });

  this.input.keyboard.on("keydown-C", () => {
    leftKeysHeld.left = true;
  });
  this.input.keyboard.on("keyup-C", () => {
    leftKeysHeld.left = false;
  });
  this.input.keyboard.on("keydown-B", () => {
    leftKeysHeld.right = true;
  });
  this.input.keyboard.on("keyup-B", () => {
    leftKeysHeld.right = false;
  });
  this.input.keyboard.on("keydown-V", () => {
    leftKeysHeld.down = true;
  });
  this.input.keyboard.on("keyup-V", () => {
    leftKeysHeld.down = false;
  });

  this.input.keyboard.on("keydown-SPACE", () => {
    userPaused = !userPaused;
    console.log(userPaused ? "Game Paused" : "Game Unpaused");
    // If pausing, maybe visually indicate pause on screen if desired later
  });

  // Initialize piece previews
  for (let i = 0; i < 3; i++) {
    leftPreview.push(getRandomTetrominoType());
    rightPreview.push(getRandomTetrominoType());
  }

  leftTetromino = spawnTetromino(this, "L");
  rightTetromino = spawnTetromino(this, "R");
  window.leftTetromino = leftTetromino;
  window.rightTetromino = rightTetromino;

  // Spawn ghost tetrominoes after active ones
  leftGhostTetromino = spawnGhostTetromino(this, "L", leftTetromino);
  rightGhostTetromino = spawnGhostTetromino(this, "R", rightTetromino);
  window.leftGhostTetromino = leftGhostTetromino;
  window.rightGhostTetromino = rightGhostTetromino;
}

function update(time, delta) {
  if (userPaused) return;

  const leftTetromino = window.leftTetromino;
  const rightTetromino = window.rightTetromino;

  handleInput(this, delta);

  // Re-fetch ghost references AFTER input is handled, as rotation can destroy and recreate them.
  const leftGhostTetromino = window.leftGhostTetromino;
  const rightGhostTetromino = window.rightGhostTetromino;

  drawPreviews(this);

  // Update ghost positions before movement and drop
  if (leftTetromino && leftGhostTetromino) {
    updateGhostTetromino(leftTetromino, leftGhostTetromino, rightTetromino);
  }
  if (rightTetromino && rightGhostTetromino) {
    updateGhostTetromino(rightTetromino, rightGhostTetromino, leftTetromino);
  }

  dropTimerLeft += delta;
  dropTimerRight += delta;

  let leftInterval = fastDropLeft ? 40 : 500;
  let rightInterval = fastDropRight ? 40 : 500;

  if (dropTimerLeft > leftInterval) {
    moveDown(leftTetromino, "L");
    dropTimerLeft = 0;
  }
  if (dropTimerRight > rightInterval) {
    moveDown(rightTetromino, "R");
    dropTimerRight = 0;
  }
}

function handleInput(scene, delta) {
  const leftTetromino = window.leftTetromino;
  const rightTetromino = window.rightTetromino;

  if (!leftTetromino || !rightTetromino) return; // Safety check

  if (leftKeysHeld.left) {
    moveTimers.left.left += delta;
    if (
      moveTimers.left.left === delta ||
      moveTimers.left.left > INITIAL_DELAY
    ) {
      moveTetromino(leftTetromino, -1);
      if (moveTimers.left.left > INITIAL_DELAY)
        moveTimers.left.left -= REPEAT_INTERVAL;
    }
  } else {
    moveTimers.left.left = 0;
  }
  if (leftKeysHeld.right) {
    moveTimers.left.right += delta;
    if (
      moveTimers.left.right === delta ||
      moveTimers.left.right > INITIAL_DELAY
    ) {
      moveTetromino(leftTetromino, 1);
      if (moveTimers.left.right > INITIAL_DELAY)
        moveTimers.left.right -= REPEAT_INTERVAL;
    }
  } else {
    moveTimers.left.right = 0;
  }
  fastDropLeft = leftKeysHeld.down;

  if (cursorsLeft.rotate.isDown) {
    rotateTetromino(leftTetromino);
    cursorsLeft.rotate.reset();
  }

  if (cursorsRight.left.isDown) {
    moveTimers.right.left += delta;
    if (
      moveTimers.right.left === delta ||
      moveTimers.right.left > INITIAL_DELAY
    ) {
      moveTetromino(rightTetromino, -1);
      if (moveTimers.right.left > INITIAL_DELAY)
        moveTimers.right.left -= REPEAT_INTERVAL;
    }
  } else {
    moveTimers.right.left = 0;
  }
  if (cursorsRight.right.isDown) {
    moveTimers.right.right += delta;
    if (
      moveTimers.right.right === delta ||
      moveTimers.right.right > INITIAL_DELAY
    ) {
      moveTetromino(rightTetromino, 1);
      if (moveTimers.right.right > INITIAL_DELAY)
        moveTimers.right.right -= REPEAT_INTERVAL;
    }
  } else {
    moveTimers.right.right = 0;
  }
  fastDropRight = cursorsRight.down.isDown;

  if (cursorsRight.rotate.isDown) {
    rotateTetromino(rightTetromino);
    cursorsRight.rotate.reset();
  }
}

let previewSprites = { L: [], R: [] };

function drawPreviews(scene) {
  // Clear existing preview sprites
  previewSprites.L.forEach((c) => c.destroy());
  previewSprites.R.forEach((c) => c.destroy());
  previewSprites.L = [];
  previewSprites.R = [];

  const PREVIEW_SCALE = 0.6;

  // Draw left preview
  leftPreview.forEach((type, index) => {
    const tet = TETROMINOES[type];
    const shape = tet.blocks[0];
    const container = scene.add.container(
      (PLAY_AREA_X_OFFSET * BLOCK_SIZE) / 2,
      (2 + index * 4) * BLOCK_SIZE,
    );
    previewSprites.L.push(container);

    let minX = 4,
      maxX = 0,
      minY = 4,
      maxY = 0;
    for (let i = 0; i < 4; i++) {
      minX = Math.min(minX, shape[i][0]);
      maxX = Math.max(maxX, shape[i][0]);
      minY = Math.min(minY, shape[i][1]);
      maxY = Math.max(maxY, shape[i][1]);
    }
    const shapeWidth = maxX - minX + 1;
    const shapeHeight = maxY - minY + 1;

    for (let i = 0; i < 4; i++) {
      const key = getBlockTextureKey("L", type, 0, i, false);
      const sprite = scene.add.sprite(
        (shape[i][0] - minX - shapeWidth / 2 + 0.5) * BLOCK_SIZE,
        (shape[i][1] - minY - shapeHeight / 2 + 0.5) * BLOCK_SIZE,
        key,
      );
      container.add(sprite);
    }
    container.setScale(PREVIEW_SCALE);
  });

  // Draw right preview
  rightPreview.forEach((type, index) => {
    const tet = TETROMINOES[type];
    const shape = tet.blocks[0];
    const container = scene.add.container(
      (PLAY_AREA_X_OFFSET + COLS) * BLOCK_SIZE +
        (PLAY_AREA_X_OFFSET * BLOCK_SIZE) / 2,
      (2 + index * 4) * BLOCK_SIZE,
    );
    previewSprites.R.push(container);

    let minX = 4,
      maxX = 0,
      minY = 4,
      maxY = 0;
    for (let i = 0; i < 4; i++) {
      minX = Math.min(minX, shape[i][0]);
      maxX = Math.max(maxX, shape[i][0]);
      minY = Math.min(minY, shape[i][1]);
      maxY = Math.max(maxY, shape[i][1]);
    }
    const shapeWidth = maxX - minX + 1;
    const shapeHeight = maxY - minY + 1;

    for (let i = 0; i < 4; i++) {
      const key = getBlockTextureKey("R", type, 0, i, false);
      const sprite = scene.add.sprite(
        (shape[i][0] - minX - shapeWidth / 2 + 0.5) * BLOCK_SIZE,
        (shape[i][1] - minY - shapeHeight / 2 + 0.5) * BLOCK_SIZE,
        key,
      );
      container.add(sprite);
    }
    container.setScale(PREVIEW_SCALE);
  });
}

function clearFullLines(scene) {
  paused = true;
  let clearedRows = [];
  for (let y = ROWS - 1; y >= 0; y--) {
    if (board[y].every((cell) => cell)) {
      clearedRows.push(y);
    }
  }
  if (clearedRows.length === 0) {
    paused = false;
    return;
  }
  let isAmbiClear = false;
  for (let row of clearedRows) {
    let leftUsed = false,
      rightUsed = false,
      leftTime = 0,
      rightTime = 0;
    for (let x = 0; x < COLS; x++) {
      if (board[row][x] && board[row][x].side === "L") {
        leftUsed = true;
        leftTime = Math.max(leftTime, board[row][x].lockTime || 0);
      }
      if (board[row][x] && board[row][x].side === "R") {
        rightUsed = true;
        rightTime = Math.max(rightTime, board[row][x].lockTime || 0);
      }
    }
    if (leftUsed && rightUsed && Math.abs(leftTime - rightTime) < 600) {
      isAmbiClear = true;
      ambiClearRows.push(row);
    }
  }
  let flashes = 0;
  let flashSprites = [];
  for (let row of clearedRows) {
    for (let x = 0; x < COLS; x++) {
      if (board[row][x] && board[row][x].sprite) {
        flashSprites.push(board[row][x].sprite);
      }
    }
  }
  function doFlash() {
    flashes++;
    flashSprites.forEach((s) => s.setTint(0xffffff));
    scene.time.delayedCall(80, () => {
      flashSprites.forEach((s) => s.clearTint());
      if (flashes < 2) {
        scene.time.delayedCall(80, doFlash);
      } else {
        doFade();
      }
    });
  }
  function doFade() {
    let completedFades = 0;
    const totalFades = flashSprites.length;

    // This case handles if clearedRows has items, but none had sprites (e.g. pre-existing blocks without sprite refs)
    // or if flashSprites array ended up empty for some reason despite clearedRows having content.
    if (totalFades === 0) {
      if (clearedRows.length > 0) {
        // Ensure there were rows to clear
        clearedRows.sort((a, b) => a - b); // Sort from top-most cleared row
        for (let i = 0; i < clearedRows.length; i++) {
          const y = clearedRows[i] - i; // Adjust index for previous splices
          board.splice(y, 1);
          board.unshift(new Array(COLS).fill(null));
        }
        // Update Y positions of all remaining sprites on the board after model update
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            if (board[r][c] && board[r][c].sprite) {
              board[r][c].sprite.y = r * BLOCK_SIZE + BLOCK_SIZE / 2;
            }
          }
        }
      }
      paused = false; // Reset the line-clear specific pause
      return;
    }

    flashSprites.forEach((sprite) => {
      scene.tweens.add({
        targets: sprite,
        alpha: 0,
        duration: 120,
        onComplete: () => {
          if (sprite && typeof sprite.destroy === "function") {
            sprite.destroy();
          }
          completedFades++;
          if (completedFades === totalFades) {
            // All sprites faded and destroyed
            // Now, update the board model
            clearedRows.sort((a, b) => a - b); // Sort: process from top-most cleared row
            for (let i = 0; i < clearedRows.length; i++) {
              const y = clearedRows[i] - i; // Adjust index for previous splices
              board.splice(y, 1);
              board.unshift(new Array(COLS).fill(null));
            }

            // Update Y positions of all remaining sprites on the board
            for (let r = 0; r < ROWS; r++) {
              for (let c = 0; c < COLS; c++) {
                if (board[r][c] && board[r][c].sprite) {
                  board[r][c].sprite.y = r * BLOCK_SIZE + BLOCK_SIZE / 2;
                }
              }
            }
            // console.log("Ambitetris: Line clear animation complete, board updated.");
            paused = false; // Reset the line-clear specific pause
          }
        },
      });
    });
  }
  doFlash();
}
