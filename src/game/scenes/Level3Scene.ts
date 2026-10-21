import Phaser from 'phaser';
import { TEXTURES } from '../config/assetKeys';
import { DEPTH, TILE } from '../config/constants';
import { SCENES } from '../config/sceneKeys';
import { TOWER_THEME } from '../config/terrainThemes';
import type { DecoyArtifact } from '../components/DecoyArtifact';
import type { MagicGate } from '../components/MagicGate';
import { SaveSystem } from '../systems/SaveSystem';
import { addFireflies, addTowerSky } from '../utils/backdrops';
import { BaseLevelScene, type LevelLayout } from './BaseLevelScene';

const BLUE = 0x7ad7ff;
const RED = 0xff7a7a;
const GREEN = 0x7affb0;

/**
 * FASE 3 — TORRE DO FEITICEIRO
 * Lição: "até os próprios objetivos podem ser falsos".
 *
 * Torre vertical de 30 x 100 tiles (a largura da tela). Andares a cada 12 linhas;
 * cada andar tem um ALÇAPÃO de madeira (atravessável por baixo, sólido por cima).
 *
 *  Andar 1 (96→84)  Subida de aprendizado.
 *  Andar 2 (84→72)  Elevador + runa que dispara orbes (pista: brilha antes).        [cp]
 *  Andar 3 (72→60)  2 portais: o espelho mostra o verdadeiro (azul). Vermelho → desce.
 *  Andar 4 (60→48)  Tábuas que desmoronam e plataforma fantasma sobre espinhos.     [cp]
 *  Andar 5 (48→36)  O FALSO Olho ("Ou não..."). Pista: treme como as ilusões.       [cp]
 *  Andar 6 (36→24)  3 portais; o espelho certo está numa saliência alta.            [cp]
 *  Andar 7 (24→12)  Pedestal vazio... mas no espelho o Olho aparece: ele é invisível.
 *                   Pegar o Olho verdadeiro abre o portão para o terraço.          [cp]
 *  Terraço (<12)    O castelo no horizonte + portal de saída.
 */
export class Level3Scene extends BaseLevelScene {
  protected terrainTheme = TOWER_THEME;

  private eyeFound = false;
  private roofSeen = false;
  private roofGate!: MagicGate;

  constructor() {
    super(SCENES.LEVEL_3);
  }

  protected getLayout(): LevelLayout {
    return { widthTiles: 30, heightTiles: 100, spawn: { tx: 5, ty: 94 } };
  }

  protected createBackground(): void {
    addTowerSky(this);
  }

  protected buildLevel(): void {
    this.eyeFound = false;
    this.roofSeen = false;

    // Fundo de tijolos do interior (cobre o céu até o terraço).
    this.add
      .tileSprite(2 * TILE, 12 * TILE, 26 * TILE, 88 * TILE, TEXTURES.BG_TOWER_WALL)
      .setOrigin(0)
      .setTilePosition(2 * TILE, 12 * TILE)
      .setDepth(DEPTH.CAVE_BACKDROP);
    addFireflies(this, this.worldWidth, this.worldHeight, 50, 0xffc98a);

    // Paredes da torre (terminam no terraço).
    this.addDirt(0, 12, 2, 88);
    this.addDirt(28, 12, 2, 88);

    this.addGround(2, 96, 26, 4);
    this.buildFloor1();
    this.buildFloor2();
    this.buildFloor3();
    this.buildFloor4();
    this.buildFloor5();
    this.buildFloor6();
    this.buildFloor7();
    this.buildRoof();
  }

  // ---------------------------------------------------------------------------
  // Andares
  // ---------------------------------------------------------------------------

  /** Andar 1: subida simples para aprender o ritmo da torre. */
  private buildFloor1(): void {
    this.floor(84, 20, 22);
    this.addSign(3, 96, 'Bem-vindo à Torre do Feiticeiro.\nO Olho está lá em cima.\nAcho.');
    this.addWoodPlatform(6, 93, 3);
    this.addWoodPlatform(11, 90, 3);
    // Regra da torre: sob cada alçapão há uma tábua 4 linhas abaixo do piso (espaço para o pulo).
    this.addWoodPlatform(15, 88, 8);
    this.addCoinRow(6, 92, 3);
    this.addCoinRow(11, 89, 3);
    this.addCoinRow(16, 87, 3);
    this.addWindow(14, 95);
    this.addDeco(24, 96, TEXTURES.BOOKSHELF);
    this.addCandle(9, 96);
    this.addCandle(20, 96);
  }

  /** Andar 2: elevador + runa atiradora. */
  private buildFloor2(): void {
    this.floor(72, 3, 6);
    this.addCheckpoint(12, 84);
    this.addMovingPlatform(4, 82, 3, 0, -8, 55);
    this.addTurret(28 * TILE - 10, 78, -1, 3200, 400);
    this.addFlyingBook(13, 79, 8, 18);
    this.addCoinRow(9, 81, 3);
    this.addWindow(22, 83);
    this.addDeco(17, 84, TEXTURES.BOOKSHELF);
    this.addCandle(8, 84);
    this.addCandle(24, 84);
    this.addRune(14, 75);
  }

  /** Andar 3: dois portais — o espelho mostra o verdadeiro. */
  private buildFloor3(): void {
    this.floor(60);
    // O espelho fica logo na chegada; o portal mais perto é o falso.
    this.addMirror(8, 71, [{ texture: TEXTURES.PORTAL, tint: BLUE, scale: 0.4 }]);
    this.addSign(10, 72, 'Portais mentem.\nEspelhos, não.');
    this.addTeleportPortal(14, 72, 12, 82, RED, 'Portal errado! Desce uma casa.');
    this.addTeleportPortal(22, 72, 4, 58, BLUE);
    this.addCoinRow(12, 65, 5);
    this.addWindow(5, 70);
    this.addCandle(16, 72);
    this.addCandle(12, 72);
  }

  /** Andar 4: tábuas que caem e plataforma fantasma sobre espinhos. */
  private buildFloor4(): void {
    this.floor(48, 19, 21);
    this.addCheckpoint(3, 60);
    this.addSpikes(6, 60, 13);
    this.addCrumblePlatform(7, 57, 2);
    this.addPhasePlatform(11, 54, 2, 2800, 0);
    this.addCrumblePlatform(15, 52, 2);
    this.addWoodPlatform(18, 52, 4);
    this.addCoin(11, 52);
    this.addCoin(12, 52);
    this.addWindow(24, 58);
    this.addDeco(25, 60, TEXTURES.BOOKSHELF);
    this.addRune(6, 52);
  }

  /** Andar 5: o FALSO Olho do Feiticeiro. */
  private buildFloor5(): void {
    this.floor(36, 24, 26);
    this.addCheckpoint(16, 48);

    // A ilha com o "Olho" (pista: ele treme e solta faíscas roxas, como as ilusões).
    this.addWoodPlatform(5, 45, 3);
    this.addStone(10, 43, 5, 1);
    this.addDecoyArtifact(12, 42, 'eye', (decoy) => this.onDecoyCollected(decoy));

    // Caminho real para cima, pela direita.
    this.addWoodPlatform(21, 45, 3);
    this.addCrumblePlatform(24, 42, 3);
    this.addWoodPlatform(25, 39, 2);
    this.addFlyingBook(13, 39, 6, 20);
    this.addCoinRow(21, 44, 3);
    this.addWindow(19, 47);
    this.addCandle(3, 48);
    this.addCandle(8, 48);
  }

  /** Andar 6: três portais; o espelho certo está escondido no alto. */
  private buildFloor6(): void {
    this.floor(24);
    this.addCheckpoint(22, 36);
    // O certo (verde) é o mais longe da chegada, perto do espelho escondido.
    this.addTeleportPortal(20, 36, 4, 58, RED, 'Portal errado! Lá embaixo de novo...');
    this.addTeleportPortal(14, 36, 16, 46, BLUE, 'Portal errado! Volta um andar.');
    this.addTeleportPortal(5, 36, 24, 22, GREEN, 'O espelho estava certo.');
    this.addSign(21, 36, 'Um espelho sabe o caminho.\nAche o espelho.');

    this.addWoodPlatform(9, 33, 3);
    this.addWoodPlatform(6, 31, 2);
    this.addStone(2, 29, 4, 1);
    this.addMirror(3, 29, [{ texture: TEXTURES.PORTAL, tint: GREEN, scale: 0.4 }]);
    this.addCoinRow(2, 28, 2);

    this.addTurret(28 * TILE - 10, 31, -1, 2400, 600);
    this.addFlyingBook(16, 30, 9, 23);
    this.addWindow(14, 34);
    this.addCandle(25, 36);
  }

  /** Andar 7: o Olho verdadeiro é invisível — só o espelho mostra. */
  private buildFloor7(): void {
    this.floor(12, 24, 26);
    this.addCheckpoint(26, 24);

    this.addStone(4, 22, 3, 2);
    this.addArtifact(5, 21, 'eye', true);
    this.addMirror(13, 23, [
      { texture: TEXTURES.TILE_STONE, dy: 12, scale: 0.6 },
      { texture: TEXTURES.ITEM_EYE, dy: -6, scale: 0.6 },
    ]);
    this.addSign(10, 24, 'Espelhos não mentem.');

    // Caminho até o portão do terraço.
    this.addWoodPlatform(17, 21, 3);
    this.addWoodPlatform(15, 18, 3);
    this.addStone(20, 17, 8, 1);
    this.roofGate = this.addMagicGate(22, 14, 3, TEXTURES.ITEM_EYE, () => this.eyeFound, 'SOMENTE COM O VERDADEIRO OLHO.');
    this.addWoodPlatform(24, 15, 3);

    this.addWindow(24, 22);
    this.addDeco(3, 22, TEXTURES.BOOKSHELF, { scale: 0.7 });
    this.addCandle(8, 24);
    this.addCandle(19, 24);
    this.addRune(9, 16);
  }

  /** Terraço: céu aberto, castelo no horizonte e o portal de saída. */
  private buildRoof(): void {
    [2, 6, 10, 14].forEach((tx) => this.addStone(tx, 10, 1, 2));
    this.addStone(27, 10, 1, 2);
    this.addExitPortal(18, 12);
    this.addCoinRow(7, 9, 3);

    const zone = this.add.zone(15 * TILE, 8 * TILE, 26 * TILE, 8 * TILE);
    this.physics.add.existing(zone, true);
    this.physics.add.overlap(this.player, zone, () => {
      if (this.roofSeen) return;
      this.roofSeen = true;
      this.showMessage('Lá está ele...', { color: '#ffd166', duration: 1600 });
      this.showMessage('O CASTELO.', { color: '#ffd166', duration: 2000 });
    });
  }

  // ---------------------------------------------------------------------------
  // Trollagens
  // ---------------------------------------------------------------------------

  private onDecoyCollected(decoy: DecoyArtifact): void {
    const owned = SaveSystem.load().artifacts;
    this.player.celebrate();
    this.cameras.main.flash(250, 255, 255, 220);
    this.hud.setArtifacts([...owned, 'eye']); // o HUD também "acredita"...

    this.showMessage('Você encontrou o Olho do Feiticeiro!', {
      color: '#ffd166',
      duration: 1800,
      onDone: () => {
        this.cameras.main.flash(400, 200, 120, 255);
        this.cameras.main.shake(300, 0.008);
        decoy.vanish(this);
        this.hud.setArtifacts(owned);
        this.showMessage('Ou não...', {
          color: '#c9b8ff',
          duration: 1600,
          onDone: () => {
            this.player.endCelebration();
            this.showMessage('Era uma ilusão. O verdadeiro Olho está mais acima.', { duration: 2200 });
          },
        });
      },
    });
  }

  protected afterArtifactCollected(): void {
    this.eyeFound = true;
    this.showMessage('Agora sim.', { color: '#ffd166', duration: 1800 });
    this.roofGate.open();
  }

  // ---------------------------------------------------------------------------
  // Helpers da torre
  // ---------------------------------------------------------------------------

  /** Andar de 2 linhas de espessura. Com alçapão: colunas [hatchFrom..hatchTo] viram madeira. */
  private floor(row: number, hatchFrom?: number, hatchTo?: number): void {
    if (hatchFrom === undefined || hatchTo === undefined) {
      this.addGround(2, row, 26, 2);
      return;
    }
    if (hatchFrom > 2) this.addGround(2, row, hatchFrom - 2, 2);
    this.addWoodPlatform(hatchFrom, row, hatchTo - hatchFrom + 1);
    if (hatchTo < 27) this.addGround(hatchTo + 1, row, 27 - hatchTo, 2);
  }

  private addWindow(tx: number, bottomRow: number): void {
    this.add
      .image(this.tileCenterX(tx), bottomRow * TILE, TEXTURES.WINDOW)
      .setOrigin(0.5, 1)
      .setDepth(DEPTH.CAVE_BACKDROP + 1);
  }

  private addCandle(tx: number, groundRow: number): void {
    const x = this.tileCenterX(tx);
    const y = groundRow * TILE;
    const glow = this.add
      .circle(x, y - 16, 22, 0xffc46a, 0.22)
      .setDepth(DEPTH.DECOR)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: glow, alpha: 0.12, scale: 1.15, duration: 300 + (tx % 4) * 90, yoyo: true, repeat: -1 });
    this.add.image(x, y + 1, TEXTURES.CANDLE).setOrigin(0.5, 1).setDepth(DEPTH.DECOR);
  }

  private addRune(tx: number, ty: number): void {
    const rune = this.add
      .image(this.tileCenterX(tx), this.tileCenterY(ty), TEXTURES.RUNE)
      .setScale(1.4)
      .setAlpha(0.55)
      .setDepth(DEPTH.CAVE_BACKDROP + 1);
    this.tweens.add({ targets: rune, alpha: 0.2, angle: 30, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
}
