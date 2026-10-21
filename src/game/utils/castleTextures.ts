import Phaser from 'phaser';
import { TEXTURES } from '../config/assetKeys';
import { TILE } from '../config/constants';
import {
  canvasTexture,
  circlePath,
  type Ctx,
  ellipsePath,
  line,
  linear,
  OUTLINE,
  polygonPath,
  radial,
  roundRectPath,
  shape,
  starPath,
  strokeShape,
} from './canvasDraw';

/** Texturas da Fase 4 (Castelo Amaldiçoado) e do chefe. */

function paintCastleBricks(ctx: Ctx, c: { mortar: string; top: string; bottom: string; outline: string }, height = 64): void {
  ctx.fillStyle = c.mortar;
  ctx.fillRect(0, 0, 64, height);
  for (let r = 0; r < height / 16; r++) {
    const offset = r % 2 === 0 ? 0 : -16;
    for (let x = offset; x < 64; x += 32) {
      [x, x + 64].forEach((bx) => {
        if (bx > 64 || bx + 32 < 0) return;
        shape(ctx, () => roundRectPath(ctx, bx + 1, r * 16 + 1, 30, 14, 2), linear(ctx, 0, r * 16, 0, r * 16 + 16, [[0, c.top], [1, c.bottom]]), c.outline, 1);
      });
    }
  }
}

const CASTLE_BRICK = { mortar: '#2a1a24', top: '#7a5a6a', bottom: '#56404e', outline: '#1e1218' };

/** Piso de pedra polida com friso dourado. `cracked` = chão que desaba (pista: rachaduras). */
function paintCastleFloor(ctx: Ctx, cracked: boolean): void {
  paintCastleBricks(ctx, CASTLE_BRICK, 32);
  for (let x = 0; x < 64; x += 32) {
    shape(ctx, () => roundRectPath(ctx, x + 0.8, 0.8, 30.4, 11, 2), linear(ctx, 0, 0, 0, 12, cracked ? [[0, '#b8a8a0'], [1, '#8a7a72']] : [[0, '#c8bccc'], [1, '#8f8298']]), '#2a1d33', 1.3);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(x + 3, 2.2, 24, 1.3);
  }
  ctx.fillStyle = cracked ? '#a8823a' : '#e3b04a';
  ctx.fillRect(0, 12, 64, 2);
  ctx.fillStyle = 'rgba(20,10,20,0.4)';
  ctx.fillRect(0, 14, 64, 2);
  if (cracked) {
    line(ctx, [[6, 1], [11, 6], [8, 11]], '#2a1d33', 1.4);
    line(ctx, [[22, 2], [26, 9]], '#2a1d33', 1.4);
    line(ctx, [[40, 1], [44, 5], [42, 11]], '#2a1d33', 1.4);
    line(ctx, [[55, 3], [59, 10]], '#2a1d33', 1.4);
  }
}

function createCastleTerrain(scene: Phaser.Scene): void {
  canvasTexture(scene, TEXTURES.TILE_CASTLE_BRICK, 64, 64, (ctx) => paintCastleBricks(ctx, CASTLE_BRICK));
  canvasTexture(scene, TEXTURES.BG_CASTLE_WALL, 64, 64, (ctx) => {
    paintCastleBricks(ctx, { mortar: '#1e1220', top: '#4a3346', bottom: '#3a2838', outline: '#170d18' });
    ctx.fillStyle = 'rgba(227,176,74,0.08)';
    ctx.fillRect(0, 30, 64, 4);
  });
  canvasTexture(scene, TEXTURES.TILE_CASTLE_FLOOR, 64, TILE, (ctx) => paintCastleFloor(ctx, false));
  canvasTexture(scene, TEXTURES.TILE_CASTLE_LOOSE, 64, TILE, (ctx) => paintCastleFloor(ctx, true));

  canvasTexture(scene, TEXTURES.PLATFORM_CASTLE, TILE, 16, (ctx) => {
    shape(ctx, () => roundRectPath(ctx, 0.8, 1, 30.4, 11, 3), linear(ctx, 0, 1, 0, 12, [[0, '#c8bccc'], [1, '#8f8298']]), '#2a1d33', 1.3);
    ctx.fillStyle = '#e3b04a';
    ctx.fillRect(1, 11, 30, 2.5);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(3, 2.5, 25, 1.3);
    ctx.fillStyle = 'rgba(20,10,20,0.4)';
    ctx.fillRect(2, 13.5, 28, 2.2);
  });
}

function createCastleDecor(scene: Phaser.Scene): void {
  canvasTexture(scene, TEXTURES.TORCH, 16, 34, (ctx) => {
    ctx.fillStyle = radial(ctx, 8, 9, 8, [[0, 'rgba(255,240,180,0.9)'], [1, 'rgba(255,140,40,0)']]);
    ctx.fillRect(0, 0, 16, 18);
    shape(ctx, () => {
      ctx.moveTo(8, 1);
      ctx.quadraticCurveTo(14, 9, 11, 14);
      ctx.quadraticCurveTo(8, 17, 5, 14);
      ctx.quadraticCurveTo(2, 9, 8, 1);
      ctx.closePath();
    }, radial(ctx, 8, 12, 8, [[0, '#ffffff'], [0.35, '#ffe066'], [1, '#ff6a2e']]), null);
    shape(ctx, () => polygonPath(ctx, [[3, 15], [13, 15], [10, 22], [6, 22]]), linear(ctx, 3, 0, 13, 0, [[0, '#c8bccc'], [1, '#6a6070']]), OUTLINE, 1);
    shape(ctx, () => roundRectPath(ctx, 6.5, 22, 3, 11, 1), '#5a3a1a', OUTLINE, 0.8);
  });

  // Retrato de um troll ancestral (com olhar suspeito).
  canvasTexture(scene, TEXTURES.PAINTING, 44, 54, (ctx) => {
    shape(ctx, () => roundRectPath(ctx, 1, 1, 42, 52, 3), linear(ctx, 0, 0, 44, 54, [[0, '#ffe58a'], [0.5, '#d9a441'], [1, '#a8741a']]), '#5a3a0a', 1.6);
    shape(ctx, () => ctx.rect(6, 6, 32, 42), linear(ctx, 0, 6, 0, 48, [[0, '#3a5a7a'], [1, '#1d2a40']]), '#5a3a0a', 1.2);
    shape(ctx, () => ellipsePath(ctx, 22, 30, 11, 13), '#7fae5a', OUTLINE, 1);
    shape(ctx, () => ellipsePath(ctx, 22, 33, 4, 3), '#5f8a42', OUTLINE, 0.8);
    shape(ctx, () => circlePath(ctx, 18, 26, 2.2), '#ffffff', OUTLINE, 0.6);
    shape(ctx, () => circlePath(ctx, 26, 26, 2.2), '#ffffff', OUTLINE, 0.6);
    shape(ctx, () => circlePath(ctx, 19, 26, 1), '#1d1430', null);
    shape(ctx, () => circlePath(ctx, 27, 26, 1), '#1d1430', null);
    shape(ctx, () => polygonPath(ctx, [[14, 17], [17, 11], [20, 15], [22, 9], [24, 15], [27, 11], [30, 17]]), '#ffd34d', OUTLINE, 0.8);
    line(ctx, [[17, 39], [22, 37], [27, 39]], OUTLINE, 1);
  });

  canvasTexture(scene, TEXTURES.BANNER, 32, 72, (ctx) => {
    shape(ctx, () => roundRectPath(ctx, 1, 1, 30, 4, 2), '#e3b04a', OUTLINE, 1);
    shape(ctx, () => polygonPath(ctx, [[4, 5], [28, 5], [28, 68], [16, 58], [4, 68]]), linear(ctx, 4, 0, 28, 0, [[0, '#c23a4a'], [1, '#8a1f2e']]), OUTLINE, 1.4);
    ctx.fillStyle = '#e3b04a';
    ctx.fillRect(4, 8, 24, 2);
    shape(ctx, () => starPath(ctx, 16, 28, 7, 3), '#ffd34d', OUTLINE, 0.8);
  });

  // Armadura decorativa.
  canvasTexture(scene, TEXTURES.STATUE, 34, 66, (ctx) => {
    shape(ctx, () => roundRectPath(ctx, 3, 58, 28, 8, 2), '#6a6070', OUTLINE, 1.2);
    const steel = linear(ctx, 6, 0, 28, 0, [[0, '#e8eaf2'], [0.5, '#a8acbc'], [1, '#6a6e80']]);
    shape(ctx, () => roundRectPath(ctx, 10, 40, 6, 18, 2), steel, OUTLINE, 1);
    shape(ctx, () => roundRectPath(ctx, 18, 40, 6, 18, 2), steel, OUTLINE, 1);
    shape(ctx, () => roundRectPath(ctx, 7, 20, 20, 22, 5), steel, OUTLINE, 1.2);
    shape(ctx, () => roundRectPath(ctx, 9, 4, 16, 17, 6), steel, OUTLINE, 1.2);
    shape(ctx, () => ctx.rect(12, 11, 10, 3), '#1d1430', null);
    shape(ctx, () => polygonPath(ctx, [[17, 4], [14, -2], [20, -2]]), '#c23a4a', OUTLINE, 0.8);
    line(ctx, [[30, 8], [30, 58]], '#6a6e80', 2.5);
    shape(ctx, () => polygonPath(ctx, [[27, 10], [33, 10], [30, 2]]), '#e8eaf2', OUTLINE, 0.8);
  });

  canvasTexture(scene, TEXTURES.THRONE, 72, 92, (ctx) => {
    const gold = linear(ctx, 0, 0, 72, 92, [[0, '#ffe58a'], [0.5, '#d9a441'], [1, '#a8741a']]);
    shape(ctx, () => {
      ctx.moveTo(10, 90);
      ctx.lineTo(10, 18);
      ctx.quadraticCurveTo(36, -6, 62, 18);
      ctx.lineTo(62, 90);
      ctx.closePath();
    }, gold, '#5a3a0a', 2);
    shape(ctx, () => {
      ctx.moveTo(18, 60);
      ctx.lineTo(18, 24);
      ctx.quadraticCurveTo(36, 8, 54, 24);
      ctx.lineTo(54, 60);
      ctx.closePath();
    }, linear(ctx, 0, 10, 0, 60, [[0, '#c23a4a'], [1, '#7a1f2e']]), '#5a3a0a', 1.4);
    shape(ctx, () => roundRectPath(ctx, 4, 58, 64, 12, 3), gold, '#5a3a0a', 1.6);
    shape(ctx, () => roundRectPath(ctx, 12, 70, 6, 20, 1), gold, '#5a3a0a', 1.2);
    shape(ctx, () => roundRectPath(ctx, 54, 70, 6, 20, 1), gold, '#5a3a0a', 1.2);
    shape(ctx, () => circlePath(ctx, 36, 12, 5), radial(ctx, 35, 11, 5, [[0, '#ffd0e0'], [1, '#e04870']]), '#5a3a0a', 1);
  });

  const button = (key: string, pressed: boolean) =>
    canvasTexture(scene, key, 32, 18, (ctx) => {
      shape(ctx, () => roundRectPath(ctx, 1, 11, 30, 6.5, 2), '#6a6070', OUTLINE, 1.2);
      const top = pressed ? 9 : 2;
      shape(ctx, () => ellipsePath(ctx, 16, top + 5, 11, 5.5), radial(ctx, 13, top + 3, 12, [[0, '#ff9a9a'], [0.5, '#e83a3a'], [1, '#a81f1f']]), OUTLINE, 1.3);
      if (!pressed) shape(ctx, () => ellipsePath(ctx, 12, top + 3, 3.5, 1.4), 'rgba(255,255,255,0.8)', null);
    });
  button(TEXTURES.BUTTON_RED, false);
  button(TEXTURES.BUTTON_RED_PRESSED, true);

  canvasTexture(scene, TEXTURES.CHANDELIER, 72, 44, (ctx) => {
    line(ctx, [[36, 0], [36, 12]], '#5a3a0a', 2);
    shape(ctx, () => ellipsePath(ctx, 36, 22, 30, 7), linear(ctx, 0, 15, 0, 29, [[0, '#ffe58a'], [1, '#a8741a']]), '#5a3a0a', 1.6);
    [10, 23, 36, 49, 62].forEach((x) => {
      shape(ctx, () => roundRectPath(ctx, x - 2, 10, 4, 10, 1), '#fff6e0', OUTLINE, 0.8);
      shape(ctx, () => ellipsePath(ctx, x, 6, 2.5, 4), radial(ctx, x, 7, 4, [[0, '#ffffff'], [1, '#ff9a3a']]), null);
    });
    [[16, 34], [36, 38], [56, 34]].forEach(([x, y]) => shape(ctx, () => polygonPath(ctx, [[x, y - 6], [x + 3, y], [x, y + 4], [x - 3, y]]), '#bfe8ff', OUTLINE, 0.8));
  });

  canvasTexture(scene, TEXTURES.ROCK, 18, 16, (ctx) => {
    shape(ctx, () => polygonPath(ctx, [[2, 10], [5, 3], [12, 1], [17, 7], [15, 14], [6, 15]]), linear(ctx, 0, 0, 0, 16, [[0, '#a8a0b0'], [1, '#5a5262']]), OUTLINE, 1.3);
    shape(ctx, () => ellipsePath(ctx, 8, 5, 3, 1.3), 'rgba(255,255,255,0.4)', null);
  });
}

// =============================================================================
// O chefe: Guardião Troll (96 x 96)
// =============================================================================

type BossPose = 'idle' | 'windup' | 'dizzy' | 'hurt';

function drawBoss(ctx: Ctx, pose: BossPose): void {
  const skin = linear(ctx, 0, 10, 0, 96, [[0, '#9ccf6a'], [1, '#4f7a3a']]);
  const dark = '#3f6a2e';

  // pernas
  shape(ctx, () => roundRectPath(ctx, 28, 72, 14, 22, 6), skin, OUTLINE, 2);
  shape(ctx, () => roundRectPath(ctx, 54, 72, 14, 22, 6), skin, OUTLINE, 2);
  shape(ctx, () => ellipsePath(ctx, 34, 92, 10, 4), '#5a3a1a', OUTLINE, 1.5);
  shape(ctx, () => ellipsePath(ctx, 62, 92, 10, 4), '#5a3a1a', OUTLINE, 1.5);

  // braços (atrás do corpo quando abaixados)
  const arm = (x: number, y: number, angle: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    shape(ctx, () => roundRectPath(ctx, -6, 0, 12, 28, 6), skin, OUTLINE, 2);
    shape(ctx, () => circlePath(ctx, 0, 30, 8), skin, OUTLINE, 2);
    ctx.restore();
  };
  if (pose === 'windup') {
    arm(18, 48, Math.PI * 0.85);
    arm(78, 48, -Math.PI * 0.85);
  } else {
    arm(16, 46, 0.25);
    arm(80, 46, -0.25);
  }

  // corpo + barriga + cinto
  shape(ctx, () => ellipsePath(ctx, 48, 58, 32, 26), skin, OUTLINE, 2.2);
  shape(ctx, () => ellipsePath(ctx, 48, 62, 20, 16), '#c8e89a', null);
  shape(ctx, () => roundRectPath(ctx, 18, 68, 60, 7, 3), '#7a4a22', OUTLINE, 1.5);
  shape(ctx, () => roundRectPath(ctx, 42, 66, 12, 11, 2), '#ffd34d', OUTLINE, 1.2);

  // cabeça + orelhas
  shape(ctx, () => polygonPath(ctx, [[22, 26], [8, 18], [24, 34]]), skin, OUTLINE, 1.6);
  shape(ctx, () => polygonPath(ctx, [[74, 26], [88, 18], [72, 34]]), skin, OUTLINE, 1.6);
  shape(ctx, () => ellipsePath(ctx, 48, 30, 26, 20), skin, OUTLINE, 2.2);

  // olhos
  if (pose === 'dizzy') {
    [38, 58].forEach((x) => {
      ctx.strokeStyle = '#1d1430';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let a = 0; a < Math.PI * 4; a += 0.3) {
        const r = 1 + a * 0.45;
        const px = x + Math.cos(a) * r;
        const py = 26 + Math.sin(a) * r;
        if (a === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    });
  } else if (pose === 'hurt') {
    [38, 58].forEach((x) => {
      line(ctx, [[x - 4, 22], [x + 4, 30]], '#1d1430', 2);
      line(ctx, [[x + 4, 22], [x - 4, 30]], '#1d1430', 2);
    });
  } else {
    [38, 58].forEach((x) => {
      shape(ctx, () => ellipsePath(ctx, x, 26, 6, 6.5), '#ffffff', OUTLINE, 1.3);
      shape(ctx, () => circlePath(ctx, x + 1.5, 27, 2.8), '#1d1430', null);
      shape(ctx, () => circlePath(ctx, x + 2.5, 25.5, 0.9), '#ffffff', null);
    });
    // sobrancelhas bravas
    line(ctx, [[30, 17], [43, 21]], '#1d1430', 2.4);
    line(ctx, [[66, 17], [53, 21]], '#1d1430', 2.4);
  }

  // nariz enorme
  shape(ctx, () => ellipsePath(ctx, 48, 35, 8, 6.5), dark, OUTLINE, 1.5);
  shape(ctx, () => ellipsePath(ctx, 45.5, 33, 2.4, 1.6), 'rgba(255,255,255,0.4)', null);

  // boca com presas para cima
  const open = pose === 'windup' || pose === 'hurt';
  shape(ctx, () => {
    ctx.moveTo(34, 42);
    ctx.quadraticCurveTo(48, open ? 54 : 48, 62, 42);
    ctx.quadraticCurveTo(48, 45, 34, 42);
    ctx.closePath();
  }, '#5a1f2a', OUTLINE, 1.4);
  shape(ctx, () => polygonPath(ctx, [[37, 43.5], [41, 43.5], [39, 37]]), '#fffbe8', OUTLINE, 1);
  shape(ctx, () => polygonPath(ctx, [[55, 43.5], [59, 43.5], [57, 37]]), '#fffbe8', OUTLINE, 1);

  // coroa torta
  ctx.save();
  ctx.translate(52, 10);
  ctx.rotate(0.18);
  shape(ctx, () => polygonPath(ctx, [[-14, 6], [-14, -4], [-8, 1], [-3, -8], [2, 1], [8, -6], [14, 1], [14, 6]]), linear(ctx, 0, -8, 0, 6, [[0, '#fff2a8'], [1, '#d9a441']]), '#5a3a0a', 1.4);
  shape(ctx, () => circlePath(ctx, -3, 2.5, 2), '#e04870', OUTLINE, 0.6);
  shape(ctx, () => circlePath(ctx, 6, 2.5, 1.6), '#5a8ae8', OUTLINE, 0.6);
  ctx.restore();

  if (pose === 'hurt') strokeShape(ctx, () => circlePath(ctx, 48, 30, 30), 'rgba(255,255,255,0.6)', 2);
}

function createBossTextures(scene: Phaser.Scene): void {
  canvasTexture(scene, TEXTURES.BOSS_IDLE, 96, 96, (ctx) => drawBoss(ctx, 'idle'));
  canvasTexture(scene, TEXTURES.BOSS_WINDUP, 96, 96, (ctx) => drawBoss(ctx, 'windup'));
  canvasTexture(scene, TEXTURES.BOSS_DIZZY, 96, 96, (ctx) => drawBoss(ctx, 'dizzy'));
  canvasTexture(scene, TEXTURES.BOSS_HURT, 96, 96, (ctx) => drawBoss(ctx, 'hurt'));
}

export function createCastleTextures(scene: Phaser.Scene): void {
  createCastleTerrain(scene);
  createCastleDecor(scene);
  createBossTextures(scene);
}
