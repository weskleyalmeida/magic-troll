import Phaser from 'phaser';
import { SFX, TEXTURES } from '../config/assetKeys';
import { DEPTH, TILE, UI_FONT } from '../config/constants';
import { AudioManager } from '../systems/AudioManager';
import type { BaseLevelScene } from '../scenes/BaseLevelScene';

export const BOSS_EVENTS = {
  HP: 'boss-hp', // (hp, maxHp)
  FAKE_DEATH: 'boss-fake-death',
  DEFEATED: 'boss-defeated',
} as const;

type BossState = 'intro' | 'busy' | 'dizzy' | 'hurt' | 'fakeDead' | 'dead';
type Attack = 'slam' | 'barrage' | 'fake' | 'redzone' | 'vanish';

const ATTACKS: Attack[] = ['slam', 'barrage', 'fake', 'redzone', 'vanish'];

/**
 * GUARDIÃO TROLL. Ciclo: alguns ataques (todos telegrafados) → fica TONTO → pise na cabeça.
 * Fase 1: 3 vidas e um falso "derrotado". Fase 2 ("Achou que acabou?"): 2 vidas, mais rápido.
 */
export class TrollBoss extends Phaser.Physics.Arcade.Sprite {
  hp = 3;
  maxHp = 3;
  private bossState: BossState = 'intro';
  private phase = 1;
  /** Incrementado para cancelar tudo o que estava agendado (ex.: ao levar um golpe). */
  private epoch = 0;
  private attacksSinceDizzy = 0;
  private lastAttack?: Attack;
  private airborne = false;
  private onLand?: () => void;
  private stars?: Phaser.GameObjects.Container;
  private shadow?: Phaser.GameObjects.Ellipse;

  constructor(
    private readonly level: BaseLevelScene,
    x: number,
    y: number,
    private readonly minX: number,
    private readonly maxX: number,
    private readonly floorY: number,
    private readonly ceilingY: number,
  ) {
    super(level, x, y, TEXTURES.BOSS_IDLE);
    level.add.existing(this);
    level.physics.add.existing(this);
    this.arcadeBody.setSize(58, 74).setOffset(19, 20);
    this.setDepth(DEPTH.ENEMIES);
    level.collideWithTerrain(this);
    this.airborne = true;
    this.onLand = () => {
      level.cameras.main.shake(400, 0.012);
      AudioManager.playSfx(level, SFX.BOSS);
    };
  }

  get arcadeBody(): Phaser.Physics.Arcade.Body {
    return this.body as Phaser.Physics.Arcade.Body;
  }

  get isVulnerable(): boolean {
    return this.bossState === 'dizzy';
  }

  get isHarmful(): boolean {
    return (this.bossState === 'busy' || this.bossState === 'intro') && this.alpha > 0.5 && this.arcadeBody.enable;
  }

  get isFakeDead(): boolean {
    return this.bossState === 'fakeDead';
  }

  /** Começa a luta (depois da entrada). */
  start(): void {
    this.bossState = 'busy';
    this.next(900);
  }

  protected preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    const body = this.arcadeBody;

    if (this.x < this.minX) {
      this.x = this.minX;
      body.setVelocityX(0);
    } else if (this.x > this.maxX) {
      this.x = this.maxX;
      body.setVelocityX(0);
    }

    if (this.airborne && body.blocked.down && body.velocity.y >= 0) {
      this.airborne = false;
      body.setVelocityX(0);
      const cb = this.onLand;
      this.onLand = undefined;
      cb?.();
    } else if (!this.airborne && body.blocked.down) {
      body.setVelocityX(0);
    }

    if (this.bossState === 'busy' && !this.airborne) this.setFlipX(this.level.player.x < this.x);
    this.stars?.setPosition(this.x, this.y - 54);
  }

  // ---------------------------------------------------------------------------
  // Agenda
  // ---------------------------------------------------------------------------

  private get speed(): number {
    return this.phase === 1 ? 1 : 0.7;
  }

  /** delayedCall que é cancelado se o chefe mudar de "época" (golpe, morte...). */
  private later(ms: number, fn: () => void): void {
    const epoch = this.epoch;
    this.level.time.delayedCall(ms * this.speed, () => {
      if (epoch === this.epoch && this.active) fn();
    });
  }

  private next(delay = 700): void {
    this.later(delay, () => {
      if (this.attacksSinceDizzy >= (this.phase === 1 ? 2 : 3)) {
        this.becomeDizzy();
        return;
      }
      this.attacksSinceDizzy++;
      const options = ATTACKS.filter((a) => a !== this.lastAttack);
      const attack = Phaser.Utils.Array.GetRandom(options);
      this.lastAttack = attack;
      this[attack]();
    });
  }

  private jump(vx: number, vy: number, onLand: () => void): void {
    this.arcadeBody.setVelocity(vx, vy);
    this.airborne = true;
    this.onLand = onLand;
  }

  // ---------------------------------------------------------------------------
  // Ataques
  // ---------------------------------------------------------------------------

  /** Pula em cima do jogador e solta ondas de choque pelo chão (pule-as!). */
  private slam(): void {
    this.setTexture(TEXTURES.BOSS_WINDUP);
    this.later(650, () => {
      this.setTexture(TEXTURES.BOSS_IDLE);
      const vx = Phaser.Math.Clamp((this.level.player.x - this.x) / 0.95, -380, 380);
      this.jump(vx, -720, () => {
        this.level.cameras.main.shake(250, 0.01);
        AudioManager.playSfx(this.level, SFX.BOSS);
        this.shockwave(-1);
        this.shockwave(1);
        this.next(900);
      });
    });
  }

  /** Arremessa orbes em arco na direção do jogador. */
  private barrage(): void {
    this.setTexture(TEXTURES.BOSS_WINDUP);
    this.later(550, () => {
      const dx = this.level.player.x - this.x;
      for (let i = 0; i < 3; i++) {
        this.orb(this.x, this.y - 30, dx / 1.1 + (i - 1) * 80, -460 - i * 50, true, 0xe08aff);
      }
      AudioManager.playSfx(this.level, SFX.TRAP);
      this.later(350, () => this.setTexture(TEXTURES.BOSS_IDLE));
      this.next(1100);
    });
  }

  /** TROLLAGEM: pose dramática de ataque... e nada acontece. */
  private fake(): void {
    this.setTexture(TEXTURES.BOSS_WINDUP);
    this.setTint(0xff9a9a);
    this.floatText('!!!', '#ff6b6b', 30);
    this.level.cameras.main.shake(700, 0.004);
    this.later(1300, () => {
      this.clearTint();
      this.setTexture(TEXTURES.BOSS_IDLE);
      this.floatText('...brincadeira.', '#ffffff', 16);
      this.next(900);
    });
  }

  /**
   * TROLLAGEM: uma zona vermelha marca "PERIGO" perto do jogador, mas as pedras caem
   * em OUTRO lugar. PISTA justa: poeira caindo do teto exatamente onde vai cair.
   */
  private redzone(): void {
    this.setTexture(TEXTURES.BOSS_WINDUP);
    const arenaMid = (this.minX + this.maxX) / 2;
    const zoneX = Phaser.Math.Clamp(this.level.player.x, this.minX + 2 * TILE, this.maxX - 2 * TILE);
    const strikeX = Phaser.Math.Clamp(zoneX + (zoneX < arenaMid ? 1 : -1) * 5 * TILE, this.minX + TILE, this.maxX - TILE);

    const zone = this.level.add.rectangle(zoneX, this.floorY - 60, 4 * TILE, 120, 0xff2a2a, 0.22).setDepth(DEPTH.DECOR);
    const label = this.level.add
      .text(zoneX, this.floorY - 130, 'PERIGO!', { fontFamily: UI_FONT, fontSize: '18px', fontStyle: 'bold', color: '#ff6b6b', stroke: '#2a1d33', strokeThickness: 4 })
      .setOrigin(0.5)
      .setDepth(DEPTH.WORLD_UI);
    this.level.tweens.add({ targets: [zone, label], alpha: 0.05, duration: 220, yoyo: true, repeat: 5 });

    const dust = this.level.time.addEvent({
      delay: 110,
      repeat: 12,
      callback: () => {
        const d = this.level.add.circle(strikeX + Phaser.Math.Between(-2 * TILE, 2 * TILE), this.ceilingY + 4, Phaser.Math.Between(2, 4), 0xd8d0e0, 0.9).setDepth(DEPTH.WORLD_UI);
        this.level.tweens.add({ targets: d, y: d.y + Phaser.Math.Between(80, 160), alpha: 0, duration: 700, onComplete: () => d.destroy() });
      },
    });

    this.later(1500, () => {
      dust.remove();
      zone.destroy();
      label.destroy();
      for (let i = 0; i < 4; i++) {
        this.rock(strikeX + (i - 1.5) * 34, this.ceilingY + 10 + i * 6);
      }
      this.setTexture(TEXTURES.BOSS_IDLE);
      this.next(1100);
    });
  }

  /** Some e reaparece caindo em cima do jogador. PISTA: a sombra no chão. */
  private vanish(): void {
    this.level.tweens.add({ targets: this, alpha: 0, duration: 450 });
    this.later(450, () => {
      this.arcadeBody.enable = false;
      this.shadow = this.level.add.ellipse(this.level.player.x, this.floorY - 4, 70, 14, 0x000000, 0.45).setDepth(DEPTH.DECOR);
      const follow = this.level.time.addEvent({
        delay: 16,
        loop: true,
        callback: () => this.shadow?.setX(Phaser.Math.Clamp(this.level.player.x, this.minX, this.maxX)),
      });
      this.later(1500, () => {
        follow.remove();
        this.later(450, () => {
          const x = this.shadow?.x ?? this.x;
          this.arcadeBody.enable = true;
          this.arcadeBody.reset(x, this.ceilingY + 60);
          this.setAlpha(1);
          this.jump(0, 320, () => {
            this.shadow?.destroy();
            this.shadow = undefined;
            this.level.cameras.main.shake(300, 0.012);
            AudioManager.playSfx(this.level, SFX.BOSS);
            this.shockwave(-1);
            this.shockwave(1);
            this.next(900);
          });
        });
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Tontura, golpes e "morte"
  // ---------------------------------------------------------------------------

  private becomeDizzy(): void {
    this.bossState = 'dizzy';
    this.attacksSinceDizzy = 0;
    this.setTexture(TEXTURES.BOSS_DIZZY);
    this.floatText('Tonto! Pise nele!', '#ffd166', 15);

    const starImgs = [0, 1, 2].map((i) =>
      this.level.add.image(Math.cos((i / 3) * Math.PI * 2) * 22, Math.sin((i / 3) * Math.PI * 2) * 8, TEXTURES.SPARKLE).setScale(1.6).setTint(0xffe066),
    );
    this.stars = this.level.add.container(this.x, this.y - 54, starImgs).setDepth(DEPTH.WORLD_UI);
    this.level.tweens.add({ targets: this.stars, angle: 360, duration: 900, repeat: -1 });

    this.later(this.phase === 1 ? 2800 : 2200, () => {
      this.clearStars();
      this.bossState = 'busy';
      this.setTexture(TEXTURES.BOSS_IDLE);
      this.next(300);
    });
  }

  /** Chamado pela fase quando o jogador pisa na cabeça durante a tontura. */
  takeHit(): void {
    if (this.bossState !== 'dizzy') return;
    this.epoch++;
    this.clearStars();
    this.hp--;
    this.emit(BOSS_EVENTS.HP, this.hp, this.maxHp);
    this.bossState = 'hurt';
    this.setTexture(TEXTURES.BOSS_HURT).setTint(0xffb0b0);
    this.level.cameras.main.shake(250, 0.01);
    this.level.spawnSparkles(this.x, this.y - 30, 0xffffff, 14);
    AudioManager.playSfx(this.level, SFX.STOMP);

    if (this.hp <= 0) {
      if (this.phase === 1) this.fakeDeath();
      else this.die();
      return;
    }

    this.later(700, () => {
      this.clearTint();
      this.setTexture(TEXTURES.BOSS_IDLE);
      const center = (this.minX + this.maxX) / 2;
      this.jump(Math.sign(center - this.x) * 220, -520, () => {
        this.bossState = 'busy';
        this.next(500);
      });
    });
  }

  private fakeDeath(): void {
    this.bossState = 'fakeDead';
    this.level.tweens.add({ targets: this, angle: this.flipX ? 90 : -90, duration: 500, ease: 'Bounce.easeOut' });
    this.setTint(0xa0a0a0);
    this.emit(BOSS_EVENTS.FAKE_DEATH);
  }

  /** "Achou que acabou?" — fase 2. */
  revive(): void {
    if (this.bossState !== 'fakeDead') return;
    this.epoch++;
    this.phase = 2;
    this.hp = 2;
    this.maxHp = 2;
    this.clearTint();
    this.setTexture(TEXTURES.BOSS_WINDUP);
    this.level.tweens.add({ targets: this, angle: 0, duration: 400 });
    this.level.cameras.main.shake(600, 0.012);
    this.emit(BOSS_EVENTS.HP, this.hp, this.maxHp);
    this.bossState = 'busy';
    this.later(700, () => {
      this.setTexture(TEXTURES.BOSS_IDLE);
      this.jump(0, -560, () => this.next(500));
    });
  }

  private die(): void {
    this.bossState = 'dead';
    this.epoch++;
    this.arcadeBody.enable = false;
    this.level.spawnSparkles(this.x, this.y, 0xffd166, 30);
    this.level.tweens.add({
      targets: this,
      angle: 720,
      scale: 0.1,
      alpha: 0,
      y: this.y - 80,
      duration: 1400,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.emit(BOSS_EVENTS.DEFEATED);
        this.destroy();
      },
    });
  }

  private clearStars(): void {
    this.stars?.destroy();
    this.stars = undefined;
  }

  // ---------------------------------------------------------------------------
  // Projéteis
  // ---------------------------------------------------------------------------

  private shockwave(dir: 1 | -1): void {
    const wave = this.orb(this.x + dir * 34, this.floorY - 9, dir * 240, 0, false, 0xffa040);
    wave.setScale(1.6, 1.1);
  }

  private rock(x: number, y: number): void {
    const rock = this.level.physics.add.image(x, y, TEXTURES.ROCK).setDepth(DEPTH.ENEMIES);
    (rock.body as Phaser.Physics.Arcade.Body).setVelocityY(60);
    this.registerProjectile(rock);
  }

  private orb(x: number, y: number, vx: number, vy: number, gravity: boolean, tint: number): Phaser.Physics.Arcade.Image {
    const orb = this.level.physics.add.image(x, y, TEXTURES.ORB).setTint(tint).setDepth(DEPTH.ENEMIES);
    const body = orb.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(gravity).setCircle(5, 3, 3).setVelocity(vx, vy);
    this.registerProjectile(orb, !gravity);
    return orb;
  }

  /** Projétil machuca ao tocar, estoura no terreno e some sozinho depois de um tempo. */
  private registerProjectile(obj: Phaser.Physics.Arcade.Image, slidesOnFloor = false): void {
    const pop = () => {
      if (!obj.active) return;
      this.level.spawnSparkles(obj.x, obj.y, 0xffc0ff, 4);
      obj.destroy();
    };
    this.level.physics.add.overlap(this.level.player, obj, () => {
      this.level.hurtPlayer(obj.x);
      pop();
    });
    if (!slidesOnFloor) this.level.collideWithTerrain(obj, pop);
    this.level.time.addEvent({
      delay: 50,
      repeat: 80,
      callback: () => {
        if (obj.active && (obj.x < this.minX - 2 * TILE || obj.x > this.maxX + 2 * TILE)) pop();
      },
    });
    this.level.time.delayedCall(4200, pop);
  }

  private floatText(text: string, color: string, size: number): void {
    const label = this.level.add
      .text(this.x, this.y - 70, text, {
        fontFamily: UI_FONT,
        fontSize: `${size}px`,
        fontStyle: 'bold',
        color,
        stroke: '#2a1d33',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.WORLD_UI);
    this.level.tweens.add({ targets: label, y: label.y - 30, alpha: 0, delay: 500, duration: 900, onComplete: () => label.destroy() });
  }
}
