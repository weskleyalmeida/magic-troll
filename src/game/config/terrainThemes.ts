import { TEXTURES } from './assetKeys';

/** Visual do terreno de uma fase (as regras de colisão são as mesmas para todas). */
export interface TerrainTheme {
  /** Linha de cima do chão (64 x 32). */
  grass: string;
  /** Terra/subsolo (64 x 64, repetível). */
  dirt: string;
  /** Tufo espalhado sobre o chão (sem tufo: undefined). */
  tuft?: string;
  /** Linha de chão que desaba (pista visual). Padrão: grama amarelada. */
  loose?: string;
  /** Plataforma atravessável padrão (32 x 16). */
  platform: string;
  /** "Tampas" arredondadas nas bordas do chão (grama/musgo). Sem tampas: undefined. */
  cap?: { outline: number; dark: number; mid: number; light: number };
}

export const FOREST_THEME: TerrainTheme = {
  grass: TEXTURES.TILE_GRASS,
  dirt: TEXTURES.TILE_DIRT,
  tuft: TEXTURES.DECO_TUFT,
  platform: TEXTURES.PLATFORM_WOOD,
  cap: { outline: 0x2c5e18, dark: 0x4c9e28, mid: 0x7fd447, light: 0xb8f070 },
};

export const SWAMP_THEME: TerrainTheme = {
  grass: TEXTURES.TILE_MOSS,
  dirt: TEXTURES.TILE_MUD,
  tuft: TEXTURES.DECO_REED,
  platform: TEXTURES.PLATFORM_SLAB,
  cap: { outline: 0x1b3d2a, dark: 0x3c7a4c, mid: 0x5fa85a, light: 0x9fd67a },
};

/** Castelo: piso de pedra polida com friso dourado sobre tijolos escuros. */
export const CASTLE_THEME: TerrainTheme = {
  grass: TEXTURES.TILE_CASTLE_FLOOR,
  dirt: TEXTURES.TILE_CASTLE_BRICK,
  loose: TEXTURES.TILE_CASTLE_LOOSE,
  platform: TEXTURES.PLATFORM_CASTLE,
};

/** Torre: piso de tábuas sobre tijolos, sem tufos nem tampas. */
export const TOWER_THEME: TerrainTheme = {
  grass: TEXTURES.TILE_TOWER_FLOOR,
  dirt: TEXTURES.TILE_TOWER_BRICK,
  platform: TEXTURES.PLATFORM_WOOD,
};
