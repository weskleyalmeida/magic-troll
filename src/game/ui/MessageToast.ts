import Phaser from 'phaser';
import { DEPTH, GAME_WIDTH, UI_FONT } from '../config/constants';

export interface MessageOptions {
  duration?: number;
  color?: string;
  /** Chamado quando a mensagem some (útil para encadear eventos). */
  onDone?: () => void;
}

/** Mensagens curtas no topo da tela, exibidas em fila (uma de cada vez). */
export class MessageToast {
  private queue: { text: string; options: MessageOptions }[] = [];
  private showing = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly y = 130,
  ) {}

  show(text: string, options: MessageOptions = {}): void {
    this.queue.push({ text, options });
    if (!this.showing) this.next();
  }

  private next(): void {
    const item = this.queue.shift();
    if (!item) {
      this.showing = false;
      return;
    }
    this.showing = true;

    const label = this.scene.add
      .text(GAME_WIDTH / 2, this.y, item.text, {
        fontFamily: UI_FONT,
        fontSize: '28px',
        fontStyle: 'bold',
        color: item.options.color ?? '#ffffff',
        stroke: '#2b1a4a',
        strokeThickness: 6,
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH.HUD)
      .setAlpha(0)
      .setScale(0.8);

    this.scene.tweens.add({ targets: label, alpha: 1, scale: 1, duration: 200, ease: 'Back.easeOut' });
    this.scene.time.delayedCall(item.options.duration ?? 1800, () => {
      this.scene.tweens.add({
        targets: label,
        alpha: 0,
        y: this.y - 20,
        duration: 250,
        onComplete: () => {
          label.destroy();
          item.options.onDone?.();
          this.next();
        },
      });
    });
  }
}
