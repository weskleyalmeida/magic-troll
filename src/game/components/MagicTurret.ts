import Phaser from 'phaser';
import { SFX, TEXTURES } from '../config/assetKeys';
import { DEPTH } from '../config/constants';
import { AudioManager } from '../systems/AudioManager';
import type { BaseLevelScene } from '../scenes/BaseLevelScene';

/**
 * Runa na parede que dispara orbes mágicos na horizontal em intervalos fixos.
 * PISTA: a runa brilha meio segundo antes de cada disparo.
 */
export class MagicTurret {
  constructor(
    private readonly level: BaseLevelScene,
    private readonly x: number,
    private readonly y: number,
    private readonly direction: 1 | -1,
    intervalMs: number,
    offsetMs: number,
    private readonly speed = 170,
  ) {
    level.add.image(x, y, TEXTURES.RUNE).setDepth(DEPTH.DECOR);
    const glow = level.add.circle(x, y, 16, 0xe08aff, 0).setDepth(DEPTH.DECOR + 1).setBlendMode(Phaser.BlendModes.ADD);

    const cycle = () => {
      level.tweens.add({ targets: glow, alpha: 0.85, scale: 1.4, duration: 500, onComplete: () => {
        glow.setAlpha(0).setScale(1);
        this.fire();
      } });
    };
    level.time.delayedCall(offsetMs, () => {
      cycle();
      level.time.addEvent({ delay: intervalMs, loop: true, callback: cycle });
    });
  }

  private fire(): void {
    const level = this.level;
    AudioManager.playSfx(level, SFX.TRAP);
    const orb = level.physics.add.image(this.x + this.direction * 14, this.y, TEXTURES.ORB).setDepth(DEPTH.ENEMIES);
    const body = orb.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false).setCircle(5, 3, 3).setVelocityX(this.direction * this.speed);
    level.tweens.add({ targets: orb, scale: 1.25, duration: 200, yoyo: true, repeat: -1 });

    const pop = () => {
      if (!orb.active) return;
      level.spawnSparkles(orb.x, orb.y, 0xe08aff, 5);
      orb.destroy();
    };
    level.physics.add.overlap(level.player, orb, () => {
      level.hurtPlayer(orb.x);
      pop();
    });
    level.collideWithTerrain(orb, pop);
    level.time.delayedCall(7000, pop);
  }
}
