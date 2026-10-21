import Phaser from 'phaser';
import { TEXTURES } from '../config/assetKeys';
import { DEPTH, TILE } from '../config/constants';
import { SCENES } from '../config/sceneKeys';
import { SWAMP_THEME } from '../config/terrainThemes';
import type { MagicGate } from '../components/MagicGate';
import type { Sign } from '../components/Sign';
import type { InputState } from '../systems/InputController';
import { addFireflies, addForegroundFog, addSwampBackdrop } from '../utils/backdrops';
import { BaseLevelScene, type LevelLayout } from './BaseLevelScene';

/**
 * FASE 2 — PÂNTANO DAS ILUSÕES
 * Lição: "as informações mentem".
 *
 * O jogador começa NO MEIO do mapa (150 x 24 tiles, superfície na linha 15).
 * A placa diz "A CHAVE ESTÁ À DIREITA →"... e mente.
 *
 *  CENTRO  [52-73]   Início. Portão mágico trancado (emblema da LUA) com o portal de saída atrás.
 *                    À esquerda, uma ruína enorme: a parte de baixo é uma ILUSÃO (treme!).
 *  DIREITA [74-149]  O caminho "certo" segundo a placa: ilusões, plataformas fantasmas,
 *                    plataforma móvel, fantasmas. Termina num beco: "Eu disse direita...
 *                    da outra perspectiva." + porta mágica que leva de volta ao início.  [cp 110]
 *  ESQUERDA [0-51]   O caminho real: plataformas invisíveis (pista: vagalumes) sobre o pântano,
 *                    sala das 3 portas (☀ ⭐ 🌙 — só a lua não mente) e a câmara da CHAVE.  [cp 40, 16]
 *
 * Ao pegar a chave, o portão do centro abre e a porta da câmara leva de volta ao centro.
 */
export class Level2Scene extends BaseLevelScene {
  protected terrainTheme = SWAMP_THEME;

  private keyFound = false;
  private gate!: MagicGate;
  private hubSign!: Sign;
  private fog!: Phaser.GameObjects.TileSprite;

  constructor() {
    super(SCENES.LEVEL_2);
  }

  protected getLayout(): LevelLayout {
    return { widthTiles: 150, heightTiles: 24, spawn: { tx: 65, ty: 13 } };
  }

  protected createBackground(): void {
    addSwampBackdrop(this, this.worldWidth);
    addFireflies(this, this.worldWidth, this.worldHeight, 45, 0x9dffc8);
  }

  protected onLevelUpdate(_input: InputState, _time: number, delta: number): void {
    this.fog.tilePositionX += delta * 0.01;
  }

  protected buildLevel(): void {
    this.keyFound = false;

    this.buildKeyChamber();
    this.buildDoorRoom();
    this.buildInvisibleCrossing();
    this.buildCenter();
    this.buildRightPath();

    this.fog = addForegroundFog(this, this.worldWidth, 0.28);
  }

  // ---------------------------------------------------------------------------
  // ESQUERDA — câmara da chave (só se chega pela porta da LUA)
  // ---------------------------------------------------------------------------
  private buildKeyChamber(): void {
    this.add
      .tileSprite(0, 2 * TILE, 18 * TILE, 13 * TILE, TEXTURES.BG_CAVE)
      .setOrigin(0)
      .setTint(0xb8a8ff)
      .setDepth(DEPTH.CAVE_BACKDROP);

    this.addStone(0, 0, 18, 2); // teto
    this.addStone(0, 9, 18, 2); // chão da câmara = teto da sala das portas
    this.addStone(17, 2, 1, 7); // parede direita (câmara selada)

    this.addWoodPlatform(11, 7, 2);
    this.addPhasePlatform(7, 6, 2, 2600, 0);
    this.addWoodPlatform(3, 5, 2);
    this.addIllusoryPlatform(12, 5, 2); // isca: parece um atalho

    this.addCoinRow(7, 4, 2);
    this.addCoin(11, 6);
    this.addGhost(9, 3, 6);

    this.addArtifact(3, 4, 'key');
    this.addMagicDoor(16, 9, 65, 13, { symbol: TEXTURES.SYMBOL_MOON, message: 'De volta ao centro do pântano.' });

    this.addDeco(1, 9, TEXTURES.DECO_RUIN, { scale: 0.8 });
    this.addDeco(14, 9, TEXTURES.DECO_MUSHROOM, { tint: 0x9dffc8 });
  }

  // ---------------------------------------------------------------------------
  // ESQUERDA — sala das 3 portas (duas mentem)
  // ---------------------------------------------------------------------------
  private buildDoorRoom(): void {
    this.addGround(0, 15, 18, 9);

    const back = { tx: 16, ty: 13 };
    this.addMagicDoor(4, 15, back.tx, back.ty, { symbol: TEXTURES.SYMBOL_SUN, message: 'Hmm... isso parece familiar.' });
    this.addMagicDoor(8, 15, back.tx, back.ty, { symbol: TEXTURES.SYMBOL_STAR, message: 'Essa porta mentiu.' });
    this.addMagicDoor(12, 15, 13, 8, { symbol: TEXTURES.SYMBOL_MOON, message: 'A lua não mente.' });

    this.addSign(14, 15, 'Só uma porta leva adiante.\nAs outras mentem.');
    this.addCheckpoint(16, 15);
    this.addDeco(1, 15, TEXTURES.DECO_RUIN, { scale: 0.9 });
  }

  // ---------------------------------------------------------------------------
  // ESQUERDA — travessia invisível sobre o pântano
  // ---------------------------------------------------------------------------
  private buildInvisibleCrossing(): void {
    this.addWater(18, 15, 16, 9, 'swamp');
    this.addLilies([19, 25, 29, 33]);

    // PISTA: vagalumes pousados em cima de cada plataforma.
    this.addInvisiblePlatform(30, 13, 2);
    this.addInvisiblePlatform(26, 12, 2);
    this.addInvisiblePlatform(22, 13, 2);
    this.addCoin(26, 10);
    this.addCoin(27, 10);

    this.addGhost(25, 9, 6);
  }

  // ---------------------------------------------------------------------------
  // CENTRO — início, ruína ilusória e portão trancado
  // ---------------------------------------------------------------------------
  private buildCenter(): void {
    this.addGround(34, 15, 40, 9);

    this.addSign(36, 15, 'Acredite no que não vê.');
    this.addCheckpoint(40, 15);

    // Ruína: a parte de cima é real; a de baixo é ILUSÃO (treme e solta faíscas roxas).
    this.addStone(44, 4, 8, 8);
    this.addFakeWall(44, 12, 8, 3, TEXTURES.TILE_STONE, 'A parede era uma ilusão!', true);

    // Nicho do portão: teto, parede, piso elevado. O portal de saída fica atrás das grades.
    this.addStone(52, 5, 8, 1);
    this.addStone(52, 6, 2, 5);
    this.addStone(52, 11, 10, 1);
    this.addExitPortal(56, 11);
    this.gate = this.addMagicGate(59, 6, 5, TEXTURES.SYMBOL_MOON, () => this.keyFound, 'SOMENTE COM A CHAVE ARCANA.');
    this.addWoodPlatform(62, 13, 2);

    this.hubSign = this.addSign(67, 15, 'A CHAVE ESTÁ À DIREITA →');
    this.addSign(71, 15, 'Dica do pântano:\no que é ilusão... treme.');

    this.addDeco(38, 15, TEXTURES.DECO_SWAMP_TREE);
    this.addDeco(69, 15, TEXTURES.DECO_SWAMP_TREE, { flipX: true, scale: 0.9 });
    this.addDeco(42, 15, TEXTURES.DECO_RUIN, { scale: 0.7 });
    this.addDeco(64, 15, TEXTURES.DECO_MUSHROOM, { tint: 0x9dffc8 });
    this.addDeco(72, 15, TEXTURES.DECO_MUSHROOM, { tint: 0xc9b8ff, scale: 1.2 });
    this.addCoinRow(54, 14, 3);
  }

  // ---------------------------------------------------------------------------
  // DIREITA — o caminho que a placa manda seguir
  // ---------------------------------------------------------------------------
  private buildRightPath(): void {
    // Pântano 1: a pedra do meio é ilusão. Dá para pular direto da 1ª para a 3ª.
    this.addWater(74, 15, 12, 9, 'swamp');
    this.addWoodPlatform(76, 13, 2);
    this.addIllusoryPlatform(79, 12, 2);
    this.addWoodPlatform(82, 13, 2);
    this.addCoinRow(79, 10, 2);
    this.addLilies([75, 81, 85]);

    // Ilha com fantasma e cogumelo.
    this.addGround(86, 15, 8, 9);
    this.addGhost(90, 11, 7);
    this.addEnemy(91, 15, 87, 93);
    this.addDeco(88, 15, TEXTURES.DECO_RUIN, { scale: 0.8 });

    // Pântano 2: plataformas fantasmas (piscam antes de sumir).
    this.addWater(94, 15, 14, 9, 'swamp');
    this.addPhasePlatform(96, 13, 2, 2800, 0);
    this.addPhasePlatform(100, 12, 2, 2800, 700);
    this.addPhasePlatform(104, 13, 2, 2800, 1400);
    this.addCoin(100, 10);
    this.addCoin(101, 10);
    this.addLilies([95, 99, 103, 107]);

    this.addGround(108, 15, 10, 9);
    this.addCheckpoint(110, 15);
    this.addSign(113, 15, 'Quase lá!\nA chave deve estar logo ali →');
    this.addDeco(116, 15, TEXTURES.DECO_SWAMP_TREE, { scale: 0.85 });

    // Pântano 3: plataforma móvel + fantasma.
    this.addWater(118, 15, 14, 9, 'swamp');
    this.addMovingPlatform(119, 13, 3, 8, 0, 70);
    this.addGhost(125, 9, 6);
    this.addCoinRow(122, 11, 4);
    this.addLilies([120, 126, 130]);

    // O beco sem saída.
    this.addGround(132, 15, 18, 9);
    this.addChest(136, 15, 'coins', 5);
    this.addSign(141, 15, 'Eu disse direita...\nda outra perspectiva.');
    this.addSign(144, 15, 'Porta mágica:\nleva de volta ao começo.');
    this.addMagicDoor(146, 15, 65, 13, { symbol: TEXTURES.SYMBOL_STAR, message: 'De volta ao começo. De propósito.' });
    this.addDeco(134, 15, TEXTURES.DECO_SWAMP_TREE, { flipX: true });
    this.addDeco(148, 15, TEXTURES.DECO_RUIN);
  }

  // ---------------------------------------------------------------------------
  // Depois da chave: o portão abre e a placa do início se desculpa.
  // ---------------------------------------------------------------------------
  protected afterArtifactCollected(): void {
    this.keyFound = true;
    this.gate.open();
    this.hubSign.setMessage('A chave estava à ESQUERDA.\nEu sei. Desculpa.');
    this.showMessage('O portão do centro se abriu!', { color: '#c9b8ff', duration: 1800 });
    this.showMessage('(A porta da lua leva até lá.)', { duration: 1800 });
  }

  private addLilies(columns: number[]): void {
    columns.forEach((tx, i) =>
      this.add
        .image(this.tileCenterX(tx), 15 * TILE + 10, TEXTURES.DECO_LILY)
        .setFlipX(i % 2 === 1)
        .setDepth(DEPTH.FOREGROUND + 1),
    );
  }
}
