import Phaser from 'phaser';
import { SFX, TEXTURES } from '../config/assetKeys';
import { DEPTH, GAME_HEIGHT, GAME_WIDTH, TILE, UI_FONT } from '../config/constants';
import { SCENES } from '../config/sceneKeys';
import { CASTLE_THEME } from '../config/terrainThemes';
import { ArtifactBarrier } from '../components/ArtifactBarrier';
import type { Interactable } from '../components/Interactable';
import { BOSS_EVENTS, TrollBoss } from '../entities/TrollBoss';
import { AudioManager } from '../systems/AudioManager';
import type { InputState } from '../systems/InputController';
import { addSky } from '../utils/backdrops';
import { BaseLevelScene, type LevelLayout } from './BaseLevelScene';

/** Parede de arena que abre/fecha (grades mágicas vermelhas). */
interface ArenaWall {
  open(): void;
  close(): void;
}

/**
 * FASE 4 — CASTELO AMALDIÇOADO
 * Lição: o jogo combina TODAS as ideias.
 *
 * Mapa (132 x 24 tiles). Teto de pedra nas linhas 0-3; piso na linha 15.
 *
 *  [0-21]    Entrada: barreira "SOMENTE COM OS 3 ARTEFATOS".
 *  [22-37]   Chão rachado que desaba num fosso de espinhos (alternativa: saliências de cima).
 *  [38-47]   Biblioteca: livros voadores + runa atiradora.
 *  [48-59]   Plataforma ILUSÓRIA sobre espinhos.                                [cp 58]
 *  [60-69]   Masmorra: lava + plataformas invisíveis (vagalumes) + fantasma.
 *  [70-81]   Antessala.                                                          [cp 72]
 *  [82-120]  Salão do trono: "FIM"... "NÃO APERTE."... GUARDIÃO TROLL.
 *  [121-131] Salão principal → final do jogo.
 */
export class Level4Scene extends BaseLevelScene {
  protected terrainTheme = CASTLE_THEME;
  protected completionSceneKey: string = SCENES.ENDING;

  private boss?: TrollBoss;
  private entryWall!: ArenaWall;
  private exitWall!: ArenaWall;
  private hallEntered = false;
  private buttonShown = false;
  private buttonPressed = false;
  private bossDefeated = false;
  private fakeDeathAt = 0;
  private hpBar?: Phaser.GameObjects.Container;
  private hpFill?: Phaser.GameObjects.Rectangle;

  constructor() {
    super(SCENES.LEVEL_4);
  }

  protected getLayout(): LevelLayout {
    return { widthTiles: 132, heightTiles: 24, spawn: { tx: 3, ty: 13 } };
  }

  protected createBackground(): void {
    addSky(this, 0x1a0f22, 0x3a1f3a);
  }

  protected buildLevel(): void {
    this.boss = undefined;
    this.hallEntered = false;
    this.buttonShown = false;
    this.buttonPressed = false;
    this.bossDefeated = false;
    this.hpBar = undefined;

    this.add
      .tileSprite(0, 4 * TILE, 132 * TILE, 14 * TILE, TEXTURES.BG_CASTLE_WALL)
      .setOrigin(0)
      .setDepth(DEPTH.CAVE_BACKDROP);
    this.addDirt(0, 0, 132, 4); // teto

    this.buildEntrance();
    this.buildCorridor();
    this.buildThroneHall();
    this.buildMainHall();
    this.decorate();
  }

  protected onLevelUpdate(_input: InputState): void {
    const px = this.player.x;

    if (!this.hallEntered && px > 90 * TILE) {
      this.hallEntered = true;
      this.showFakeCredits();
    }
    if (this.hallEntered && !this.buttonShown && px > 104 * TILE) {
      this.buttonShown = true;
      this.revealButton();
    }

    // "Achou que acabou?": depois de um respiro (para o jogador acreditar na vitória), o chefe
    // "derrotado" levanta quando o jogador chega perto dele ou tenta sair pela grade aberta.
    const boss = this.boss;
    const believed = this.time.now - this.fakeDeathAt > 3200;
    if (boss?.isFakeDead && believed && (Math.abs(px - boss.x) < 4 * TILE || px > 116 * TILE)) {
      this.exitWall.close();
      boss.revive();
      this.showMessage('Achou que acabou?', { color: '#ff6b6b', duration: 2000 });
      this.hpBar?.setVisible(true);
    }
  }

  // ---------------------------------------------------------------------------
  // Seções
  // ---------------------------------------------------------------------------

  private buildEntrance(): void {
    this.addGround(0, 15, 34, 9);
    this.addSign(5, 15, 'O Castelo Amaldiçoado.\nSó entra quem trouxe os 3 artefatos.');
    new ArtifactBarrier(this, 20, 4, 11);
    this.addCoinRow(9, 13, 3);
  }

  private buildCorridor(): void {
    // Chão rachado (pista!) sobre um fosso de espinhos. Por cima: saliências seguras.
    this.add.tileSprite(34 * TILE, 16 * TILE, 4 * TILE, 2 * TILE, TEXTURES.BG_CASTLE_WALL).setOrigin(0).setDepth(DEPTH.CAVE_BACKDROP);
    this.addDirt(34, 18, 4, 6);
    this.addSpikes(34, 18, 4);
    this.addCollapsingGround(34, 15, 4, 2);
    this.addWoodPlatform(32, 12, 2);
    this.addWoodPlatform(36, 12, 2);
    this.addCoinRow(34, 14, 4); // isca, de novo

    // Biblioteca.
    this.addGround(38, 15, 10, 9);
    this.addFlyingBook(43, 11, 38, 47);
    this.addTurret(47 * TILE + 16, 10, -1, 2800, 0);

    // Ilusão sobre espinhos.
    this.addGround(48, 15, 12, 9);
    this.addSpikes(49, 15, 8);
    this.addWoodPlatform(49, 12, 2);
    this.addIllusoryPlatform(52, 11, 2);
    this.addWoodPlatform(55, 12, 2);
    this.addCoinRow(52, 9, 2);
    this.addCheckpoint(58, 15);

    // Masmorra de lava com plataformas invisíveis.
    this.addWater(60, 15, 10, 9, 'lava');
    this.addInvisiblePlatform(61, 13, 2);
    this.addInvisiblePlatform(64, 12, 2);
    this.addInvisiblePlatform(67, 13, 2);
    this.addGhost(65, 8, 6);

    this.addGround(70, 15, 62, 9);
    this.addCheckpoint(72, 15);
    this.addSign(76, 15, 'Salão do Trono →\n(é o fim, prometo)');
  }

  private buildThroneHall(): void {
    this.entryWall = this.makeWall(82, false);
    this.exitWall = this.makeWall(120, true);

    // Trono no tablado.
    this.addStone(109, 13, 7, 2);
    this.add.image(this.tileCenterX(112), 13 * TILE + 2, TEXTURES.THRONE).setOrigin(0.5, 1).setDepth(DEPTH.DECOR);
    this.add.rectangle(86 * TILE, 15 * TILE - 3, 23 * TILE, 6, 0xc23a4a).setOrigin(0).setDepth(DEPTH.DECOR); // tapete

    // A "saída" (não é).
    this.add.image(this.tileCenterX(118), 15 * TILE, TEXTURES.DOOR).setOrigin(0.5, 1).setDepth(DEPTH.DECOR_BACK);
    this.addSign(117, 15, 'SAÍDA\n(em manutenção. Volte nunca.)');
  }

  private buildMainHall(): void {
    // Salão principal: portal dourado para o final.
    const door = this.add.image(this.tileCenterX(127), 15 * TILE, TEXTURES.DOOR).setOrigin(0.5, 1).setScale(2).setTint(0xffe9a8).setDepth(DEPTH.DECOR);
    const glow = this.add.circle(door.x, door.y - 48, 60, 0xffd27a, 0.25).setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH.DECOR - 1);
    this.tweens.add({ targets: glow, alpha: 0.1, scale: 1.2, duration: 900, yoyo: true, repeat: -1 });
    this.addSign(124, 15, 'SALÃO PRINCIPAL');

    const zone = this.add.zone(door.x, door.y - 40, 2 * TILE, 80);
    this.physics.add.existing(zone, true);
    this.physics.add.overlap(this.player, zone, () => {
      if (this.bossDefeated) this.completeLevel();
    });
  }

  private decorate(): void {
    for (let tx = 6; tx < 130; tx += 9) {
      if (tx > 32 && tx < 38) continue;
      this.addTorch(tx, 9);
    }
    [12, 44, 78, 96, 104].forEach((tx) => this.add.image(this.tileCenterX(tx), 5 * TILE, TEXTURES.BANNER).setOrigin(0.5, 0).setDepth(DEPTH.CAVE_BACKDROP + 1));
    [16, 74, 100].forEach((tx) => this.add.image(this.tileCenterX(tx), 8 * TILE, TEXTURES.PAINTING).setDepth(DEPTH.CAVE_BACKDROP + 1));
    [26, 86, 115].forEach((tx) => this.addDeco(tx, tx === 115 ? 13 : 15, TEXTURES.STATUE));
    [40, 42, 45].forEach((tx) => this.addDeco(tx, 15, TEXTURES.BOOKSHELF));
    [92, 102].forEach((tx) => this.add.image(this.tileCenterX(tx), 4 * TILE, TEXTURES.CHANDELIER).setOrigin(0.5, 0).setScale(1.3).setDepth(DEPTH.DECOR_BACK));
  }

  // ---------------------------------------------------------------------------
  // O salão do trono: o falso fim, o botão e o chefe
  // ---------------------------------------------------------------------------

  private showFakeCredits(): void {
    const fin = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, 'FIM', { fontFamily: UI_FONT, fontSize: '96px', fontStyle: 'bold', color: '#ffd166', stroke: '#2a1660', strokeThickness: 12 })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH.HUD)
      .setAlpha(0);
    const thanks = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, 'Obrigado por jogar!', { fontFamily: UI_FONT, fontSize: '28px', fontStyle: 'bold', color: '#ffffff', stroke: '#2a1660', strokeThickness: 6 })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH.HUD)
      .setAlpha(0);
    this.tweens.add({ targets: [fin, thanks], alpha: 1, duration: 700 });
    this.tweens.add({ targets: [fin, thanks], alpha: 0, delay: 2600, duration: 800, onComplete: () => [fin, thanks].forEach((t) => t.destroy()) });
    this.spawnSparkles(this.player.x, this.player.y - 40, 0xffd166, 20);
  }

  private revealButton(): void {
    const sign = this.addSign(104, 15, 'NÃO APERTE.');
    const button = this.add.image(this.tileCenterX(107), 15 * TILE + 1, TEXTURES.BUTTON_RED).setOrigin(0.5, 1).setDepth(DEPTH.ITEMS);
    [sign, button].forEach((o) => o.setScale(0));
    this.tweens.add({ targets: [sign, button], scale: 1, duration: 400, ease: 'Back.easeOut' });
    this.spawnSparkles(button.x, button.y - 10, 0xff6b6b, 10);

    const interactable: Interactable = {
      x: button.x,
      y: button.y,
      getPromptY: () => button.y - 26,
      canInteract: () => !this.buttonPressed,
      interact: () => {
        this.buttonPressed = true;
        button.setTexture(TEXTURES.BUTTON_RED_PRESSED);
        this.startBossSequence();
      },
    };
    this.registerInteractable(interactable);
  }

  private startBossSequence(): void {
    this.entryWall.close();
    this.respawnPoint.set(this.tileCenterX(88), 13 * TILE);
    AudioManager.playSfx(this, SFX.BOSS);
    this.cameras.main.shake(1600, 0.01);

    // Alarme: tela vermelha piscando.
    const alarm = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0xff0000, 0).setOrigin(0).setScrollFactor(0).setDepth(DEPTH.HUD - 1);
    this.tweens.add({ targets: alarm, alpha: 0.3, duration: 250, yoyo: true, repeat: 7, onComplete: () => alarm.destroy() });

    this.showMessage('VOCÊ REALMENTE APERTOU?', {
      color: '#ff6b6b',
      duration: 1900,
      onDone: () =>
        this.showMessage('VOCÊ AINDA NÃO TERMINOU.', {
          color: '#ff6b6b',
          duration: 1900,
          onDone: () => this.spawnBoss(),
        }),
    });
  }

  private spawnBoss(): void {
    const boss = new TrollBoss(this, this.tileCenterX(100), 5 * TILE, 85 * TILE, 118 * TILE, 15 * TILE, 4 * TILE);
    this.boss = boss;

    this.physics.add.overlap(this.player, boss, () => {
      if (this.player.isDead) return;
      if (boss.isVulnerable) {
        const pb = this.player.arcadeBody;
        if (pb.velocity.y > 0 && pb.bottom <= boss.arcadeBody.top + 24) {
          boss.takeHit();
          this.player.bounce();
        }
      } else if (boss.isHarmful) {
        this.hurtPlayer(boss.x);
      }
    });

    boss.on(BOSS_EVENTS.HP, (hp: number, max: number) => this.updateHpBar(hp, max));
    boss.on(BOSS_EVENTS.FAKE_DEATH, () => {
      this.fakeDeathAt = this.time.now;
      this.hpBar?.setVisible(false);
      this.showMessage('O guardião foi derrotado!', { color: '#ffd166', duration: 2200 });
      this.exitWall.open(); // a isca: a saída "abre"...
    });
    boss.on(BOSS_EVENTS.DEFEATED, () => {
      this.bossDefeated = true;
      this.hpBar?.destroy();
      this.exitWall.open();
      this.cameras.main.flash(500, 255, 230, 160);
      this.showMessage('Agora sim... acabou.', { color: '#ffd166', duration: 1800 });
      this.showMessage('Acho.', { duration: 1400 });
      this.showMessage('O salão principal está aberto →', { color: '#ffd166', duration: 2000 });
    });

    this.time.delayedCall(1200, () => {
      this.showMessage('GUARDIÃO TROLL', { color: '#7affb0', duration: 1600 });
      this.createHpBar();
      boss.start();
    });
  }

  private createHpBar(): void {
    const cx = GAME_WIDTH / 2;
    const bg = this.add.rectangle(cx, 34, 320, 18, 0x1d1430).setStrokeStyle(3, 0xffd166);
    this.hpFill = this.add.rectangle(cx - 157, 34, 314, 12, 0x7affb0).setOrigin(0, 0.5);
    const label = this.add
      .text(cx, 56, 'GUARDIÃO TROLL', { fontFamily: UI_FONT, fontSize: '14px', fontStyle: 'bold', color: '#ffffff', stroke: '#2a1d33', strokeThickness: 4 })
      .setOrigin(0.5);
    this.hpBar = this.add.container(0, 0, [bg, this.hpFill, label]).setScrollFactor(0).setDepth(DEPTH.HUD);
  }

  private updateHpBar(hp: number, max: number): void {
    if (!this.hpFill) return;
    this.hpFill.setFillStyle(max === 2 ? 0xff6b6b : 0x7affb0);
    this.tweens.add({ targets: this.hpFill, scaleX: Math.max(0, hp / max), duration: 300 });
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /** Grade vermelha de arena (linhas 4-14), sólida só quando fechada. */
  private makeWall(tx: number, closed: boolean): ArenaWall {
    const x = tx * TILE;
    const top = 4 * TILE;
    const h = 11 * TILE;
    const g = this.add.graphics().setDepth(DEPTH.DECOR);
    g.fillStyle(0xff4a6a, 0.25);
    g.fillRect(x + 2, top, TILE - 4, h);
    for (let i = 0; i < 3; i++) {
      g.fillStyle(0x3a1020, 1);
      g.fillRect(x + 5 + i * 9, top, 5, h);
      g.fillStyle(0xff9ab0, 1);
      g.fillRect(x + 6 + i * 9, top, 2, h);
    }
    const zone = this.add.zone(x + TILE / 2, top + h / 2, TILE - 6, h);
    this.physics.add.existing(zone, true);
    const body = zone.body as Phaser.Physics.Arcade.StaticBody;
    this.physics.add.collider(this.player, zone);

    const set = (isClosed: boolean) => {
      body.enable = isClosed;
      this.tweens.add({ targets: g, alpha: isClosed ? 1 : 0, duration: 350 });
      if (isClosed) this.cameras.main.shake(200, 0.006);
    };
    body.enable = closed;
    g.setAlpha(closed ? 1 : 0);
    return { open: () => set(false), close: () => set(true) };
  }

  private addTorch(tx: number, ty: number): void {
    const x = this.tileCenterX(tx);
    const y = this.tileCenterY(ty);
    const glow = this.add.circle(x, y - 8, 34, 0xffa040, 0.2).setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH.CAVE_BACKDROP + 1);
    this.tweens.add({ targets: glow, alpha: 0.1, scale: 1.12, duration: 260 + (tx % 5) * 60, yoyo: true, repeat: -1 });
    const torch = this.add.image(x, y, TEXTURES.TORCH).setDepth(DEPTH.CAVE_BACKDROP + 2);
    this.tweens.add({ targets: torch, scaleY: 1.06, duration: 180 + (tx % 3) * 40, yoyo: true, repeat: -1 });
  }
}
