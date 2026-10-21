import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, UI_FONT } from '../config/constants';
import { SCENES } from '../config/sceneKeys';
import { TEXTURES } from '../config/assetKeys';
import { addFireflies, addForestBackdrop } from '../utils/backdrops';
import { TextButton } from '../ui/TextButton';

const HOW_TO_PLAY = [
  '← → ou A / D — mover',
  '↑ / W / ESPAÇO — pular (segure para pular mais alto)',
  'E — interagir',
  'ESC — pausar',
  '',
  'Encontre o artefato escondido em cada fase.',
  'E não confie em tudo que você vê...',
].join('\n');

const CREDITS = ['TROLL GAME', '', 'Desenvolvido com Phaser 3 + TypeScript + Vite', '', 'Arte e sons: placeholders (por enquanto!)'].join(
  '\n',
);

export class MenuScene extends Phaser.Scene {
  private mainButtons!: Phaser.GameObjects.Container;

  constructor() {
    super(SCENES.MENU);
  }

  create(): void {
    const cx = GAME_WIDTH / 2;

    addForestBackdrop(this, GAME_WIDTH);
    addFireflies(this, GAME_WIDTH, GAME_HEIGHT, 14);
    const shade = this.add.graphics();
    shade.fillGradientStyle(0x140c30, 0x140c30, 0x140c30, 0x140c30, 0.15, 0.15, 0.55, 0.55);
    shade.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.add
      .text(cx, 110, 'TROLL GAME', {
        fontFamily: UI_FONT,
        fontSize: '72px',
        fontStyle: 'bold',
        color: '#ffd166',
        stroke: '#3b1d7a',
        strokeThickness: 10,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 175, 'nem tudo é o que parece', { fontFamily: UI_FONT, fontSize: '20px', color: '#c9b8ff' })
      .setOrigin(0.5);

    // Mascote "flutuando" no menu.
    const mascot = this.add.image(cx, 240, TEXTURES.PLAYER_IDLE).setScale(2);
    this.tweens.add({ targets: mascot, y: 230, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.mainButtons = this.add.container(0, 0, [
      new TextButton(this, cx, 320, 'JOGAR', () => this.scene.start(SCENES.WORLD_MAP)),
      new TextButton(this, cx, 385, 'COMO JOGAR', () => this.showPanel('COMO JOGAR', HOW_TO_PLAY)),
      new TextButton(this, cx, 450, 'CRÉDITOS', () => this.showPanel('CRÉDITOS', CREDITS)),
    ]);
  }

  private showPanel(title: string, body: string): void {
    this.mainButtons.setVisible(false);
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const panel = this.add.container(0, 0);
    panel.add([
      this.add.rectangle(cx, cy, 640, 420, 0x1a1240, 0.95).setStrokeStyle(4, 0xffd166),
      this.add
        .text(cx, cy - 160, title, { fontFamily: UI_FONT, fontSize: '36px', fontStyle: 'bold', color: '#ffd166' })
        .setOrigin(0.5),
      this.add
        .text(cx, cy - 10, body, { fontFamily: UI_FONT, fontSize: '20px', color: '#ffffff', align: 'center', lineSpacing: 6 })
        .setOrigin(0.5),
      new TextButton(this, cx, cy + 160, 'VOLTAR', () => {
        panel.destroy();
        this.mainButtons.setVisible(true);
      }),
    ]);
  }
}
