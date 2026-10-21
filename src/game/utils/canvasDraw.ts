import Phaser from 'phaser';

/**
 * Pequenos helpers de Canvas 2D para desenhar placeholders com cara de arte final
 * (contorno cartoon, gradientes, brilhos). Tudo vira textura comum do Phaser.
 */

export type Ctx = CanvasRenderingContext2D;

/** Cor de contorno padrão (roxo bem escuro: mais "cartoon" que preto puro). */
export const OUTLINE = '#2a1d33';

export function canvasTexture(scene: Phaser.Scene, key: string, w: number, h: number, draw: (ctx: Ctx) => void): void {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const texture = scene.textures.createCanvas(key, w, h);
  if (!texture) return;
  const ctx = texture.getContext();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  draw(ctx);
  texture.refresh();
}

export function linear(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]): CanvasGradient {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([offset, color]) => g.addColorStop(offset, color));
  return g;
}

export function radial(ctx: Ctx, x: number, y: number, r: number, stops: [number, string][]): CanvasGradient {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  stops.forEach(([offset, color]) => g.addColorStop(offset, color));
  return g;
}

/** Preenche um caminho e (opcionalmente) contorna. */
export function shape(
  ctx: Ctx,
  path: () => void,
  fill: string | CanvasGradient,
  stroke: string | null = OUTLINE,
  lineWidth = 1.5,
): void {
  ctx.beginPath();
  path();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

/** Só contorna um caminho (sem preencher). */
export function strokeShape(ctx: Ctx, path: () => void, color: string = OUTLINE, lineWidth = 1.5): void {
  ctx.beginPath();
  path();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

export function roundRectPath(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function ellipsePath(ctx: Ctx, x: number, y: number, rx: number, ry: number): void {
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
}

export function circlePath(ctx: Ctx, x: number, y: number, r: number): void {
  ctx.arc(x, y, r, 0, Math.PI * 2);
}

export function polygonPath(ctx: Ctx, points: [number, number][]): void {
  points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.closePath();
}

export function starPath(ctx: Ctx, x: number, y: number, outer: number, inner: number, spikes = 5): void {
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/** Linha simples. */
export function line(ctx: Ctx, points: [number, number][], color: string, width = 1.5): void {
  ctx.beginPath();
  points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

/**
 * Copa de árvore/arbusto "fofa": vários círculos com contorno externo único
 * (desenha primeiro os círculos maiores na cor do contorno), sombra e brilho.
 */
export function foliage(
  ctx: Ctx,
  blobs: [x: number, y: number, r: number][],
  colors: { outline?: string | null; dark: string; mid: string; light: string },
  outlineWidth = 2,
): void {
  if (colors.outline) {
    ctx.fillStyle = colors.outline;
    blobs.forEach(([x, y, r]) => {
      ctx.beginPath();
      circlePath(ctx, x, y, r + outlineWidth);
      ctx.fill();
    });
  }
  ctx.fillStyle = colors.dark;
  blobs.forEach(([x, y, r]) => {
    ctx.beginPath();
    circlePath(ctx, x, y, r);
    ctx.fill();
  });
  ctx.fillStyle = colors.mid;
  blobs.forEach(([x, y, r]) => {
    ctx.beginPath();
    circlePath(ctx, x - r * 0.12, y - r * 0.18, r * 0.82);
    ctx.fill();
  });
  ctx.fillStyle = colors.light;
  blobs.forEach(([x, y, r]) => {
    ctx.beginPath();
    circlePath(ctx, x - r * 0.35, y - r * 0.42, r * 0.32);
    ctx.fill();
  });
}

/** Gerador pseudoaleatório determinístico (as texturas saem sempre iguais). */
export function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
