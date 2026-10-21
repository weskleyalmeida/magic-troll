import Phaser from 'phaser';
import { TEXTURES } from '../config/assetKeys';
import { DEPTH, GAME_HEIGHT, GAME_WIDTH, TILE } from '../config/constants';
import { SCENES } from '../config/sceneKeys';
import type { Sign } from '../components/Sign';
import type { InputState } from '../systems/InputController';
import { addFireflies, addForestBackdrop } from '../utils/backdrops';
import { BaseLevelScene, type LevelLayout } from './BaseLevelScene';

/**
 * FASE 1 — FLORESTA ENCANTADA
 * Lição: "o cenário pode enganar".
 *
 * Mapa (150 x 24 tiles). Superfície principal na linha 15; platô alto na linha 12.
 *
 *  A [0-29]    Tutorial: placas, baú verdadeiro (cadeado dourado), primeiro cogumelo.
 *  B [30-59]   "CAMINHO SEGURO →": espinhos escondidos no chão (pista: furinhos na grama).
 *              O caminho de cima, que parece arriscado, é o seguro. Cogumelo "dormindo"
 *              no chão acorda e persegue (pista: olhos fechados e "z").         [checkpoint 57]
 *  C [60-87]   Riacho com pilares, peixes saltadores (pista: bolhas) e tábua que desmorona.
 *              Placa sugere "o cristal está num baú": baú falso (cadeado vermelho).
 *              Cachoeira com brilhos verdes escapando.                           [checkpoint 81]
 *  Segredo     Atrás da cachoeira, uma parede rachada falsa → túnel → caverna com chão de
 *              espinhos; o CRISTAL só se alcança por tábuas que desmoronam.
 *  D [88-149]  Platô: placa "O CRISTAL ESTÁ NO FIM DA FLORESTA →", cogumelo dormindo,
 *              moedas-isca sobre chão falso (grama amarelada) com buraco sem fundo. [checkpoint 119]
 *              No fim... nada (e uma dica).
 */
export class Level1Scene extends BaseLevelScene {
  private duskOverlay!: Phaser.GameObjects.Rectangle;
  private safePathSign!: Sign;
  private endSign!: Sign;
  private hintTimer?: Phaser.Time.TimerEvent;
  private waterfall!: Phaser.GameObjects.TileSprite;

  constructor() {
    super(SCENES.LEVEL_1);
  }

  protected onLevelUpdate(_input: InputState, _time: number, delta: number): void {
    this.waterfall.tilePositionY -= 0.4 * delta;
  }

  protected getLayout(): LevelLayout {
    return { widthTiles: 150, heightTiles: 24, spawn: { tx: 2, ty: 13 } };
  }

  protected createBackground(): void {
    addForestBackdrop(this, this.worldWidth, 760);
    addFireflies(this, this.worldWidth, this.worldHeight, 40);

    // Usado na mudança de cenário depois de pegar o cristal (céu de entardecer).
    this.duskOverlay = this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0xff6a3d, 0)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(DEPTH.BACKGROUND);
  }

  protected buildLevel(): void {
    this.buildSectionA();
    this.buildSectionB();
    this.buildSectionC();
    this.buildSecretCave();
    this.buildSectionD();
  }

  // ---------------------------------------------------------------------------
  // A — Tutorial
  // ---------------------------------------------------------------------------
  private buildSectionA(): void {
    this.addGround(0, 15, 30, 9);

    this.addDeco(1, 15, TEXTURES.DECO_TREE);
    this.addDeco(11, 15, TEXTURES.DECO_TREE, { scale: 1.15 });
    this.addDeco(27, 15, TEXTURES.DECO_TREE, { flipX: true });
    this.addDeco(6, 15, TEXTURES.DECO_BUSH);
    this.addDeco(25, 15, TEXTURES.DECO_BUSH, { scale: 0.8 });
    this.addFlowers([3, 8, 9, 15, 19, 24, 28]);
    this.addDeco(17, 15, TEXTURES.DECO_MUSHROOM);

    this.addSign(
      4,
      15,
      'Bem-vindo, aventureiro!\nEncontre o CRISTAL VERDE escondido nesta floresta.\n\nDica: nem tudo aqui é o que parece.',
    );
    this.addCoinRow(7, 13, 3);
    this.addChest(13, 15, 'coins', 5);

    this.addSign(16, 15, 'Cogumelos bravos odeiam ser pisados.\nLiteralmente.');
    this.addEnemy(23, 15, 18, 28);
    this.addWoodPlatform(20, 12, 4);
    this.addCoinRow(20, 11, 4);
  }

  // ---------------------------------------------------------------------------
  // B — O "caminho seguro"
  // ---------------------------------------------------------------------------
  private buildSectionB(): void {
    this.addGround(30, 15, 30, 9);

    this.addDeco(36, 15, TEXTURES.DECO_TREE, { scale: 0.9 });
    this.addDeco(49, 15, TEXTURES.DECO_TREE, { scale: 1.1, flipX: true });
    this.addDeco(55, 15, TEXTURES.DECO_TREE);
    this.addDeco(44, 15, TEXTURES.DECO_ROCK);
    this.addFlowers([31, 34, 38, 47, 52, 58]);

    this.safePathSign = this.addSign(32, 15, 'CAMINHO SEGURO →');

    // Armadilha: espinhos escondidos sob a grama esburacada.
    this.addPopupSpikes(40, 15, 3);
    this.addSign(46, 15, 'Seguro... para as minhocas.');

    // O caminho "arriscado" de cima é o seguro (e tem moedas).
    this.addWoodPlatform(34, 12, 3);
    this.addWoodPlatform(39, 9, 4);
    this.addWoodPlatform(45, 9, 4);
    this.addWoodPlatform(51, 12, 3);
    this.addCoinRow(40, 8, 3);
    this.addCoinRow(46, 8, 3);

    // Parece decoração... mas está dormindo (olhos fechados + "z"). Quem foi por cima nem acorda ele.
    this.addSleepingEnemy(50, 15, 47, 55);
    this.addCheckpoint(57, 15);
  }

  // ---------------------------------------------------------------------------
  // C — Riacho, baú falso e cachoeira
  // ---------------------------------------------------------------------------
  private buildSectionC(): void {
    this.addWater(60, 15, 20, 9);

    this.addGround(64, 15, 3, 9);
    this.addGround(72, 14, 3, 10);
    this.addGround(80, 15, 8, 9);
    this.addCrumblePlatform(68, 12, 2);

    // Peixes saltadores entre os pilares (pista: bolhas antes do salto).
    this.addFish(62, 15, 2600, 400);
    this.addFish(69, 15, 2400, 0);
    this.addFish(77, 15, 2400, 1200);

    this.addCoin(61, 12);
    this.addCoin(62, 11);
    this.addCoin(63, 12);
    this.addCoinRow(68, 11, 2);
    this.addCoin(76, 11);
    this.addCoin(77, 10);
    this.addCoin(78, 11);

    // Mentira: o cristal não está em baú nenhum.
    this.addSign(65, 15, 'Um cristal tão valioso...\ncertamente está guardado num baú.');
    this.addChest(73, 14, 'fake');

    this.addCheckpoint(81, 15);
    this.addDeco(83, 15, TEXTURES.DECO_ROCK, { scale: 0.8 });

    // Moedas "apontando" para trás da cachoeira.
    this.addCoinRow(85, 14, 3);

    this.buildWaterfall();
  }

  private buildWaterfall(): void {
    // Rocha de onde a água cai (só visual).
    this.add.tileSprite(85 * TILE, 3 * TILE, 6 * TILE, 2 * TILE, TEXTURES.TILE_STONE).setOrigin(0).setDepth(DEPTH.FOREGROUND);

    this.waterfall = this.add
      .tileSprite(86 * TILE, 5 * TILE, 4 * TILE, 10 * TILE, TEXTURES.WATERFALL)
      .setOrigin(0)
      .setAlpha(0.78)
      .setDepth(DEPTH.FOREGROUND + 1);

    // Bordas mais claras da queda d'água.
    [86 * TILE, 90 * TILE - 4].forEach((x) =>
      this.add.rectangle(x, 5 * TILE, 4, 10 * TILE, 0xe6f8ff, 0.8).setOrigin(0).setDepth(DEPTH.FOREGROUND + 1),
    );

    // Espuma: bolhas brancas pulsando na base + névoa.
    const baseY = 15 * TILE - 4;
    for (let i = 0; i < 9; i++) {
      const foam = this.add
        .circle(86 * TILE + 6 + i * 14, baseY + (i % 2) * 4, 9 + (i % 3) * 3, 0xffffff, 0.9)
        .setDepth(DEPTH.FOREGROUND + 2);
      this.tweens.add({
        targets: foam,
        scale: 1.25,
        alpha: 0.55,
        duration: 260 + (i % 4) * 70,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
    const mist = this.add.ellipse(88 * TILE, baseY - 10, 7 * TILE, 50, 0xffffff, 0.3).setDepth(DEPTH.FOREGROUND + 2);
    this.tweens.add({ targets: mist, scaleX: 1.15, alpha: 0.15, duration: 1400, yoyo: true, repeat: -1 });

    // PISTA: brilhos verdes "vazando" de trás da água.
    this.hintTimer = this.time.addEvent({
      delay: 650,
      loop: true,
      callback: () =>
        this.spawnSparkles(
          Phaser.Math.Between(88 * TILE, 90 * TILE),
          Phaser.Math.Between(13 * TILE, 15 * TILE),
          0x2ee86f,
          1,
        ),
    });
  }

  // ---------------------------------------------------------------------------
  // Segredo — túnel e caverna atrás da cachoeira
  // ---------------------------------------------------------------------------
  private buildSecretCave(): void {
    // Fundo de rocha da caverna (atrás dos tiles).
    this.add
      .tileSprite(88 * TILE, 13 * TILE, 26 * TILE, 8 * TILE, TEXTURES.BG_CAVE)
      .setOrigin(0)
      .setDepth(DEPTH.CAVE_BACKDROP);

    // Teto (grama do platô) + paredes. Vão livre: túnel [88-97 x 13-14], caverna [98-113 x 13-20].
    // O platô tem um buraco sem fundo em [128-131], coberto por chão falso (ver seção D).
    this.addGround(88, 12, 40, 1);
    this.addGround(132, 12, 18, 1);
    this.addDirt(88, 15, 10, 9);
    this.addDirt(98, 21, 16, 3);
    this.addDirt(114, 13, 14, 11);
    this.addDirt(132, 13, 18, 11);

    // A área secreta inteira é coberta por terra falsa, que some quando o jogador entra.
    // Só a entrada tem rachaduras (a pista), e ela fica atrás da cachoeira.
    this.addFakeWall(88, 13, 2, 2, TEXTURES.TILE_DIRT_CRACKED, 'Uma passagem secreta!');
    this.addFakeWall(90, 13, 8, 2, TEXTURES.TILE_DIRT);
    this.addFakeWall(98, 13, 16, 8, TEXTURES.TILE_DIRT);

    // Cogumelos luminosos (o brilho fica atrás da terra falsa: só aparece lá dentro).
    ([[98, 1], [112, 1.3], [113, 1]] as const).forEach(([tx, scale]) => {
      const glow = this.add
        .circle(this.tileCenterX(tx), 21 * TILE - 8, 18 * scale, 0x7affc1, 0.22)
        .setDepth(DEPTH.DECOR)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: glow, alpha: 0.08, scale: 1.2, duration: 1200, yoyo: true, repeat: -1 });
      this.addDeco(tx, 21, TEXTURES.DECO_MUSHROOM, { tint: 0x7affc1, scale });
    });

    // Chão de espinhos: o cristal só se alcança por tábuas que desmoronam.
    this.addWoodPlatform(99, 18, 3);
    this.addSpikes(101, 21, 8);
    this.addCrumblePlatform(103, 16, 2);
    this.addCrumblePlatform(106, 17, 2);
    this.addCoinRow(103, 15, 2);
    this.addCoinRow(106, 16, 2);

    this.addStone(109, 19, 3, 2);
    this.addArtifact(110, 18, 'crystal');
  }

  // ---------------------------------------------------------------------------
  // D — Platô e a placa mentirosa
  // ---------------------------------------------------------------------------
  private buildSectionD(): void {
    this.addDeco(95, 12, TEXTURES.DECO_TREE);
    this.addDeco(108, 12, TEXTURES.DECO_TREE, { scale: 1.2, flipX: true });
    this.addDeco(122, 12, TEXTURES.DECO_TREE, { scale: 0.9 });
    this.addDeco(140, 12, TEXTURES.DECO_TREE, { scale: 1.1 });
    this.addDeco(118, 12, TEXTURES.DECO_BUSH, { scale: 0.9 });
    this.addFlowers([93, 99, 103, 111, 125, 137, 143, 147]);

    this.addSign(92, 12, 'O CRISTAL ESTÁ NO\nFIM DA FLORESTA →');

    this.addSleepingEnemy(102, 12, 98, 111);
    this.addWoodPlatform(104, 9, 4);
    this.addCoinRow(104, 8, 4);

    this.addSpikes(114, 12, 3);
    this.addCheckpoint(119, 12);

    this.addEnemy(123, 12, 120, 126);

    // Isca: moedas fáceis sobre chão falso (grama amarelada, sem flores) → buraco sem fundo.
    // O caminho seguro passa pela plataforma de cima.
    this.add
      .tileSprite(128 * TILE, 13 * TILE, 4 * TILE, 12 * TILE, TEXTURES.BG_CAVE)
      .setOrigin(0)
      .setTint(0x8a7aa8)
      .setDepth(DEPTH.CAVE_BACKDROP);
    this.addCollapsingGround(128, 12, 4, 11);
    this.addCoinRow(128, 11, 4);
    this.addWoodPlatform(127, 9, 4);
    this.addCoinRow(127, 8, 4);

    // Segredo bônus: moedas atrás de um arbusto.
    this.addCoinRow(134, 11, 3);
    this.addFakeBush(135, 12, 'Moedas secretas!');

    this.endSign = this.addSign(
      146,
      12,
      'FIM DA FLORESTA.\nViu algum cristal? Nem eu.\n\nDica: a água esconde muita coisa.',
    );
  }

  // ---------------------------------------------------------------------------
  // Depois do cristal: "Fácil demais, né?" e o cenário muda.
  // ---------------------------------------------------------------------------
  protected afterArtifactCollected(): void {
    this.showMessage('Fácil demais, né?', { duration: 1600, onDone: () => this.transformForest() });
  }

  private transformForest(): void {
    this.cameras.main.shake(500, 0.01);
    this.hintTimer?.remove();
    this.tweens.add({ targets: this.duskOverlay, alpha: 0.4, duration: 1500 });

    this.safePathSign.setMessage('CAMINHO SEGURO ←\n(agora é verdade. Confia.)');
    this.endSign.setMessage('O cristal? Já era.\nO pântano te espera...');

    // O portal abre do outro lado dos espinhos: tem que atravessar as tábuas de novo.
    this.addExitPortal(99, 21);
    this.spawnSparkles(this.tileCenterX(99), 20 * TILE, 0xc9b8ff, 20);
    this.showMessage('Um portal se abriu!', { color: '#c9b8ff' });
  }

  private addFlowers(columns: number[]): void {
    const colors = [0xff8fb1, 0xffe066, 0x9ad0ff, 0xd7a6ff];
    const groundRowAt = (tx: number) => (tx >= 88 ? 12 : 15);
    columns.forEach((tx, i) => this.addDeco(tx, groundRowAt(tx), TEXTURES.DECO_FLOWER, { tint: colors[i % colors.length] }));
  }
}
