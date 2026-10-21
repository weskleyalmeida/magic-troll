import Phaser from 'phaser';
import { TEXTURES } from '../config/assetKeys';
import { ARTIFACT_ORDER, ARTIFACTS, type ArtifactId } from '../config/artifacts';
import { DEPTH, GAME_WIDTH, UI_FONT } from '../config/constants';
import { formatTime } from '../utils/format';

/** HUD compacto: vida, moedas, artefatos e tempo. Fixo na tela (scrollFactor 0). */
export class HUD {
  private hearts: Phaser.GameObjects.Image[] = [];
  private coinText: Phaser.GameObjects.Text;
  private timeText: Phaser.GameObjects.Text;
  private artifactIcons = new Map<ArtifactId, Phaser.GameObjects.Image>();

  constructor(scene: Phaser.Scene, maxHealth: number) {
    const fix = <T extends Phaser.GameObjects.Components.ScrollFactor & Phaser.GameObjects.Components.Depth>(obj: T): T => {
      obj.setScrollFactor(0);
      obj.setDepth(DEPTH.HUD);
      return obj;
    };

    const panel = fix(scene.add.graphics());
    panel.fillStyle(0x000000, 0.25);
    panel.fillRoundedRect(13, 13, 200, 66, 12);
    panel.fillStyle(0x1c1446, 0.8);
    panel.fillRoundedRect(10, 10, 200, 66, 12);
    panel.lineStyle(2, 0xffd166, 0.75);
    panel.strokeRoundedRect(10, 10, 200, 66, 12);
    panel.lineStyle(1, 0xffffff, 0.15);
    panel.lineBetween(18, 43, 202, 43);

    for (let i = 0; i < maxHealth; i++) {
      this.hearts.push(fix(scene.add.image(30 + i * 26, 28, TEXTURES.HEART_FULL).setScale(1.2)));
    }

    fix(scene.add.image(30, 58, TEXTURES.COIN));
    this.coinText = fix(
      scene.add
        .text(44, 58, 'x 0', { fontFamily: UI_FONT, fontSize: '18px', fontStyle: 'bold', color: '#ffffff' })
        .setOrigin(0, 0.5),
    );

    ARTIFACT_ORDER.forEach((id, i) => {
      const icon = fix(scene.add.image(122 + i * 28, 58, ARTIFACTS[id].texture).setScale(0.65));
      this.artifactIcons.set(id, icon);
    });

    this.timeText = fix(
      scene.add
        .text(GAME_WIDTH - 72, 36, '00:00', {
          fontFamily: UI_FONT,
          fontSize: '20px',
          fontStyle: 'bold',
          color: '#ffffff',
          stroke: '#2b1a4a',
          strokeThickness: 4,
        })
        .setOrigin(1, 0.5),
    );
  }

  setHealth(health: number): void {
    this.hearts.forEach((heart, i) => {
      const full = i < health;
      const wasFull = heart.texture.key === TEXTURES.HEART_FULL;
      heart.setTexture(full ? TEXTURES.HEART_FULL : TEXTURES.HEART_EMPTY);
      if (wasFull && !full) {
        heart.scene.tweens.add({ targets: heart, scale: 1.7, duration: 120, yoyo: true });
      }
    });
  }

  setCoins(coins: number): void {
    this.coinText.setText(`x ${coins}`);
  }

  /** Artefatos não obtidos aparecem como silhuetas apagadas. */
  setArtifacts(owned: readonly string[]): void {
    this.artifactIcons.forEach((icon, id) => {
      if (owned.includes(id)) icon.clearTint().setAlpha(1);
      else icon.setTint(0x333344).setAlpha(0.5);
    });
  }

  setTime(ms: number): void {
    this.timeText.setText(formatTime(ms));
  }
}
