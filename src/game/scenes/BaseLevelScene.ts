import Phaser from 'phaser';
import { SFX, TEXTURES } from '../config/assetKeys';
import { ARTIFACTS, type ArtifactId } from '../config/artifacts';
import { DEPTH, GAME_HEIGHT, GAME_WIDTH, INTERACT_RANGE, PLAYER, TILE, UI_FONT } from '../config/constants';
import { getLevelBySceneKey, LEVELS } from '../config/levels';
import { SCENES } from '../config/sceneKeys';
import { Artifact } from '../components/Artifact';
import { Checkpoint } from '../components/Checkpoint';
import { Chest, type ChestKind } from '../components/Chest';
import { Coin } from '../components/Coin';
import { CrumblePlatform } from '../components/CrumblePlatform';
import { FakeWall } from '../components/FakeWall';
import type { Interactable } from '../components/Interactable';
import { Portal } from '../components/Portal';
import { Sign } from '../components/Sign';
import { HazardZone, PopupSpikeTrap, SpikeTrap } from '../components/Trap';
import { IllusoryPlatform, ILLUSION_COLOR, InvisiblePlatform, PhasePlatform } from '../components/Illusion';
import { MagicDoor } from '../components/MagicDoor';
import { MagicGate } from '../components/MagicGate';
import { MagicTurret } from '../components/MagicTurret';
import { Mirror, type Reflection } from '../components/Mirror';
import { DecoyArtifact } from '../components/DecoyArtifact';
import { MovingPlatform } from '../components/MovingPlatform';
import { FOREST_THEME, type TerrainTheme } from '../config/terrainThemes';
import { Enemy, type EnemyOptions } from '../entities/Enemy';
import { Fish } from '../entities/Fish';
import { FlyingBook } from '../entities/FlyingBook';
import { Ghost } from '../entities/Ghost';
import { Player, PLAYER_EVENTS } from '../entities/Player';
import { AudioManager } from '../systems/AudioManager';
import { InputController, type InputState } from '../systems/InputController';
import { SaveSystem } from '../systems/SaveSystem';
import { calculateScore, createLevelStats, type LevelStats } from '../systems/ScoreSystem';
import { HUD } from '../ui/HUD';
import { MessageToast, type MessageOptions } from '../ui/MessageToast';

export interface LevelLayout {
  widthTiles: number;
  heightTiles: number;
  /** Posição inicial, em tiles. */
  spawn: { tx: number; ty: number };
}

export interface LevelCompleteData {
  levelKey: string;
  stats: LevelStats;
  score: number;
  newRecord: boolean;
}

/**
 * Base de todas as fases. Cuida do que é comum (física, câmera, vida, checkpoints,
 * interação, pausa, fim de fase) e oferece helpers para montar o cenário.
 *
 * CONVENÇÃO DE COORDENADAS DOS HELPERS (em tiles):
 *  - Blocos (addGround, addStone...): (tx, ty) = canto superior esquerdo.
 *  - Objetos apoiados no chão (placas, baús, inimigos...): `groundRow` = linha da
 *    superfície onde eles ficam em cima (a mesma `ty` do bloco de chão).
 *  - Objetos soltos (moedas, artefatos): centro do tile (tx, ty).
 *
 * Uma fase concreta implementa:
 *  - getLayout(): tamanho do mundo e spawn
 *  - buildLevel(): terreno, objetos, inimigos
 *  - (opcional) createBackground(), onLevelUpdate(), afterArtifactCollected()
 */
export abstract class BaseLevelScene extends Phaser.Scene {
  player!: Player;
  stats: LevelStats = createLevelStats();

  protected controls!: InputController;
  protected hud!: HUD;
  protected messages!: MessageToast;
  /** Blocos sólidos por todos os lados. */
  protected solids!: Phaser.Physics.Arcade.StaticGroup;
  /** Plataformas atravessáveis por baixo (só colidem quando o jogador cai sobre elas). */
  protected oneWayPlatforms!: Phaser.Physics.Arcade.StaticGroup;

  protected worldWidth = 0;
  protected worldHeight = 0;
  protected spawnPoint = new Phaser.Math.Vector2();
  protected respawnPoint = new Phaser.Math.Vector2();
  protected levelEnded = false;
  /** Visual do terreno. Fases sobrescrevem com outro tema (ex.: SWAMP_THEME). */
  protected terrainTheme: TerrainTheme = FOREST_THEME;
  /** Tela mostrada ao concluir a fase (a última fase pode mostrar o final do jogo). */
  protected completionSceneKey: string = SCENES.LEVEL_COMPLETE;
  private illusionHintShown = false;

  private interactables: Interactable[] = [];
  private waterSurfaces: Phaser.GameObjects.TileSprite[] = [];
  private terrainRects: Phaser.Geom.Rectangle[] = [];
  private decoratedBlocks: { x: number; y: number; w: number; h: number; grassy: boolean }[] = [];
  /** Altura (mundo) onde a sombra de profundidade da terra começa. */
  private shadeStartY = 0;
  private focused?: Interactable;
  private interactPrompt!: Phaser.GameObjects.Text;

  protected abstract getLayout(): LevelLayout;
  protected abstract buildLevel(): void;

  /** Gancho para lógica específica da fase, chamado a cada frame (fora da pausa). */
  protected onLevelUpdate(_input: InputState, _time: number, _delta: number): void {}

  create(): void {
    // A mesma instância de Scene é reutilizada ao reiniciar: resetar estado aqui.
    this.stats = createLevelStats();
    this.levelEnded = false;
    this.illusionHintShown = false;
    this.interactables = [];
    this.waterSurfaces = [];
    this.terrainRects = [];
    this.decoratedBlocks = [];
    this.focused = undefined;

    const levelIndex = LEVELS.findIndex((l) => l.sceneKey === this.scene.key);
    if (levelIndex >= 0) SaveSystem.setLastPlayed(levelIndex);

    const layout = this.getLayout();
    this.shadeStartY = (layout.spawn.ty + 2) * TILE;
    this.worldWidth = layout.widthTiles * TILE;
    this.worldHeight = layout.heightTiles * TILE;
    this.spawnPoint.set(layout.spawn.tx * TILE + TILE / 2, layout.spawn.ty * TILE);
    this.respawnPoint.copy(this.spawnPoint);

    // Sem colisão na borda de baixo: o jogador pode cair no vazio.
    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight, true, true, true, false);

    this.createBackground();

    this.solids = this.physics.add.staticGroup();
    this.oneWayPlatforms = this.physics.add.staticGroup();
    this.controls = new InputController(this);
    this.messages = new MessageToast(this);

    // O player existe antes do buildLevel para que os componentes registrem colisões com ele.
    this.player = new Player(this, this.spawnPoint.x, this.spawnPoint.y);
    this.player.on(PLAYER_EVENTS.HURT, (health: number) => {
      this.stats.damageTaken++;
      this.hud.setHealth(health);
    });
    this.player.on(PLAYER_EVENTS.DIED, () => this.onPlayerDied());

    this.buildLevel();
    this.decorateTerrain();

    this.physics.add.collider(this.player, this.solids);
    this.physics.add.collider(this.player, this.oneWayPlatforms, undefined, (_player, platform) => {
      const body = (platform as Phaser.Types.Physics.Arcade.GameObjectWithBody).body;
      return this.canLandOnOneWay(body);
    });

    this.setupCamera();
    this.createLevelUi();
    this.setupPauseHandling();
  }

  update(time: number, delta: number): void {
    const input = this.controls.update();
    if (input.pausePressed && this.canPause()) {
      this.openPause();
      return;
    }

    if (!this.levelEnded) this.stats.elapsedMs += delta;
    this.player.updateMovement(input, time, delta);

    if (!this.player.isDead && this.player.y > this.worldHeight + TILE * 2) this.onPlayerHitHazard();

    this.updateInteraction(input);
    this.hud.setTime(this.stats.elapsedMs);
    this.waterSurfaces.forEach((s) => (s.tilePositionX += delta * 0.025));
    this.onLevelUpdate(input, time, delta);
  }

  // ===========================================================================
  // API usada pelos componentes
  // ===========================================================================

  showMessage(text: string, options?: MessageOptions): void {
    this.messages.show(text, options);
  }

  registerInteractable(obj: Interactable): void {
    this.interactables.push(obj);
  }

  registerCoin(amount = 1): void {
    this.stats.totalCoins += amount;
  }

  addCoins(amount: number): void {
    this.stats.coins += amount;
    this.hud.setCoins(this.stats.coins);
  }

  hurtPlayer(sourceX: number, knockbackScale = 1): void {
    if (this.levelEnded) return;
    if (this.player.takeDamage(sourceX, knockbackScale)) this.cameras.main.shake(120, 0.006);
  }

  /** Água, vazio, lava...: perde 1 vida e volta ao último checkpoint. */
  onPlayerHitHazard(): void {
    if (this.player.isDead || this.levelEnded) return;
    this.player.takeDamage(this.player.x);
    if (!this.player.isDead) {
      this.cameras.main.flash(150, 255, 255, 255);
      this.player.respawn(this.respawnPoint.x, this.respawnPoint.y);
    }
  }

  setCheckpoint(x: number, y: number): void {
    this.respawnPoint.set(x, y);
    AudioManager.playSfx(this, SFX.CHECKPOINT);
    this.showMessage('Checkpoint ativado!', { color: '#5cff9d', duration: 1200 });
  }

  onArtifactCollected(id: ArtifactId): void {
    this.stats.artifactFound = true;
    SaveSystem.addArtifact(id);
    this.hud.setArtifacts(SaveSystem.load().artifacts);
    this.player.celebrate();
    this.cameras.main.flash(250, 255, 255, 220);
    this.showMessage(`Você encontrou o ${ARTIFACTS[id].name}!`, {
      color: '#ffd166',
      duration: 2000,
      onDone: () => {
        this.player.endCelebration();
        this.afterArtifactCollected(id);
      },
    });
  }

  /** Faíscas decorativas (checkpoints, artefatos, segredos). */
  spawnSparkles(x: number, y: number, color: number, count = 8, depth: number = DEPTH.WORLD_UI): void {
    for (let i = 0; i < count; i++) {
      const sparkle = this.add.image(x, y, TEXTURES.SPARKLE).setTint(color).setDepth(depth);
      const angle = Math.random() * Math.PI * 2;
      const distance = Phaser.Math.Between(16, 40);
      this.tweens.add({
        targets: sparkle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.3,
        duration: Phaser.Math.Between(450, 750),
        onComplete: () => sparkle.destroy(),
      });
    }
  }

  // ===========================================================================
  // Fluxo da fase (sobrescrevível)
  // ===========================================================================

  /** Padrão: termina a fase logo após pegar o artefato. Fases podem fazer algo antes. */
  protected afterArtifactCollected(_id: ArtifactId): void {
    this.completeLevel();
  }

  protected createBackground(): void {
    this.addSkyGradient(0x7ec8ff, 0xd8f1ff);
  }

  protected completeLevel(): void {
    if (this.levelEnded) return;
    this.levelEnded = true;
    this.player.freeze();

    const level = getLevelBySceneKey(this.scene.key);
    const score = calculateScore(this.stats);
    let newRecord = false;
    if (level) {
      newRecord = SaveSystem.submitTime(level.id, this.stats.elapsedMs);
      SaveSystem.submitScore(level.id, score);
      SaveSystem.unlockLevel(LEVELS.indexOf(level) + 1);
    }
    AudioManager.playSfx(this, SFX.VICTORY);

    const data: LevelCompleteData = { levelKey: this.scene.key, stats: { ...this.stats }, score, newRecord };
    this.cameras.main.fadeOut(500, 20, 10, 40);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.launch(this.completionSceneKey, data);
      this.scene.pause();
    });
  }

  /** Chamado pela tela de derrota ("Tentar novamente"). */
  retryFromCheckpoint(): void {
    this.player.revive(this.respawnPoint.x, this.respawnPoint.y);
    this.hud.setHealth(this.player.health);
  }

  private onPlayerDied(): void {
    this.stats.deaths++;
    this.scene.launch(SCENES.GAME_OVER, { levelKey: this.scene.key });
    this.scene.pause();
  }

  // ===========================================================================
  // Helpers de construção: terreno
  // ===========================================================================

  /** Chão de terra com grama no topo. */
  protected addGround(tx: number, ty: number, tw: number, th: number): void {
    const x = tx * TILE;
    const y = ty * TILE;
    this.alignToWorld(this.add.tileSprite(x, y, tw * TILE, TILE, this.terrainTheme.grass).setOrigin(0), false);
    if (th > 1) this.alignToWorld(this.add.tileSprite(x, y + TILE, tw * TILE, (th - 1) * TILE, this.terrainTheme.dirt).setOrigin(0));
    this.addBody(this.solids, x, y, tw * TILE, th * TILE);
    this.registerTerrain(x, y, tw * TILE, th * TILE, true);
    this.addGrassTufts(tx, ty, tw);
  }

  /** Terra sem grama (subsolo, paredes de caverna). */
  protected addDirt(tx: number, ty: number, tw: number, th: number): void {
    this.alignToWorld(this.add.tileSprite(tx * TILE, ty * TILE, tw * TILE, th * TILE, this.terrainTheme.dirt).setOrigin(0));
    this.addBody(this.solids, tx * TILE, ty * TILE, tw * TILE, th * TILE);
    this.registerTerrain(tx * TILE, ty * TILE, tw * TILE, th * TILE, false);
  }

  /**
   * Registra um bloco de terreno. `decorate=false` só marca a área como "ocupada"
   * (pedra, paredes falsas, chão falso), para que vizinhos não desenhem bordas ali.
   */
  private registerTerrain(x: number, y: number, w: number, h: number, grassy: boolean, decorate = true): void {
    this.terrainRects.push(new Phaser.Geom.Rectangle(x, y, w, h));
    if (decorate) this.decoratedBlocks.push({ x, y, w, h, grassy });
  }

  /** Alinha o padrão da textura às coordenadas do mundo: blocos vizinhos não mostram emenda. */
  private alignToWorld(ts: Phaser.GameObjects.TileSprite, alignY = true): Phaser.GameObjects.TileSprite {
    return ts.setTilePosition(ts.x, alignY ? ts.y : 0);
  }

  private isTerrainAt(px: number, py: number): boolean {
    return this.terrainRects.some((r) => r.contains(px, py));
  }

  /** Sombra de profundidade baseada na altura no MUNDO: contínua entre blocos vizinhos. */
  private static readonly SHADE_SPAN = 6 * TILE;
  private static readonly SHADE_MAX = 0.6;

  private shadeAlpha(y: number): number {
    return Phaser.Math.Clamp((y - this.shadeStartY) / BaseLevelScene.SHADE_SPAN, 0, 1) * BaseLevelScene.SHADE_MAX;
  }

  /**
   * O gradiente do Phaser é linear entre topo e base do retângulo; como a sombra tem
   * início e "teto", o retângulo é dividido nesses pontos para ficar exato em qualquer bloco.
   */
  protected drawDepthShade(g: Phaser.GameObjects.Graphics, x: number, top: number, w: number, bottom: number): void {
    const color = 0x1a0c04;
    const rampStart = Math.max(top, this.shadeStartY);
    const rampEnd = Math.min(bottom, this.shadeStartY + BaseLevelScene.SHADE_SPAN);
    if (rampEnd > rampStart) {
      const a0 = this.shadeAlpha(rampStart);
      const a1 = this.shadeAlpha(rampEnd);
      g.fillGradientStyle(color, color, color, color, a0, a0, a1, a1);
      g.fillRect(x, rampStart, w, rampEnd - rampStart);
    }
    const solidStart = Math.max(top, this.shadeStartY + BaseLevelScene.SHADE_SPAN);
    if (bottom > solidStart) {
      g.fillStyle(color, BaseLevelScene.SHADE_MAX);
      g.fillRect(x, solidStart, w, bottom - solidStart);
    }
  }

  /**
   * Acabamento visual depois que a fase inteira foi montada: sombra, bordas laterais
   * e "tampas" de grama arredondadas — só nos lados realmente expostos.
   */
  private decorateTerrain(): void {
    const g = this.add.graphics().setDepth(DEPTH.TILES);
    for (const { x, y, w, h, grassy } of this.decoratedBlocks) {
      this.drawDepthShade(g, x, grassy ? y + 12 : y, w, y + h);

      g.fillStyle(0x2e1a0c, 0.55);
      for (let rowY = y; rowY < y + h; rowY += TILE) {
        const top = rowY === y && grassy ? rowY + 10 : rowY;
        const height = rowY + TILE - top;
        if (!this.isTerrainAt(x - 1, rowY + TILE / 2)) g.fillRect(x, top, 3, height);
        if (!this.isTerrainAt(x + w + 1, rowY + TILE / 2)) g.fillRect(x + w - 3, top, 3, height);
      }

      if (!grassy || !this.terrainTheme.cap) continue;
      const caps = [
        { cx: x + 1, exposed: !this.isTerrainAt(x - 1, y + TILE / 2) },
        { cx: x + w - 1, exposed: !this.isTerrainAt(x + w + 1, y + TILE / 2) },
      ];
      caps
        .filter((c) => c.exposed)
        .forEach(({ cx }) => {
          const cap = this.terrainTheme.cap!;
          g.fillStyle(cap.outline);
          g.fillCircle(cx, y + 7, 7.8);
          g.fillStyle(cap.dark);
          g.fillCircle(cx, y + 6.5, 6.4);
          g.fillStyle(cap.mid);
          g.fillCircle(cx, y + 4.6, 4.6);
          g.fillStyle(cap.light);
          g.fillCircle(cx - 1, y + 3, 1.8);
        });
    }
  }

  /** Tufos de grama espalhados de forma determinística (a fase fica sempre igual). */
  private addGrassTufts(tx: number, ty: number, tw: number): void {
    const tuft = this.terrainTheme.tuft;
    if (!tuft) return;
    for (let i = 1; i < tw - 1; i++) {
      const hash = ((tx + i) * 73 + ty * 31) % 7;
      if (hash > 2) continue;
      this.add
        .image((tx + i) * TILE + 8 + hash * 6, ty * TILE + 2, tuft)
        .setOrigin(0.5, 1)
        .setFlipX(hash === 1)
        .setDepth(DEPTH.DECOR);
    }
  }

  /** Bloco de pedra sólido. */
  protected addStone(tx: number, ty: number, tw: number, th: number): void {
    this.add.tileSprite(tx * TILE, ty * TILE, tw * TILE, th * TILE, TEXTURES.TILE_STONE).setOrigin(0);
    this.addBody(this.solids, tx * TILE, ty * TILE, tw * TILE, th * TILE);
    this.registerTerrain(tx * TILE, ty * TILE, tw * TILE, th * TILE, false, false);
  }

  /** Plataforma atravessável por baixo (madeira na floresta, laje no pântano...). */
  protected addWoodPlatform(tx: number, ty: number, tw: number): void {
    this.add.tileSprite(tx * TILE, ty * TILE, tw * TILE, 16, this.terrainTheme.platform).setOrigin(0).setTilePosition(tx * TILE, 0);
    this.addBody(this.oneWayPlatforms, tx * TILE, ty * TILE, tw * TILE, 16);
  }

  /** Água: visual na frente do jogador + área de perigo. `ty` = linha da superfície. */
  protected addWater(tx: number, ty: number, tw: number, th: number, style: 'water' | 'swamp' | 'lava' = 'water'): void {
    const swamp = style === 'swamp';
    const lava = style === 'lava';
    const x = tx * TILE;
    const w = tw * TILE;
    const surfaceY = ty * TILE + 12;
    const height = th * TILE;

    const water = this.add.graphics().setDepth(DEPTH.FOREGROUND);
    const [top, bottom] = lava ? [0xffb03a, 0x9a1f0a] : swamp ? [0x7fbf5a, 0x16301f] : [0x6fd6ff, 0x1d4f9e];
    const topAlpha = lava ? 0.95 : swamp ? 0.85 : 0.72;
    water.fillGradientStyle(top, top, bottom, bottom, topAlpha, topAlpha, 0.98, 0.98);
    water.fillRect(x, surfaceY, w, height);
    // reflexos de luz
    water.fillStyle(0xffffff, 0.12);
    for (let i = 0; i < tw; i += 3) water.fillRect(x + i * TILE + 10, surfaceY + 18 + (i % 2) * 14, 26, 3);

    const surface = this.add.tileSprite(x, surfaceY - 7, w, 12, TEXTURES.WATER_SURFACE).setOrigin(0).setDepth(DEPTH.FOREGROUND);
    if (swamp) surface.setTint(0xb8f0a0);
    if (lava) surface.setTint(0xffd27a);
    this.waterSurfaces.push(surface);

    // Pântano/lava: bolhas subindo de vez em quando.
    if (swamp || lava) {
      this.time.addEvent({
        delay: 700,
        loop: true,
        callback: () => {
          const bubble = this.add
            .circle(x + Phaser.Math.Between(8, w - 8), surfaceY + 10, Phaser.Math.Between(2, 4), lava ? 0xffe08a : 0xd8ffc0, 0.85)
            .setDepth(DEPTH.FOREGROUND + 1);
          this.tweens.add({ targets: bubble, y: surfaceY - 4, alpha: 0, duration: 700, onComplete: () => bubble.destroy() });
        },
      });
    }

    new HazardZone(this, x, (ty + 1) * TILE, w, height);
  }

  // ===========================================================================
  // Helpers de construção: objetos
  // ===========================================================================

  protected addCoin(tx: number, ty: number): Coin {
    return new Coin(this, this.tileCenterX(tx), this.tileCenterY(ty));
  }

  protected addCoinRow(tx: number, ty: number, count: number): void {
    for (let i = 0; i < count; i++) this.addCoin(tx + i, ty);
  }

  protected addCheckpoint(tx: number, groundRow: number): Checkpoint {
    return new Checkpoint(this, this.tileCenterX(tx), groundRow * TILE);
  }

  protected addSign(tx: number, groundRow: number, message: string): Sign {
    return new Sign(this, this.tileCenterX(tx), groundRow * TILE, message);
  }

  protected addChest(tx: number, groundRow: number, kind: ChestKind, coins = 5): Chest {
    return new Chest(this, this.tileCenterX(tx), groundRow * TILE, kind, coins);
  }

  protected addSpikes(tx: number, groundRow: number, tw: number): void {
    new SpikeTrap(this, tx * TILE, groundRow * TILE, tw * TILE);
  }

  protected addPopupSpikes(tx: number, groundRow: number, tw: number): void {
    new PopupSpikeTrap(this, tx * TILE, groundRow * TILE, tw * TILE);
  }

  /** Bloco que parece sólido mas é atravessável (pista: textura rachada). */
  protected addFakeWall(
    tx: number,
    ty: number,
    tw: number,
    th: number,
    texture: string,
    secretMessage?: string,
    shimmer = false,
  ): void {
    const [x, y, w, h] = [tx * TILE, ty * TILE, tw * TILE, th * TILE];
    const tiles = this.alignToWorld(this.add.tileSprite(x, y, w, h, texture).setOrigin(0));
    // Mesma sombra da terra de verdade ao redor: sem "emenda" que entregue o segredo.
    const shade = this.add.graphics();
    this.drawDepthShade(shade, x, y, w, y + h);
    this.registerTerrain(x, y, w, h, false, false);
    new FakeWall(this, this.add.container(0, 0, [tiles, shade]), secretMessage, new Phaser.Geom.Rectangle(x, y, w, h), shimmer);
  }

  /** Arbusto na frente do jogador que esconde algo atrás dele. */
  protected addFakeBush(tx: number, groundRow: number, secretMessage?: string): void {
    const visual = this.add.image(this.tileCenterX(tx), groundRow * TILE + 4, TEXTURES.DECO_BUSH).setOrigin(0.5, 1).setScale(1.7);
    new FakeWall(this, visual, secretMessage);
  }

  protected addEnemy(tx: number, groundRow: number, minTx: number, maxTx: number, options?: EnemyOptions): Enemy {
    const enemy = new Enemy(this, this.tileCenterX(tx), groundRow * TILE - 13, minTx * TILE, (maxTx + 1) * TILE, options);
    this.physics.add.collider(enemy, this.solids);
    this.registerStompable(enemy);
    return enemy;
  }

  /** Livro voador que patrulha no ar (pode ser pisado). */
  protected addFlyingBook(tx: number, ty: number, minTx: number, maxTx: number, speed?: number): FlyingBook {
    const book = new FlyingBook(this, this.tileCenterX(tx), this.tileCenterY(ty), minTx * TILE, (maxTx + 1) * TILE, speed);
    this.registerStompable(book);
    return book;
  }

  /** Regra comum de inimigo: pisar em cima derrota; encostar de lado machuca. */
  private registerStompable(enemy: Phaser.GameObjects.GameObject & { x: number; isAlive: boolean; squash(): void; arcadeBody: Phaser.Physics.Arcade.Body }): void {
    this.physics.add.overlap(this.player, enemy, () => {
      if (!enemy.isAlive || this.player.isDead) return;
      const playerBody = this.player.arcadeBody;
      const stomping = playerBody.velocity.y > 0 && playerBody.bottom <= enemy.arcadeBody.top + 10;
      if (stomping) {
        enemy.squash();
        this.player.bounce();
      } else {
        this.hurtPlayer(enemy.x);
      }
    });
  }

  /** Runa na parede que dispara orbes. `direction`: 1 = para a direita, -1 = para a esquerda. */
  protected addTurret(x: number, ty: number, direction: 1 | -1, intervalMs = 2600, offsetMs = 0): void {
    new MagicTurret(this, x, this.tileCenterY(ty), direction, intervalMs, offsetMs);
  }

  /** Espelho de parede que mostra só o que é real. */
  protected addMirror(tx: number, bottomRow: number, reflections: Reflection[]): void {
    new Mirror(this, this.tileCenterX(tx), bottomRow * TILE, reflections);
  }

  /** Artefato falso (treme como ilusão). A fase decide o que acontece em `onCollect`. */
  protected addDecoyArtifact(tx: number, ty: number, id: ArtifactId, onCollect: (decoy: DecoyArtifact) => void): DecoyArtifact {
    const decoy: DecoyArtifact = new DecoyArtifact(this, this.tileCenterX(tx), this.tileCenterY(ty), id, () => onCollect(decoy));
    return decoy;
  }

  /** Portal de teletransporte reutilizável e colorido. */
  protected addTeleportPortal(tx: number, groundRow: number, targetTx: number, targetTy: number, tint: number, message?: string): Portal {
    return new Portal(
      this,
      this.tileCenterX(tx),
      groundRow * TILE,
      () => this.teleportPlayer(this.tileCenterX(targetTx), targetTy * TILE, message),
      { reusable: true, tint },
    );
  }

  /** Faz um objeto colidir com o terreno sólido (ex.: orbes que estouram na parede). */
  collideWithTerrain(obj: Phaser.GameObjects.GameObject, onHit?: () => void): void {
    this.physics.add.collider(obj, this.solids, onHit);
  }

  /** Inimigo que parece decoração (dormindo) e persegue o jogador quando acorda. */
  protected addSleepingEnemy(tx: number, groundRow: number, minTx: number, maxTx: number): Enemy {
    return this.addEnemy(tx, groundRow, minTx, maxTx, { sleeping: true, target: this.player });
  }

  /** Peixe que salta da água. `surfaceRow` = mesma linha passada para addWater. */
  protected addFish(tx: number, surfaceRow: number, intervalMs = 2400, firstDelayMs = 0): Fish {
    const fish = new Fish(this, this.tileCenterX(tx), surfaceRow * TILE + 12, intervalMs, firstDelayMs);
    this.physics.add.overlap(this.player, fish, () => {
      if (fish.isDangerous) this.hurtPlayer(fish.x);
    });
    return fish;
  }

  /** Tábua rachada atravessável por baixo que cai pouco depois de pisada. */
  protected addCrumblePlatform(tx: number, ty: number, tw: number, respawnMs?: number): void {
    new CrumblePlatform(this, tx * TILE, ty * TILE, tw * TILE, 16, TEXTURES.PLATFORM_CRUMBLE, true, respawnMs);
  }

  /**
   * Chão falso (grama amarelada) que desaba. Coloque um buraco embaixo!
   * `coverRows` = linhas de terra falsa que escondem o buraco e caem junto.
   */
  protected addCollapsingGround(tx: number, ty: number, tw: number, coverRows = 0, respawnMs = 3000): void {
    const x = tx * TILE;
    const w = tw * TILE;
    const cover: (Phaser.GameObjects.TileSprite | Phaser.GameObjects.Graphics)[] = [];
    if (coverRows > 0) {
      const top = (ty + 1) * TILE;
      const bottom = top + coverRows * TILE;
      cover.push(this.alignToWorld(this.add.tileSprite(x, top, w, coverRows * TILE, this.terrainTheme.dirt).setOrigin(0).setDepth(DEPTH.TILES)));
      const shade = this.add.graphics().setDepth(DEPTH.TILES);
      this.drawDepthShade(shade, x, top, w, bottom);
      cover.push(shade);
    }
    this.registerTerrain(x, ty * TILE, w, (coverRows + 1) * TILE, true, false);
    new CrumblePlatform(this, x, ty * TILE, w, TILE, this.terrainTheme.loose ?? TEXTURES.TILE_GRASS_LOOSE, false, respawnMs, 300, cover);
  }

  protected addArtifact(tx: number, ty: number, id: ArtifactId, hidden = false): Artifact {
    return new Artifact(this, this.tileCenterX(tx), this.tileCenterY(ty), id, hidden);
  }

  // --- Ilusões (Fase 2+) ---

  /** Parece plataforma, mas é ilusão (pista: treme e solta faíscas roxas). */
  protected addIllusoryPlatform(tx: number, ty: number, tw: number): void {
    new IllusoryPlatform(this, tx * TILE, ty * TILE, tw * TILE, this.terrainTheme.platform);
  }

  /** Plataforma real, mas invisível (pista: vagalumes pousados em cima). */
  protected addInvisiblePlatform(tx: number, ty: number, tw: number): void {
    new InvisiblePlatform(this, tx * TILE, ty * TILE, tw * TILE, this.terrainTheme.platform);
  }

  /** Plataforma fantasma que aparece/some em ciclos (pista: pisca antes de sumir). */
  protected addPhasePlatform(tx: number, ty: number, tw: number, periodMs = 2800, offsetMs = 0): void {
    new PhasePlatform(this, tx * TILE, ty * TILE, tw * TILE, this.terrainTheme.platform, periodMs, offsetMs);
  }

  /** Plataforma que vai e volta. `dxTiles/dyTiles` = deslocamento total. */
  protected addMovingPlatform(tx: number, ty: number, tw: number, dxTiles: number, dyTiles: number, speed = 70): MovingPlatform {
    return new MovingPlatform(this, tx * TILE, ty * TILE, tw * TILE, this.terrainTheme.platform, dxTiles * TILE, dyTiles * TILE, speed);
  }

  /** Fantasma tímido: só se aproxima quando o jogador está de costas. */
  protected addGhost(tx: number, ty: number, leashTiles = 7): Ghost {
    const ghost = new Ghost(this, this.tileCenterX(tx), this.tileCenterY(ty), this.player, leashTiles * TILE);
    this.physics.add.overlap(this.player, ghost, () => this.hurtPlayer(ghost.x));
    return ghost;
  }

  /** Porta mágica (E) que teletransporta para (targetTx, targetTy) em tiles. */
  protected addMagicDoor(tx: number, groundRow: number, targetTx: number, targetTy: number, options: { symbol?: string; message?: string } = {}): MagicDoor {
    return new MagicDoor(this, this.tileCenterX(tx), groundRow * TILE, {
      ...options,
      targetX: this.tileCenterX(targetTx),
      targetY: targetTy * TILE,
    });
  }

  /** Barreira mágica sólida que só abre quando `isUnlocked()` for verdadeiro. */
  protected addMagicGate(tx: number, topRow: number, heightTiles: number, emblem: string, isUnlocked: () => boolean, lockedMessage: string): MagicGate {
    return new MagicGate(this, tx, topRow, heightTiles, emblem, isUnlocked, lockedMessage);
  }

  /** Teletransporte com "piscada" de câmera (portas, portais da Fase 3). */
  teleportPlayer(x: number, y: number, message?: string): void {
    if (this.player.isDead) return;
    AudioManager.playSfx(this, SFX.TELEPORT);
    this.spawnSparkles(this.player.x, this.player.y, ILLUSION_COLOR, 10);
    this.player.freeze();
    this.cameras.main.fadeOut(160, 30, 10, 60);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.player.respawn(x, y);
      this.player.endCelebration();
      this.cameras.main.fadeIn(220, 30, 10, 60);
      this.spawnSparkles(x, y, ILLUSION_COLOR, 10);
      if (message) this.showMessage(message, { color: '#c9b8ff', duration: 1800 });
    });
  }

  /** Chamado quando o jogador "desmascara" uma ilusão. A primeira vez dá uma dica. */
  revealIllusion(x: number, y: number): void {
    this.spawnSparkles(x, y, ILLUSION_COLOR, 12);
    AudioManager.playSfx(this, SFX.SECRET);
    if (!this.illusionHintShown) {
      this.illusionHintShown = true;
      this.showMessage('Era só uma ilusão...', { color: '#c9b8ff', duration: 1600 });
    }
  }

  /** Portal que termina a fase. */
  protected addExitPortal(tx: number, groundRow: number): Portal {
    return new Portal(this, this.tileCenterX(tx), groundRow * TILE, () => this.completeLevel());
  }

  // ===========================================================================
  // Helpers de construção: decoração
  // ===========================================================================

  protected addDeco(
    tx: number,
    groundRow: number,
    texture: string,
    options: { scale?: number; tint?: number; depth?: number; flipX?: boolean } = {},
  ): Phaser.GameObjects.Image {
    const img = this.add
      .image(this.tileCenterX(tx), groundRow * TILE + 2, texture)
      .setOrigin(0.5, 1)
      .setScale(options.scale ?? 1)
      .setFlipX(options.flipX ?? false)
      .setDepth(options.depth ?? (texture === TEXTURES.DECO_TREE ? DEPTH.DECOR_BACK : DEPTH.DECOR));
    if (options.tint !== undefined) img.setTint(options.tint);
    return img;
  }

  /** Texto solto no mundo (dicas de teste). */
  protected addWorldText(tx: number, ty: number, text: string, color = '#ffffff'): Phaser.GameObjects.Text {
    return this.add
      .text(tx * TILE, ty * TILE, text, {
        fontFamily: UI_FONT,
        fontSize: '18px',
        fontStyle: 'bold',
        color,
        stroke: '#2b1a4a',
        strokeThickness: 4,
        align: 'center',
      })
      .setOrigin(0.5, 1)
      .setDepth(DEPTH.DECOR);
  }

  // ===========================================================================
  // Helpers de fundo (parallax). Desenhados na ordem de chamada, todos no fundo.
  // ===========================================================================

  protected addSkyGradient(top: number, bottom: number): void {
    const g = this.add.graphics().setScrollFactor(0).setDepth(DEPTH.BACKGROUND);
    g.fillGradientStyle(top, top, bottom, bottom, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  /** Colinas onduladas. scrollFactor menor = mais distante. */
  protected addHills(color: number, scrollFactor: number, baseY: number, amplitude: number, frequency = 0.008): void {
    const width = this.worldWidth * scrollFactor + GAME_WIDTH + 100;
    const points: Phaser.Math.Vector2[] = [new Phaser.Math.Vector2(0, this.worldHeight + 400)];
    for (let x = 0; x <= width; x += 32) {
      const y = baseY + Math.sin(x * frequency) * amplitude + Math.sin(x * frequency * 2.7) * amplitude * 0.35;
      points.push(new Phaser.Math.Vector2(x, y));
    }
    points.push(new Phaser.Math.Vector2(width, this.worldHeight + 400));

    const g = this.add.graphics().setScrollFactor(scrollFactor).setDepth(DEPTH.BACKGROUND);
    g.fillStyle(color, 1);
    g.fillPoints(points, true);
  }

  /** Fileira de copas de árvores ao fundo. */
  protected addTreeLine(color: number, scrollFactor: number, baseY: number): void {
    const width = this.worldWidth * scrollFactor + GAME_WIDTH + 100;
    const g = this.add.graphics().setScrollFactor(scrollFactor).setDepth(DEPTH.BACKGROUND);
    g.fillStyle(color, 1);
    for (let x = 0, i = 0; x <= width; x += 46, i++) {
      const r = 34 + ((i * 37) % 22);
      g.fillCircle(x, baseY - ((i * 53) % 30), r);
    }
    g.fillRect(0, baseY, width, this.worldHeight + 400);
  }

  protected addClouds(scrollFactor: number, count: number): void {
    const width = this.worldWidth * scrollFactor + GAME_WIDTH;
    const g = this.add.graphics().setScrollFactor(scrollFactor).setDepth(DEPTH.BACKGROUND);
    g.fillStyle(0xffffff, 0.85);
    for (let i = 0; i < count; i++) {
      const x = (i + 0.5) * (width / count) + ((i * 53) % 70) - 35;
      const y = 50 + ((i * 97) % 110);
      g.fillEllipse(x, y, 90, 34);
      g.fillEllipse(x + 30, y - 12, 60, 34);
      g.fillEllipse(x - 28, y - 6, 50, 26);
    }
  }

  /** Silhueta do castelo ao longe: o objetivo final sempre visível. */
  protected addDistantCastle(x: number, baseY: number, scrollFactor: number, color = 0x7a6bb0): void {
    const g = this.add.graphics().setScrollFactor(scrollFactor).setDepth(DEPTH.BACKGROUND);
    g.fillStyle(color, 0.75);
    g.fillRect(x - 40, baseY - 120, 80, 120);
    g.fillRect(x - 80, baseY - 90, 30, 90);
    g.fillRect(x + 50, baseY - 90, 30, 90);
    g.fillRect(x - 12, baseY - 180, 24, 60);
    g.fillTriangle(x - 86, baseY - 90, x - 44, baseY - 90, x - 65, baseY - 128);
    g.fillTriangle(x + 44, baseY - 90, x + 86, baseY - 90, x + 65, baseY - 128);
    g.fillTriangle(x - 18, baseY - 180, x + 18, baseY - 180, x, baseY - 228);
    g.fillStyle(0xffe08a, 0.8);
    g.fillRect(x - 3, baseY - 160, 6, 10);
    g.fillRect(x - 20, baseY - 90, 8, 12);
    g.fillRect(x + 12, baseY - 90, 8, 12);
  }

  // ===========================================================================
  // Internos
  // ===========================================================================

  protected tileCenterX(tx: number): number {
    return tx * TILE + TILE / 2;
  }

  protected tileCenterY(ty: number): number {
    return ty * TILE + TILE / 2;
  }

  private addBody(group: Phaser.Physics.Arcade.StaticGroup, x: number, y: number, w: number, h: number): void {
    // Um único corpo invisível por bloco (o visual é separado): menos corpos = mais leve.
    const zone = this.add.zone(x + w / 2, y + h / 2, w, h);
    group.add(zone);
  }

  /** Regra das plataformas atravessáveis: só colide quando o jogador vem de cima, caindo. */
  canLandOnOneWay(platform: Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody): boolean {
    const body = this.player.arcadeBody;
    const wasAbove = body.prev.y + body.height <= platform.top + 4;
    return body.velocity.y >= 0 && wasAbove;
  }

  private updateInteraction(input: InputState): void {
    let best: Interactable | undefined;
    let bestDistance: number = INTERACT_RANGE;

    if (!this.player.isDead && !this.levelEnded) {
      const feetY = this.player.arcadeBody.bottom;
      for (const obj of this.interactables) {
        if (!obj.canInteract()) continue;
        const dx = Math.abs(obj.x - this.player.x);
        if (dx < bestDistance && Math.abs(obj.y - feetY) < INTERACT_RANGE) {
          best = obj;
          bestDistance = dx;
        }
      }
    }

    if (best !== this.focused) {
      this.focused?.onFocusLost?.();
      this.focused = best;
    }

    this.interactPrompt.setVisible(!!best);
    if (best) {
      this.interactPrompt.setPosition(best.x, best.getPromptY());
      if (input.interactPressed) best.interact();
    }
  }

  private setupCamera(): void {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.worldWidth, this.worldHeight);
    cam.startFollow(this.player, true, 0.12, 0.12);
    cam.setDeadzone(80, 60);
    cam.fadeIn(300);
  }

  private createLevelUi(): void {
    this.hud = new HUD(this, PLAYER.maxHealth);
    this.hud.setArtifacts(SaveSystem.load().artifacts);

    this.interactPrompt = this.add
      .text(0, 0, 'E', {
        fontFamily: UI_FONT,
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#2b1a4a',
        backgroundColor: '#ffd166',
        padding: { x: 7, y: 3 },
      })
      .setOrigin(0.5, 1)
      .setDepth(DEPTH.WORLD_UI)
      .setVisible(false);
    this.tweens.add({ targets: this.interactPrompt, scale: 1.15, duration: 400, yoyo: true, repeat: -1 });

    const name = getLevelBySceneKey(this.scene.key)?.name;
    if (name) this.showTitleBanner(name);

    // Botão de pausa (também serve para toque no mobile).
    const pauseBtn = this.add
      .circle(GAME_WIDTH - 36, 36, 22, 0x2b1a4a, 0.7)
      .setStrokeStyle(2, 0xffffff)
      .setScrollFactor(0)
      .setDepth(DEPTH.HUD)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(GAME_WIDTH - 36, 36, 'II', { fontFamily: UI_FONT, fontSize: '20px', fontStyle: 'bold', color: '#ffffff' })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH.HUD + 1);
    pauseBtn.on('pointerup', () => {
      if (this.canPause()) this.openPause();
    });
  }

  /** Faixa "FASE N / NOME DA FASE" que entra no início e some sozinha. */
  private showTitleBanner(fullName: string): void {
    const [stage, title] = fullName.includes(' — ') ? fullName.split(' — ') : ['', fullName];

    const titleText = this.add
      .text(0, stage ? 12 : 0, title, {
        fontFamily: UI_FONT,
        fontSize: '34px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#173a22',
        strokeThickness: 7,
      })
      .setOrigin(0.5);
    const stageText = this.add
      .text(0, -22, stage, {
        fontFamily: UI_FONT,
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#ffd166',
        stroke: '#173a22',
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    const w = Math.max(titleText.width + 70, 300);
    const h = stage ? 84 : 60;
    const bg = this.add.graphics();
    // pontas da fita
    bg.fillStyle(0x163a24, 1);
    bg.fillTriangle(-w / 2 - 22, -h / 2 + 14, -w / 2 + 6, -h / 2 + 14, -w / 2 + 6, h / 2 + 6);
    bg.fillTriangle(w / 2 + 22, -h / 2 + 14, w / 2 - 6, -h / 2 + 14, w / 2 - 6, h / 2 + 6);
    // faixa principal
    bg.fillStyle(0x0d2416, 0.45);
    bg.fillRoundedRect(-w / 2 + 4, -h / 2 + 6, w, h, 16);
    bg.fillStyle(0x22603a, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 16);
    bg.fillStyle(0x3a8a52, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h / 2, { tl: 16, tr: 16, bl: 0, br: 0 });
    bg.lineStyle(3, 0xffd166, 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 16);
    bg.lineStyle(1.5, 0xffffff, 0.25);
    bg.strokeRoundedRect(-w / 2 + 6, -h / 2 + 6, w - 12, h - 12, 12);

    const banner = this.add
      .container(GAME_WIDTH / 2, 70, [bg, stageText, titleText])
      .setScrollFactor(0)
      .setDepth(DEPTH.HUD)
      .setAlpha(0);
    this.tweens.add({ targets: banner, y: 118, alpha: 1, duration: 450, ease: 'Back.easeOut' });
    this.tweens.add({ targets: banner, y: 90, alpha: 0, delay: 2600, duration: 500, ease: 'Quad.easeIn' });
  }

  private setupPauseHandling(): void {
    const onResume = () => {
      this.input.keyboard?.resetKeys();
      this.controls.sync();
    };
    this.events.on(Phaser.Scenes.Events.RESUME, onResume);
    // Evita acumular listeners quando a fase é reiniciada.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.events.off(Phaser.Scenes.Events.RESUME, onResume));
  }

  private canPause(): boolean {
    return !this.player.isDead && !this.levelEnded;
  }

  private openPause(): void {
    this.scene.launch(SCENES.PAUSE, { levelKey: this.scene.key });
    this.scene.pause();
  }
}
