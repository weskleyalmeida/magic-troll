import Phaser from 'phaser';
import { TEXTURES } from '../config/assetKeys';
import { DEPTH } from '../config/constants';

/**
 * Peixe que salta da água em intervalos regulares. Não pode ser pisado (barbatana com espinhos).
 * PISTA: bolhas sobem na superfície um pouco antes de cada salto.
 */
export class Fish extends Phaser.Physics.Arcade.Sprite {
  private jumping = false;
  private readonly homeY: number;
  private readonly surfaceY: number;

  constructor(scene: Phaser.Scene, x: number, surfaceY: number, intervalMs: number, firstDelayMs: number) {
    super(scene, x, surfaceY + 30, TEXTURES.ENEMY_FISH);
    this.surfaceY = surfaceY;
    this.homeY = surfaceY + 30;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    // Hitbox quadrada: o desenho gira durante o salto, o corpo não.
    this.arcadeBody.setSize(16, 16).setOffset(8, 2).setAllowGravity(false);
    this.setDepth(DEPTH.ENEMIES).setVisible(false);

    scene.time.delayedCall(firstDelayMs, () => {
      this.prepareJump();
      scene.time.addEvent({ delay: intervalMs, loop: true, callback: () => this.prepareJump() });
    });
  }

  get arcadeBody(): Phaser.Physics.Arcade.Body {
    return this.body as Phaser.Physics.Arcade.Body;
  }

  /** Só machuca enquanto está fora da água. */
  get isDangerous(): boolean {
    return this.jumping;
  }

  protected preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (!this.jumping) return;

    const vy = this.arcadeBody.velocity.y;
    this.setAngle(vy < 0 ? -90 : 90);
    if (vy > 0 && this.y >= this.homeY) {
      this.jumping = false;
      this.arcadeBody.setAllowGravity(false).setVelocity(0, 0);
      this.setVisible(false);
    }
  }

  private prepareJump(): void {
    if (this.jumping) return;
    for (let i = 0; i < 3; i++) {
      const bubble = this.scene.add
        .circle(this.x + Phaser.Math.Between(-8, 8), this.surfaceY + 6, Phaser.Math.Between(3, 5), 0xe0f7ff, 0.9)
        .setDepth(DEPTH.FOREGROUND + 1);
      this.scene.tweens.add({
        targets: bubble,
        y: bubble.y - 14,
        alpha: 0,
        delay: i * 160,
        duration: 450,
        onComplete: () => bubble.destroy(),
      });
    }
    this.scene.time.delayedCall(700, () => this.jump());
  }

  private jump(): void {
    this.jumping = true;
    this.arcadeBody.reset(this.x, this.homeY);
    this.arcadeBody.setAllowGravity(true).setVelocityY(-680);
    this.setVisible(true);
  }
}
