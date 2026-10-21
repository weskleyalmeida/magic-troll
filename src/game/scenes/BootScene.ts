import Phaser from 'phaser';
import { registerAnimations } from '../config/animations';
import { SCENES } from '../config/sceneKeys';
import { createPlaceholderTextures } from '../utils/placeholderTextures';

/**
 * Carrega (ou gera) todos os assets globais e registra animações.
 * Para usar arte real: carregue em preload() com as chaves de assetKeys.ts, ex.:
 *   this.load.spritesheet(TEXTURES.PLAYER, 'assets/player/player.png', { frameWidth: 32, frameHeight: 44 });
 *   this.load.audio(SFX.JUMP, 'assets/audio/jump.ogg');
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.BOOT);
  }

  preload(): void {
    // Nenhum arquivo externo ainda.
  }

  create(): void {
    createPlaceholderTextures(this);
    registerAnimations(this.anims);

    // Atalho de desenvolvimento: ?level=Level1Scene pula o menu (só em `npm run dev`; no jogo
    // publicado as fases precisam ser desbloqueadas no mapa).
    const requested = import.meta.env.DEV ? new URLSearchParams(window.location.search).get('level') : null;
    const isKnownScene = (Object.values(SCENES) as string[]).includes(requested ?? '');
    this.scene.start(requested && isKnownScene ? requested : SCENES.MENU);
  }
}
