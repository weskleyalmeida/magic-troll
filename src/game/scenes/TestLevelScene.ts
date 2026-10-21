import { SCENES } from '../config/sceneKeys';
import { BaseLevelScene, type LevelLayout } from './BaseLevelScene';

/**
 * Cenário de teste para calibrar movimento, pulo, colisão e câmera.
 * Mundo de 94 x 22 tiles (3008 x 704 px). O chão fica na linha 19.
 * Altura máxima do pulo ≈ 4 tiles; distância horizontal ≈ 7 tiles.
 */
export class TestLevelScene extends BaseLevelScene {
  constructor() {
    super(SCENES.TEST_LEVEL);
  }

  protected getLayout(): LevelLayout {
    return { widthTiles: 94, heightTiles: 22, spawn: { tx: 3, ty: 17 } };
  }

  protected createBackground(): void {
    this.addSkyGradient(0x7ec8ff, 0xe3f6ff);
    this.addClouds(0.15, 6);
    this.addDistantCastle(820, 430, 0.1);
    this.addHills(0x9ad69a, 0.3, 430, 30);
    this.addHills(0x6dbb73, 0.5, 500, 24, 0.012);
  }

  protected buildLevel(): void {
    // --- Chão (com dois buracos para testar queda/respawn) ---
    this.addGround(0, 19, 21, 3);
    this.addGround(24, 19, 22, 3);
    this.addGround(49, 19, 45, 3);

    // --- Seção 1: escada de plataformas atravessáveis ---
    this.addWorldText(4, 14,'Plataformas de madeira:\npule por baixo delas!');
    this.addWoodPlatform(6, 16, 4);
    this.addWoodPlatform(12, 13, 4);
    this.addWoodPlatform(18, 10, 4);

    // --- Seção 2: obstáculos sólidos ---
    this.addStone(29, 17, 2, 2);
    this.addStone(36, 16, 2, 3);
    this.addWoodPlatform(40, 15, 4);
    this.addWoodPlatform(46, 16, 3); // sobre o segundo buraco

    // --- Seção 3: parede alta e subida ---
    this.addWorldText(52, 15, 'Segure o pulo\npara ir mais alto');
    this.addStone(55, 16, 3, 3);
    this.addWoodPlatform(60, 13, 5);
    this.addWoodPlatform(67, 10, 5);
    this.addStone(74, 12, 4, 1);
    this.addStone(80, 16, 2, 3);

    this.addWorldText(89, 19, 'FIM DO TESTE\n(a Fase 1 começa aqui em breve)', '#ffd166');
  }
}
