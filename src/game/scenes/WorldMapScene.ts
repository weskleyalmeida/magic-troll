import Phaser from 'phaser';
import { ANIMS, SFX, TEXTURES } from '../config/assetKeys';
import { ARTIFACTS } from '../config/artifacts';
import { GAME_HEIGHT, GAME_WIDTH, UI_FONT } from '../config/constants';
import { LEVELS } from '../config/levels';
import { SCENES } from '../config/sceneKeys';
import { AudioManager } from '../systems/AudioManager';
import { SaveSystem } from '../systems/SaveSystem';
import { TextButton } from '../ui/TextButton';
import { addFireflies } from '../utils/backdrops';
import { formatTime } from '../utils/format';

/** Visual de cada fase no mapa. Fases novas sem entrada aqui usam o último estilo. */
const NODE_STYLES = [
  { color: 0x5cc552, icon: ARTIFACTS.crystal.texture, iconScale: 0.9, ground: 0x6dbb73 },
  { color: 0x4fae8a, icon: ARTIFACTS.key.texture, iconScale: 1, ground: 0x4f7f6a },
  { color: 0x9a6aff, icon: ARTIFACTS.eye.texture, iconScale: 1, ground: 0x6a6488 },
  { color: 0xe04a5a, icon: TEXTURES.THRONE, iconScale: 0.32, ground: 0x5a4060 },
];

interface MapNode {
  index: number;
  x: number;
  y: number;
  disc: Phaser.GameObjects.Arc;
  lock?: Phaser.GameObjects.Image;
  icon: Phaser.GameObjects.Image;
}

/**
 * Mapa do reino: as fases aparecem ao longo de um caminho.
 * Uma fase só abre depois que a anterior for concluída (SaveSystem.unlockedLevelIndex).
 * Controles: ← → (ou A/D) para andar, ENTER/ESPAÇO/E para entrar, clique/toque nos pontos.
 */
export class WorldMapScene extends Phaser.Scene {
  private nodes: MapNode[] = [];
  private hero!: Phaser.GameObjects.Sprite;
  private current = 0;
  private busy = false;
  private infoTitle!: Phaser.GameObjects.Text;
  private infoStatus!: Phaser.GameObjects.Text;
  private toast?: Phaser.GameObjects.Text;
  private ring!: Phaser.GameObjects.Arc;

  constructor() {
    super(SCENES.WORLD_MAP);
  }

  create(): void {
    this.nodes = [];
    this.busy = false;
    const save = SaveSystem.load();
    const unlocked = Math.min(save.unlockedLevelIndex, LEVELS.length - 1);
    const hasNewUnlock = unlocked > save.seenUnlockedIndex;

    this.drawBackground();
    this.drawPaths(hasNewUnlock ? unlocked - 1 : unlocked);
    LEVELS.forEach((_, i) => this.createNode(i, hasNewUnlock && i === unlocked ? true : !SaveSystem.isUnlocked(i)));
    this.createUi();

    this.current = hasNewUnlock ? unlocked - 1 : Phaser.Math.Clamp(save.lastPlayedLevelIndex, 0, unlocked);
    const start = this.nodes[this.current];
    this.ring = this.add.circle(start.x, start.y, 30).setStrokeStyle(3, 0xffffff, 0.9).setDepth(4);
    this.tweens.add({ targets: this.ring, scale: 1.25, alpha: 0.2, duration: 800, repeat: -1 });
    this.hero = this.add.sprite(start.x, start.y - 6, TEXTURES.PLAYER_IDLE).setOrigin(0.5, 1).setScale(1.4).setDepth(10);
    this.hero.play(ANIMS.PLAYER_IDLE);
    this.updateInfo();
    this.setupInput();

    this.cameras.main.fadeIn(400, 20, 10, 40);
    if (hasNewUnlock) {
      this.busy = true;
      this.time.delayedCall(700, () => this.playUnlock(unlocked));
    }
  }

  // ---------------------------------------------------------------------------
  // Navegação
  // ---------------------------------------------------------------------------

  private setupInput(): void {
    const kb = this.input.keyboard;
    if (!kb) return;
    const bindings: [string, () => void][] = [
      ['keydown-LEFT', () => this.move(-1)],
      ['keydown-A', () => this.move(-1)],
      ['keydown-RIGHT', () => this.move(1)],
      ['keydown-D', () => this.move(1)],
      ['keydown-ENTER', () => this.enter()],
      ['keydown-SPACE', () => this.enter()],
      ['keydown-E', () => this.enter()],
      ['keydown-ESC', () => this.goToMenu()],
    ];
    bindings.forEach(([event, fn]) => kb.on(event, fn));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => bindings.forEach(([event, fn]) => kb.off(event, fn)));
  }

  private move(dir: 1 | -1): void {
    if (this.busy) return;
    const target = this.current + dir;
    if (target < 0 || target >= this.nodes.length) return;
    if (!SaveSystem.isUnlocked(target)) {
      this.lockedFeedback(target);
      return;
    }
    this.walkTo(target);
  }

  private onNodeClicked(index: number): void {
    if (this.busy) return;
    if (index === this.current) this.enter();
    else if (SaveSystem.isUnlocked(index)) this.walkTo(index);
    else this.lockedFeedback(index);
  }

  /** Anda nó a nó pelo caminho até o destino. */
  private walkTo(target: number, onArrive?: () => void): void {
    if (target === this.current) {
      onArrive?.();
      return;
    }
    this.busy = true;
    const dir = target > this.current ? 1 : -1;
    const from = this.current;
    const to = from + dir;
    const curve = this.segment(Math.min(from, to));
    this.hero.setFlipX(dir < 0).play(ANIMS.PLAYER_WALK, true);
    AudioManager.playSfx(this, SFX.JUMP);

    const progress = { t: 0 };
    this.tweens.add({
      targets: progress,
      t: 1,
      duration: 650,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        const p = curve.getPoint(dir > 0 ? progress.t : 1 - progress.t);
        this.hero.setPosition(p.x, p.y - 6);
      },
      onComplete: () => {
        this.current = to;
        this.ring.setPosition(this.nodes[to].x, this.nodes[to].y);
        this.updateInfo();
        if (to === target) {
          this.hero.play(ANIMS.PLAYER_IDLE);
          this.busy = false;
          onArrive?.();
        } else {
          this.busy = false;
          this.walkTo(target, onArrive);
        }
      },
    });
  }

  private enter(): void {
    if (this.busy) return;
    const level = LEVELS[this.current];
    if (!level || !SaveSystem.isUnlocked(this.current)) return;
    this.busy = true;
    SaveSystem.setLastPlayed(this.current);
    AudioManager.playSfx(this, SFX.TELEPORT);
    this.hero.play(ANIMS.PLAYER_CELEBRATE);
    this.tweens.add({ targets: this.hero, y: this.hero.y - 20, duration: 200, yoyo: true });
    this.cameras.main.fadeOut(450, 20, 10, 40);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start(level.sceneKey));
  }

  private goToMenu(): void {
    if (this.busy) return;
    this.scene.start(SCENES.MENU);
  }

  private lockedFeedback(index: number): void {
    const node = this.nodes[index];
    if (node.lock) this.tweens.add({ targets: node.lock, x: node.x + 4, duration: 50, yoyo: true, repeat: 3, onComplete: () => node.lock?.setX(node.x) });
    this.showToast(`Bloqueada! Conclua a Fase ${index} primeiro.`);
  }

  // ---------------------------------------------------------------------------
  // Desbloqueio animado
  // ---------------------------------------------------------------------------

  private playUnlock(index: number): void {
    const node = this.nodes[index];
    const lock = node.lock;
    this.drawPathSegment(index - 1, true);

    const finish = () => {
      node.disc.setFillStyle(NODE_STYLES[Math.min(index, NODE_STYLES.length - 1)].color);
      node.icon.setAlpha(0.6);
      SaveSystem.markUnlockSeen(index);
      this.showToast(`Fase ${index + 1} desbloqueada!`, '#7affb0');
      this.walkTo(index, () => SaveSystem.setLastPlayed(index));
    };
    if (!lock) {
      finish();
      return;
    }
    this.tweens.add({
      targets: lock,
      angle: { from: -12, to: 12 },
      duration: 70,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        this.spawnSparkles(node.x, node.y, 0xffd166, 18);
        AudioManager.playSfx(this, SFX.DOOR);
        this.cameras.main.shake(200, 0.006);
        this.tweens.add({ targets: lock, y: lock.y + 40, alpha: 0, angle: 60, duration: 450, onComplete: () => lock.destroy() });
        node.lock = undefined;
        this.busy = false;
        finish();
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Desenho
  // ---------------------------------------------------------------------------

  private nodePosition(i: number): { x: number; y: number } {
    const n = LEVELS.length;
    const x = n === 1 ? GAME_WIDTH / 2 : 140 + i * ((GAME_WIDTH - 280) / (n - 1));
    const y = i % 2 === 0 ? 350 : 262;
    return { x, y };
  }

  /** Trecho do caminho entre o nó i e o nó i+1 (curva suave). */
  private segment(i: number): Phaser.Curves.QuadraticBezier {
    const a = this.nodePosition(i);
    const b = this.nodePosition(i + 1);
    const control = new Phaser.Math.Vector2((a.x + b.x) / 2, Math.min(a.y, b.y) - 70);
    return new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(a.x, a.y), control, new Phaser.Math.Vector2(b.x, b.y));
  }

  private drawPaths(openUpTo: number): void {
    for (let i = 0; i < LEVELS.length - 1; i++) this.drawPathSegment(i, i < openUpTo);
  }

  /** Caminho pontilhado; trechos ainda bloqueados ficam apagados. */
  private drawPathSegment(i: number, open: boolean): void {
    const curve = this.segment(i);
    const points = curve.getSpacedPoints(Math.max(8, Math.round(curve.getLength() / 16)));
    const g = this.add.graphics().setDepth(2);
    points.slice(1, -1).forEach((p) => {
      g.fillStyle(0x2a1d33, open ? 0.9 : 0.35);
      g.fillCircle(p.x, p.y, 5);
      g.fillStyle(open ? 0xfff1c8 : 0x9a90a8, open ? 1 : 0.5);
      g.fillCircle(p.x, p.y, 3.5);
    });
  }

  private createNode(i: number, locked: boolean): void {
    const { x, y } = this.nodePosition(i);
    const style = NODE_STYLES[Math.min(i, NODE_STYLES.length - 1)];
    const level = LEVELS[i];
    const completed = SaveSystem.isCompleted(level.id);

    this.add.ellipse(x, y + 10, 70, 22, 0x000000, 0.3).setDepth(3);
    this.add.ellipse(x, y + 4, 66, 26, 0x8a8fa3).setStrokeStyle(2, 0x3f4458).setDepth(3);
    const disc = this.add
      .circle(x, y - 2, 22, locked ? 0x5a5468 : style.color)
      .setStrokeStyle(3, completed ? 0xffd166 : 0xffffff)
      .setDepth(5)
      .setInteractive({ useHandCursor: true });
    disc.on('pointerup', () => this.onNodeClicked(i));
    this.add
      .text(x, y - 2, String(i + 1), { fontFamily: UI_FONT, fontSize: '22px', fontStyle: 'bold', color: '#ffffff', stroke: '#2a1d33', strokeThickness: 5 })
      .setOrigin(0.5)
      .setDepth(6);

    // Artefato da fase: aceso se concluída, silhueta se não.
    const icon = this.add
      .image(x, y - 62, style.icon)
      .setScale(style.iconScale)
      .setDepth(6)
      .setAlpha(completed ? 1 : 0.6);
    if (!completed) icon.setTint(0x3a3448);
    else this.tweens.add({ targets: icon, y: icon.y - 5, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const shortName = level.name.includes(' — ') ? level.name.split(' — ')[1] : level.name;
    this.add
      .text(x, y + 30, shortName, {
        fontFamily: UI_FONT,
        fontSize: '14px',
        fontStyle: 'bold',
        color: locked ? '#b8b0c8' : '#ffffff',
        stroke: '#2a1d33',
        strokeThickness: 4,
        align: 'center',
        wordWrap: { width: 150 },
      })
      .setOrigin(0.5, 0)
      .setDepth(6);

    if (completed) {
      this.add.image(x + 20, y - 22, TEXTURES.SPARKLE).setScale(2.2).setTint(0xffd166).setDepth(7);
    }

    const node: MapNode = { index: i, x, y, disc, icon };
    if (locked) node.lock = this.add.image(x, y - 4, TEXTURES.LOCK).setDepth(8);
    this.nodes.push(node);
  }

  private drawBackground(): void {
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x8fd8ff, 0x3a2a6a, 0xe8fbe4, 0x7a5a8a, 1);
    sky.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // nuvens
    const clouds = this.add.graphics();
    clouds.fillStyle(0xffffff, 0.7);
    [[110, 90], [330, 60], [540, 110]].forEach(([x, y]) => {
      clouds.fillEllipse(x, y, 90, 30);
      clouds.fillEllipse(x + 28, y - 10, 56, 30);
    });
    // lua no lado do castelo
    this.add.circle(860, 70, 30, 0xfff6e8, 0.95);
    this.add.circle(860, 70, 56, 0xfff1d6, 0.15).setBlendMode(Phaser.BlendModes.ADD);

    // castelo ao fundo (o destino final)
    this.add.image(810, 250, TEXTURES.BG_CASTLE).setOrigin(0.5, 1).setScale(0.62).setAlpha(0.95);

    // terreno: uma colina por região
    LEVELS.forEach((_, i) => {
      const { x } = this.nodePosition(i);
      const style = NODE_STYLES[Math.min(i, NODE_STYLES.length - 1)];
      const hill = this.add.graphics();
      hill.fillStyle(style.ground, 1);
      hill.fillEllipse(x, GAME_HEIGHT + 40, 420, 520);
      hill.fillStyle(0xffffff, 0.08);
      hill.fillEllipse(x - 40, GAME_HEIGHT - 170, 220, 60);
    });

    // decoração de cada região
    const p = (i: number) => this.nodePosition(i);
    [[-90, 330], [-50, 420], [80, 410], [95, 300]].forEach(([dx, y]) =>
      this.add.image(p(0).x + dx, y, TEXTURES.DECO_TREE).setOrigin(0.5, 1).setScale(0.38),
    );
    if (LEVELS.length > 1) {
      this.add.ellipse(p(1).x - 30, 400, 160, 40, 0x3f8f7a, 0.9);
      this.add.image(p(1).x - 60, 398, TEXTURES.DECO_LILY);
      this.add.image(p(1).x + 10, 404, TEXTURES.DECO_LILY).setFlipX(true);
      [[-95, 260], [90, 330]].forEach(([dx, y]) => this.add.image(p(1).x + dx, y, TEXTURES.DECO_SWAMP_TREE).setOrigin(0.5, 1).setScale(0.4));
    }
    if (LEVELS.length > 2) this.drawTower(p(2).x + 80, 330);
    addFireflies(this, GAME_WIDTH, GAME_HEIGHT, 18);
  }

  private drawTower(x: number, baseY: number): void {
    const g = this.add.graphics();
    g.fillStyle(0x2a2440, 1);
    g.fillRect(x - 22, baseY - 150, 44, 150);
    g.fillStyle(0x8d86a8, 1);
    g.fillRect(x - 19, baseY - 148, 38, 148);
    g.fillStyle(0x666082, 1);
    for (let y = baseY - 140; y < baseY; y += 16) g.fillRect(x - 19, y, 38, 2);
    g.fillStyle(0x5a2db0, 1);
    g.fillTriangle(x - 30, baseY - 148, x + 30, baseY - 148, x, baseY - 210);
    g.fillStyle(0xffe9a8, 1);
    g.fillRect(x - 5, baseY - 120, 10, 14);
    g.fillRect(x - 5, baseY - 70, 10, 14);
  }

  private createUi(): void {
    this.add
      .text(GAME_WIDTH / 2, 40, 'MAPA DO REINO', {
        fontFamily: UI_FONT,
        fontSize: '40px',
        fontStyle: 'bold',
        color: '#ffd166',
        stroke: '#2a1660',
        strokeThickness: 9,
      })
      .setOrigin(0.5)
      .setDepth(20);

    new TextButton(this, 80, 40, 'MENU', () => this.goToMenu(), 120).setDepth(20);

    // Painel de informações da fase atual.
    const panel = this.add.graphics().setDepth(20);
    panel.fillStyle(0x000000, 0.3);
    panel.fillRoundedRect(GAME_WIDTH / 2 - 357, 450, 720, 78, 14);
    panel.fillStyle(0x1c1446, 0.92);
    panel.fillRoundedRect(GAME_WIDTH / 2 - 360, 446, 720, 78, 14);
    panel.lineStyle(2, 0xffd166, 0.9);
    panel.strokeRoundedRect(GAME_WIDTH / 2 - 360, 446, 720, 78, 14);

    this.infoTitle = this.add
      .text(GAME_WIDTH / 2 - 340, 458, '', { fontFamily: UI_FONT, fontSize: '20px', fontStyle: 'bold', color: '#ffd166' })
      .setDepth(21);
    this.infoStatus = this.add
      .text(GAME_WIDTH / 2 - 340, 484, '', { fontFamily: UI_FONT, fontSize: '15px', color: '#ffffff' })
      .setDepth(21);
    this.add
      .text(GAME_WIDTH / 2 - 340, 505, '← → andar   ·   ENTER jogar   ·   ou toque numa fase', { fontFamily: UI_FONT, fontSize: '12px', color: '#c9b8ff' })
      .setDepth(21);
    new TextButton(this, GAME_WIDTH / 2 + 260, 485, 'JOGAR', () => this.enter(), 160).setDepth(21);
  }

  private updateInfo(): void {
    const level = LEVELS[this.current];
    const save = SaveSystem.load();
    this.infoTitle.setText(level.name);
    if (SaveSystem.isCompleted(level.id)) {
      const time = formatTime(save.bestTimesMs[level.id]);
      const score = save.bestScores[level.id] ?? 0;
      this.infoStatus.setText(`★ Concluída   ·   Melhor tempo ${time}   ·   Recorde ${score} pts`);
    } else {
      this.infoStatus.setText('Ainda não concluída. Pronta para jogar!');
    }
  }

  private showToast(text: string, color = '#ffb3b3'): void {
    this.toast?.destroy();
    const toast = this.add
      .text(GAME_WIDTH / 2, 100, text, { fontFamily: UI_FONT, fontSize: '22px', fontStyle: 'bold', color, stroke: '#2a1660', strokeThickness: 6 })
      .setOrigin(0.5)
      .setDepth(30);
    this.toast = toast;
    this.tweens.add({ targets: toast, alpha: 0, delay: 1600, duration: 400, onComplete: () => toast.destroy() });
  }

  private spawnSparkles(x: number, y: number, color: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const s = this.add.image(x, y, TEXTURES.SPARKLE).setTint(color).setDepth(30);
      const a = Math.random() * Math.PI * 2;
      const d = Phaser.Math.Between(20, 50);
      this.tweens.add({ targets: s, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, alpha: 0, duration: 600, onComplete: () => s.destroy() });
    }
  }
}
