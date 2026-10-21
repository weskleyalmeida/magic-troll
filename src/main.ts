import Phaser from 'phaser';
import { gameConfig } from './game/config/gameConfig';

const game = new Phaser.Game(gameConfig);

// Só em desenvolvimento: permite inspecionar o jogo pelo console do navegador (window.__game).
if (import.meta.env.DEV) {
  (window as unknown as { __game: Phaser.Game }).__game = game;
}
