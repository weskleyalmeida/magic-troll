import Phaser from 'phaser';
import { SFX } from '../config/assetKeys';
import { DEPTH } from '../config/constants';
import { AudioManager } from '../systems/AudioManager';
import type { BaseLevelScene } from '../scenes/BaseLevelScene';

/**
 * Bloco/plataforma que treme e cai pouco depois de o jogador pisar em cima.
 * Serve para tábuas rachadas (oneWay) e para chão falso (sólido). Volta depois de `respawnMs`.
 */
export class CrumblePlatform {
  private state: 'idle' | 'shaking' | 'gone' = 'idle';
  private readonly visual: Phaser.GameObjects.TileSprite;
  private readonly body: Phaser.Physics.Arcade.StaticBody;

  constructor(
    private readonly level: BaseLevelScene,
    private readonly x: number,
    y: number,
    width: number,
    height: number,
    texture: string,
    oneWay: boolean,
    private readonly respawnMs = 2500,
    private readonly shakeMs = 450,
    /** Visuais extras que caem junto (ex.: a terra que esconde o buraco embaixo do chão falso). */
    private readonly attached: (Phaser.GameObjects.TileSprite | Phaser.GameObjects.Graphics)[] = [],
  ) {
    this.visual = level.add.tileSprite(x, y, width, height, texture).setOrigin(0).setTilePosition(x, 0).setDepth(DEPTH.TILES);

    const zone = level.add.zone(x + width / 2, y + height / 2, width, height);
    level.physics.add.existing(zone, true);
    this.body = zone.body as Phaser.Physics.Arcade.StaticBody;

    level.physics.add.collider(
      level.player,
      zone,
      () => this.onTouch(),
      oneWay ? () => level.canLandOnOneWay(this.body) : undefined,
    );
  }

  private onTouch(): void {
    if (this.state !== 'idle') return;
    // Só quando pisa em cima (bater de lado ou por baixo não derruba).
    if (this.level.player.arcadeBody.bottom > this.body.top + 2) return;

    this.state = 'shaking';
    AudioManager.playSfx(this.level, SFX.CRUMBLE);
    this.level.tweens.add({ targets: this.visual, x: this.x + 2, duration: 40, yoyo: true, repeat: Math.floor(this.shakeMs / 80) });
    this.level.time.delayedCall(this.shakeMs, () => this.fall());
  }

  private fall(): void {
    this.state = 'gone';
    this.body.enable = false;
    const pieces = [this.visual, ...this.attached];
    this.level.tweens.add({ targets: pieces, y: '+=60', alpha: 0, duration: 350, ease: 'Quad.easeIn' });
    this.level.time.delayedCall(this.respawnMs, () => this.restore());
  }

  private restore(): void {
    const pieces = [this.visual, ...this.attached];
    pieces.forEach((piece) => piece.setY(piece.y - 60).setAlpha(0));
    this.visual.setX(this.x);
    this.level.tweens.add({ targets: pieces, alpha: 1, duration: 250 });
    this.body.enable = true;
    this.state = 'idle';
  }
}
