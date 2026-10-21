import Phaser from 'phaser';
import { TEXTURES } from '../config/assetKeys';
import { DEPTH } from '../config/constants';
import type { BaseLevelScene } from '../scenes/BaseLevelScene';
import type { Interactable } from './Interactable';

export interface DoorOptions {
  /** Textura do símbolo acima da porta (sol, lua, estrela...). */
  symbol?: string;
  /** Destino do teletransporte (mundo, px). */
  targetX: number;
  targetY: number;
  /** Mensagem mostrada ao chegar (ex.: "Hmm... parece familiar."). */
  message?: string;
}

/** Porta mágica usada com E: teletransporta o jogador. Algumas mentem e levam de volta. */
export class MagicDoor extends Phaser.GameObjects.Image implements Interactable {
  constructor(
    private readonly level: BaseLevelScene,
    x: number,
    groundY: number,
    private readonly options: DoorOptions,
  ) {
    super(level, x, groundY, TEXTURES.DOOR);
    this.setOrigin(0.5, 1).setDepth(DEPTH.DECOR);
    level.add.existing(this);
    level.registerInteractable(this);

    if (options.symbol) {
      const symbol = level.add.image(x, groundY - this.height - 12, options.symbol).setDepth(DEPTH.DECOR);
      level.tweens.add({ targets: symbol, y: symbol.y - 3, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  getPromptY(): number {
    return this.y - this.height - 26;
  }

  canInteract(): boolean {
    return !this.level.player.isDead;
  }

  interact(): void {
    this.level.teleportPlayer(this.options.targetX, this.options.targetY, this.options.message);
  }
}
