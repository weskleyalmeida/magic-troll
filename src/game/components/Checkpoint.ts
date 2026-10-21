import Phaser from 'phaser';
import { TEXTURES } from '../config/assetKeys';
import { DEPTH } from '../config/constants';
import type { BaseLevelScene } from '../scenes/BaseLevelScene';

/** Bandeira que salva o ponto de respawn ao ser tocada. */
export class Checkpoint extends Phaser.Physics.Arcade.Image {
  private activated = false;

  constructor(level: BaseLevelScene, x: number, groundY: number) {
    super(level, x, groundY, TEXTURES.CHECKPOINT_OFF);
    this.setOrigin(0.5, 1).setDepth(DEPTH.DECOR);
    level.add.existing(this);
    level.physics.add.existing(this, true);
    level.physics.add.overlap(level.player, this, () => this.activate(level));
  }

  private activate(level: BaseLevelScene): void {
    if (this.activated || level.player.isDead) return;
    this.activated = true;
    this.setTexture(TEXTURES.CHECKPOINT_ON);
    level.tweens.add({ targets: this, scaleY: 1.2, scaleX: 0.85, duration: 120, yoyo: true });
    level.spawnSparkles(this.x + 8, this.y - 40, 0x5cff9d, 10);
    level.setCheckpoint(this.x, this.y - 24);
  }
}
