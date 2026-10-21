import Phaser from 'phaser';
import { ANIMS, TEXTURES } from './assetKeys';

/**
 * Animações globais. Hoje usam texturas avulsas (placeholders); com uma spritesheet real,
 * troque `frames` por `anims.generateFrameNumbers('player', { start, end })`.
 * As entidades não precisam mudar: elas só usam as chaves de ANIMS.
 */
export function registerAnimations(anims: Phaser.Animations.AnimationManager): void {
  const create = (config: Phaser.Types.Animations.Animation) => {
    if (config.key && !anims.exists(config.key)) anims.create(config);
  };
  const single = (key: string, texture: string) => create({ key, frames: [{ key: texture }], repeat: -1 });

  single(ANIMS.PLAYER_IDLE, TEXTURES.PLAYER_IDLE);
  single(ANIMS.PLAYER_JUMP, TEXTURES.PLAYER_JUMP);
  single(ANIMS.PLAYER_FALL, TEXTURES.PLAYER_FALL);
  single(ANIMS.PLAYER_HURT, TEXTURES.PLAYER_HURT);
  single(ANIMS.PLAYER_CELEBRATE, TEXTURES.PLAYER_CELEBRATE);

  const walkFrames = [{ key: TEXTURES.PLAYER_WALK_0 }, { key: TEXTURES.PLAYER_WALK_1 }];
  create({ key: ANIMS.PLAYER_WALK, frames: walkFrames, frameRate: 7, repeat: -1 });
  create({ key: ANIMS.PLAYER_RUN, frames: walkFrames, frameRate: 12, repeat: -1 });

  create({
    key: ANIMS.FLYING_BOOK,
    frames: [{ key: TEXTURES.FLYING_BOOK_0 }, { key: TEXTURES.FLYING_BOOK_1 }],
    frameRate: 6,
    repeat: -1,
  });

  create({
    key: ANIMS.ENEMY_MUSHROOM_WALK,
    frames: [{ key: TEXTURES.ENEMY_MUSHROOM_0 }, { key: TEXTURES.ENEMY_MUSHROOM_1 }],
    frameRate: 5,
    repeat: -1,
  });
}
