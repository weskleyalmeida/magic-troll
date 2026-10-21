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
  strokeShape,
} from './canvasDraw';
import { createSwampTextures } from './swampTextures';
import { createTowerTextures } from './towerTextures';
import { createCastleTextures } from './castleTextures';

/**
 * Gera as texturas do jogo em código (Canvas 2D), em estilo cartoon com contorno.
 * IMPORTANTE: os TAMANHOS de cada textura definem hitboxes/posições, então ao trocar
 * por arte final mantenha as mesmas dimensões (ou ajuste os setSize/setOffset).
 * Para usar arte real: carregue no BootScene com a MESMA chave e remova a geração daqui.
 */

type Rect = [x: number, y: number, w: number, h: number];

// =============================================================================
// Player (32 x 44)
// =============================================================================

interface WizardOptions {
  legs: Rect[];
  staffOffsetY?: number;
  eye?: 'open' | 'hurt' | 'happy';
}

function drawWizard(ctx: Ctx, { legs, staffOffsetY = 0, eye = 'open' }: WizardOptions): void {
  // mochila
  shape(ctx, () => roundRectPath(ctx, 3, 25, 7, 11, 2.5), linear(ctx, 0, 25, 0, 36, [[0, '#b8783d'], [1, '#7e4a22']]));

  // pernas + botas
  legs.forEach(([x, y, w, h]) => {
    shape(ctx, () => roundRectPath(ctx, x, y, w, h, 1.5), '#5a4030');
    shape(ctx, () => roundRectPath(ctx, x - 0.5, y + h - 3, w + 2, 3.2, 1.5), '#3a2a20', OUTLINE, 1);
  });

  // túnica
  shape(
    ctx,
    () => {
      ctx.moveTo(10, 24.5);
      ctx.lineTo(22.5, 24.5);
      ctx.quadraticCurveTo(25, 31, 25.5, 37.5);
      ctx.lineTo(7, 37.5);
      ctx.quadraticCurveTo(7.5, 31, 10, 24.5);
      ctx.closePath();
    },
    linear(ctx, 0, 24, 0, 38, [[0, '#5fa2ff'], [1, '#2f5fc0']]),
  );
  // cinto com fivela
  shape(ctx, () => ctx.rect(7.8, 31.5, 17.4, 2.6), '#ffcf4a', OUTLINE, 1);
  shape(ctx, () => ctx.rect(14.5, 31, 3.5, 3.6), '#fff1a8', OUTLINE, 1);

  // rosto
  shape(ctx, () => circlePath(ctx, 16.5, 21, 6), radial(ctx, 15, 19, 7, [[0, '#ffe6cf'], [1, '#f6c39b']]));
  ctx.fillStyle = 'rgba(255,130,130,0.55)';
  ctx.beginPath();
  circlePath(ctx, 19.8, 23.3, 1.6);
  ctx.fill();

  if (eye === 'open') {
    shape(ctx, () => ellipsePath(ctx, 19.3, 19.8, 1.8, 2.3), '#ffffff', OUTLINE, 0.8);
    shape(ctx, () => circlePath(ctx, 19.9, 20.2, 1.1), '#1d1430', null);
  } else if (eye === 'hurt') {
    line(ctx, [[17.6, 18.2], [21, 21.6]], OUTLINE, 1.4);
    line(ctx, [[21, 18.2], [17.6, 21.6]], OUTLINE, 1.4);
  } else {
    line(ctx, [[17.5, 20.8], [19.3, 18.8], [21.1, 20.8]], OUTLINE, 1.4);
  }

  // chapéu de mago (ponta curvada) + aba + faixa + estrela
  shape(
    ctx,
    () => {
      ctx.moveTo(6.5, 16);
      ctx.quadraticCurveTo(11, 8, 14, 3);
      ctx.quadraticCurveTo(17, -0.5, 21.5, 1.5);
      ctx.quadraticCurveTo(18, 3, 19.5, 8);
      ctx.quadraticCurveTo(22, 12.5, 25.5, 16);
      ctx.closePath();
    },
    linear(ctx, 8, 2, 24, 16, [[0, '#a36bff'], [1, '#5a2db0']]),
  );
  shape(ctx, () => ctx.rect(8.6, 12.6, 15, 2.6), '#ffcf4a', OUTLINE, 1);
  shape(ctx, () => ellipsePath(ctx, 16, 16.4, 13, 2.6), linear(ctx, 0, 14, 0, 19, [[0, '#6a3bd0'], [1, '#3f1d8a']]));
  shape(ctx, () => starPath(ctx, 14.2, 8.4, 2.6, 1.1), '#ffe066', OUTLINE, 0.8);

  // cajado com gema brilhante
  const sy = staffOffsetY;
  shape(ctx, () => roundRectPath(ctx, 25.2, 20 + sy, 3, 20, 1.2), linear(ctx, 25, 0, 28, 0, [[0, '#b07a45'], [1, '#6e4520']]));
  ctx.fillStyle = radial(ctx, 26.7, 18.5 + sy, 5.5, [[0, 'rgba(160,255,255,0.75)'], [1, 'rgba(160,255,255,0)']]);
  ctx.beginPath();
  circlePath(ctx, 26.7, 18.5 + sy, 5.5);
  ctx.fill();
  shape(ctx, () => circlePath(ctx, 26.7, 18.5 + sy, 3), radial(ctx, 25.8, 17.5 + sy, 3.5, [[0, '#ffffff'], [0.4, '#7ff6ff'], [1, '#1fb6d6']]), OUTLINE, 1);
}

function createPlayerTextures(scene: Phaser.Scene): void {
  const wizard = (key: string, options: WizardOptions) => canvasTexture(scene, key, 32, 44, (ctx) => drawWizard(ctx, options));
  wizard(TEXTURES.PLAYER_IDLE, { legs: [[11, 36, 4, 7], [17, 36, 4, 7]] });
  wizard(TEXTURES.PLAYER_WALK_0, { legs: [[9, 36, 4, 7], [19, 35, 4, 6]] });
  wizard(TEXTURES.PLAYER_WALK_1, { legs: [[13, 35, 4, 6], [16, 36, 4, 7]] });
  wizard(TEXTURES.PLAYER_JUMP, { legs: [[11, 35, 4, 5], [17, 34, 4, 5]], staffOffsetY: -3 });
  wizard(TEXTURES.PLAYER_FALL, { legs: [[8, 36, 4, 7], [20, 36, 4, 7]], staffOffsetY: 1 });
  wizard(TEXTURES.PLAYER_HURT, { legs: [[8, 35, 4, 6], [20, 36, 4, 7]], eye: 'hurt' });
  wizard(TEXTURES.PLAYER_CELEBRATE, { legs: [[10, 35, 4, 6], [18, 35, 4, 6]], staffOffsetY: -8, eye: 'happy' });
}

// =============================================================================
// Inimigos
// =============================================================================

function drawMushroomEnemy(ctx: Ctx, feet: Rect[], sleeping = false): void {
  feet.forEach(([x, y, w, h]) => shape(ctx, () => ellipsePath(ctx, x + w / 2, y + h / 2, w / 2 + 0.5, h / 2), '#5a3a26', OUTLINE, 1));

  // corpo
  shape(ctx, () => roundRectPath(ctx, 7, 10, 14, 13.5, 4.5), linear(ctx, 0, 10, 0, 24, [[0, '#fff3e0'], [1, '#efc595']]));

  if (sleeping) {
    line(ctx, [[9.2, 17.5], [12.4, 17.5]], OUTLINE, 1.4);
    line(ctx, [[15.6, 17.5], [18.8, 17.5]], OUTLINE, 1.4);
    line(ctx, [[12.5, 21], [15.5, 21]], OUTLINE, 1);
  } else {
    shape(ctx, () => ellipsePath(ctx, 11, 17.4, 1.5, 2), '#1d1430', null);
    shape(ctx, () => ellipsePath(ctx, 17, 17.4, 1.5, 2), '#1d1430', null);
    line(ctx, [[8.8, 14.6], [12.8, 15.9]], OUTLINE, 1.5);
    line(ctx, [[19.2, 14.6], [15.2, 15.9]], OUTLINE, 1.5);
    line(ctx, [[12, 21.4], [14, 20.4], [16, 21.4]], OUTLINE, 1.1);
  }

  // chapéu vermelho com bolinhas
  shape(
    ctx,
    () => {
      ctx.moveTo(1, 13.5);
      ctx.bezierCurveTo(1, 2.5, 27, 2.5, 27, 13.5);
      ctx.quadraticCurveTo(14, 17, 1, 13.5);
      ctx.closePath();
    },
    radial(ctx, 10, 5, 18, [[0, '#ff8a75'], [0.6, '#e8483a'], [1, '#b62a22']]),
  );
  ctx.fillStyle = '#ffffff';
  [[7, 8.5, 2.3], [14.5, 5.6, 2.1], [21.2, 9, 2.2], [11.5, 11.6, 1.3], [18.5, 12, 1.2]].forEach(([x, y, r]) => {
    ctx.beginPath();
    ellipsePath(ctx, x, y, r, r * 0.85);
    ctx.fill();
  });
}

function createEnemyTextures(scene: Phaser.Scene): void {
  canvasTexture(scene, TEXTURES.ENEMY_MUSHROOM_0, 28, 26, (ctx) => drawMushroomEnemy(ctx, [[6, 22, 6, 3.6], [16, 22, 6, 3.6]]));
  canvasTexture(scene, TEXTURES.ENEMY_MUSHROOM_1, 28, 26, (ctx) => drawMushroomEnemy(ctx, [[8, 22, 6, 3.6], [14, 22, 6, 3.6]]));
  canvasTexture(scene, TEXTURES.ENEMY_MUSHROOM_SLEEP, 28, 26, (ctx) => drawMushroomEnemy(ctx, [[7, 22, 6, 3.6], [15, 22, 6, 3.6]], true));

  canvasTexture(scene, TEXTURES.ENEMY_MUSHROOM_SQUASHED, 28, 26, (ctx) => {
    shape(ctx, () => roundRectPath(ctx, 8, 20, 12, 5, 2), '#f2d2a8');
    shape(ctx, () => ellipsePath(ctx, 14, 20.5, 13, 4), linear(ctx, 0, 16, 0, 25, [[0, '#ff7a66'], [1, '#c2332a']]));
    ctx.fillStyle = '#ffffff';
    [[8, 20], [14, 19], [20, 20.5]].forEach(([x, y]) => {
      ctx.beginPath();
      ellipsePath(ctx, x, y, 1.8, 1);
      ctx.fill();
    });
  });

  // Peixe saltador: barbatana com espinhos (pista de que NÃO dá para pisar nele).
  canvasTexture(scene, TEXTURES.ENEMY_FISH, 28, 20, (ctx) => {
    shape(ctx, () => polygonPath(ctx, [[8.5, 6.5], [10.5, 1], [12.5, 6], [14.5, 0.8], [16.5, 6], [18.5, 2], [19.5, 6.5]]), '#f4f7ff', OUTLINE, 1);
    shape(ctx, () => polygonPath(ctx, [[1, 3], [1, 17], [8.5, 10]]), linear(ctx, 0, 0, 8, 0, [[0, '#ff7a3a'], [1, '#ff9a4d']]), OUTLINE, 1.2);
    shape(ctx, () => ellipsePath(ctx, 16, 10.5, 10.8, 6.8), linear(ctx, 0, 4, 0, 17, [[0, '#ffae5c'], [1, '#e2572a']]), OUTLINE, 1.3);
    shape(ctx, () => ellipsePath(ctx, 17, 13.5, 6.5, 2.4), '#ffd8b5', null);
    shape(ctx, () => circlePath(ctx, 21.8, 8.6, 2.1), '#ffffff', OUTLINE, 0.8);
    shape(ctx, () => circlePath(ctx, 22.4, 8.9, 1.1), '#1d1430', null);
    shape(ctx, () => polygonPath(ctx, [[22.5, 12.2], [26.2, 12.2], [24.4, 15]]), '#ffffff', OUTLINE, 0.6);
  });
}

// =============================================================================
// Terreno (texturas que se repetem: elementos nunca cruzam a borda)
// =============================================================================

/** Terra 64x64 (2x2 tiles) alinhada ao mundo: camadas de solo onduladas + poucas pedras. */
export const DIRT_SIZE = 64;

export interface DirtPalette {
  base: string;
  bandLight: string;
  bandDark: string;
  speck: string;
  stoneTop: string;
  stoneBottom: string;
  stoneOutline: string;
}

const FOREST_DIRT: DirtPalette = {
  base: '#8b5a33',
  bandLight: 'rgba(110,70,38,0.55)',
  bandDark: 'rgba(70,40,20,0.3)',
  speck: 'rgba(60,34,16,0.4)',
  stoneTop: '#caa98a',
  stoneBottom: '#8a6c50',
  stoneOutline: '#55351c',
};

export function paintDirt(ctx: Ctx, seed: number, height = DIRT_SIZE, palette: DirtPalette = FOREST_DIRT): void {
  ctx.fillStyle = palette.base;
  ctx.fillRect(0, 0, DIRT_SIZE, height);

  // camadas onduladas (período = largura: emenda perfeita na horizontal)
  const band = (y: number, amp: number, thick: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= DIRT_SIZE; x += 4) ctx.lineTo(x, y + Math.sin((x / DIRT_SIZE) * Math.PI * 2) * amp);
    for (let x = DIRT_SIZE; x >= 0; x -= 4) ctx.lineTo(x, y + thick + Math.sin((x / DIRT_SIZE) * Math.PI * 2 + 1) * amp);
    ctx.closePath();
    ctx.fill();
  };
  band(14, 2.5, 5, palette.bandLight);
  band(40, 3, 6, palette.bandDark);

  const rnd = seeded(seed);
  ctx.fillStyle = palette.speck;
  for (let i = 0; i < 14; i++) {
    ctx.beginPath();
    ellipsePath(ctx, 4 + rnd() * 56, 4 + rnd() * (height - 8), 1 + rnd() * 1.6, 0.8 + rnd());
    ctx.fill();
  }
  // poucas pedrinhas, de tamanhos variados
  const stones: [number, number, number, number][] = [
    [14, 26, 5, 3.4],
    [44, 52, 6.5, 4],
    [50, 18, 2.8, 2],
    [24, 56, 2.4, 1.7],
  ];
  stones
    .filter(([, y, , ry]) => y + ry < height - 1)
    .forEach(([x, y, rx, ry]) => {
      shape(ctx, () => ellipsePath(ctx, x, y, rx, ry), linear(ctx, 0, y - ry, 0, y + ry, [[0, palette.stoneTop], [1, palette.stoneBottom]]), palette.stoneOutline, 1.1);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ellipsePath(ctx, x - rx * 0.3, y - ry * 0.35, rx * 0.35, ry * 0.25);
      ctx.fill();
    });
}

export function paintGrassTop(ctx: Ctx, light: string, mid: string, dark: string, outline: string): void {
  // franja arredondada (período de 8px: emenda perfeita entre tiles)
  const W = DIRT_SIZE;
  // franja arredondada com tamanhos alternados (período de 16px: emenda perfeita)
  const fringe = (x: number) => (Math.round(x / 8) % 2 === 0 ? 5.6 : 4.4);
  ctx.fillStyle = outline;
  for (let x = -4; x <= W + 4; x += 8) {
    ctx.beginPath();
    circlePath(ctx, x, 11, fringe(x) + 0.7);
    ctx.fill();
  }
  ctx.fillStyle = dark;
  for (let x = -4; x <= W + 4; x += 8) {
    ctx.beginPath();
    circlePath(ctx, x, 10, fringe(x));
    ctx.fill();
  }
  ctx.fillStyle = linear(ctx, 0, 0, 0, 11, [[0, light], [1, mid]]);
  ctx.fillRect(0, 0, W, 10);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(0, 1.2, W, 1.6);
  ctx.fillStyle = outline;
  ctx.fillRect(0, 0, W, 1.2);
  // folhinhas
  [[5, 6], [13, 4], [21, 7], [28, 5], [37, 6], [46, 4], [53, 7], [60, 5]].forEach(([x, y]) =>
    line(ctx, [[x, y + 3], [x + 1.5, y]], 'rgba(40,90,20,0.5)', 1),
  );
}

function createTerrainTextures(scene: Phaser.Scene): void {
  canvasTexture(scene, TEXTURES.TILE_DIRT, DIRT_SIZE, DIRT_SIZE, (ctx) => paintDirt(ctx, 7));

  // Pista sutil de parede falsa: rachaduras.
  canvasTexture(scene, TEXTURES.TILE_DIRT_CRACKED, DIRT_SIZE, DIRT_SIZE, (ctx) => {
    paintDirt(ctx, 7);
    line(ctx, [[8, 4], [24, 24], [18, 40], [24, 54]], '#3b2212', 1.8);
    line(ctx, [[24, 24], [44, 32], [56, 56]], '#3b2212', 1.8);
    line(ctx, [[44, 32], [54, 18]], '#3b2212', 1.4);
  });

  // Linha de cima do chão (64 x 32): grama + início da terra.
  canvasTexture(scene, TEXTURES.TILE_GRASS, DIRT_SIZE, TILE, (ctx) => {
    paintDirt(ctx, 3, TILE);
    paintGrassTop(ctx, '#a6ec5c', '#62c234', '#4c9e28', '#2c5e18');
  });

  // Chão que desaba: grama amarelada e rachaduras (a pista).
  canvasTexture(scene, TEXTURES.TILE_GRASS_LOOSE, DIRT_SIZE, TILE, (ctx) => {
    paintDirt(ctx, 3, TILE);
    paintGrassTop(ctx, '#e0e483', '#b5bf45', '#959c33', '#5a5a1c');
    line(ctx, [[6, 13], [10, 22], [7, 30]], '#3b2212', 1.5);
    line(ctx, [[22, 12], [26, 20], [24, 26]], '#3b2212', 1.5);
    line(ctx, [[40, 13], [44, 24]], '#3b2212', 1.5);
    line(ctx, [[54, 12], [58, 20], [56, 28]], '#3b2212', 1.5);
  });

  canvasTexture(scene, TEXTURES.TILE_STONE, TILE, TILE, (ctx) => {
    ctx.fillStyle = '#4d5266';
    ctx.fillRect(0, 0, TILE, TILE);
    const brick = (x: number, y: number, w: number, h: number) =>
      shape(ctx, () => roundRectPath(ctx, x, y, w, h, 3.5), linear(ctx, 0, y, 0, y + h, [[0, '#b4bacb'], [1, '#7e8598']]), '#40445a', 1.2);
    brick(1, 1, 30, 14);
    brick(1, 17, 14, 14);
    brick(17, 17, 14, 14);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(4, 3, 18, 1.5);
    ctx.fillRect(4, 19, 7, 1.5);
    ctx.fillRect(20, 19, 7, 1.5);
    // musgo
    ctx.fillStyle = '#6dbb3c';
    [[6, 2, 4], [11, 1.5, 3], [24, 2, 3]].forEach(([x, y, r]) => {
      ctx.beginPath();
      ellipsePath(ctx, x, y, r, 2);
      ctx.fill();
    });
  });

  const plank = (ctx: Ctx, top: string, bottom: string, cracked: boolean) => {
    shape(ctx, () => roundRectPath(ctx, 0.8, 1, 30.4, 12.5, 3), linear(ctx, 0, 1, 0, 14, [[0, top], [1, bottom]]), '#4a2a12', 1.4);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(3, 2.6, 26, 1.4);
    line(ctx, [[4, 7.5], [13, 7], [20, 8]], 'rgba(70,35,10,0.45)', 1);
    line(ctx, [[15, 10.5], [27, 10]], 'rgba(70,35,10,0.45)', 1);
    shape(ctx, () => circlePath(ctx, 4.5, 7.5, 1.2), '#3a220f', null);
    shape(ctx, () => circlePath(ctx, 27.5, 7.5, 1.2), '#3a220f', null);
    ctx.fillStyle = 'rgba(30,15,5,0.35)';
    ctx.fillRect(2, 13.5, 28, 2.2);
    if (cracked) {
      line(ctx, [[8, 2], [12, 8.5], [10, 13]], '#2b1608', 1.5);
      line(ctx, [[21, 3], [25, 11]], '#2b1608', 1.5);
      shape(ctx, () => polygonPath(ctx, [[25, 14], [31, 14], [31, 8]]), '#2b1608', null);
    }
  };
  canvasTexture(scene, TEXTURES.PLATFORM_WOOD, TILE, 16, (ctx) => plank(ctx, '#e3a05a', '#a8652c', false));
  // Tábua que desmorona: mais escura, rachada e com um pedaço faltando.
  canvasTexture(scene, TEXTURES.PLATFORM_CRUMBLE, TILE, 16, (ctx) => plank(ctx, '#b47d47', '#7a4a22', true));

  // Cachoeira: faixas que se repetem na vertical (o tileSprite rola para baixo).
  canvasTexture(scene, TEXTURES.WATERFALL, TILE, TILE, (ctx) => {
    ctx.fillStyle = linear(ctx, 0, 0, TILE, 0, [[0, '#5cc8ff'], [0.5, '#8fdcff'], [1, '#5cc8ff']]);
    ctx.fillRect(0, 0, TILE, TILE);
    const streaks: [number, number, number][] = [[4, 2, 14], [11, 12, 12], [18, 20, 16], [26, 6, 10], [8, 24, 9]];
    streaks.forEach(([x, y, len]) => {
      [y, y - TILE].forEach((yy) => line(ctx, [[x, yy], [x, yy + len]], 'rgba(255,255,255,0.75)', 2));
    });
  });

  // Superfície da água (crista de onda que se repete na horizontal).
  canvasTexture(scene, TEXTURES.WATER_SURFACE, 64, 12, (ctx) => {
    ctx.fillStyle = 'rgba(200,240,255,0.9)';
    ctx.beginPath();
    ctx.moveTo(0, 6);
    for (let x = 0; x <= 64; x += 16) {
      ctx.quadraticCurveTo(x + 8, 1, x + 16, 6);
    }
    ctx.lineTo(64, 12);
    ctx.lineTo(0, 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    [[10, 4], [38, 5]].forEach(([x, y]) => {
      ctx.beginPath();
      ellipsePath(ctx, x, y, 4, 1.2);
      ctx.fill();
    });
  });
}

// =============================================================================
// Armadilhas e objetos interativos
// =============================================================================

function paintChestBody(ctx: Ctx, lockColor: string): void {
  shape(ctx, () => roundRectPath(ctx, 2, 13.5, 28, 14, 2.5), linear(ctx, 0, 13, 0, 28, [[0, '#c27a3a'], [1, '#7f4a1f']]));
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(3, 14, 26, 2);
  shape(ctx, () => ctx.rect(6, 13.5, 3.2, 14), '#e3b04a', OUTLINE, 1);
  shape(ctx, () => ctx.rect(22.8, 13.5, 3.2, 14), '#e3b04a', OUTLINE, 1);
  shape(ctx, () => roundRectPath(ctx, 12.8, 11.5, 6.4, 7.5, 1.5), lockColor, OUTLINE, 1.2);
  shape(ctx, () => roundRectPath(ctx, 15.2, 13.8, 1.6, 3, 0.8), '#2b1a10', null);
}

function paintChestLid(ctx: Ctx, fill: string | CanvasGradient): void {
  shape(
    ctx,
    () => {
      ctx.moveTo(2, 14.5);
      ctx.lineTo(2, 10);
      ctx.quadraticCurveTo(16, 2, 30, 10);
      ctx.lineTo(30, 14.5);
      ctx.closePath();
    },
    fill,
  );
}

function createObjectTextures(scene: Phaser.Scene): void {
  canvasTexture(scene, TEXTURES.SPIKES, TILE, 16, (ctx) => {
    for (let i = 0; i < 4; i++) {
      const x = i * 8;
      shape(ctx, () => polygonPath(ctx, [[x + 0.6, 15.5], [x + 7.4, 15.5], [x + 4, 1]]), linear(ctx, x, 0, x + 8, 0, [[0, '#f4f6fc'], [0.5, '#c7ccdc'], [1, '#868ca3']]), OUTLINE, 1.1);
    }
    shape(ctx, () => ctx.rect(0, 13.5, TILE, 2.5), '#5b6073', null);
  });

  // Pista das armadilhas escondidas: furinhos na grama.
  canvasTexture(scene, TEXTURES.SPIKE_HOLES, TILE, 6, (ctx) => {
    [4, 12, 20, 28].forEach((x) => shape(ctx, () => ellipsePath(ctx, x, 3, 2.6, 1.6), 'rgba(40,25,10,0.85)', null));
  });

  canvasTexture(scene, TEXTURES.SIGN, 32, 36, (ctx) => {
    shape(ctx, () => roundRectPath(ctx, 13.5, 15, 5, 21, 1.5), linear(ctx, 13, 0, 19, 0, [[0, '#a8703c'], [1, '#6e4420']]));
    shape(ctx, () => roundRectPath(ctx, 1.5, 1.5, 29, 18, 3.5), linear(ctx, 0, 1, 0, 20, [[0, '#e8b276'], [1, '#b67a40']]), '#4a2a12', 1.6);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(4, 3.5, 24, 1.3);
    line(ctx, [[7, 8.5], [25, 8.5]], '#6b4423', 1.8);
    line(ctx, [[7, 13], [19, 13]], '#6b4423', 1.8);
    shape(ctx, () => circlePath(ctx, 4.5, 5, 1), '#3a220f', null);
    shape(ctx, () => circlePath(ctx, 27.5, 5, 1), '#3a220f', null);
  });

  // Baú verdadeiro: cadeado dourado.
  canvasTexture(scene, TEXTURES.CHEST_CLOSED, 32, 28, (ctx) => {
    paintChestLid(ctx, linear(ctx, 0, 4, 0, 15, [[0, '#a8632c'], [1, '#7a4419']]));
    paintChestBody(ctx, '#ffd34d');
  });
  canvasTexture(scene, TEXTURES.CHEST_OPEN, 32, 28, (ctx) => {
    shape(ctx, () => roundRectPath(ctx, 2, 0.8, 28, 6, 2), linear(ctx, 0, 0, 0, 7, [[0, '#a8632c'], [1, '#7a4419']]));
    shape(ctx, () => roundRectPath(ctx, 3, 6.5, 26, 8.5, 1.5), '#3b2414');
    ctx.fillStyle = radial(ctx, 16, 11, 12, [[0, 'rgba(255,220,90,0.9)'], [1, 'rgba(255,220,90,0)']]);
    ctx.fillRect(3, 6.5, 26, 8.5);
    [[10, 12], [16.5, 10.5], [23, 12.5]].forEach(([x, y]) => shape(ctx, () => circlePath(ctx, x, y, 2.6), '#ffd34d', '#a8741a', 1));
    paintChestBody(ctx, '#ffd34d');
  });

  // Baú falso: cadeado VERMELHO e dentinhos discretos (a pista).
  canvasTexture(scene, TEXTURES.CHEST_FAKE_CLOSED, 32, 28, (ctx) => {
    paintChestLid(ctx, linear(ctx, 0, 4, 0, 15, [[0, '#a8632c'], [1, '#7a4419']]));
    paintChestBody(ctx, '#e04848');
    [9.5, 20].forEach((x) => shape(ctx, () => polygonPath(ctx, [[x, 15.2], [x + 3, 15.2], [x + 1.5, 18]]), '#ffffff', OUTLINE, 0.7));
  });
  canvasTexture(scene, TEXTURES.CHEST_FAKE_OPEN, 32, 28, (ctx) => {
    shape(ctx, () => roundRectPath(ctx, 2, 0.5, 28, 7, 2.5), linear(ctx, 0, 0, 0, 7, [[0, '#8a3a4a'], [1, '#5a1f2c']]));
    [[10, 3.8], [22, 3.8]].forEach(([x, y]) => {
      shape(ctx, () => circlePath(ctx, x, y, 2.6), '#ffe14d', OUTLINE, 0.8);
      shape(ctx, () => ellipsePath(ctx, x + 0.4, y, 0.8, 1.6), '#1d1430', null);
    });
    shape(ctx, () => roundRectPath(ctx, 3, 7, 26, 9, 2), '#7a1f2a');
    shape(ctx, () => ellipsePath(ctx, 16, 14.5, 6, 2.2), '#ff6f8a', null);
    paintChestBody(ctx, '#e04848');
    for (let x = 4; x < 28; x += 6) {
      shape(ctx, () => polygonPath(ctx, [[x, 7], [x + 5, 7], [x + 2.5, 12]]), '#ffffff', OUTLINE, 0.7);
      shape(ctx, () => polygonPath(ctx, [[x, 15.5], [x + 5, 15.5], [x + 2.5, 11]]), '#ffffff', OUTLINE, 0.7);
    }
  });

  const checkpoint = (key: string, active: boolean) =>
    canvasTexture(scene, key, 24, 48, (ctx) => {
      shape(ctx, () => roundRectPath(ctx, 2.5, 3, 3.5, 42, 1.5), linear(ctx, 2, 0, 6, 0, [[0, '#e3e6f0'], [1, '#8a90a6']]));
      shape(
        ctx,
        () => {
          ctx.moveTo(6, 4.5);
          ctx.quadraticCurveTo(14, 2, 22.5, 8);
          ctx.quadraticCurveTo(14, 12, 6, 16.5);
          ctx.closePath();
        },
        active ? linear(ctx, 6, 0, 22, 0, [[0, '#7dffb4'], [1, '#2fd47a']]) : linear(ctx, 6, 0, 22, 0, [[0, '#a8a3c4'], [1, '#7d7898']]),
        OUTLINE,
        1.2,
      );
      if (active) {
        ctx.fillStyle = radial(ctx, 4.2, 3, 4, [[0, '#fff6c2'], [1, 'rgba(255,209,102,0)']]);
        ctx.beginPath();
        circlePath(ctx, 4.2, 3, 4);
        ctx.fill();
      }
      shape(ctx, () => circlePath(ctx, 4.2, 3, 2.2), active ? '#ffd34d' : '#c9cbd6', OUTLINE, 1);
      shape(ctx, () => roundRectPath(ctx, 0.5, 43, 12, 4.5, 1.5), '#7d8496', OUTLINE, 1);
    });
  checkpoint(TEXTURES.CHECKPOINT_OFF, false);
  checkpoint(TEXTURES.CHECKPOINT_ON, true);

  canvasTexture(scene, TEXTURES.PORTAL, 40, 56, (ctx) => {
    shape(ctx, () => ellipsePath(ctx, 20, 28, 18.5, 26.5), linear(ctx, 0, 0, 0, 56, [[0, '#b18cff'], [1, '#6a3fd0']]), OUTLINE, 2);
    ctx.fillStyle = radial(ctx, 20, 28, 22, [[0, '#ffffff'], [0.25, '#e2d4ff'], [0.6, '#5a2db0'], [1, '#1d0f3a']]);
    ctx.beginPath();
    ellipsePath(ctx, 20, 28, 14, 22);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(20, 28, 9, 15, 0.3, 0.3, Math.PI * 1.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(20, 28, 5, 9, -0.4, Math.PI, Math.PI * 2.3);
    ctx.stroke();
  });
}

// =============================================================================
// Itens
// =============================================================================

function createItemTextures(scene: Phaser.Scene): void {
  canvasTexture(scene, TEXTURES.COIN, 16, 16, (ctx) => {
    shape(ctx, () => circlePath(ctx, 8, 8, 7), radial(ctx, 6, 5.5, 9, [[0, '#fff3a8'], [0.5, '#ffd34d'], [1, '#d99a1e']]), '#8a5a10', 1.2);
    strokeShape(ctx, () => circlePath(ctx, 8, 8, 4.6), '#c4870f', 1);
    shape(ctx, () => starPath(ctx, 8, 8.2, 3.2, 1.4), '#fff7c8', null);
    shape(ctx, () => ellipsePath(ctx, 5.6, 4.8, 1.8, 1), 'rgba(255,255,255,0.9)', null);
  });

  canvasTexture(scene, TEXTURES.ITEM_CRYSTAL, 24, 32, (ctx) => {
    shape(ctx, () => polygonPath(ctx, [[12, 1], [22.5, 11], [12, 31], [1.5, 11]]), '#2ee86f', '#0c5a2a', 1.6);
    shape(ctx, () => polygonPath(ctx, [[12, 1], [16, 11], [8, 11]]), '#c9ffdc', null);
    shape(ctx, () => polygonPath(ctx, [[1.5, 11], [8, 11], [12, 31]]), '#5df59a', null);
    shape(ctx, () => polygonPath(ctx, [[22.5, 11], [16, 11], [12, 31]]), '#14a84c', null);
    shape(ctx, () => polygonPath(ctx, [[8, 11], [16, 11], [12, 31]]), '#28d462', null);
    strokeShape(ctx, () => polygonPath(ctx, [[12, 1], [22.5, 11], [12, 31], [1.5, 11]]), '#0c5a2a', 1.6);
    shape(ctx, () => polygonPath(ctx, [[9, 4.5], [10.5, 4], [7.5, 10], [6, 10]]), 'rgba(255,255,255,0.85)', null);
  });

  canvasTexture(scene, TEXTURES.ITEM_KEY, 28, 16, (ctx) => {
    shape(ctx, () => roundRectPath(ctx, 10, 5.8, 17, 4.4, 1.5), linear(ctx, 0, 5, 0, 11, [[0, '#c2f0ff'], [1, '#3fa9d6']]), '#174a66', 1.2);
    shape(ctx, () => ctx.rect(19.5, 9.5, 3, 5), '#5cc4ec', '#174a66', 1);
    shape(ctx, () => ctx.rect(23.8, 9.5, 3, 3.8), '#5cc4ec', '#174a66', 1);
    shape(ctx, () => circlePath(ctx, 7, 8, 5.8), radial(ctx, 5.5, 6, 7, [[0, '#e6faff'], [1, '#3fa9d6']]), '#174a66', 1.3);
    shape(ctx, () => circlePath(ctx, 7, 8, 2.3), '#1d3a66', null);
  });

  canvasTexture(scene, TEXTURES.ITEM_EYE, 28, 20, (ctx) => {
    shape(ctx, () => {
      ctx.moveTo(1, 10);
      ctx.quadraticCurveTo(14, -3, 27, 10);
      ctx.quadraticCurveTo(14, 23, 1, 10);
      ctx.closePath();
    }, '#fbf3ff', '#4a1a66', 1.5);
    shape(ctx, () => circlePath(ctx, 14, 10, 6), radial(ctx, 12.5, 8.5, 7, [[0, '#f0a6ff'], [1, '#9a1fd6']]), '#4a1a66', 1);
    shape(ctx, () => ellipsePath(ctx, 14, 10, 1.6, 3.6), '#140a1f', null);
    shape(ctx, () => circlePath(ctx, 16.2, 7.8, 1.4), '#ffffff', null);
  });

  canvasTexture(scene, TEXTURES.SPARKLE, 8, 8, (ctx) => {
    ctx.fillStyle = radial(ctx, 4, 4, 4, [[0, 'rgba(255,255,255,1)'], [1, 'rgba(255,255,255,0)']]);
    ctx.fillRect(0, 0, 8, 8);
    shape(ctx, () => starPath(ctx, 4, 4, 4, 1, 4), '#ffffff', null);
  });
}

// =============================================================================
// Decoração
// =============================================================================

const LEAF = { outline: '#1f4a1c', dark: '#2f7d32', mid: '#4aa83c', light: '#8fd85a' };

function createDecorationTextures(scene: Phaser.Scene): void {
  canvasTexture(scene, TEXTURES.DECO_TREE, 128, 176, (ctx) => {
    // tronco com raízes
    shape(
      ctx,
      () => {
        ctx.moveTo(54, 80);
        ctx.lineTo(74, 80);
        ctx.quadraticCurveTo(72, 140, 82, 170);
        ctx.quadraticCurveTo(90, 174, 96, 175);
        ctx.lineTo(32, 175);
        ctx.quadraticCurveTo(40, 174, 46, 170);
        ctx.quadraticCurveTo(56, 140, 54, 80);
        ctx.closePath();
      },
      linear(ctx, 46, 0, 82, 0, [[0, '#9a6538'], [0.6, '#7a4a26'], [1, '#55321a']]),
      '#2e1a0c',
      2,
    );
    line(ctx, [[60, 100], [62, 130], [60, 155]], 'rgba(40,20,8,0.5)', 1.5);
    line(ctx, [[68, 95], [67, 120]], 'rgba(40,20,8,0.5)', 1.5);
    // copa
    foliage(
      ctx,
      [
        [64, 46, 34],
        [34, 66, 26],
        [94, 66, 26],
        [50, 88, 22],
        [80, 88, 22],
        [64, 22, 22],
        [40, 36, 20],
        [88, 38, 20],
      ],
      LEAF,
      2.5,
    );
    // frutinhas/flores na copa
    [[44, 52], [86, 60], [62, 76], [74, 30]].forEach(([x, y]) => shape(ctx, () => circlePath(ctx, x, y, 2.6), '#ff7a8a', '#7a1f2a', 1));
  });

  canvasTexture(scene, TEXTURES.DECO_BUSH, 72, 40, (ctx) => {
    foliage(
      ctx,
      [
        [16, 26, 13],
        [34, 20, 17],
        [54, 25, 14],
        [26, 31, 9],
        [46, 31, 9],
      ],
      { outline: '#1f4a1c', dark: '#2f8a3a', mid: '#4fb248', light: '#9be36a' },
      2,
    );
    ctx.fillStyle = '#2f8a3a';
    ctx.fillRect(6, 30, 60, 10);
    ctx.fillStyle = '#1f4a1c';
    ctx.fillRect(4, 38, 64, 2);
  });

  // Pétalas brancas: a cor vem do tint aplicado na cena.
  canvasTexture(scene, TEXTURES.DECO_FLOWER, 12, 18, (ctx) => {
    line(ctx, [[6, 9], [6, 17.5]], '#2f7d32', 1.6);
    shape(ctx, () => ellipsePath(ctx, 8.5, 14, 2.2, 1), '#4aa83c', null);
    [[3, 6], [9, 6], [6, 3], [6, 9]].forEach(([x, y]) => shape(ctx, () => circlePath(ctx, x, y, 2.6), '#ffffff', 'rgba(60,30,60,0.7)', 0.8));
    shape(ctx, () => circlePath(ctx, 6, 6, 1.8), '#ffd34d', null);
  });

  canvasTexture(scene, TEXTURES.DECO_MUSHROOM, 18, 18, (ctx) => {
    shape(ctx, () => roundRectPath(ctx, 6.5, 8.5, 5, 9, 2), '#fff1dc', OUTLINE, 1);
    shape(ctx, () => {
      ctx.moveTo(1, 10);
      ctx.bezierCurveTo(1, 1, 17, 1, 17, 10);
      ctx.quadraticCurveTo(9, 12, 1, 10);
      ctx.closePath();
    }, radial(ctx, 6, 4, 10, [[0, '#d9a6ff'], [1, '#8a45d6']]), OUTLINE, 1.2);
    [[5, 6.5], [11.5, 4.5], [13, 8]].forEach(([x, y]) => shape(ctx, () => circlePath(ctx, x, y, 1.3), '#ffffff', null));
  });

  canvasTexture(scene, TEXTURES.DECO_ROCK, 40, 24, (ctx) => {
    shape(ctx, () => {
      ctx.moveTo(2, 23);
      ctx.quadraticCurveTo(3, 8, 16, 6);
      ctx.quadraticCurveTo(32, 3, 38, 23);
      ctx.closePath();
    }, linear(ctx, 0, 4, 0, 24, [[0, '#b9bfd0'], [1, '#727a90']]), '#3f4458', 1.6);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ellipsePath(ctx, 15, 10, 6, 2);
    ctx.fill();
    ctx.fillStyle = '#6dbb3c';
    [[12, 7, 5], [20, 5.5, 4]].forEach(([x, y, r]) => {
      ctx.beginPath();
      ellipsePath(ctx, x, y, r, 2);
      ctx.fill();
    });
  });

  // Tufo de grama (espalhado automaticamente sobre o chão).
  canvasTexture(scene, TEXTURES.DECO_TUFT, 16, 12, (ctx) => {
    const blades: [number, number, number][] = [[3, 4, -2], [6, 1, -1], [8, 0, 0.5], [10, 2, 1.5], [13, 5, 2.5]];
    blades.forEach(([x, top, lean]) =>
      shape(ctx, () => polygonPath(ctx, [[x - 1.6, 12], [x + 1.6, 12], [x + lean, top]]), linear(ctx, 0, 0, 0, 12, [[0, '#a6ec5c'], [1, '#3f8f2a']]), '#2c5e18', 0.8),
    );
  });
}

// =============================================================================
// Fundos (repetem na horizontal: cada elemento é desenhado também deslocado de ±largura)
// =============================================================================

function wrapX(width: number, x: number, draw: (x: number) => void): void {
  draw(x);
  draw(x - width);
  draw(x + width);
}

function treeRow(ctx: Ctx, width: number, opts: { seed: number; count: number; baseY: number; minR: number; maxR: number; trunk: string; colors: { dark: string; mid: string; light: string }; groundY: number }): void {
  const rnd = seeded(opts.seed);
  const trees = Array.from({ length: opts.count }, (_, i) => ({
    x: (i + rnd() * 0.6) * (width / opts.count),
    r: opts.minR + rnd() * (opts.maxR - opts.minR),
    lift: rnd() * 40,
  }));

  ctx.fillStyle = opts.trunk;
  trees.forEach((t) => wrapX(width, t.x, (x) => ctx.fillRect(x - t.r * 0.12, opts.baseY - t.lift, t.r * 0.24, opts.groundY)));

  trees.forEach((t) =>
    wrapX(width, t.x, (x) => {
      const y = opts.baseY - t.lift;
      foliage(
        ctx,
        [
          [x, y - t.r * 0.6, t.r],
          [x - t.r * 0.7, y, t.r * 0.75],
          [x + t.r * 0.7, y, t.r * 0.75],
        ],
        { outline: null, ...opts.colors },
      );
    }),
  );
  ctx.fillStyle = opts.colors.dark;
  ctx.fillRect(0, opts.groundY, width, 1000);
}

function createBackgroundTextures(scene: Phaser.Scene): void {
  const W = 512;

  canvasTexture(scene, TEXTURES.BG_TREES_FAR, W, 320, (ctx) =>
    treeRow(ctx, W, {
      seed: 11,
      count: 9,
      baseY: 140,
      minR: 34,
      maxR: 52,
      trunk: '#7fb9a3',
      colors: { dark: '#8cc6b0', mid: '#9fd4bd', light: '#bfe6d3' },
      groundY: 170,
    }),
  );

  canvasTexture(scene, TEXTURES.BG_TREES_MID, W, 360, (ctx) =>
    treeRow(ctx, W, {
      seed: 23,
      count: 7,
      baseY: 150,
      minR: 40,
      maxR: 62,
      trunk: '#3d6e4f',
      colors: { dark: '#2f8350', mid: '#45a262', light: '#74c886' },
      groundY: 200,
    }),
  );

  canvasTexture(scene, TEXTURES.BG_TREES_NEAR, W, 240, (ctx) => {
    const rnd = seeded(41);
    for (let i = 0; i < 14; i++) {
      const x = (i + rnd() * 0.5) * (W / 14);
      const r = 26 + rnd() * 22;
      wrapX(W, x, (xx) => foliage(ctx, [[xx, 90 - rnd() * 10, r], [xx + r * 0.8, 100, r * 0.7]], { outline: null, dark: '#25683a', mid: '#2f7d45', light: '#4f9e5a' }));
    }
    ctx.fillStyle = '#25683a';
    ctx.fillRect(0, 105, W, 200);
  });

  canvasTexture(scene, TEXTURES.BG_CASTLE, 240, 280, (ctx) => {
    const wall = linear(ctx, 0, 60, 0, 280, [[0, '#9db3e0'], [1, '#7389c2']]);
    const roof = linear(ctx, 0, 0, 0, 120, [[0, '#7f8fd8'], [1, '#5a69b8']]);
    const tower = (x: number, y: number, w: number) => {
      shape(ctx, () => ctx.rect(x, y, w, 280 - y), wall, '#56679e', 1.5);
      shape(ctx, () => polygonPath(ctx, [[x - 6, y + 1], [x + w + 6, y + 1], [x + w / 2, y - w * 1.3]]), roof, '#4a5794', 1.5);
      shape(ctx, () => roundRectPath(ctx, x + w / 2 - 3, y + 18, 6, 10, 3), '#ffe9a8', null);
      line(ctx, [[x + w / 2, y - w * 1.3], [x + w / 2, y - w * 1.3 - 14]], '#4a5794', 1.5);
      shape(ctx, () => polygonPath(ctx, [[x + w / 2, y - w * 1.3 - 14], [x + w / 2 + 10, y - w * 1.3 - 10], [x + w / 2, y - w * 1.3 - 6]]), '#ff8a8a', null);
    };
    shape(ctx, () => ctx.rect(40, 150, 160, 130), wall, '#56679e', 1.5);
    for (let x = 40; x < 200; x += 16) shape(ctx, () => ctx.rect(x, 142, 9, 9), wall, '#56679e', 1);
    tower(18, 120, 34);
    tower(188, 120, 34);
    tower(98, 70, 44);
    tower(66, 130, 26);
    tower(148, 130, 26);
    shape(ctx, () => roundRectPath(ctx, 106, 220, 28, 60, 14), '#4a5794', null);
  });

  // Fundo da caverna: rochas escuras que se repetem nos dois eixos.
  canvasTexture(scene, TEXTURES.BG_CAVE, 64, 64, (ctx) => {
    ctx.fillStyle = '#2a2140';
    ctx.fillRect(0, 0, 64, 64);
    const rocks: [number, number, number, number][] = [[14, 14, 11, 8], [44, 20, 13, 9], [24, 44, 14, 9], [54, 52, 8, 6], [6, 56, 6, 5]];
    rocks.forEach(([x, y, rx, ry]) => shape(ctx, () => ellipsePath(ctx, x, y, rx, ry), linear(ctx, 0, y - ry, 0, y + ry, [[0, '#3b2f58'], [1, '#2f2547']]), '#1e1730', 1.5));
  });
}

// =============================================================================
// UI
// =============================================================================

function createUiTextures(scene: Phaser.Scene): void {
  const heart = (key: string, full: boolean) =>
    canvasTexture(scene, key, 18, 16, (ctx) => {
      shape(
        ctx,
        () => {
          ctx.moveTo(9, 15);
          ctx.bezierCurveTo(-3, 7, 2, -1.5, 9, 4);
          ctx.bezierCurveTo(16, -1.5, 21, 7, 9, 15);
          ctx.closePath();
        },
        full ? radial(ctx, 6, 5, 11, [[0, '#ff9aa8'], [0.5, '#ff4d6d'], [1, '#c41f45']]) : '#4a3a5a',
        OUTLINE,
        1.4,
      );
      if (full) shape(ctx, () => ellipsePath(ctx, 5.5, 5, 1.8, 1.2), 'rgba(255,255,255,0.85)', null);
    });
  heart(TEXTURES.HEART_FULL, true);
  heart(TEXTURES.HEART_EMPTY, false);

  // Cadeado das fases bloqueadas no mapa.
  canvasTexture(scene, TEXTURES.LOCK, 28, 32, (ctx) => {
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = OUTLINE;
    ctx.beginPath();
    ctx.arc(14, 13, 7.5, Math.PI, 0);
    ctx.lineTo(21.5, 15);
    ctx.moveTo(6.5, 13);
    ctx.lineTo(6.5, 15);
    ctx.stroke();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#c9ccd8';
    ctx.stroke();
    shape(ctx, () => roundRectPath(ctx, 2, 14, 24, 16, 4), linear(ctx, 0, 14, 0, 30, [[0, '#ffe58a'], [1, '#c88a1e']]), OUTLINE, 1.6);
    shape(ctx, () => circlePath(ctx, 14, 20.5, 2.6), '#3a2410', null);
    shape(ctx, () => roundRectPath(ctx, 12.8, 21, 2.4, 5, 1), '#3a2410', null);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(5, 16.5, 12, 1.6);
  });
}

export function createPlaceholderTextures(scene: Phaser.Scene): void {
  createPlayerTextures(scene);
  createEnemyTextures(scene);
  createTerrainTextures(scene);
  createObjectTextures(scene);
  createItemTextures(scene);
  createDecorationTextures(scene);
  createBackgroundTextures(scene);
  createUiTextures(scene);
  createSwampTextures(scene);
  createTowerTextures(scene);
  createCastleTextures(scene);
}
