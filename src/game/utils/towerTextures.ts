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
  seeded,
  shape,
  starPath,
  strokeShape,
} from './canvasDraw';

/** Texturas da Fase 3 (Torre do Feiticeiro). Mesmo estilo cartoon das outras fases. */

/** Tijolos 64x64 em fileiras alternadas (repetível nos dois eixos). */
function paintBricks(ctx: Ctx, colors: { mortar: string; top: string; bottom: string; outline: string; highlight: string }, height = 64): void {
  ctx.fillStyle = colors.mortar;
  ctx.fillRect(0, 0, 64, height);
  const rows = height / 16;
  for (let r = 0; r < rows; r++) {
    const offset = r % 2 === 0 ? 0 : -16;
    for (let x = offset; x < 64; x += 32) {
      const y = r * 16;
      // tijolos que cruzam a borda são desenhados também do outro lado (emenda perfeita)
      [x, x + 64].forEach((bx) => {
        if (bx > 64 || bx + 32 < 0) return;
        shape(ctx, () => roundRectPath(ctx, bx + 1, y + 1, 30, 14, 2.5), linear(ctx, 0, y, 0, y + 16, [[0, colors.top], [1, colors.bottom]]), colors.outline, 1);
        ctx.fillStyle = colors.highlight;
        ctx.fillRect(bx + 4, y + 3, 14, 1.2);
      });
    }
  }
}

function createTowerTerrain(scene: Phaser.Scene): void {
  canvasTexture(scene, TEXTURES.TILE_TOWER_BRICK, 64, 64, (ctx) =>
    paintBricks(ctx, { mortar: '#3a3350', top: '#8d86a8', bottom: '#666082', outline: '#2a2440', highlight: 'rgba(255,255,255,0.22)' }),
  );

  // Fundo da torre: tijolos mais escuros e de baixo contraste.
  canvasTexture(scene, TEXTURES.BG_TOWER_WALL, 64, 64, (ctx) =>
    paintBricks(ctx, { mortar: '#231d36', top: '#4a4266', bottom: '#3a3354', outline: '#1d1830', highlight: 'rgba(255,255,255,0.08)' }),
  );

  // Piso: tábuas de madeira sobre tijolos.
  canvasTexture(scene, TEXTURES.TILE_TOWER_FLOOR, 64, TILE, (ctx) => {
    paintBricks(ctx, { mortar: '#3a3350', top: '#8d86a8', bottom: '#666082', outline: '#2a2440', highlight: 'rgba(255,255,255,0.22)' }, 32);
    for (let x = 0; x < 64; x += 32) {
      shape(ctx, () => roundRectPath(ctx, x + 0.8, 0.8, 30.4, 10, 2), linear(ctx, 0, 0, 0, 11, [[0, '#d89a58'], [1, '#9a5f2c']]), '#4a2a12', 1.3);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(x + 3, 2.2, 24, 1.3);
      line(ctx, [[x + 6, 6], [x + 20, 6.5]], 'rgba(70,35,10,0.4)', 1);
      shape(ctx, () => circlePath(ctx, x + 4, 5.5, 1), '#3a220f', null);
      shape(ctx, () => circlePath(ctx, x + 28, 5.5, 1), '#3a220f', null);
    }
    ctx.fillStyle = 'rgba(20,10,30,0.4)';
    ctx.fillRect(0, 11, 64, 3);
  });
}

function createTowerDecor(scene: Phaser.Scene): void {
  // Janela em arco mostrando o céu noturno e o castelo ao longe.
  canvasTexture(scene, TEXTURES.WINDOW, 64, 96, (ctx) => {
    const glass = () => {
      ctx.moveTo(12, 90);
      ctx.lineTo(12, 30);
      ctx.arc(32, 30, 20, Math.PI, 0);
      ctx.lineTo(52, 90);
      ctx.closePath();
    };
    shape(ctx, () => {
      ctx.moveTo(4, 95);
      ctx.lineTo(4, 30);
      ctx.arc(32, 30, 28, Math.PI, 0);
      ctx.lineTo(60, 95);
      ctx.closePath();
    }, linear(ctx, 0, 0, 0, 96, [[0, '#9a93b8'], [1, '#6a6488']]), '#2a2440', 2);
    shape(ctx, glass, linear(ctx, 0, 10, 0, 90, [[0, '#1d1a4a'], [0.6, '#4a3a8a'], [1, '#8a6ab0']]), '#2a2440', 1.5);
    ctx.save();
    ctx.beginPath();
    glass();
    ctx.clip();
    const rnd = seeded(3);
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      circlePath(ctx, 14 + rnd() * 36, 14 + rnd() * 40, 0.5 + rnd() * 0.9);
      ctx.fill();
    }
    // castelo distante
    ctx.fillStyle = '#7f8fd8';
    ctx.fillRect(22, 70, 20, 20);
    ctx.fillRect(18, 62, 6, 28);
    ctx.fillRect(40, 62, 6, 28);
    ctx.fillRect(29, 54, 6, 36);
    ctx.beginPath();
    polygonPath(ctx, [[17, 62], [25, 62], [21, 54]]);
    ctx.fill();
    ctx.beginPath();
    polygonPath(ctx, [[39, 62], [47, 62], [43, 54]]);
    ctx.fill();
    ctx.beginPath();
    polygonPath(ctx, [[28, 54], [36, 54], [32, 44]]);
    ctx.fill();
    ctx.fillStyle = '#ffe9a8';
    ctx.fillRect(31, 60, 2, 3);
    ctx.restore();
    line(ctx, [[32, 10], [32, 90]], '#2a2440', 2);
    line(ctx, [[12, 50], [52, 50]], '#2a2440', 2);
    shape(ctx, () => roundRectPath(ctx, 2, 88, 60, 7, 2), '#9a93b8', '#2a2440', 1.5);
  });

  // Estante com livros coloridos e poções.
  canvasTexture(scene, TEXTURES.BOOKSHELF, 64, 96, (ctx) => {
    shape(ctx, () => roundRectPath(ctx, 1, 1, 62, 94, 3), linear(ctx, 0, 0, 64, 0, [[0, '#8a5530'], [1, '#5a3418']]), '#2b1608', 2);
    shape(ctx, () => ctx.rect(6, 6, 52, 84), '#3a2010', null);
    const colors = ['#e85a5a', '#5a8ae8', '#5ac87a', '#e8c25a', '#b56ae8', '#e88a3a'];
    const rnd = seeded(17);
    [28, 56, 84].forEach((shelfY, row) => {
      let x = 8;
      while (x < 54) {
        const w = 4 + Math.floor(rnd() * 4);
        const h = 16 + Math.floor(rnd() * 6);
        if (row === 1 && x > 34 && x < 44) {
          // poção
          shape(ctx, () => circlePath(ctx, x + 4, shelfY - 6, 5), radial(ctx, x + 3, shelfY - 7, 5, [[0, '#d0ffe0'], [1, '#3fd47a']]), OUTLINE, 1);
          shape(ctx, () => ctx.rect(x + 2.5, shelfY - 15, 3, 5), '#c9b8ff', OUTLINE, 0.8);
          x += 11;
          continue;
        }
        shape(ctx, () => ctx.rect(x, shelfY - h, w, h), colors[Math.floor(rnd() * colors.length)], OUTLINE, 0.9);
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillRect(x + 1, shelfY - h + 3, w - 2, 1.5);
        x += w + 0.5;
      }
      shape(ctx, () => ctx.rect(4, shelfY, 56, 4), '#8a5530', '#2b1608', 1);
    });
  });

  canvasTexture(scene, TEXTURES.CANDLE, 12, 22, (ctx) => {
    shape(ctx, () => ellipsePath(ctx, 6, 6, 3, 5), radial(ctx, 6, 7, 5, [[0, '#ffffff'], [0.4, '#ffe066'], [1, '#ff8a2e']]), null);
    shape(ctx, () => roundRectPath(ctx, 3, 10, 6, 10, 1.5), linear(ctx, 3, 0, 9, 0, [[0, '#fff6e0'], [1, '#e0cfa8']]), OUTLINE, 1);
    shape(ctx, () => ellipsePath(ctx, 6, 20.5, 5, 1.5), '#9aa0b5', OUTLINE, 0.8);
  });

  // Runa mágica (também usada como "canhão" de orbes na parede).
  canvasTexture(scene, TEXTURES.RUNE, 24, 24, (ctx) => {
    shape(ctx, () => circlePath(ctx, 12, 12, 10.5), radial(ctx, 12, 12, 11, [[0, '#4a2a8a'], [1, '#231436']]), '#c9b8ff', 1.6);
    strokeShape(ctx, () => starPath(ctx, 12, 12.5, 7.5, 3.2, 5), '#e2d4ff', 1.2);
    strokeShape(ctx, () => circlePath(ctx, 12, 12, 7.8), 'rgba(226,212,255,0.6)', 0.8);
  });

  // Espelho com moldura dourada (o "vidro" fica claro para os reflexos aparecerem por cima).
  canvasTexture(scene, TEXTURES.MIRROR, 48, 64, (ctx) => {
    shape(ctx, () => ellipsePath(ctx, 24, 32, 22, 30), linear(ctx, 0, 0, 48, 64, [[0, '#ffe58a'], [0.5, '#d9a441'], [1, '#a8741a']]), '#5a3a0a', 2);
    shape(ctx, () => ellipsePath(ctx, 24, 32, 16.5, 24), linear(ctx, 0, 6, 48, 58, [[0, '#e8f4ff'], [0.5, '#a8c4e8'], [1, '#6a86b8']]), '#5a3a0a', 1.5);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    polygonPath(ctx, [[14, 18], [20, 12], [24, 14], [16, 22]]);
    ctx.fill();
    shape(ctx, () => starPath(ctx, 24, 3.5, 3.5, 1.5), '#fff2a8', '#5a3a0a', 0.8);
  });

  canvasTexture(scene, TEXTURES.ORB, 16, 16, (ctx) => {
    ctx.fillStyle = radial(ctx, 8, 8, 8, [[0, 'rgba(255,255,255,1)'], [0.35, 'rgba(230,140,255,0.95)'], [1, 'rgba(140,40,220,0)']]);
    ctx.fillRect(0, 0, 16, 16);
  });

  // Livro voador (2 quadros: páginas para cima / para baixo).
  const book = (key: string, up: boolean) =>
    canvasTexture(scene, key, 28, 20, (ctx) => {
      const wing = up ? 2 : 10;
      shape(ctx, () => polygonPath(ctx, [[14, 12], [2, wing], [3, wing + 5], [14, 16]]), '#fff6e0', OUTLINE, 1);
      shape(ctx, () => polygonPath(ctx, [[14, 12], [26, wing], [25, wing + 5], [14, 16]]), '#fff6e0', OUTLINE, 1);
      shape(ctx, () => roundRectPath(ctx, 7, 11, 14, 8, 2), linear(ctx, 0, 11, 0, 19, [[0, '#e85a5a'], [1, '#a82a3a']]), OUTLINE, 1.2);
      shape(ctx, () => ellipsePath(ctx, 11.5, 14.5, 1.4, 1.8), '#ffffff', null);
      shape(ctx, () => ellipsePath(ctx, 16.5, 14.5, 1.4, 1.8), '#ffffff', null);
      shape(ctx, () => circlePath(ctx, 11.8, 15, 0.8), '#1d1430', null);
      shape(ctx, () => circlePath(ctx, 16.8, 15, 0.8), '#1d1430', null);
      line(ctx, [[10, 12.5], [13, 13.3]], OUTLINE, 1);
      line(ctx, [[18, 12.5], [15, 13.3]], OUTLINE, 1);
    });
  book(TEXTURES.FLYING_BOOK_0, true);
  book(TEXTURES.FLYING_BOOK_1, false);
}

export function createTowerTextures(scene: Phaser.Scene): void {
  createTowerTerrain(scene);
  createTowerDecor(scene);
}
