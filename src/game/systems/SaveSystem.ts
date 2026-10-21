/**
 * Persistência simples em localStorage. Sem backend por enquanto.
 * `bestTimes`/`bestScores` são indexados pelo id da fase, prontos para um ranking futuro.
 */

const STORAGE_KEY = 'troll-game-save';
const SAVE_VERSION = 1;

export interface SaveData {
  version: number;
  /** Índice (em LEVELS) da fase mais avançada desbloqueada. */
  unlockedLevelIndex: number;
  /** Último desbloqueio já mostrado no mapa (para animar o cadeado quebrando só uma vez). */
  seenUnlockedIndex: number;
  /** Última fase jogada (o mago aparece nela no mapa). */
  lastPlayedLevelIndex: number;
  bestTimesMs: Record<string, number>;
  bestScores: Record<string, number>;
  /** Artefatos já obtidos (necessários para a barreira da Fase 4). */
  artifacts: string[];
  settings: {
    musicVolume: number;
    sfxVolume: number;
  };
}

function defaultSave(): SaveData {
  return {
    version: SAVE_VERSION,
    unlockedLevelIndex: 0,
    seenUnlockedIndex: 0,
    lastPlayedLevelIndex: 0,
    bestTimesMs: {},
    bestScores: {},
    artifacts: [],
    settings: { musicVolume: 0.6, sfxVolume: 0.8 },
  };
}

let cache: SaveData | null = null;

export const SaveSystem = {
  load(): SaveData {
    if (cache) return cache;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as Partial<SaveData>) : {};
      // Mescla com o padrão para tolerar saves antigos com campos faltando.
      const base = defaultSave();
      cache = { ...base, ...parsed, settings: { ...base.settings, ...parsed.settings } };
    } catch {
      // localStorage pode estar bloqueado (aba privada, WebView restrita...).
      cache = defaultSave();
    }
    return cache;
  },

  save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.load()));
    } catch {
      /* sem persistência disponível: o jogo continua normalmente */
    }
  },

  unlockLevel(index: number): void {
    const data = this.load();
    if (index > data.unlockedLevelIndex) {
      data.unlockedLevelIndex = index;
      this.save();
    }
  },

  isUnlocked(index: number): boolean {
    return index <= this.load().unlockedLevelIndex;
  },

  /** Uma fase está concluída quando já tem melhor tempo registrado. */
  isCompleted(levelId: string): boolean {
    return this.load().bestTimesMs[levelId] !== undefined;
  },

  markUnlockSeen(index: number): void {
    const data = this.load();
    if (index > data.seenUnlockedIndex) {
      data.seenUnlockedIndex = index;
      this.save();
    }
  },

  setLastPlayed(index: number): void {
    const data = this.load();
    data.lastPlayedLevelIndex = index;
    this.save();
  },

  addArtifact(id: string): void {
    const data = this.load();
    if (!data.artifacts.includes(id)) {
      data.artifacts.push(id);
      this.save();
    }
  },

  hasArtifact(id: string): boolean {
    return this.load().artifacts.includes(id);
  },

  /** Retorna true se for um novo recorde. */
  submitTime(levelId: string, timeMs: number): boolean {
    const data = this.load();
    const best = data.bestTimesMs[levelId];
    if (best === undefined || timeMs < best) {
      data.bestTimesMs[levelId] = timeMs;
      this.save();
      return true;
    }
    return false;
  },

  submitScore(levelId: string, score: number): boolean {
    const data = this.load();
    const best = data.bestScores[levelId];
    if (best === undefined || score > best) {
      data.bestScores[levelId] = score;
      this.save();
      return true;
    }
    return false;
  },
};
