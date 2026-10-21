import Phaser from 'phaser';
import { ANIMS, TEXTURES } from '../config/assetKeys';
import { GAME_HEIGHT, GAME_WIDTH, UI_FONT } from '../config/constants';
import { SCENES } from '../config/sceneKeys';
import { TextButton } from '../ui/TextButton';
import { formatTime } from '../utils/format';
import type { LevelCompleteData } from './BaseLevelScene';

/**
 * Final do jogo: o aventureiro entra no salão principal do castelo.
 * "VOCÊ CONSEGUIU!" → "MAS..." → pausa → "SERÁ QUE VOCÊ ENCONTROU TODOS OS SEGREDOS? 👀"
 */
export class EndingScene extends Phaser.Scene {
  private info!: LevelCompleteData;

  constructor() {
    super(SCENES.ENDING);
  }

  init(data: LevelCompleteData): void {
    this.info = data;
  }

  create(): void {
    this.scene.stop(this.info.levelKey);
    this.cameras.main.fadeIn(800, 20, 10, 40);
    this.drawHall();

    // O herói entra andando no salão.
    const hero = this.add.sprite(-40, 452, TEXTURES.PLAYER_IDLE).setScale(2).setOrigin(0.5, 1).setDepth(5);
    hero.play(ANIMS.PLAYER_WALK);
    this.tweens.add({
      targets: hero,
      x: GAME_WIDTH / 2 - 120,
      duration: 2600,
      ease: 'Sine.easeOut',
      onComplete: () => {
        hero.stop();
        hero.setTexture(TEXTURES.PLAYER_CELEBRATE);
        this.tweens.add({ targets: hero, y: 430, duration: 220, yoyo: true, repeat: 2 });
        this.runTexts();
      },
    });
  }

  private runTexts(): void {
    const cx = GAME_WIDTH / 2;
    const big = this.title(cx, 150, 'VOCÊ CONSEGUIU!', 64, '#ffd166');
    this.pop(big);
    this.confetti();

    this.time.delayedCall(2600, () => {
      this.tweens.add({ targets: big, alpha: 0, duration: 400 });
      const but = this.title(cx, 150, 'MAS...', 56, '#ffffff');
      this.pop(but);

      // pausa dramática
      this.time.delayedCall(2600, () => {
        this.tweens.add({ targets: but, alpha: 0, duration: 400 });
        const secret = this.title(cx, 150, 'SERÁ QUE VOCÊ ENCONTROU\nTODOS OS SEGREDOS? 👀', 36, '#c9b8ff');
        this.pop(secret);
        this.time.delayedCall(2400, () => this.showSummary());
      });
    });
  }

  private showSummary(): void {
    const cx = GAME_WIDTH / 2;
    const { stats, score } = this.info;
    const panel = this.add.rectangle(cx, 300, 360, 140, 0x140c30, 0.82).setStrokeStyle(3, 0xffd166).setDepth(10);
    const text = this.add
      .text(
        cx,
        300,
        [`Castelo: ${formatTime(stats.elapsedMs)}`, `Moedas: ${stats.coins} / ${stats.totalCoins}`, `Mortes: ${stats.deaths}`, `PONTUAÇÃO: ${score}`].join('\n'),
        { fontFamily: UI_FONT, fontSize: '20px', color: '#ffffff', align: 'center', lineSpacing: 6 },
      )
      .setOrigin(0.5)
      .setDepth(11);
    [panel, text].forEach((o) => o.setAlpha(0));
    this.tweens.add({ targets: [panel, text], alpha: 1, duration: 500 });

    new TextButton(this, cx - 140, 500, 'MAPA DAS FASES', () => this.scene.start(SCENES.WORLD_MAP), 240).setDepth(12);
    new TextButton(this, cx + 140, 500, 'MENU', () => this.scene.start(SCENES.MENU), 240).setDepth(12);
  }

  private drawHall(): void {
    const g = this.add.graphics();
    g.fillGradientStyle(0x3a1f3a, 0x3a1f3a, 0x8a5a3a, 0x8a5a3a, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.add.tileSprite(0, 0, GAME_WIDTH, 452, TEXTURES.BG_CASTLE_WALL).setOrigin(0).setAlpha(0.55);
    this.add.tileSprite(0, 452, GAME_WIDTH, GAME_HEIGHT - 452, TEXTURES.TILE_CASTLE_BRICK).setOrigin(0);
    this.add.tileSprite(0, 452, GAME_WIDTH, 32, TEXTURES.TILE_CASTLE_FLOOR).setOrigin(0);
    this.add.rectangle(GAME_WIDTH / 2, 456, 520, 10, 0xc23a4a).setStrokeStyle(2, 0xe3b04a);

    [120, 360, 600, 840].forEach((x) => this.add.image(x, 60, TEXTURES.BANNER).setOrigin(0.5, 0).setScale(1.3));
    [240, 720].forEach((x) => {
      this.add.image(x, 0, TEXTURES.CHANDELIER).setOrigin(0.5, 0).setScale(1.5);
      const glow = this.add.circle(x, 40, 90, 0xffd27a, 0.18).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: glow, alpha: 0.08, duration: 900, yoyo: true, repeat: -1 });
    });
    this.add.image(GAME_WIDTH / 2 + 290, 452, TEXTURES.THRONE).setOrigin(0.5, 1).setScale(1.6);
    // luz dourada vinda de cima
    const light = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    light.fillStyle(0xfff2c8, 0.08);
    light.fillTriangle(GAME_WIDTH / 2 + 290, 0, GAME_WIDTH / 2 + 110, 452, GAME_WIDTH / 2 + 470, 452);
  }

  private title(x: number, y: number, text: string, size: number, color: string): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, text, {
        fontFamily: UI_FONT,
        fontSize: `${size}px`,
        fontStyle: 'bold',
        color,
        stroke: '#2a1660',
        strokeThickness: 10,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(20);
  }

  private pop(obj: Phaser.GameObjects.Text): void {
    obj.setScale(0.4).setAlpha(0);
    this.tweens.add({ targets: obj, scale: 1, alpha: 1, duration: 450, ease: 'Back.easeOut' });
  }

  private confetti(): void {
    const colors = [0xffd166, 0xff6b6b, 0x7ad7ff, 0x7affb0, 0xc77dff];
    for (let i = 0; i < 70; i++) {
      const piece = this.add
        .rectangle(Phaser.Math.Between(0, GAME_WIDTH), Phaser.Math.Between(-200, -10), 6, 10, Phaser.Utils.Array.GetRandom(colors))
        .setDepth(15);
      this.tweens.add({
        targets: piece,
        y: GAME_HEIGHT + 20,
        x: piece.x + Phaser.Math.Between(-80, 80),
        angle: Phaser.Math.Between(-360, 360),
        duration: Phaser.Math.Between(2200, 4200),
        delay: Phaser.Math.Between(0, 1500),
        onComplete: () => piece.destroy(),
      });
    }
  }
}
