import Phaser from 'phaser';
import { SFX, TEXTURES } from '../config/assetKeys';
import { DEPTH } from '../config/constants';
import { AudioManager } from '../systems/AudioManager';
import type { BaseLevelScene } from '../scenes/BaseLevelScene';

export class Coin extends Phaser.Physics.Arcade.Image {
  private collected = false;

  constructor(level: BaseLevelScene, x: number, y: number) {
    super(level, x, y, TEXTURES.COIN);
    level.add.existing(this);
    level.physics.add.existing(this, true);
    this.setDepth(DEPTH.ITEMS);
    level.registerCoin();

    // "Gira" achatando no eixo X (não mexe na hitbox estática).
    level.tweens.add({ targets: this, scaleX: 0.25, duration: 450, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    level.physics.add.overlap(level.player, this, () => this.collect(level));
  }

  private collect(level: BaseLevelScene): void {
    if (this.collected || level.player.isDead) return;
    this.collected = true;
    (this.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    level.addCoins(1);
    AudioManager.playSfx(level, SFX.COIN);
    level.tweens.killTweensOf(this);
    level.tweens.add({
      targets: this,
      y: this.y - 24,
      alpha: 0,
      scaleX: 1,
      duration: 250,
      onComplete: () => this.destroy(),
    });
  }
}
