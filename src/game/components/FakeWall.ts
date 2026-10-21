import Phaser from 'phaser';
import { SFX } from '../config/assetKeys';
import { DEPTH } from '../config/constants';
import { AudioManager } from '../systems/AudioManager';
import { ILLUSION_COLOR } from './Illusion';
import type { BaseLevelScene } from '../scenes/BaseLevelScene';

type Visual = Phaser.GameObjects.Image | Phaser.GameObjects.TileSprite | Phaser.GameObjects.Container;

/**
 * Parede/arbusto falso: parece sólido, mas não tem colisão.
 * Fica na frente do jogador e fica transparente quando ele entra, revelando o segredo.
 */
export class FakeWall {
  private revealed = false;

  constructor(
    private readonly level: BaseLevelScene,
    private readonly visual: Visual,
    private readonly secretMessage?: string,
    /** Área que revela o segredo (padrão: os limites do visual). */
    private readonly area?: Phaser.Geom.Rectangle,
    /** Ilusão mágica: treme e solta faíscas roxas de tempos em tempos (a pista). */
    shimmer = false,
  ) {
    visual.setDepth(DEPTH.FOREGROUND);
    if (shimmer && area) {
      level.time.addEvent({
        delay: 1700,
        loop: true,
        callback: () => {
          if (this.revealed) return;
          level.tweens.add({ targets: visual, x: 1.5, duration: 60, yoyo: true, repeat: 2, onComplete: () => visual.setX(0) });
          level.spawnSparkles(area.x + Math.random() * area.width, area.y + Math.random() * area.height, ILLUSION_COLOR, 2, DEPTH.FOREGROUND + 1);
        },
      });
    }
    level.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    level.events.once(Phaser.Scenes.Events.SHUTDOWN, () => level.events.off(Phaser.Scenes.Events.UPDATE, this.update, this));
  }

  private update(): void {
    const area = this.area ?? (this.visual as Phaser.GameObjects.Image).getBounds();
    const inside = Phaser.Geom.Rectangle.Overlaps(area, this.level.player.getBounds());
    const targetAlpha = inside ? 0.15 : 1;
    this.visual.setAlpha(Phaser.Math.Linear(this.visual.alpha, targetAlpha, 0.2));

    if (inside && !this.revealed) {
      this.revealed = true;
      AudioManager.playSfx(this.level, SFX.SECRET);
      if (this.secretMessage) this.level.showMessage(this.secretMessage, { color: '#c9b8ff', duration: 1600 });
    }
  }
}
