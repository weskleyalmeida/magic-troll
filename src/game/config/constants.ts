/** Resolução lógica do jogo. O Phaser escala isso para caber em qualquer tela (Scale.FIT). */
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

/** Tamanho do tile em pixels. Fases são montadas em coordenadas de tile. */
export const TILE = 32;

export const WORLD_GRAVITY = 1400;

/**
 * Parâmetros de "feel" do personagem. Ajuste aqui para mudar a jogabilidade
 * sem mexer na lógica do Player.
 */
export const PLAYER = {
  maxSpeed: 260, // px/s
  acceleration: 2200, // px/s² no chão
  deceleration: 2600, // px/s² ao soltar a direção
  turnMultiplier: 2, // virar para o lado oposto é mais rápido (responsividade)
  airControl: 0.65, // fração da aceleração disponível no ar
  jumpVelocity: -620, // ~4 tiles de altura
  jumpCutMultiplier: 0.45, // soltar o pulo cedo corta a subida (pulo variável)
  maxFallSpeed: 800,
  coyoteTimeMs: 100, // ainda pode pular logo depois de sair da borda
  jumpBufferMs: 120, // pulo apertado um pouco antes de tocar o chão ainda conta
  runThreshold: 0.75, // acima dessa fração da maxSpeed a animação vira "correndo"

  maxHealth: 3,
  invulnerableMs: 1200, // tempo piscando depois de tomar dano
  hurtLockMs: 300, // tempo sem controle durante o knockback
  knockbackX: 240,
  knockbackY: -320,
  stompBounce: -460, // quique ao pisar em um inimigo (segure o pulo para ir mais alto)
} as const;

/** Distância máxima (px) para interagir com placas, baús etc. */
export const INTERACT_RANGE = 44;

/** Camadas de desenho. Quanto maior, mais na frente. */
export const DEPTH = {
  BACKGROUND: -100,
  CAVE_BACKDROP: -50,
  DECOR_BACK: -5, // árvores (o pé fica escondido atrás da grama)
  HIDDEN: -1, // coisas escondidas "dentro" do chão (espinhos retraídos)
  TILES: 0,
  DECOR: 2,
  ITEMS: 5,
  ENEMIES: 8,
  PLAYER: 10,
  FOREGROUND: 15, // água, cachoeira, paredes falsas
  WORLD_UI: 20, // balões de placas, indicador "E", brilhos
  HUD: 100,
} as const;

export const UI_FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';
