import { TEXTURES } from './assetKeys';

/** Artefatos principais. Novos artefatos (fases extras) entram aqui. */
export type ArtifactId = 'crystal' | 'key' | 'eye';

export interface ArtifactInfo {
  id: ArtifactId;
  name: string;
  texture: string;
  glowColor: number;
}

export const ARTIFACTS: Record<ArtifactId, ArtifactInfo> = {
  crystal: { id: 'crystal', name: 'Cristal Verde', texture: TEXTURES.ITEM_CRYSTAL, glowColor: 0x2ee86f },
  key: { id: 'key', name: 'Chave Arcana', texture: TEXTURES.ITEM_KEY, glowColor: 0x7ad7ff },
  eye: { id: 'eye', name: 'Olho do Feiticeiro', texture: TEXTURES.ITEM_EYE, glowColor: 0xc23cff },
};

/** Ordem de exibição no HUD. */
export const ARTIFACT_ORDER: ArtifactId[] = ['crystal', 'key', 'eye'];
