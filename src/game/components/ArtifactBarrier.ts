import Phaser from 'phaser';
import { SFX } from '../config/assetKeys';
import { ARTIFACT_ORDER, ARTIFACTS, type ArtifactId } from '../config/artifacts';
import { DEPTH, TILE, UI_FONT } from '../config/constants';
import { AudioManager } from '../systems/AudioManager';
import { SaveSystem } from '../systems/SaveSystem';
import type { BaseLevelScene } from '../scenes/BaseLevelScene';
import type { Interactable } from './Interactable';

/**
 * Barreira mágica que só se desfaz com TODOS os artefatos principais (salvos no SaveSystem).
 * Abre ao encostar (ou com E) se o jogador tiver tudo; senão diz o que falta.
 */
export class ArtifactBarrier implements Interactable {
  readonly x: number;
  readonly y: number;
  private opened = false;
  private opening = false;
  private lastHintAt = -Infinity;
  private readonly visual: Phaser.GameObjects.Container;
  private readonly slots: Phaser.GameObjects.Image[] = [];
  private readonly body: Phaser.Physics.Arcade.StaticBody;

  constructor(
    private readonly level: BaseLevelScene,
    tx: number,
    topRow: number,
    heightTiles: number,
  ) {
    const left = tx * TILE;
    const top = topRow * TILE;
    const w = TILE * 2;
    const h = heightTiles * TILE;
    this.x = left + w / 2;
    this.y = top + h;

    const field = level.add.graphics();
    field.fillStyle(0xb06aff, 0.3);
    field.fillRect(left, top, w, h);
    for (let i = 0; i < 5; i++) {
      field.fillStyle(0xe2c8ff, 0.5);
      field.fillRect(left + 4 + i * 13, top, 2, h);
    }
    field.lineStyle(3, 0xffd166, 0.9);
    field.strokeRect(left, top, w, h);
    level.tweens.add({ targets: field, alpha: 0.65, duration: 700, yoyo: true, repeat: -1 });

    const midY = top + h / 2;
    const parts: Phaser.GameObjects.GameObject[] = [field];
    ARTIFACT_ORDER.forEach((id, i) => {
      const sy = midY + (i - 1) * 40;
      parts.push(level.add.circle(this.x, sy, 15, 0x1d1430, 0.9).setStrokeStyle(2, 0xffd166));
      const icon = level.add.image(this.x, sy, ARTIFACTS[id].texture).setScale(0.75).setTint(0x333344).setAlpha(0.6);
      this.slots.push(icon);
      parts.push(icon);
    });
    parts.push(
      level.add
        .text(this.x, top + 18, 'SOMENTE COM\nOS 3 ARTEFATOS.', {
          fontFamily: UI_FONT,
          fontSize: '13px',
          fontStyle: 'bold',
          color: '#ffe9a8',
          stroke: '#2a1d4a',
          strokeThickness: 4,
          align: 'center',
        })
        .setOrigin(0.5, 0),
    );
    this.visual = level.add.container(0, 0, parts).setDepth(DEPTH.DECOR);

    const zone = level.add.zone(this.x, top + h / 2, w - 8, h);
    level.physics.add.existing(zone, true);
    this.body = zone.body as Phaser.Physics.Arcade.StaticBody;
    level.physics.add.collider(level.player, zone, () => this.tryOpen(false));
    level.registerInteractable(this);
  }

  getPromptY(): number {
    return this.y - 4;
  }

  canInteract(): boolean {
    return !this.opened && !this.opening;
  }

  interact(): void {
    this.tryOpen(true);
  }

  private missing(): ArtifactId[] {
    const owned = SaveSystem.load().artifacts;
    return ARTIFACT_ORDER.filter((id) => !owned.includes(id));
  }

  private tryOpen(explicit: boolean): void {
    if (this.opened || this.opening) return;
    const missing = this.missing();
    if (missing.length === 0) {
      this.open();
      return;
    }
    const now = this.level.time.now;
    if (!explicit && now - this.lastHintAt < 3000) return;
    this.lastHintAt = now;
    this.level.showMessage(`Faltam: ${missing.map((id) => ARTIFACTS[id].name).join(', ')}.`, { color: '#c9b8ff', duration: 2200 });
  }

  private open(): void {
    this.opening = true;
    this.level.player.freeze();
    this.slots.forEach((icon, i) => {
      this.level.time.delayedCall(350 + i * 450, () => {
        icon.clearTint().setAlpha(1);
        this.level.tweens.add({ targets: icon, scale: 1.2, duration: 150, yoyo: true });
        this.level.spawnSparkles(icon.x, icon.y, ARTIFACTS[ARTIFACT_ORDER[i]].glowColor, 12);
        AudioManager.playSfx(this.level, SFX.COLLECT);
      });
    });
    this.level.time.delayedCall(1900, () => {
      this.opened = true;
      this.body.enable = false;
      this.level.cameras.main.shake(400, 0.008);
      this.level.cameras.main.flash(300, 230, 200, 255);
      AudioManager.playSfx(this.level, SFX.DOOR);
      this.level.tweens.add({ targets: this.visual, alpha: 0, duration: 600 });
      this.level.player.endCelebration();
      this.level.showMessage('A barreira se desfez!', { color: '#ffd166' });
    });
  }
}
