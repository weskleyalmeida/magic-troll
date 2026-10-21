import Phaser from 'phaser';
import { TEXTURES } from '../config/assetKeys';
import { DEPTH, UI_FONT } from '../config/constants';
import type { BaseLevelScene } from '../scenes/BaseLevelScene';
import type { Interactable } from './Interactable';

/** Placa lida com E. O texto pode mudar durante a fase (placas mentirosas!). */
export class Sign extends Phaser.GameObjects.Image implements Interactable {
  private message: string;
  private bubble?: Phaser.GameObjects.Container;

  constructor(level: BaseLevelScene, x: number, groundY: number, message: string) {
    super(level, x, groundY, TEXTURES.SIGN);
    this.message = message;
    this.setOrigin(0.5, 1).setDepth(DEPTH.DECOR);
    level.add.existing(this);
    level.registerInteractable(this);
  }

  getPromptY(): number {
    return this.y - this.height - 10;
  }

  canInteract(): boolean {
    return true;
  }

  interact(): void {
    if (this.bubble) this.hideBubble();
    else this.showBubble();
  }

  onFocusLost(): void {
    this.hideBubble();
  }

  setMessage(message: string): void {
    this.message = message;
    if (this.bubble) {
      this.hideBubble();
      this.showBubble();
    }
  }

  private showBubble(): void {
    const text = this.scene.add
      .text(0, 0, this.message, {
        fontFamily: UI_FONT,
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#2b1a4a',
        align: 'center',
        wordWrap: { width: 260 },
      })
      .setOrigin(0.5);
    const w = text.width + 28;
    const h = text.height + 18;
    const bg = this.scene.add.rectangle(0, 0, w, h, 0xfff4d6).setStrokeStyle(3, 0x8a5a2b);

    this.bubble = this.scene.add
      .container(this.x, this.y - this.height - 34 - h / 2, [bg, text])
      .setDepth(DEPTH.WORLD_UI)
      .setScale(0.8);
    this.scene.tweens.add({ targets: this.bubble, scale: 1, duration: 140, ease: 'Back.easeOut' });
  }

  private hideBubble(): void {
    this.bubble?.destroy();
    this.bubble = undefined;
  }
}
