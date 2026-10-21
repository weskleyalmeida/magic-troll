import Phaser from 'phaser';
import { SFX, TEXTURES } from '../config/assetKeys';
import { DEPTH } from '../config/constants';
import { AudioManager } from '../systems/AudioManager';
import type { BaseLevelScene } from '../scenes/BaseLevelScene';
import type { Interactable } from './Interactable';

/**
 * 'coins': baú verdadeiro (cadeado dourado) que dá moedas.
 * 'fake':  baú falso (cadeado vermelho + dentinhos) que morde.
 */
export type ChestKind = 'coins' | 'fake';

export class Chest extends Phaser.GameObjects.Image implements Interactable {
  private opened = false;
  private readonly level: BaseLevelScene;
  private readonly kind: ChestKind;
  private readonly coins: number;

  constructor(level: BaseLevelScene, x: number, groundY: number, kind: ChestKind, coins = 5) {
    super(level, x, groundY, kind === 'fake' ? TEXTURES.CHEST_FAKE_CLOSED : TEXTURES.CHEST_CLOSED);
    this.level = level;
    this.kind = kind;
    this.coins = coins;

    this.setOrigin(0.5, 1).setDepth(DEPTH.ITEMS);
    level.add.existing(this);
    level.registerInteractable(this);
    if (kind === 'coins') level.registerCoin(coins);
  }

  getPromptY(): number {
    return this.y - this.height - 10;
  }

  canInteract(): boolean {
    return !this.opened && !this.level.player.isDead;
  }

  interact(): void {
    this.opened = true;
    AudioManager.playSfx(this.level, SFX.CHEST);
    if (this.kind === 'coins') this.openWithCoins();
    else this.bite();
  }

  private openWithCoins(): void {
    this.setTexture(TEXTURES.CHEST_OPEN);
    this.level.addCoins(this.coins);
    this.level.showMessage(`+${this.coins} moedas!`, { color: '#ffd166', duration: 1200 });

    for (let i = 0; i < this.coins; i++) {
      const coin = this.level.add.image(this.x, this.y - 16, TEXTURES.COIN).setDepth(DEPTH.WORLD_UI);
      this.level.tweens.add({
        targets: coin,
        x: this.x + Phaser.Math.Between(-30, 30),
        y: this.y - Phaser.Math.Between(40, 70),
        alpha: 0,
        duration: 600,
        delay: i * 60,
        ease: 'Quad.easeOut',
        onComplete: () => coin.destroy(),
      });
    }
  }

  private bite(): void {
    this.setTexture(TEXTURES.CHEST_FAKE_OPEN);
    this.level.tweens.add({ targets: this, x: this.x + 3, duration: 50, yoyo: true, repeat: 5 });
    // Empurrão fraco: o baú pode estar num lugar apertado (morder E derrubar na água seria injusto).
    this.level.hurtPlayer(this.x, 0.3);
    this.level.showMessage('HA! Baú falso!', { color: '#ff6b6b', duration: 1400 });
    // A "pista" revelada depois do erro: o jogador deveria ter notado.
    this.level.showMessage('(Cadeado vermelho... sério?)', { duration: 1800 });
  }
}
