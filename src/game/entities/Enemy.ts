import Phaser from 'phaser';
import { ANIMS, SFX, TEXTURES } from '../config/assetKeys';
import { DEPTH, TILE, UI_FONT } from '../config/constants';
import { AudioManager } from '../systems/AudioManager';

export interface EnemyOptions {
  speed?: number;
  /** Começa parado, parecendo decoração. Acorda quando o alvo chega perto. */
  sleeping?: boolean;
  /** Alvo para acordar/perseguir (normalmente o player). */
  target?: { x: number; y: number };
  wakeRange?: number;
  chaseSpeed?: number;
}

/** Distância em que um inimigo acordado passa a ir na direção do alvo. */
const CHASE_RANGE = 6 * TILE;

/**
 * Inimigo que patrulha entre minX e maxX (e vira ao bater em paredes).
 * Pode ser derrotado pulando em cima. Variante "dormindo": acorda e persegue.
 */
export class Enemy extends Phaser.Physics.Arcade.Sprite {
  private direction = -1;
  private alive = true;
  private sleeping: boolean;
  private chasing = false;
  private speed: number;
  private zTimer?: Phaser.Time.TimerEvent;
  private readonly minX: number;
  private readonly maxX: number;
  private readonly options: EnemyOptions;

  constructor(scene: Phaser.Scene, x: number, y: number, minX: number, maxX: number, options: EnemyOptions = {}) {
    super(scene, x, y, options.sleeping ? TEXTURES.ENEMY_MUSHROOM_SLEEP : TEXTURES.ENEMY_MUSHROOM_0);
    this.minX = minX;
    this.maxX = maxX;
    this.options = options;
    this.speed = options.speed ?? 55;
    this.sleeping = options.sleeping ?? false;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.arcadeBody.setSize(22, 18).setOffset(3, 8);
    this.setDepth(DEPTH.ENEMIES);

    if (this.sleeping) {
      // PISTA: "z" saindo de vez em quando. Parece enfeite... mas está dormindo.
      this.zTimer = scene.time.addEvent({ delay: 1400, loop: true, callback: () => this.floatText('z', '#c9b8ff', 14) });
    } else {
      this.play(ANIMS.ENEMY_MUSHROOM_WALK);
    }
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

    const body = this.arcadeBody;
    const target = this.options.target;
    const near = (range: number) =>
      !!target && Math.abs(target.x - this.x) < range && Math.abs(target.y - this.y) < 2 * TILE;

    if (this.sleeping) {
      body.setVelocityX(0);
      if (near(this.options.wakeRange ?? 3 * TILE)) this.wakeUp();
      return;
    }

    if (this.chasing && target && near(CHASE_RANGE)) {
      this.direction = target.x < this.x ? -1 : 1;
    }
    if (this.x <= this.minX || body.blocked.left) this.direction = 1;
    else if (this.x >= this.maxX || body.blocked.right) this.direction = -1;

    body.setVelocityX(this.direction * this.speed);
    this.setFlipX(this.direction > 0);
  }

  squash(): void {
    this.alive = false;
    this.zTimer?.remove();
    this.arcadeBody.enable = false;
    this.anims.stop();
    this.setTexture(TEXTURES.ENEMY_MUSHROOM_SQUASHED);
    AudioManager.playSfx(this.scene, SFX.STOMP);
    this.scene.tweens.add({ targets: this, alpha: 0, delay: 400, duration: 300, onComplete: () => this.destroy() });
  }

  private wakeUp(): void {
    this.sleeping = false;
    this.chasing = true;
    this.zTimer?.remove();
    this.speed = this.options.chaseSpeed ?? 115;
    this.play(ANIMS.ENEMY_MUSHROOM_WALK);
    this.arcadeBody.setVelocityY(-220);
    AudioManager.playSfx(this.scene, SFX.ENEMY_ALERT);
    this.floatText('!', '#ff6b6b', 22);
  }

  private floatText(text: string, color: string, size: number): void {
    const label = this.scene.add
      .text(this.x + 6, this.y - 18, text, {
        fontFamily: UI_FONT,
        fontSize: `${size}px`,
        fontStyle: 'bold',
        color,
        stroke: '#2b1a4a',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.WORLD_UI);
    this.scene.tweens.add({
      targets: label,
      y: label.y - 22,
      x: label.x + 6,
      alpha: 0,
      duration: 1100,
      onComplete: () => label.destroy(),
    });
  }
}
