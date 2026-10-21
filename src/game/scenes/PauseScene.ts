import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, UI_FONT } from '../config/constants';
import { SCENES } from '../config/sceneKeys';
import { TextButton } from '../ui/TextButton';

interface PauseData {
  levelKey: string;
}

/** Overlay lançado por cima da fase pausada. */
export class PauseScene extends Phaser.Scene {
  private levelKey = '';

  constructor() {
    super(SCENES.PAUSE);
  }

  init(data: PauseData): void {
    this.levelKey = data.levelKey;
  }

  create(): void {
    const cx = GAME_WIDTH / 2;

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6).setOrigin(0);
    this.add
      .text(cx, 130, 'PAUSADO', {
        fontFamily: UI_FONT,
        fontSize: '56px',
        fontStyle: 'bold',
        color: '#ffd166',
        stroke: '#3b1d7a',
        strokeThickness: 8,
      })
      .setOrigin(0.5);

    new TextButton(this, cx, 250, 'CONTINUAR', () => this.resumeLevel());
    new TextButton(this, cx, 320, 'REINICIAR FASE', () => this.scene.start(this.levelKey));
    new TextButton(this, cx, 390, 'MAPA DAS FASES', () => {
      this.scene.stop(this.levelKey);
      this.scene.start(SCENES.WORLD_MAP);
    });

    // Ignora a auto-repetição de ESC segurado (senão despausaria na hora).
    this.input.keyboard?.on('keydown-ESC', (event: KeyboardEvent) => {
      if (!event.repeat) this.resumeLevel();
    });
  }

  private resumeLevel(): void {
    this.scene.resume(this.levelKey);
    this.scene.stop();
  }
}
