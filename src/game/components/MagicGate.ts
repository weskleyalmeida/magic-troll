import Phaser from 'phaser';
import { SFX } from '../config/assetKeys';
import { DEPTH, TILE } from '../config/constants';
import { AudioManager } from '../systems/AudioManager';
import type { BaseLevelScene } from '../scenes/BaseLevelScene';
import type { Interactable } from './Interactable';

/**
 * Barreira mágica sólida com um emblema. Só abre quando `isUnlocked()` for verdadeiro.
 * Pode ser aberta pela fase (open()) ou pelo jogador com E.
 */
export class MagicGate implements Interactable {
  readonly x: number;
  readonly y: number;
  private opened = false;
  private readonly visual: Phaser.GameObjects.Container;
  private readonly body: Phaser.Physics.Arcade.StaticBody;

  constructor(
    private readonly level: BaseLevelScene,
    tx: number,
    topRow: number,
    heightTiles: number,
    emblem: string,
    private readonly isUnlocked: () => boolean,
    private readonly lockedMessage: string,
  ) {
    const x = tx * TILE;
    const top = topRow * TILE;
    const h = heightTiles * TILE;
    this.x = x + TILE / 2;
    this.y = top + h;

    const g = level.add.graphics();
    g.fillStyle(0x8a5cf0, 0.28);
    g.fillRect(x + 2, top, TILE - 4, h);
    for (let i = 0; i < 3; i++) {
      g.fillStyle(0x2a1d4a, 1);
      g.fillRect(x + 5 + i * 9, top, 5, h);
      g.fillStyle(0xc9b8ff, 1);
      g.fillRect(x + 6 + i * 9, top, 2, h);
    }
    g.lineStyle(2, 0x2a1d4a, 1);
    g.strokeRect(x + 2, top, TILE - 4, h);

    const glow = level.add.circle(this.x, top + h / 2, 14, 0xc77dff, 0.35).setBlendMode(Phaser.BlendModes.ADD);
    const plate = level.add.circle(this.x, top + h / 2, 11, 0x2a1d4a, 1).setStrokeStyle(2, 0xffd166);
    const symbol = level.add.image(this.x, top + h / 2, emblem).setScale(0.9);
    level.tweens.add({ targets: glow, scale: 1.4, alpha: 0.15, duration: 900, yoyo: true, repeat: -1 });

    this.visual = level.add.container(0, 0, [g, glow, plate, symbol]).setDepth(DEPTH.DECOR);

    const zone = level.add.zone(this.x, top + h / 2, TILE - 6, h);
    level.physics.add.existing(zone, true);
    this.body = zone.body as Phaser.Physics.Arcade.StaticBody;
    level.physics.add.collider(level.player, zone);
    level.registerInteractable(this);
  }

  getPromptY(): number {
    return this.y - 4;
  }

  canInteract(): boolean {
    return !this.opened;
  }

  interact(): void {
    if (this.isUnlocked()) this.open();
    else this.level.showMessage(this.lockedMessage, { color: '#c9b8ff', duration: 1800 });
  }

  open(): void {
    if (this.opened) return;
    this.opened = true;
    this.body.enable = false;
    AudioManager.playSfx(this.level, SFX.DOOR);
    this.level.spawnSparkles(this.x, this.y - TILE * 2, 0xc77dff, 18);
    this.level.tweens.add({ targets: this.visual, alpha: 0, y: -TILE * 2, duration: 700, ease: 'Quad.easeIn' });
  }
}
