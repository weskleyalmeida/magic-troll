import Phaser from 'phaser';
import { DEPTH } from '../config/constants';
import type { BaseLevelScene } from '../scenes/BaseLevelScene';

/** Cor das ilusões (faíscas, brilho): o jogador aprende a associar roxo a "mentira". */
export const ILLUSION_COLOR = 0xc77dff;

/**
 * Plataforma ILUSÓRIA: parece real, mas não tem colisão.
 * PISTA: de tempos em tempos ela treme e solta faíscas roxas.
 */
export class IllusoryPlatform {
  private revealed = false;

  constructor(level: BaseLevelScene, x: number, y: number, width: number, texture: string) {
    const visual = level.add.tileSprite(x, y, width, 16, texture).setOrigin(0).setTilePosition(x, 0).setDepth(DEPTH.TILES);

    level.time.addEvent({
      delay: 2000,
      startAt: Phaser.Math.Between(0, 1800),
      loop: true,
      callback: () => {
        if (this.revealed) return;
        level.tweens.add({ targets: visual, x: x + 1.5, alpha: 0.6, duration: 60, yoyo: true, repeat: 2, onComplete: () => visual.setX(x) });
        level.spawnSparkles(x + Math.random() * width, y + 4, ILLUSION_COLOR, 2);
      },
    });

    const zone = level.add.zone(x + width / 2, y + 8, width, 16);
    level.physics.add.existing(zone, true);
    level.physics.add.overlap(level.player, zone, () => {
      if (this.revealed) return;
      this.revealed = true;
      level.tweens.add({ targets: visual, alpha: 0.15, duration: 250 });
      level.revealIllusion(x + width / 2, y + 8);
    });
  }
}

/**
 * Plataforma INVISÍVEL: existe, mas não aparece até alguém pisar.
 * PISTA: vagalumes pousados exatamente em cima dela.
 */
export class InvisiblePlatform {
  private revealed = false;

  constructor(level: BaseLevelScene, x: number, y: number, width: number, texture: string) {
    const visual = level.add
      .tileSprite(x, y, width, 16, texture)
      .setOrigin(0)
      .setTilePosition(x, 0)
      .setTint(0xd9b8ff)
      .setAlpha(0)
      .setDepth(DEPTH.TILES);

    const zone = level.add.zone(x + width / 2, y + 8, width, 16);
    level.physics.add.existing(zone, true);
    const body = zone.body as Phaser.Physics.Arcade.StaticBody;
    level.physics.add.collider(
      level.player,
      zone,
      () => {
        if (this.revealed) return;
        this.revealed = true;
        level.tweens.add({ targets: visual, alpha: 0.6, duration: 300 });
        level.spawnSparkles(x + width / 2, y, 0xfff3a0, 8);
      },
      () => level.canLandOnOneWay(body),
    );

    for (let i = 0; i < Math.max(1, Math.round(width / 32)); i++) {
      const mx = x + 16 + i * 32;
      const glow = level.add.circle(mx, y - 8, 6, 0xfff3a0, 0.3).setDepth(DEPTH.DECOR).setBlendMode(Phaser.BlendModes.ADD);
      const dot = level.add.circle(mx, y - 8, 1.8, 0xfffbe0, 1).setDepth(DEPTH.DECOR);
      level.tweens.add({ targets: [glow, dot], y: y - 16, duration: 900 + i * 150, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }
}

/**
 * Plataforma FANTASMA: aparece e some num ritmo fixo.
 * PISTA: pisca rapidamente pouco antes de sumir.
 */
export class PhasePlatform {
  private readonly visual: Phaser.GameObjects.TileSprite;
  private readonly body: Phaser.Physics.Arcade.StaticBody;

  constructor(level: BaseLevelScene, x: number, y: number, width: number, texture: string, periodMs: number, offsetMs: number) {
    this.visual = level.add
      .tileSprite(x, y, width, 16, texture)
      .setOrigin(0)
      .setTilePosition(x, 0)
      .setTint(0xa8ecff)
      .setDepth(DEPTH.TILES);
    const zone = level.add.zone(x + width / 2, y + 8, width, 16);
    level.physics.add.existing(zone, true);
    this.body = zone.body as Phaser.Physics.Arcade.StaticBody;
    level.physics.add.collider(level.player, zone, undefined, () => level.canLandOnOneWay(this.body));

    const visibleMs = periodMs * 0.62;
    const cycle = () => {
      this.setSolid(true);
      level.time.delayedCall(visibleMs - 520, () =>
        level.tweens.add({ targets: this.visual, alpha: 0.35, duration: 65, yoyo: true, repeat: 3 }),
      );
      level.time.delayedCall(visibleMs, () => this.setSolid(false));
    };
    level.time.delayedCall(offsetMs, () => {
      cycle();
      level.time.addEvent({ delay: periodMs, loop: true, callback: cycle });
    });
    this.setSolid(false);
  }

  private setSolid(solid: boolean): void {
    this.body.enable = solid;
    this.visual.setAlpha(solid ? 1 : 0.12);
  }
}
