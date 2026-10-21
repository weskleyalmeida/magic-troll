import { SCENES } from './sceneKeys';

export interface LevelInfo {
  /** Identificador estável usado no save (melhor tempo, desbloqueio...). */
  id: string;
  sceneKey: string;
  name: string;
}

/**
 * Ordem oficial das fases. Para adicionar uma fase nova:
 * 1. crie a Scene herdando de BaseLevelScene
 * 2. registre-a em gameConfig.ts
 * 3. adicione uma entrada aqui
 */
export const LEVELS: LevelInfo[] = [
  { id: 'level1', sceneKey: SCENES.LEVEL_1, name: 'FASE 1 — FLORESTA ENCANTADA' },
  { id: 'level2', sceneKey: SCENES.LEVEL_2, name: 'FASE 2 — PÂNTANO DAS ILUSÕES' },
  { id: 'level3', sceneKey: SCENES.LEVEL_3, name: 'FASE 3 — TORRE DO FEITICEIRO' },
  { id: 'level4', sceneKey: SCENES.LEVEL_4, name: 'FASE 4 — CASTELO AMALDIÇOADO' },
];

export function getLevelBySceneKey(sceneKey: string): LevelInfo | undefined {
  return LEVELS.find((l) => l.sceneKey === sceneKey);
}

export function getNextLevel(sceneKey: string): LevelInfo | undefined {
  const index = LEVELS.findIndex((l) => l.sceneKey === sceneKey);
  return index >= 0 ? LEVELS[index + 1] : undefined;
}
