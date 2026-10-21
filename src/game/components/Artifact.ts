import Phaser from 'phaser';
import { ARTIFACTS, type ArtifactId } from '../config/artifacts';
import { DEPTH } from '../config/constants';
import type { BaseLevelScene } from '../scenes/BaseLevelScene';

/** Artefato principal da fase (Cristal, Chave, Olho). Brilha, flutua e solta faíscas. */
export class Artifact extends Phaser.Physics.Arcade.Image {
  readonly artifactId: ArtifactId;
  private collected = false;
  private readonly glow: Phaser.GameObjects.Arc;
  private readonly sparkleTimer: Phaser.Time.TimerEvent;

  /** `hidden`: invisível (sem brilho nem faíscas) — só um espelho revela onde está. */
  constructor(level: BaseLevelScene, x: number, y: number, id: ArtifactId, hidden = false) {
    const info = ARTIFACTS[id];
    super(level, x, y, info.texture);
    this.artifactId = id;

    level.add.existing(this);
    level.physics.add.existing(this, true);
    this.setDepth(DEPTH.ITEMS).setAlpha(hidden ? 0 : 1);

    this.glow = level.add
      .circle(x, y, 22, info.glowColor, 0.35)
      .setDepth(DEPTH.ITEMS - 1)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setVisible(!hidden);
    level.tweens.add({ targets: this.glow, scale: 1.4, alpha: 0.15, duration: 800, yoyo: true, repeat: -1 });
    level.tweens.add({ targets: this, y: y - 6, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.sparkleTimer = level.time.addEvent({
      delay: 350,
      loop: true,
      callback: () => {
        if (hidden) return;
        // Mesma camada do item: se ele estiver escondido atrás de algo, as faíscas também ficam.
        level.spawnSparkles(x + Phaser.Math.Between(-14, 14), y + Phaser.Math.Between(-16, 16), info.glowColor, 1, DEPTH.ITEMS);
      },
    });

    level.physics.add.overlap(level.player, this, () => this.collect(level));
  }

  private collect(level: BaseLevelScene): void {
    if (this.collected || level.player.isDead) return;
    this.collected = true;
    (this.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    this.sparkleTimer.remove();
    this.glow.destroy();
    level.tweens.killTweensOf(this);
    this.setAlpha(1);

    level.spawnSparkles(this.x, this.y, ARTIFACTS[this.artifactId].glowColor, 18);
    level.tweens.add({
      targets: this,
      y: this.y - 40,
      scale: 1.8,
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => level.tweens.add({ targets: this, alpha: 0, duration: 400, delay: 500, onComplete: () => this.destroy() }),
    });

    level.onArtifactCollected(this.artifactId);
  }
}
