import Phaser from 'phaser';
import { UI_FONT } from '../config/constants';

const HEIGHT = 52;
const COLORS = {
  idle: { base: 0x5b34b8, top: 0x7a52e0 },
  hover: { base: 0x7046d6, top: 0x9a76f5 },
};

/** Botão arredondado com sombra e brilho. Funciona com mouse e toque. */
export class TextButton extends Phaser.GameObjects.Container {
  private readonly bg: Phaser.GameObjects.Graphics;
  private readonly buttonWidth: number;

  constructor(scene: Phaser.Scene, x: number, y: number, label: string, onClick: () => void, width = 260) {
    super(scene, x, y);
    this.buttonWidth = width;

    this.bg = scene.add.graphics();
    this.draw(COLORS.idle);

    const text = scene.add
      .text(0, 0, label, {
        fontFamily: UI_FONT,
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#2a1660',
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    const hit = scene.add.zone(0, 0, width, HEIGHT).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => {
      this.draw(COLORS.hover);
      this.setScale(1.05);
    });
    hit.on('pointerout', () => {
      this.draw(COLORS.idle);
      this.setScale(1);
    });
    hit.on('pointerup', onClick);

    this.add([this.bg, text, hit]);
    scene.add.existing(this);
  }

  private draw(colors: { base: number; top: number }): void {
    const w = this.buttonWidth;
    const g = this.bg;
    g.clear();
    g.fillStyle(0x000000, 0.3);
    g.fillRoundedRect(-w / 2 + 3, -HEIGHT / 2 + 5, w, HEIGHT, 16);
    g.fillStyle(colors.base, 1);
    g.fillRoundedRect(-w / 2, -HEIGHT / 2, w, HEIGHT, 16);
    g.fillStyle(colors.top, 1);
    g.fillRoundedRect(-w / 2, -HEIGHT / 2, w, HEIGHT / 2, { tl: 16, tr: 16, bl: 0, br: 0 });
    g.lineStyle(3, 0xffd166, 1);
    g.strokeRoundedRect(-w / 2, -HEIGHT / 2, w, HEIGHT, 16);
  }
}
