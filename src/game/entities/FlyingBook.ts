import Phaser from 'phaser';
import { ANIMS, SFX, TEXTURES } from '../config/assetKeys';
import { DEPTH } from '../config/constants';
import { AudioManager } from '../systems/AudioManager';

/** Livro voador que patrulha no ar entre minX e maxX. Pode ser pisado. */
export class FlyingBook extends Phaser.Physics.Arcade.Sprite {
  private alive = true;
  private direction = 1;
  private readonly baseY: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly minX: number,
    private readonly maxX: number,
    private readonly speed = 70,
  ) {
    super(scene, x, y, TEXTURES.FLYING_BOOK_0);
    this.baseY = y;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.arcadeBody.setAllowGravity(false).setSize(18, 12).setOffset(5, 7);
    this.setDepth(DEPTH.ENEMIES);
    this.play(ANIMS.FLYING_BOOK);
  }

  get arcadeBody(): Phaser.Physics.Arcade.Body {
    return this.body as Phaser.Physics.Arcade.Body;
  }

  get isAlive(): boolean {
    return this.alive;
  }

  protected preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (!this.alive) return;
    if (this.x <= this.minX) this.direction = 1;
    else if (this.x >= this.maxX) this.direction = -1;
    this.arcadeBody.setVelocityX(this.direction * this.speed);
    this.y = this.baseY + Math.sin(time / 320) * 8;
    this.setFlipX(this.direction < 0);
  }

  squash(): void {
    this.alive = false;
    this.arcadeBody.enable = false;
    this.anims.stop();
    AudioManager.playSfx(this.scene, SFX.STOMP);
    this.scene.tweens.add({ targets: this, y: this.y + 40, angle: 180, alpha: 0, duration: 500, onComplete: () => this.destroy() });
  }
}
