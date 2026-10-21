import Phaser from 'phaser';
import { TEXTURES } from '../config/assetKeys';
import { DEPTH } from '../config/constants';
import type { BaseLevelScene } from '../scenes/BaseLevelScene';

/** Algo que aparece DENTRO do espelho (posição relativa ao centro do vidro). */
export interface Reflection {
  texture: string;
  dx?: number;
  dy?: number;
  scale?: number;
  tint?: number;
}

/**
 * Espelho de parede. Espelhos não mentem: mostram só o que é real
 * (o portal verdadeiro, o Olho invisível...). É decoração — sem colisão.
 */
export class Mirror {
  constructor(level: BaseLevelScene, x: number, bottomY: number, reflections: Reflection[]) {
    const frame = level.add.image(x, bottomY, TEXTURES.MIRROR).setOrigin(0.5, 1).setDepth(DEPTH.DECOR_BACK);
    const cx = x;
    const cy = bottomY - frame.height / 2;

    reflections.forEach((r) => {
      const img = level.add
        .image(cx + (r.dx ?? 0), cy + (r.dy ?? 0), r.texture)
        .setScale(r.scale ?? 0.5)
        .setAlpha(0.85)
        .setFlipX(true) // é um reflexo
        .setDepth(DEPTH.DECOR_BACK);
      if (r.tint !== undefined) img.setTint(r.tint);
      level.tweens.add({ targets: img, alpha: 0.6, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });

    // brilho que atravessa o vidro de tempos em tempos
    const shine = level.add.rectangle(cx - 12, cy, 5, 40, 0xffffff, 0).setAngle(20).setDepth(DEPTH.DECOR_BACK);
    level.tweens.add({
      targets: shine,
      x: cx + 12,
      alpha: { from: 0.5, to: 0 },
      duration: 700,
      repeat: -1,
      repeatDelay: 2200,
      ease: Phaser.Math.Easing.Sine.InOut,
    });
  }
}
