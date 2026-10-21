import Phaser from 'phaser';
import { TEXTURES } from '../config/assetKeys';
import { TILE } from '../config/constants';
import {
  canvasTexture,
  circlePath,
  type Ctx,
  ellipsePath,
  foliage,
  line,
  linear,
  OUTLINE,
  polygonPath,
  radial,
  roundRectPath,
  seeded,
  shape,
  starPath,
} from './canvasDraw';
import { DIRT_SIZE, type DirtPalette, paintDirt, paintGrassTop } from './placeholderTextures';

/** Texturas da Fase 2 (Pântano das Ilusões). Mesmo estilo cartoon da floresta. */

const MUD: DirtPalette = {
  base: '#4f4436',
  bandLight: 'rgba(90,78,60,0.6)',
  bandDark: 'rgba(30,26,20,0.35)',
  speck: 'rgba(25,22,16,0.45)',
  stoneTop: '#8fa08a',
  stoneBottom: '#5f6d5c',
  stoneOutline: '#2c332a',
};

function createSwampTerrain(scene: Phaser.Scene): void {
  canvasTexture(scene, TEXTURES.TILE_MUD, DIRT_SIZE, DIRT_SIZE, (ctx) => paintDirt(ctx, 13, DIRT_SIZE, MUD));

  // Musgo com "gotas" penduradas.
  canvasTexture(scene, TEXTURES.TILE_MOSS, DIRT_SIZE, TILE, (ctx) => {
    paintDirt(ctx, 5, TILE, MUD);
    paintGrassTop(ctx, '#a8e08a', '#5fa85a', '#3c7a4c', '#1b3d2a');
    [[9, 3.2], [27, 4.5], [44, 2.6], [57, 3.8]].forEach(([x, len]) => {
      shape(ctx, () => roundRectPath(ctx, x - 1.6, 12, 3.2, 3 + len, 1.6), '#3c7a4c', '#1b3d2a', 0.8);
    });
  });

  // Laje de pedra musgosa (plataforma atravessável do pântano).
  canvasTexture(scene, TEXTURES.PLATFORM_SLAB, TILE, 16, (ctx) => {
    shape(ctx, () => roundRectPath(ctx, 0.8, 1.5, 30.4, 12.5, 3.5), linear(ctx, 0, 1, 0, 14, [[0, '#a9b6b0'], [1, '#6c7a76']]), '#2c3a36', 1.4);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(3, 3, 25, 1.4);
    line(ctx, [[9, 6], [12, 12]], 'rgba(30,40,36,0.5)', 1);
    line(ctx, [[22, 4], [20, 9]], 'rgba(30,40,36,0.5)', 1);
    ctx.fillStyle = '#5fa85a';
    [[6, 2, 4.5], [17, 1.6, 3.5], [26, 2.2, 3]].forEach(([x, y, r]) => {
      ctx.beginPath();
      ellipsePath(ctx, x, y, r, 2);
      ctx.fill();
    });
    ctx.fillStyle = 'rgba(20,30,26,0.35)';
    ctx.fillRect(2, 14, 28, 2);
  });
}

function createSwampDecorations(scene: Phaser.Scene): void {
  // Taboa / juncos (tufo do pântano).
  canvasTexture(scene, TEXTURES.DECO_REED, 16, 24, (ctx) => {
    [[4, 6, -1.5], [8, 2, 0.5], [12, 7, 2]].forEach(([x, top, lean]) => {
      line(ctx, [[x, 24], [x + lean, top + 6]], '#2c5e3a', 1.6);
      shape(ctx, () => roundRectPath(ctx, x + lean - 1.8, top, 3.6, 7, 1.8), '#7a4a2a', OUTLINE, 0.8);
    });
    shape(ctx, () => polygonPath(ctx, [[1, 24], [3, 12], [5, 24]]), '#4f9e5a', '#1b3d2a', 0.8);
    shape(ctx, () => polygonPath(ctx, [[11, 24], [14, 14], [15, 24]]), '#4f9e5a', '#1b3d2a', 0.8);
  });

  // Árvore retorcida com musgo pendurado.
  canvasTexture(scene, TEXTURES.DECO_SWAMP_TREE, 128, 176, (ctx) => {
    shape(
      ctx,
      () => {
        ctx.moveTo(40, 175);
        ctx.quadraticCurveTo(58, 150, 52, 120);
        ctx.quadraticCurveTo(44, 90, 62, 64);
        ctx.lineTo(74, 66);
        ctx.quadraticCurveTo(60, 92, 68, 120);
        ctx.quadraticCurveTo(74, 150, 92, 175);
        ctx.closePath();
      },
      linear(ctx, 40, 0, 92, 0, [[0, '#6b5a4a'], [1, '#3e3328']]),
      '#1e1812',
      2,
    );
    line(ctx, [[60, 96], [36, 74], [24, 78]], '#3e3328', 5);
    line(ctx, [[66, 84], [92, 66], [104, 70]], '#3e3328', 5);
    foliage(
      ctx,
      [
        [64, 50, 30],
        [34, 62, 22],
        [96, 58, 22],
        [50, 36, 20],
        [82, 34, 20],
      ],
      { outline: '#10241c', dark: '#24503e', mid: '#2f6b50', light: '#4f9472' },
      2.5,
    );
    // musgo pendurado
    [[30, 70, 26], [44, 74, 38], [58, 76, 22], [80, 72, 34], [98, 66, 28]].forEach(([x, y, len]) => {
      line(ctx, [[x, y], [x + 1.5, y + len * 0.5], [x - 1, y + len]], '#5f9e6a', 2.2);
    });
    // cogumelos luminosos no pé
    [[34, 172], [100, 172]].forEach(([x, y]) => {
      ctx.fillStyle = radial(ctx, x, y - 4, 12, [[0, 'rgba(160,255,200,0.55)'], [1, 'rgba(160,255,200,0)']]);
      ctx.beginPath();
      circlePath(ctx, x, y - 4, 12);
      ctx.fill();
      shape(ctx, () => roundRectPath(ctx, x - 1.5, y - 6, 3, 6, 1), '#e6fff0', OUTLINE, 0.8);
      shape(ctx, () => ellipsePath(ctx, x, y - 7, 5, 3), '#7affc1', OUTLINE, 0.8);
    });
  });

  // Coluna de ruína quebrada.
  canvasTexture(scene, TEXTURES.DECO_RUIN, 40, 80, (ctx) => {
    shape(ctx, () => roundRectPath(ctx, 2, 72, 36, 8, 2), '#6c7a76', '#2c3a36', 1.4);
    shape(
      ctx,
      () => polygonPath(ctx, [[7, 72], [7, 18], [14, 10], [20, 16], [27, 6], [33, 14], [33, 72]]),
      linear(ctx, 7, 0, 33, 0, [[0, '#b9c4bf'], [0.5, '#93a19c'], [1, '#6c7a76']]),
      '#2c3a36',
      1.6,
    );
    line(ctx, [[14, 22], [14, 70]], 'rgba(30,40,36,0.4)', 1.2);
    line(ctx, [[26, 20], [26, 70]], 'rgba(30,40,36,0.4)', 1.2);
    line(ctx, [[20, 30], [24, 40], [21, 48]], '#2c3a36', 1.2);
    ctx.fillStyle = '#5fa85a';
    [[12, 18, 5], [28, 13, 4], [30, 60, 4], [9, 50, 3]].forEach(([x, y, r]) => {
      ctx.beginPath();
      ellipsePath(ctx, x, y, r, r * 0.6);
      ctx.fill();
    });
  });

  // Vitória-régia com florzinha.
  canvasTexture(scene, TEXTURES.DECO_LILY, 28, 10, (ctx) => {
    shape(ctx, () => {
      ctx.moveTo(14, 5);
      ctx.ellipse(14, 5, 13, 4.2, 0, 0.25, Math.PI * 2 - 0.25);
      ctx.closePath();
    }, linear(ctx, 0, 1, 0, 9, [[0, '#7fcf6a'], [1, '#3f8a4a']]), '#1b3d2a', 1);
    shape(ctx, () => starPath(ctx, 9, 3.5, 3, 1.4, 5), '#ffb3d1', OUTLINE, 0.6);
    shape(ctx, () => circlePath(ctx, 9, 3.5, 0.9), '#ffe066', null);
  });

  // Neblina (faixa que se repete na horizontal).
  canvasTexture(scene, TEXTURES.FOG, 512, 96, (ctx) => {
    const rnd = seeded(77);
    for (let i = 0; i < 10; i++) {
      const x = i * 52 + rnd() * 20;
      const y = 40 + rnd() * 30;
      const r = 40 + rnd() * 30;
      [x, x - 512, x + 512].forEach((xx) => {
        ctx.fillStyle = radial(ctx, xx, y, r, [[0, 'rgba(235,240,255,0.55)'], [1, 'rgba(235,240,255,0)']]);
        ctx.beginPath();
        ellipsePath(ctx, xx, y, r * 1.6, r * 0.6);
        ctx.fill();
      });
    }
  });
}

function drawGhost(ctx: Ctx, shy: boolean): void {
  // corpo com "saia" ondulada
  shape(
    ctx,
    () => {
      ctx.moveTo(3, 26);
      ctx.lineTo(3, 13);
      ctx.bezierCurveTo(3, 1, 25, 1, 25, 13);
      ctx.lineTo(25, 26);
      ctx.quadraticCurveTo(22, 22, 19.5, 26);
      ctx.quadraticCurveTo(17, 22, 14, 26);
      ctx.quadraticCurveTo(11, 22, 8.5, 26);
      ctx.quadraticCurveTo(6, 22, 3, 26);
      ctx.closePath();
    },
    radial(ctx, 10, 8, 22, [[0, '#ffffff'], [0.7, '#e6defa'], [1, '#b8a8e6']]),
    '#4a3a7a',
    1.6,
  );
  ctx.fillStyle = 'rgba(255,150,190,0.5)';
  [[8, 15.5], [20, 15.5]].forEach(([x, y]) => {
    ctx.beginPath();
    ellipsePath(ctx, x, y, 2.2, 1.3);
    ctx.fill();
  });

  if (shy) {
    // olhos fechados + mãozinhas cobrindo o rosto
    line(ctx, [[8, 11.5], [11, 12.5]], '#2a1d4a', 1.4);
    line(ctx, [[20, 11.5], [17, 12.5]], '#2a1d4a', 1.4);
    shape(ctx, () => ellipsePath(ctx, 7.5, 13, 4, 3.2), '#f4f0ff', '#4a3a7a', 1.2);
    shape(ctx, () => ellipsePath(ctx, 20.5, 13, 4, 3.2), '#f4f0ff', '#4a3a7a', 1.2);
  } else {
    shape(ctx, () => ellipsePath(ctx, 10, 11.5, 2.2, 3), '#2a1d4a', null);
    shape(ctx, () => ellipsePath(ctx, 18, 11.5, 2.2, 3), '#2a1d4a', null);
    shape(ctx, () => circlePath(ctx, 10.6, 10.4, 0.8), '#ffffff', null);
    shape(ctx, () => circlePath(ctx, 18.6, 10.4, 0.8), '#ffffff', null);
    shape(ctx, () => ellipsePath(ctx, 14, 18, 3, 2.4), '#2a1d4a', null);
  }
}

function createSwampObjects(scene: Phaser.Scene): void {
  canvasTexture(scene, TEXTURES.ENEMY_GHOST, 28, 28, (ctx) => drawGhost(ctx, false));
  canvasTexture(scene, TEXTURES.ENEMY_GHOST_SHY, 28, 28, (ctx) => drawGhost(ctx, true));

  // Porta mágica: arco de pedra + madeira.
  canvasTexture(scene, TEXTURES.DOOR, 32, 48, (ctx) => {
    shape(
      ctx,
      () => {
        ctx.moveTo(1, 47);
        ctx.lineTo(1, 16);
        ctx.arc(16, 16, 15, Math.PI, 0);
        ctx.lineTo(31, 47);
        ctx.closePath();
      },
      linear(ctx, 0, 0, 0, 48, [[0, '#a9b6b0'], [1, '#6c7a76']]),
      '#2c3a36',
      1.6,
    );
    shape(
      ctx,
      () => {
        ctx.moveTo(6, 47);
        ctx.lineTo(6, 17);
        ctx.arc(16, 17, 10, Math.PI, 0);
        ctx.lineTo(26, 47);
        ctx.closePath();
      },
      linear(ctx, 6, 0, 26, 0, [[0, '#8a5a32'], [1, '#5a3518']]),
      '#2b1608',
      1.4,
    );
    line(ctx, [[11, 12], [11, 47]], 'rgba(30,15,5,0.5)', 1.2);
    line(ctx, [[16, 7], [16, 47]], 'rgba(30,15,5,0.5)', 1.2);
    line(ctx, [[21, 12], [21, 47]], 'rgba(30,15,5,0.5)', 1.2);
    shape(ctx, () => circlePath(ctx, 22.5, 31, 1.8), '#ffd34d', OUTLINE, 0.8);
    ctx.fillStyle = 'rgba(200,160,255,0.35)';
    ctx.fillRect(7, 44, 18, 3);
  });

  canvasTexture(scene, TEXTURES.SYMBOL_SUN, 18, 18, (ctx) => {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      line(ctx, [[9 + Math.cos(a) * 5, 9 + Math.sin(a) * 5], [9 + Math.cos(a) * 8, 9 + Math.sin(a) * 8]], '#ffb52e', 2);
    }
    shape(ctx, () => circlePath(ctx, 9, 9, 4.6), radial(ctx, 8, 8, 5, [[0, '#fff2a8'], [1, '#ffb52e']]), OUTLINE, 1);
  });
  canvasTexture(scene, TEXTURES.SYMBOL_MOON, 18, 18, (ctx) => {
    shape(
      ctx,
      () => {
        ctx.arc(9, 9, 7.5, Math.PI * 0.35, Math.PI * 1.65);
        ctx.arc(12, 7.5, 6, Math.PI * 1.45, Math.PI * 0.55, true);
        ctx.closePath();
      },
      linear(ctx, 0, 0, 18, 18, [[0, '#f2f6ff'], [1, '#9fb6ff']]),
      OUTLINE,
      1,
    );
  });
  canvasTexture(scene, TEXTURES.SYMBOL_STAR, 18, 18, (ctx) => {
    shape(ctx, () => starPath(ctx, 9, 9.5, 8, 3.4), linear(ctx, 0, 0, 0, 18, [[0, '#fff2a8'], [1, '#ffcf3a']]), OUTLINE, 1);
  });
}

// =============================================================================
// Fundos do pântano
// =============================================================================

function twistedTree(ctx: Ctx, x: number, baseY: number, h: number, trunk: string, canopy: string): void {
  ctx.fillStyle = trunk;
  ctx.beginPath();
  ctx.moveTo(x - 9, baseY);
  ctx.quadraticCurveTo(x + 8, baseY - h * 0.45, x - 4, baseY - h * 0.8);
  ctx.lineTo(x + 3, baseY - h * 0.8);
  ctx.quadraticCurveTo(x + 16, baseY - h * 0.45, x + 9, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = trunk;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, baseY - h * 0.6);
  ctx.quadraticCurveTo(x - 20, baseY - h * 0.75, x - 30, baseY - h * 0.68);
  ctx.moveTo(x + 2, baseY - h * 0.7);
  ctx.quadraticCurveTo(x + 22, baseY - h * 0.85, x + 32, baseY - h * 0.78);
  ctx.stroke();
  ctx.fillStyle = canopy;
  [[x - 28, baseY - h * 0.75, h * 0.16], [x, baseY - h * 0.9, h * 0.2], [x + 28, baseY - h * 0.82, h * 0.15]].forEach(([cx, cy, r]) => {
    ctx.beginPath();
    ellipsePath(ctx, cx, cy, r * 1.3, r * 0.8);
    ctx.fill();
  });
  ctx.strokeStyle = canopy;
  ctx.lineWidth = 2;
  [[x - 34, 1], [x - 20, 1.4], [x + 8, 1.2], [x + 30, 1.5]].forEach(([mx, k]) => {
    ctx.beginPath();
    ctx.moveTo(mx, baseY - h * 0.72);
    ctx.lineTo(mx + 1, baseY - h * 0.72 + 22 * k);
    ctx.stroke();
  });
}

function createSwampBackgrounds(scene: Phaser.Scene): void {
  const W = 512;
  const wrap = (x: number, draw: (x: number) => void) => [x, x - W, x + W].forEach(draw);

  canvasTexture(scene, TEXTURES.BG_SWAMP_FAR, W, 300, (ctx) => {
    const rnd = seeded(5);
    for (let i = 0; i < 6; i++) {
      const x = (i + rnd() * 0.5) * (W / 6);
      const h = 120 + rnd() * 50;
      wrap(x, (xx) => twistedTree(ctx, xx, 190, h, '#5a6a92', '#56679a'));
    }
    ctx.fillStyle = '#56679a';
    ctx.fillRect(0, 188, W, 200);
  });

  canvasTexture(scene, TEXTURES.BG_SWAMP_MID, W, 340, (ctx) => {
    const rnd = seeded(9);
    for (let i = 0; i < 5; i++) {
      const x = (i + rnd() * 0.5) * (W / 5);
      const h = 170 + rnd() * 60;
      wrap(x, (xx) => twistedTree(ctx, xx, 236, h, '#2f4a52', '#2f5a54'));
    }
    ctx.fillStyle = '#2f4a52';
    ctx.fillRect(0, 232, W, 200);
    // brilhos de cogumelos ao longe
    for (let i = 0; i < 8; i++) {
      const x = rnd() * W;
      wrap(x, (xx) => {
        ctx.fillStyle = radial(ctx, xx, 228, 8, [[0, 'rgba(140,255,200,0.6)'], [1, 'rgba(140,255,200,0)']]);
        ctx.beginPath();
        circlePath(ctx, xx, 228, 8);
        ctx.fill();
      });
    }
  });

  canvasTexture(scene, TEXTURES.BG_SWAMP_NEAR, W, 220, (ctx) => {
    const rnd = seeded(31);
    ctx.fillStyle = '#1d3530';
    for (let i = 0; i < 40; i++) {
      const x = rnd() * W;
      const h = 30 + rnd() * 60;
      const lean = rnd() * 6 - 3;
      wrap(x, (xx) => {
        ctx.beginPath();
        polygonPath(ctx, [[xx - 3, 140], [xx + lean, 140 - h], [xx + 3, 140]]);
        ctx.fill();
      });
    }
    for (let i = 0; i < 9; i++) {
      const x = rnd() * W;
      const r = 22 + rnd() * 14;
      wrap(x, (xx) => foliage(ctx, [[xx, 132, r]], { outline: null, dark: '#1d3530', mid: '#24423a', light: '#2f5248' }));
    }
    ctx.fillStyle = '#1d3530';
    ctx.fillRect(0, 138, W, 120);
  });
}

export function createSwampTextures(scene: Phaser.Scene): void {
  createSwampTerrain(scene);
  createSwampDecorations(scene);
  createSwampObjects(scene);
  createSwampBackgrounds(scene);
}
