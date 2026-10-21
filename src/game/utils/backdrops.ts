import Phaser from 'phaser';
import { TEXTURES } from '../config/assetKeys';
import { DEPTH, GAME_HEIGHT, GAME_WIDTH } from '../config/constants';

/**
 * Fundos reutilizáveis (fases e menus). Tudo fica em DEPTH.BACKGROUND e é desenhado na
 * ordem de chamada. Camadas usam tileSprite com scrollFactor: parallax sem custo por frame.
 */

/** Camada que se repete na horizontal + cor sólida embaixo (cobre o rolar vertical). */
function addLayer(scene: Phaser.Scene, worldWidth: number, key: string, factor: number, y: number, fillColor: number): void {
  const height = (scene.textures.get(key).getSourceImage() as HTMLCanvasElement).height;
  const width = worldWidth * factor + GAME_WIDTH + 64;
  scene.add.tileSprite(0, y, width, height, key).setOrigin(0).setScrollFactor(factor).setDepth(DEPTH.BACKGROUND);
  scene.add
    .rectangle(0, y + height - 2, width, 900, fillColor)
    .setOrigin(0)
    .setScrollFactor(factor)
    .setDepth(DEPTH.BACKGROUND);
}

/** Faixa de neblina fixa na tela (transparente → branca → transparente). */
function addMist(scene: Phaser.Scene, centerY: number, height: number, alpha: number): void {
  const g = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH.BACKGROUND);
  g.fillGradientStyle(0xffffff, 0xffffff, 0xffffff, 0xffffff, 0, 0, alpha, alpha);
  g.fillRect(0, centerY - height / 2, GAME_WIDTH, height / 2);
  g.fillGradientStyle(0xffffff, 0xffffff, 0xffffff, 0xffffff, alpha, alpha, 0, 0);
  g.fillRect(0, centerY, GAME_WIDTH, height / 2);
}

export function addSky(scene: Phaser.Scene, top: number, bottom: number): void {
  const g = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH.BACKGROUND);
  g.fillGradientStyle(top, top, bottom, bottom, 1);
  g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
}

/** Sol suave e raios de luz atravessando a floresta. */
export function addSunRays(scene: Phaser.Scene, sunX = 780): void {
  scene.add
    .circle(sunX, 60, 70, 0xfff6c8, 0.18)
    .setScrollFactor(0)
    .setDepth(DEPTH.BACKGROUND)
    .setBlendMode(Phaser.BlendModes.ADD);
  scene.add
    .circle(sunX, 60, 34, 0xffffff, 0.3)
    .setScrollFactor(0)
    .setDepth(DEPTH.BACKGROUND)
    .setBlendMode(Phaser.BlendModes.ADD);

  const rays = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH.BACKGROUND).setBlendMode(Phaser.BlendModes.ADD);
  rays.fillStyle(0xfff8d8, 0.09);
  const fans: [number, number][] = [[-380, -280], [-200, -110], [-40, 40], [120, 200]];
  fans.forEach(([a, b]) =>
    rays.fillPoints([new Phaser.Math.Vector2(sunX, 40), new Phaser.Math.Vector2(sunX + a, GAME_HEIGHT), new Phaser.Math.Vector2(sunX + b, GAME_HEIGHT)], true),
  );
  scene.tweens.add({ targets: rays, alpha: 0.55, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
}

/** Floresta encantada completa: céu, sol, castelo distante, 3 camadas de árvores e neblina. */
export function addForestBackdrop(scene: Phaser.Scene, worldWidth: number, castleX = 720): void {
  addSky(scene, 0x8fd8ff, 0xe8fbe4);
  addSunRays(scene);

  scene.add
    .image(castleX, 285, TEXTURES.BG_CASTLE)
    .setOrigin(0.5, 1)
    .setScale(0.55)
    .setAlpha(0.8)
    .setScrollFactor(0.04)
    .setDepth(DEPTH.BACKGROUND);

  addLayer(scene, worldWidth, TEXTURES.BG_TREES_FAR, 0.12, 170, 0x9fd2bf);
  addMist(scene, 330, 140, 0.45);
  addLayer(scene, worldWidth, TEXTURES.BG_TREES_MID, 0.3, 230, 0x3f8a5a);
  addMist(scene, 410, 90, 0.18);
  addLayer(scene, worldWidth, TEXTURES.BG_TREES_NEAR, 0.55, 360, 0x25683a);
}

/** Pântano das Ilusões: anoitecer roxo, lua, estrelas, castelo e árvores retorcidas. */
export function addSwampBackdrop(scene: Phaser.Scene, worldWidth: number, castleX = 760): void {
  addSky(scene, 0x2b2558, 0x7fa392);

  const stars = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH.BACKGROUND);
  const rnd = new Phaser.Math.RandomDataGenerator(['stars']);
  for (let i = 0; i < 45; i++) {
    stars.fillStyle(0xffffff, rnd.realInRange(0.3, 0.9));
    stars.fillCircle(rnd.between(0, GAME_WIDTH), rnd.between(0, 200), rnd.realInRange(0.6, 1.6));
  }
  scene.tweens.add({ targets: stars, alpha: 0.6, duration: 1800, yoyo: true, repeat: -1 });

  // lua com halo
  scene.add.circle(170, 90, 70, 0xdfe6ff, 0.12).setScrollFactor(0).setDepth(DEPTH.BACKGROUND).setBlendMode(Phaser.BlendModes.ADD);
  scene.add.circle(170, 90, 36, 0xf4f1ff, 0.95).setScrollFactor(0).setDepth(DEPTH.BACKGROUND);
  scene.add.circle(158, 80, 7, 0xd6d2ef, 0.8).setScrollFactor(0).setDepth(DEPTH.BACKGROUND);
  scene.add.circle(182, 102, 5, 0xd6d2ef, 0.8).setScrollFactor(0).setDepth(DEPTH.BACKGROUND);

  scene.add
    .image(castleX, 270, TEXTURES.BG_CASTLE)
    .setOrigin(0.5, 1)
    .setScale(0.5)
    .setTint(0x8a86c8)
    .setAlpha(0.75)
    .setScrollFactor(0.04)
    .setDepth(DEPTH.BACKGROUND);

  addLayer(scene, worldWidth, TEXTURES.BG_SWAMP_FAR, 0.12, 150, 0x56679a);
  addMist(scene, 320, 150, 0.35);
  addLayer(scene, worldWidth, TEXTURES.BG_SWAMP_MID, 0.3, 200, 0x2f4a52);
  addMist(scene, 420, 110, 0.22);
  addLayer(scene, worldWidth, TEXTURES.BG_SWAMP_NEAR, 0.55, 340, 0x1d3530);
}

/**
 * Céu da torre: noite estrelada e o CASTELO grande no horizonte. Com scrollFactor baixo,
 * ele só aparece de verdade no topo (dentro da torre, o fundo de tijolos cobre o céu).
 */
export function addTowerSky(scene: Phaser.Scene): void {
  addSky(scene, 0x1a1640, 0x8a5a9a);

  const stars = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH.BACKGROUND);
  const rnd = new Phaser.Math.RandomDataGenerator(['tower-stars']);
  for (let i = 0; i < 70; i++) {
    stars.fillStyle(0xffffff, rnd.realInRange(0.3, 1));
    stars.fillCircle(rnd.between(0, GAME_WIDTH), rnd.between(0, 300), rnd.realInRange(0.6, 1.8));
  }
  scene.tweens.add({ targets: stars, alpha: 0.65, duration: 1600, yoyo: true, repeat: -1 });

  scene.add.circle(820, 80, 80, 0xfff1d6, 0.12).setScrollFactor(0).setDepth(DEPTH.BACKGROUND).setBlendMode(Phaser.BlendModes.ADD);
  scene.add.circle(820, 80, 38, 0xfff6e8, 0.95).setScrollFactor(0).setDepth(DEPTH.BACKGROUND);

  // montanhas + castelo (scrollFactor baixo: ficam "lá longe")
  const hills = scene.add.graphics().setScrollFactor(0.12).setDepth(DEPTH.BACKGROUND);
  hills.fillStyle(0x3a2a5a, 1);
  hills.fillPoints(
    [
      new Phaser.Math.Vector2(0, 600),
      new Phaser.Math.Vector2(0, 380),
      new Phaser.Math.Vector2(180, 330),
      new Phaser.Math.Vector2(330, 370),
      new Phaser.Math.Vector2(520, 340),
      new Phaser.Math.Vector2(720, 360),
      new Phaser.Math.Vector2(960, 320),
      new Phaser.Math.Vector2(960, 600),
    ],
    true,
  );
  scene.add.image(560, 362, TEXTURES.BG_CASTLE).setOrigin(0.5, 1).setScale(1.05).setScrollFactor(0.12).setDepth(DEPTH.BACKGROUND);
  hills.setDepth(DEPTH.BACKGROUND);
}

/**
 * Neblina na FRENTE do cenário (faixa fixa na parte de baixo da tela, rolando mais
 * rápido que o mundo). Retorna o tileSprite para a fase animar se quiser.
 */
export function addForegroundFog(scene: Phaser.Scene, worldWidth: number, alpha = 0.3): Phaser.GameObjects.TileSprite {
  return scene.add
    .tileSprite(0, GAME_HEIGHT - 120, worldWidth * 1.15 + GAME_WIDTH, 96, TEXTURES.FOG)
    .setOrigin(0)
    .setScrollFactor(1.15, 0)
    .setAlpha(alpha)
    .setDepth(DEPTH.FOREGROUND + 4);
}

/** Vagalumes/pólen mágico flutuando pelo mundo. */
export function addFireflies(scene: Phaser.Scene, worldWidth: number, worldHeight: number, count: number, color = 0xfff3a0): void {
  const rnd = new Phaser.Math.RandomDataGenerator(['fireflies']);
  for (let i = 0; i < count; i++) {
    const x = rnd.between(0, worldWidth);
    const y = rnd.between(60, worldHeight - 160);
    const glow = scene.add.circle(x, y, 6, color, 0.25).setDepth(DEPTH.DECOR_BACK).setBlendMode(Phaser.BlendModes.ADD);
    const dot = scene.add.circle(x, y, 1.8, 0xfffbe0, 0.95).setDepth(DEPTH.DECOR_BACK);
    scene.tweens.add({
      targets: [glow, dot],
      x: x + rnd.between(-40, 40),
      y: y + rnd.between(-30, 30),
      duration: rnd.between(2600, 4200),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    scene.tweens.add({ targets: [glow, dot], alpha: 0.2, duration: rnd.between(700, 1400), yoyo: true, repeat: -1 });
  }
}
