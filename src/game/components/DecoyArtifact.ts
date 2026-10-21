import Phaser from 'phaser';
import { ARTIFACTS, type ArtifactId } from '../config/artifacts';
import { DEPTH } from '../config/constants';
import type { BaseLevelScene } from '../scenes/BaseLevelScene';
import { ILLUSION_COLOR } from './Illusion';

/**
 * Artefato FALSO: idêntico ao verdadeiro... só que treme e solta faíscas roxas,
 * como toda ilusão da Fase 2 (a pista). Ao ser pego, chama `onCollect` — a fase
 * decide a trollagem e depois chama `vanish()`.
 */
export class DecoyArtifact extends Phaser.Physics.Arcade.Image {
  private collected = false;
  private readonly glow: Phaser.GameObjects.Arc;

  constructor(level: BaseLevelScene, x: number, y: number, id: ArtifactId, onCollect: () => void) {
    const info = ARTIFACTS[id];
    super(level, x, y, info.texture);
    level.add.existing(this);
    level.physics.add.existing(this, true);
    this.setDepth(DEPTH.ITEMS);

    this.glow = level.add.circle(x, y, 22, info.glowColor, 0.35).setDepth(DEPTH.ITEMS - 1).setBlendMode(Phaser.BlendModes.ADD);
    level.tweens.add({ targets: this.glow, scale: 1.4, alpha: 0.15, duration: 800, yoyo: true, repeat: -1 });
    level.tweens.add({ targets: this, y: y - 6, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // PISTA: tremida de ilusão + faíscas roxas.
    level.time.addEvent({
      delay: 1600,
      loop: true,
      callback: () => {
        if (this.collected) return;
        level.tweens.add({ targets: this, x: x + 2, duration: 50, yoyo: true, repeat: 3, onComplete: () => this.setX(x) });
        level.spawnSparkles(x + Phaser.Math.Between(-12, 12), y + Phaser.Math.Between(-14, 14), ILLUSION_COLOR, 2);
      },
    });

    level.physics.add.overlap(level.player, this, () => {
      if (this.collected || level.player.isDead) return;
      this.collected = true;
      (this.body as Phaser.Physics.Arcade.StaticBody).enable = false;
      level.tweens.killTweensOf(this);
      this.glow.destroy();
      level.tweens.add({ targets: this, y: this.y - 40, scale: 1.8, duration: 500, ease: 'Back.easeOut' });
      onCollect();
    });
  }

  /** Desfaz a ilusão: tremedeira, faíscas roxas e some. */
  vanish(level: BaseLevelScene): void {
    level.tweens.add({
      targets: this,
      x: this.x + 3,
      duration: 40,
      yoyo: true,
      repeat: 6,
      onComplete: () => {
        level.spawnSparkles(this.x, this.y, ILLUSION_COLOR, 24);
        level.tweens.add({ targets: this, alpha: 0, scale: 0.2, duration: 350, onComplete: () => this.destroy() });
      },
    });
  }
}
