import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, UI_FONT } from '../config/constants';
import { SCENES } from '../config/sceneKeys';
import { TextButton } from '../ui/TextButton';
import type { BaseLevelScene } from './BaseLevelScene';

const TAUNTS = [
  'O jogo te enganou?',
  'Ninguém viu. Talvez.',
  'Faz parte do treinamento.',
  'A floresta agradece a visita.',
  'Era uma armadilha. Óbvio.',
];

/** Overlay de derrota. "Tentar novamente" volta ao último checkpoint (sem reiniciar a fase). */
export class GameOverScene extends Phaser.Scene {
  private levelKey = '';

  constructor() {
    super(SCENES.GAME_OVER);
  }

  init(data: { levelKey: string }): void {
    this.levelKey = data.levelKey;
  }

  create(): void {
    const cx = GAME_WIDTH / 2;

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x1a0010, 0.7).setOrigin(0);
    this.add
      .text(cx, 150, 'VOCÊ MORREU', {
        fontFamily: UI_FONT,
        fontSize: '60px',
        fontStyle: 'bold',
        color: '#ff6b6b',
        stroke: '#3b1d7a',
        strokeThickness: 8,
      })
      .setOrigin(0.5);
    this.add
      .text(cx, 215, Phaser.Utils.Array.GetRandom(TAUNTS), { fontFamily: UI_FONT, fontSize: '22px', color: '#ffd6e0' })
      .setOrigin(0.5);

    new TextButton(this, cx, 310, 'TENTAR NOVAMENTE', () => this.retry(), 300);
    new TextButton(this, cx, 380, 'MAPA DAS FASES', () => {
      this.scene.stop(this.levelKey);
      this.scene.start(SCENES.WORLD_MAP);
    }, 300);
  }

  private retry(): void {
    const level = this.scene.get(this.levelKey) as BaseLevelScene;
    level.retryFromCheckpoint();
    this.scene.resume(this.levelKey);
    this.scene.stop();
  }
}
