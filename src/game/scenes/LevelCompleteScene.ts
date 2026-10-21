import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, UI_FONT } from '../config/constants';
import { getNextLevel } from '../config/levels';
import { SCENES } from '../config/sceneKeys';
import { TextButton } from '../ui/TextButton';
import { formatTime } from '../utils/format';
import type { LevelCompleteData } from './BaseLevelScene';

/** Tela de vitória da fase: estatísticas + PRÓXIMA FASE / REPETIR / MENU. */
export class LevelCompleteScene extends Phaser.Scene {
  private info!: LevelCompleteData;

  constructor() {
    super(SCENES.LEVEL_COMPLETE);
  }

  init(data: LevelCompleteData): void {
    this.info = data;
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    const { stats, score, newRecord, levelKey } = this.info;

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x140c30, 0.85).setOrigin(0);
    this.add
      .text(cx, 80, 'FASE CONCLUÍDA!', {
        fontFamily: UI_FONT,
        fontSize: '52px',
        fontStyle: 'bold',
        color: '#ffd166',
        stroke: '#3b1d7a',
        strokeThickness: 8,
      })
      .setOrigin(0.5);

    const lines = [
      `Tempo: ${formatTime(stats.elapsedMs)}${newRecord ? '   ★ NOVO RECORDE!' : ''}`,
      `Moedas: ${stats.coins} / ${stats.totalCoins}`,
      `Mortes: ${stats.deaths}`,
      `Dano recebido: ${stats.damageTaken}`,
      '',
      `PONTUAÇÃO: ${score}`,
    ];
    this.add
      .text(cx, 225, lines.join('\n'), {
        fontFamily: UI_FONT,
        fontSize: '22px',
        color: '#ffffff',
        align: 'center',
        lineSpacing: 6,
      })
      .setOrigin(0.5);

    const next = getNextLevel(levelKey);
    if (next) {
      new TextButton(this, cx, 370, 'PRÓXIMA FASE', () => {
        this.scene.stop(levelKey);
        this.scene.start(next.sceneKey);
      });
    } else {
      this.add
        .text(cx, 370, 'Próxima fase: em breve...', { fontFamily: UI_FONT, fontSize: '22px', color: '#c9b8ff' })
        .setOrigin(0.5);
    }
    new TextButton(this, cx, 435, 'REPETIR FASE', () => this.scene.start(levelKey));
    new TextButton(this, cx, 500, 'MAPA DAS FASES', () => {
      this.scene.stop(levelKey);
      this.scene.start(SCENES.WORLD_MAP);
    });
  }
}
