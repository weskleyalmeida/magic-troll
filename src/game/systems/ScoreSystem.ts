/** Estatísticas de uma tentativa de fase. Base para pontuação e ranking futuro. */
export interface LevelStats {
  coins: number;
  totalCoins: number;
  deaths: number;
  damageTaken: number;
  elapsedMs: number;
  artifactFound: boolean;
}

export function createLevelStats(): LevelStats {
  return { coins: 0, totalCoins: 0, deaths: 0, damageTaken: 0, elapsedMs: 0, artifactFound: false };
}

/** Pesos da pontuação. Ajuste aqui sem mexer nas cenas. */
const SCORE = {
  artifact: 1000,
  perCoin: 50,
  timeBonusSeconds: 300, // bônus de tempo vai até 5 min
  perSecondBonus: 5,
  perDeath: 200,
  perDamage: 50,
} as const;

export function calculateScore(stats: LevelStats): number {
  const seconds = Math.floor(stats.elapsedMs / 1000);
  const score =
    (stats.artifactFound ? SCORE.artifact : 0) +
    stats.coins * SCORE.perCoin +
    Math.max(0, SCORE.timeBonusSeconds - seconds) * SCORE.perSecondBonus -
    stats.deaths * SCORE.perDeath -
    stats.damageTaken * SCORE.perDamage;
  return Math.max(0, score);
}
