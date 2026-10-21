import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { GameOverScene } from '../scenes/GameOverScene';
import { Level1Scene } from '../scenes/Level1Scene';
import { Level2Scene } from '../scenes/Level2Scene';
import { Level3Scene } from '../scenes/Level3Scene';
import { Level4Scene } from '../scenes/Level4Scene';
import { EndingScene } from '../scenes/EndingScene';
import { LevelCompleteScene } from '../scenes/LevelCompleteScene';
import { MenuScene } from '../scenes/MenuScene';
import { WorldMapScene } from '../scenes/WorldMapScene';
import { PauseScene } from '../scenes/PauseScene';
import { TestLevelScene } from '../scenes/TestLevelScene';
import { GAME_HEIGHT, GAME_WIDTH, WORLD_GRAVITY } from './constants';

/** Abra o jogo com ?debug na URL para ver as hitboxes. */
const DEBUG_PHYSICS = new URLSearchParams(window.location.search).has('debug');

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#1d1b3a',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  scale: {
    // Mantém a proporção 16:9 e encaixa em qualquer tela (desktop, tablet, celular).
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: WORLD_GRAVITY },
      debug: DEBUG_PHYSICS,
    },
  },
  input: {
    // Vários dedos ao mesmo tempo (andar + pular nos controles touch futuros).
    activePointers: 3,
  },
  render: {
    roundPixels: true,
  },
  // A primeira cena da lista inicia automaticamente. Overlays (pausa, derrota...) ficam por último.
  scene: [BootScene, MenuScene, WorldMapScene, Level1Scene, Level2Scene, Level3Scene, Level4Scene, TestLevelScene, PauseScene, GameOverScene, LevelCompleteScene, EndingScene],
};
