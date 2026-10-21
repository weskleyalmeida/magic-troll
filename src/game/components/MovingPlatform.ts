import Phaser from 'phaser';
import { DEPTH } from '../config/constants';
import type { BaseLevelScene } from '../scenes/BaseLevelScene';

/**
 * Plataforma que vai e volta (horizontal ou vertical). Move por velocidade, então o
 * Arcade carrega o jogador junto automaticamente (friction do corpo imóvel).
 */
export class MovingPlatform extends Phaser.GameObjects.TileSprite {
  private readonly startX: number;
  private readonly startY: number;
  private readonly direction: Phaser.Math.Vector2;
  private readonly distance: number;
  private readonly speed: number;
  private forward = true;

  constructor(level: BaseLevelScene, x: number, y: number, width: number, texture: string, dx: number, dy: number, speed: number) {
    super(level, x, y, width, 16, texture);
    this.startX = x;
    this.startY = y;
    this.distance = Math.hypot(dx, dy);
    this.direction = new Phaser.Math.Vector2(dx, dy).normalize();

    this.setOrigin(0).setDepth(DEPTH.TILES);
    level.add.existing(this);
    level.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false).setImmovable(true);
    body.setVelocity(this.direction.x * speed, this.direction.y * speed);
    this.speed = speed;

    level.physics.add.collider(level.player, this, undefined, () => level.canLandOnOneWay(body));
    level.events.on(Phaser.Scenes.Events.UPDATE, this.step, this);
    level.events.once(Phaser.Scenes.Events.SHUTDOWN, () => level.events.off(Phaser.Scenes.Events.UPDATE, this.step, this));
  }

  private step(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const travelled = Math.hypot(this.x - this.startX, this.y - this.startY);
    if (this.forward && travelled >= this.distance) this.forward = false;
    else if (!this.forward && (this.x - this.startX) * this.direction.x + (this.y - this.startY) * this.direction.y <= 0) this.forward = true;

    const sign = this.forward ? 1 : -1;
    body.setVelocity(this.direction.x * this.speed * sign, this.direction.y * this.speed * sign);
  }
}
