/**
 * Todas as chaves de assets ficam aqui. A lógica do jogo só conhece estas chaves,
 * então trocar um placeholder por um sprite real não exige mudar entidades/cenas.
 */

export const TEXTURES = {
  // Player
  PLAYER_IDLE: 'player-idle',
  PLAYER_WALK_0: 'player-walk-0',
  PLAYER_WALK_1: 'player-walk-1',
  PLAYER_JUMP: 'player-jump',
  PLAYER_FALL: 'player-fall',
  PLAYER_HURT: 'player-hurt',
  PLAYER_CELEBRATE: 'player-celebrate',

  // Inimigos
  ENEMY_MUSHROOM_0: 'enemy-mushroom-0',
  ENEMY_MUSHROOM_1: 'enemy-mushroom-1',
  ENEMY_MUSHROOM_SQUASHED: 'enemy-mushroom-squashed',
  ENEMY_MUSHROOM_SLEEP: 'enemy-mushroom-sleep',
  ENEMY_FISH: 'enemy-fish',

  // Terreno
  TILE_GRASS: 'tile-grass',
  TILE_GRASS_LOOSE: 'tile-grass-loose',
  TILE_DIRT: 'tile-dirt',
  TILE_DIRT_CRACKED: 'tile-dirt-cracked',
  TILE_STONE: 'tile-stone',
  PLATFORM_WOOD: 'platform-wood',
  PLATFORM_CRUMBLE: 'platform-crumble',
  WATERFALL: 'waterfall',

  // Armadilhas e objetos
  SPIKES: 'spikes',
  SPIKE_HOLES: 'spike-holes',
  SIGN: 'sign',
  CHEST_CLOSED: 'chest-closed',
  CHEST_OPEN: 'chest-open',
  CHEST_FAKE_CLOSED: 'chest-fake-closed',
  CHEST_FAKE_OPEN: 'chest-fake-open',
  CHECKPOINT_OFF: 'checkpoint-off',
  CHECKPOINT_ON: 'checkpoint-on',
  PORTAL: 'portal',

  // Itens
  COIN: 'coin',
  ITEM_CRYSTAL: 'item-crystal',
  ITEM_KEY: 'item-key',
  ITEM_EYE: 'item-eye',
  SPARKLE: 'sparkle',

  // Decoração
  DECO_TREE: 'deco-tree',
  DECO_BUSH: 'deco-bush',
  DECO_FLOWER: 'deco-flower',
  DECO_MUSHROOM: 'deco-mushroom',
  DECO_ROCK: 'deco-rock',
  DECO_TUFT: 'deco-tuft',

  // Pântano
  TILE_MOSS: 'tile-moss',
  TILE_MUD: 'tile-mud',
  PLATFORM_SLAB: 'platform-slab',
  DECO_REED: 'deco-reed',
  DECO_SWAMP_TREE: 'deco-swamp-tree',
  DECO_RUIN: 'deco-ruin',
  DECO_LILY: 'deco-lily',
  ENEMY_GHOST: 'enemy-ghost',
  ENEMY_GHOST_SHY: 'enemy-ghost-shy',
  DOOR: 'door',
  SYMBOL_SUN: 'symbol-sun',
  SYMBOL_MOON: 'symbol-moon',
  SYMBOL_STAR: 'symbol-star',
  BG_SWAMP_FAR: 'bg-swamp-far',
  BG_SWAMP_MID: 'bg-swamp-mid',
  BG_SWAMP_NEAR: 'bg-swamp-near',
  FOG: 'fog',

  // Torre
  TILE_TOWER_FLOOR: 'tile-tower-floor',
  TILE_TOWER_BRICK: 'tile-tower-brick',
  BG_TOWER_WALL: 'bg-tower-wall',
  WINDOW: 'window',
  BOOKSHELF: 'bookshelf',
  CANDLE: 'candle',
  RUNE: 'rune',
  MIRROR: 'mirror',
  ORB: 'orb',
  FLYING_BOOK_0: 'flying-book-0',
  FLYING_BOOK_1: 'flying-book-1',

  // Castelo
  TILE_CASTLE_FLOOR: 'tile-castle-floor',
  TILE_CASTLE_BRICK: 'tile-castle-brick',
  TILE_CASTLE_LOOSE: 'tile-castle-loose',
  BG_CASTLE_WALL: 'bg-castle-wall',
  PLATFORM_CASTLE: 'platform-castle',
  TORCH: 'torch',
  PAINTING: 'painting',
  BANNER: 'banner',
  STATUE: 'statue',
  THRONE: 'throne',
  BUTTON_RED: 'button-red',
  BUTTON_RED_PRESSED: 'button-red-pressed',
  CHANDELIER: 'chandelier',
  ROCK: 'rock',
  BOSS_IDLE: 'boss-idle',
  BOSS_WINDUP: 'boss-windup',
  BOSS_DIZZY: 'boss-dizzy',
  BOSS_HURT: 'boss-hurt',

  // Fundos (camadas de parallax que se repetem na horizontal)
  BG_TREES_FAR: 'bg-trees-far',
  BG_TREES_MID: 'bg-trees-mid',
  BG_TREES_NEAR: 'bg-trees-near',
  BG_CASTLE: 'bg-castle',
  BG_CAVE: 'bg-cave',
  WATER_SURFACE: 'water-surface',

  // UI
  LOCK: 'lock',
  HEART_FULL: 'heart-full',
  HEART_EMPTY: 'heart-empty',
} as const;

export const ANIMS = {
  PLAYER_IDLE: 'anim-player-idle',
  PLAYER_WALK: 'anim-player-walk',
  PLAYER_RUN: 'anim-player-run',
  PLAYER_JUMP: 'anim-player-jump',
  PLAYER_FALL: 'anim-player-fall',
  PLAYER_HURT: 'anim-player-hurt',
  PLAYER_CELEBRATE: 'anim-player-celebrate',
  ENEMY_MUSHROOM_WALK: 'anim-enemy-mushroom-walk',
  FLYING_BOOK: 'anim-flying-book',
} as const;

/** Efeitos sonoros. Arquivos esperados em public/assets/audio/ (ainda não existem). */
export const SFX = {
  JUMP: 'sfx-jump',
  COIN: 'sfx-coin',
  COLLECT: 'sfx-collect',
  HURT: 'sfx-hurt',
  DEATH: 'sfx-death',
  STOMP: 'sfx-stomp',
  CHECKPOINT: 'sfx-checkpoint',
  CHEST: 'sfx-chest',
  TRAP: 'sfx-trap',
  CRUMBLE: 'sfx-crumble',
  ENEMY_ALERT: 'sfx-enemy-alert',
  SECRET: 'sfx-secret',
  DOOR: 'sfx-door',
  TELEPORT: 'sfx-teleport',
  BOSS: 'sfx-boss',
  VICTORY: 'sfx-victory',
} as const;

export const MUSIC = {
  MENU: 'music-menu',
  FOREST: 'music-forest',
} as const;
