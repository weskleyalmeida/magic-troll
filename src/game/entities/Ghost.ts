import Phaser from 'phaser';
import { TEXTURES } from '../config/assetKeys';
import { DEPTH, TILE } from '../config/constants';
import type { Player } from './Player';

/**
 * Fantasma tímido: só avança quando o jogador está DE COSTAS para ele.
 * Quando é encarado, para e cobre o rosto (a pista de como lidar com ele).
 * Atravessa paredes e não pode ser pisado (é um fantasma!).
 */
export class Ghost extends Phaser.Physics.Arcade.Sprite {
  private readonly homeX: number;
  private readonly homeY: number;
  private shy = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly target: Player,
    private readonly leash = 7 * TILE,
    private readonly speed = 62,
  ) {
    super(scene, x, y, TEXTURES.ENEMY_GHOST);
    this.homeX = x;
    this.homeY = y;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.arcadeBody.setAllowGravity(false).setSize(18, 18).setOffset(5, 5);
    this.setDepth(DEPTH.ENEMIES).setAlpha(0.85);
  }

  get arcadeBody(): Phaser.Physics.Arcade.Body {
    return this.body as Phaser.Physics.Arcade.Body;
  }

  protected preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    const player = this.target;
    const toPlayer = new Phaser.Math.Vector2(player.x - this.x, player.y - 6 - this.y);
    const fromHome = Phaser.Math.Distance.Between(this.x, this.y, this.homeX, this.homeY);
    const playerNearHome = Phaser.Math.Distance.Between(player.x, player.y, this.homeX, this.homeY) < this.leash;

    // O jogador olha para a direita quando flipX = false.
    const beingWatched = player.flipX ? this.x < player.x : this.x > player.x;

    if (!player.isDead && playerNearHome && beingWatched && toPlayer.length() < 9 * TILE) {
      this.setShy(true);
      this.arcadeBody.setVelocity(0, 0);
    } else if (!player.isDead && playerNearHome) {
      this.setShy(false);
      toPlayer.normalize().scale(this.speed);
      this.arcadeBody.setVelocity(toPlayer.x, toPlayer.y);
    } else if (fromHome > 4) {
      this.setShy(false);
      const toHome = new Phaser.Math.Vector2(this.homeX - this.x, this.homeY - this.y).normalize().scale(this.speed * 0.7);
      this.arcadeBody.setVelocity(toHome.x, toHome.y);
    } else {
      this.arcadeBody.setVelocity(0, 0);
    }

    // flutuar
    this.y += Math.sin(time / 280) * 0.25;
    if (Math.abs(this.arcadeBody.velocity.x) > 1) this.setFlipX(this.arcadeBody.velocity.x < 0);
  }

  private setShy(shy: boolean): void {
    if (shy === this.shy) return;
    this.shy = shy;
    this.setTexture(shy ? TEXTURES.ENEMY_GHOST_SHY : TEXTURES.ENEMY_GHOST);
    this.setAlpha(shy ? 0.55 : 0.85);
  }
}
