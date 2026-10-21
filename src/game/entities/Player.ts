import Phaser from 'phaser';
import { ANIMS, SFX, TEXTURES } from '../config/assetKeys';
import { DEPTH, PLAYER } from '../config/constants';
import { AudioManager } from '../systems/AudioManager';
import type { InputState } from '../systems/InputController';

export type PlayerAnimState = 'idle' | 'walk' | 'run' | 'jump' | 'fall' | 'hurt' | 'celebrate';

/** Eventos emitidos pelo Player (a cena escuta e atualiza HUD, telas etc.). */
export const PLAYER_EVENTS = {
  HURT: 'player-hurt', // (health: number)
  DIED: 'player-died', // após a animação de morte
} as const;

const ANIM_BY_STATE: Record<PlayerAnimState, string> = {
  idle: ANIMS.PLAYER_IDLE,
  walk: ANIMS.PLAYER_WALK,
  run: ANIMS.PLAYER_RUN,
  jump: ANIMS.PLAYER_JUMP,
  fall: ANIMS.PLAYER_FALL,
  hurt: ANIMS.PLAYER_HURT,
  celebrate: ANIMS.PLAYER_CELEBRATE,
};

export class Player extends Phaser.Physics.Arcade.Sprite {
  private lastGroundedAt = -Infinity;
  private lastJumpPressedAt = -Infinity;
  private isJumping = false;
  private animState: PlayerAnimState = 'idle';

  private hp: number = PLAYER.maxHealth;
  private invulnerableUntil = 0;
  private controlLockedUntil = 0;
  /** Sem controle do jogador (comemoração, fim de fase, cutscenes). */
  private frozen = false;
  private celebrating = false;
  private dead = false;
  private blinkTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEXTURES.PLAYER_IDLE);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Hitbox menor que o desenho (chapéu e cajado não colidem): mais justo para o jogador.
    this.arcadeBody.setSize(16, 30).setOffset(8, 14);
    this.arcadeBody.setMaxVelocity(1000, PLAYER.maxFallSpeed);
    this.setCollideWorldBounds(true);
    this.setDepth(DEPTH.PLAYER);
    this.play(ANIMS.PLAYER_IDLE);
  }

  get arcadeBody(): Phaser.Physics.Arcade.Body {
    return this.body as Phaser.Physics.Arcade.Body;
  }

  get isOnGround(): boolean {
    return this.arcadeBody.blocked.down || this.arcadeBody.touching.down;
  }

  get health(): number {
    return this.hp;
  }

  get isDead(): boolean {
    return this.dead;
  }

  get isInvulnerable(): boolean {
    return this.scene.time.now < this.invulnerableUntil;
  }

  // ---------------------------------------------------------------------------
  // Movimento
  // ---------------------------------------------------------------------------

  updateMovement(input: InputState, time: number, delta: number): void {
    if (this.dead) return;

    const dt = delta / 1000;
    const body = this.arcadeBody;
    const onGround = this.isOnGround;

    if (onGround) {
      this.lastGroundedAt = time;
      if (body.velocity.y >= 0) this.isJumping = false;
    }

    // Durante o knockback o jogador não controla nada.
    if (time < this.controlLockedUntil) {
      this.updateAnimation(onGround, time);
      return;
    }

    // --- Horizontal ---
    const dir = this.frozen ? 0 : (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const control = onGround ? 1 : PLAYER.airControl;
    let vx = body.velocity.x;

    if (dir !== 0) {
      const turning = vx !== 0 && Math.sign(vx) !== dir;
      vx += dir * PLAYER.acceleration * control * (turning ? PLAYER.turnMultiplier : 1) * dt;
      vx = Phaser.Math.Clamp(vx, -PLAYER.maxSpeed, PLAYER.maxSpeed);
      this.setFlipX(dir < 0);
    } else {
      const decel = PLAYER.deceleration * control * dt;
      vx = Math.abs(vx) <= decel ? 0 : vx - Math.sign(vx) * decel;
    }
    body.setVelocityX(vx);

    if (!this.frozen) this.updateJump(input, time);
    this.updateAnimation(onGround, time);
  }

  private updateJump(input: InputState, time: number): void {
    const body = this.arcadeBody;
    if (input.jumpPressed) this.lastJumpPressedAt = time;

    // Buffer + coyote time.
    const jumpBuffered = time - this.lastJumpPressedAt <= PLAYER.jumpBufferMs;
    const canJump = time - this.lastGroundedAt <= PLAYER.coyoteTimeMs && !this.isJumping;

    if (jumpBuffered && canJump) {
      body.setVelocityY(PLAYER.jumpVelocity);
      this.isJumping = true;
      this.lastJumpPressedAt = -Infinity;
      this.lastGroundedAt = -Infinity;
      AudioManager.playSfx(this.scene, SFX.JUMP);
    }

    // Pulo variável: soltar o botão durante a subida corta o pulo.
    if (this.isJumping && !input.jump && body.velocity.y < 0) {
      body.setVelocityY(body.velocity.y * PLAYER.jumpCutMultiplier);
      this.isJumping = false;
    }
  }

  /** Quique ao pisar em um inimigo. Segurar o pulo mantém o quique alto. */
  bounce(): void {
    this.arcadeBody.setVelocityY(PLAYER.stompBounce);
    this.isJumping = true;
  }

  // ---------------------------------------------------------------------------
  // Vida
  // ---------------------------------------------------------------------------

  /**
   * Retorna true se o dano foi aplicado (false se invulnerável/morto).
   * `knockbackScale` < 1 para danos em lugares apertados (ex.: baú em cima de um pilar).
   */
  takeDamage(sourceX: number, knockbackScale = 1): boolean {
    if (this.dead || this.isInvulnerable) return false;

    this.hp = Math.max(0, this.hp - 1);
    this.emit(PLAYER_EVENTS.HURT, this.hp);

    if (this.hp === 0) {
      this.die();
      return true;
    }

    AudioManager.playSfx(this.scene, SFX.HURT);
    const now = this.scene.time.now;
    this.invulnerableUntil = now + PLAYER.invulnerableMs;
    this.controlLockedUntil = now + PLAYER.hurtLockMs;
    this.isJumping = false;

    const away = this.x < sourceX ? -1 : 1;
    this.arcadeBody.setVelocity(away * PLAYER.knockbackX * knockbackScale, PLAYER.knockbackY * Math.max(knockbackScale, 0.6));

    this.setTint(0xff8080);
    this.scene.time.delayedCall(PLAYER.hurtLockMs, () => {
      if (!this.dead) this.clearTint();
    });
    this.startBlink(PLAYER.invulnerableMs);
    return true;
  }

  private die(): void {
    this.dead = true;
    this.frozen = false;
    this.celebrating = false;
    this.stopBlink();
    this.setTint(0xff8080);
    this.animState = 'hurt';
    this.play(ANIMS.PLAYER_HURT);

    // Clássico: pula, gira e cai atravessando o chão.
    const body = this.arcadeBody;
    body.checkCollision.none = true;
    this.setCollideWorldBounds(false);
    body.setVelocity(0, -420);
    this.scene.tweens.add({ targets: this, angle: this.flipX ? -180 : 180, duration: 800 });

    AudioManager.playSfx(this.scene, SFX.DEATH);
    this.scene.time.delayedCall(1000, () => this.emit(PLAYER_EVENTS.DIED));
  }

  /** Volta à vida com vida cheia (usado em "Tentar novamente"). */
  revive(x: number, y: number): void {
    this.dead = false;
    this.hp = PLAYER.maxHealth;
    this.frozen = false;
    this.celebrating = false;
    this.controlLockedUntil = 0;
    this.arcadeBody.checkCollision.none = false;
    this.setCollideWorldBounds(true);
    this.setAngle(0);
    this.clearTint();
    this.respawn(x, y);
  }

  /** Reposiciona o jogador (queda, água, checkpoint) com breve invulnerabilidade. */
  respawn(x: number, y: number): void {
    this.arcadeBody.reset(x, y);
    this.isJumping = false;
    this.lastJumpPressedAt = -Infinity;
    this.invulnerableUntil = Math.max(this.invulnerableUntil, this.scene.time.now + 800);
    this.startBlink(800);
  }

  // ---------------------------------------------------------------------------
  // Cutscenes
  // ---------------------------------------------------------------------------

  celebrate(): void {
    this.frozen = true;
    this.celebrating = true;
    if (this.isOnGround) this.arcadeBody.setVelocityY(-280);
    AudioManager.playSfx(this.scene, SFX.COLLECT);
  }

  endCelebration(): void {
    this.celebrating = false;
    this.frozen = false;
  }

  freeze(): void {
    this.frozen = true;
  }

  // ---------------------------------------------------------------------------
  // Internos
  // ---------------------------------------------------------------------------

  private startBlink(durationMs: number): void {
    this.stopBlink();
    this.blinkTween = this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: Math.max(0, Math.floor(durationMs / 200) - 1),
      onComplete: () => this.setAlpha(1),
    });
  }

  private stopBlink(): void {
    this.blinkTween?.stop();
    this.blinkTween = undefined;
    this.setAlpha(1);
  }

  private updateAnimation(onGround: boolean, time: number): void {
    const { velocity } = this.arcadeBody;
    let next: PlayerAnimState;

    if (time < this.controlLockedUntil) {
      next = 'hurt';
    } else if (this.celebrating) {
      next = 'celebrate';
    } else if (!onGround) {
      next = velocity.y < 0 ? 'jump' : 'fall';
    } else if (Math.abs(velocity.x) < 10) {
      next = 'idle';
    } else {
      next = Math.abs(velocity.x) > PLAYER.maxSpeed * PLAYER.runThreshold ? 'run' : 'walk';
    }

    if (next !== this.animState) {
      this.animState = next;
      this.play(ANIM_BY_STATE[next], true);
    }
  }
}
