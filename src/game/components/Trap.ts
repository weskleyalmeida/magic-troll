import Phaser from 'phaser';
import { SFX, TEXTURES } from '../config/assetKeys';
import { DEPTH } from '../config/constants';
import { AudioManager } from '../systems/AudioManager';
import type { BaseLevelScene } from '../scenes/BaseLevelScene';

/** Área de hit estática, um pouco menor que o visual (mais justo para o jogador). */
function addHitZone(level: BaseLevelScene, x: number, y: number, w: number, h: number, onHit: () => void): void {
  const zone = level.add.zone(x, y, w, h);
  level.physics.add.existing(zone, true);
  level.physics.add.overlap(level.player, zone, onHit);
}

/** Espinhos sempre visíveis. */
export class SpikeTrap {
  constructor(level: BaseLevelScene, x: number, groundY: number, width: number) {
    level.add.tileSprite(x, groundY, width, 16, TEXTURES.SPIKES).setOrigin(0, 1).setDepth(DEPTH.ITEMS);
    const centerX = x + width / 2;
    addHitZone(level, centerX, groundY - 5, width - 8, 10, () => level.hurtPlayer(centerX));
  }
}

/**
 * Espinhos escondidos no chão que saltam quando o jogador passa por cima.
 * Pista: furinhos na grama exatamente onde eles estão.
 */
export class PopupSpikeTrap {
  private raised = false;
  private busy = false;
  private readonly spikes: Phaser.GameObjects.TileSprite;
  private readonly groundY: number;

  constructor(
    private readonly level: BaseLevelScene,
    x: number,
    groundY: number,
    width: number,
  ) {
    this.groundY = groundY;
    level.add.tileSprite(x, groundY + 1, width, 6, TEXTURES.SPIKE_HOLES).setOrigin(0, 0).setDepth(DEPTH.DECOR);

    // Começa "dentro" do chão: atrás dos tiles, 16px abaixo da superfície.
    this.spikes = level.add
      .tileSprite(x, groundY + 16, width, 16, TEXTURES.SPIKES)
      .setOrigin(0, 1)
      .setDepth(DEPTH.HIDDEN);

    const centerX = x + width / 2;
    addHitZone(level, centerX, groundY - 24, width + 24, 48, () => this.trigger());
    addHitZone(level, centerX, groundY - 5, width - 8, 10, () => {
      if (this.raised) level.hurtPlayer(centerX);
    });
  }

  private trigger(): void {
    if (this.busy) return;
    this.busy = true;

    this.level.time.delayedCall(120, () => {
      AudioManager.playSfx(this.level, SFX.TRAP);
      this.level.tweens.add({
        targets: this.spikes,
        y: this.groundY,
        duration: 70,
        onComplete: () => {
          this.raised = true;
          this.spikes.setDepth(DEPTH.ITEMS);
        },
      });
    });

    this.level.time.delayedCall(1700, () => {
      this.raised = false;
      this.spikes.setDepth(DEPTH.HIDDEN);
      this.level.tweens.add({
        targets: this.spikes,
        y: this.groundY + 16,
        duration: 300,
        onComplete: () => this.level.time.delayedCall(400, () => (this.busy = false)),
      });
    });
  }
}

/** Área perigosa invisível (água, lava, vazio): tira 1 vida e volta ao checkpoint. */
export class HazardZone {
  constructor(level: BaseLevelScene, x: number, y: number, w: number, h: number) {
    addHitZone(level, x + w / 2, y + h / 2, w, h, () => level.onPlayerHitHazard());
  }
}
