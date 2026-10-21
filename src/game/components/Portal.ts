import Phaser from 'phaser';
import { SFX, TEXTURES } from '../config/assetKeys';
import { DEPTH } from '../config/constants';
import { AudioManager } from '../systems/AudioManager';
import type { BaseLevelScene } from '../scenes/BaseLevelScene';

export interface PortalOptions {
  /** Pode ser usado várias vezes (teletransporte). Padrão: uso único (saída de fase). */
  reusable?: boolean;
  /** Cor do portal (azul, vermelho, verde...). */
  tint?: number;
}

/**
 * Portal genérico: executa `onEnter` quando o jogador entra.
 * Saída de fase (uso único) ou teletransporte (reutilizável) — basta mudar o callback.
 */
export class Portal extends Phaser.Physics.Arcade.Image {
  private used = false;

  constructor(level: BaseLevelScene, x: number, groundY: number, onEnter: () => void, options: PortalOptions = {}) {
    super(level, x, groundY, TEXTURES.PORTAL);
    this.setOrigin(0.5, 1).setDepth(DEPTH.DECOR);
    level.add.existing(this);
    // O corpo estático é criado com escala 1, antes da animação de surgimento.
    level.physics.add.existing(this, true);

    if (options.tint !== undefined) {
      this.setTint(options.tint);
      const glow = level.add
        .circle(x, groundY - 28, 30, options.tint, 0.25)
        .setDepth(DEPTH.DECOR - 1)
        .setBlendMode(Phaser.BlendModes.ADD);
      level.tweens.add({ targets: glow, scale: 1.25, alpha: 0.1, duration: 900, yoyo: true, repeat: -1 });
    }

    this.setScale(0);
    level.tweens.add({
      targets: this,
      scale: 1,
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => level.tweens.add({ targets: this, scaleX: 0.88, duration: 600, yoyo: true, repeat: -1 }),
    });

    level.physics.add.overlap(level.player, this, () => {
      if (this.used || level.player.isDead) return;
      this.used = true;
      AudioManager.playSfx(level, SFX.TELEPORT);
      onEnter();
      if (options.reusable) level.time.delayedCall(1200, () => (this.used = false));
    });
  }
}
