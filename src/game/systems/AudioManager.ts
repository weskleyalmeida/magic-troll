import Phaser from 'phaser';
import { SaveSystem } from './SaveSystem';

/**
 * Ponto único para tocar sons. Se o arquivo ainda não foi carregado (placeholder),
 * simplesmente não toca nada — assim o jogo já pode chamar os sons desde agora.
 */
export const AudioManager = {
  playSfx(scene: Phaser.Scene, key: string, config: Phaser.Types.Sound.SoundConfig = {}): void {
    if (!scene.cache.audio.exists(key)) return;
    const volume = SaveSystem.load().settings.sfxVolume * (config.volume ?? 1);
    scene.sound.play(key, { ...config, volume });
  },

  playMusic(scene: Phaser.Scene, key: string): void {
    if (!scene.cache.audio.exists(key)) return;
    const current = scene.sound.get(key);
    if (current?.isPlaying) return;
    scene.sound.stopAll();
    scene.sound.play(key, { loop: true, volume: SaveSystem.load().settings.musicVolume });
  },
};
