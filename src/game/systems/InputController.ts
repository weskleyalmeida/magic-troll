import Phaser from 'phaser';

/** Ações de jogo. O resto do código só conhece ações, nunca teclas. */
export type Action = 'left' | 'right' | 'down' | 'jump' | 'interact' | 'pause';

export interface InputState {
  left: boolean;
  right: boolean;
  down: boolean;
  /** Pulo segurado (usado para pulo variável). */
  jump: boolean;
  /** Pulo apertado neste frame. */
  jumpPressed: boolean;
  interactPressed: boolean;
  pausePressed: boolean;
}

const KEY_BINDINGS: Record<Action, number[]> = {
  left: [Phaser.Input.Keyboard.KeyCodes.LEFT, Phaser.Input.Keyboard.KeyCodes.A],
  right: [Phaser.Input.Keyboard.KeyCodes.RIGHT, Phaser.Input.Keyboard.KeyCodes.D],
  down: [Phaser.Input.Keyboard.KeyCodes.DOWN, Phaser.Input.Keyboard.KeyCodes.S],
  jump: [
    Phaser.Input.Keyboard.KeyCodes.UP,
    Phaser.Input.Keyboard.KeyCodes.W,
    Phaser.Input.Keyboard.KeyCodes.SPACE,
  ],
  interact: [Phaser.Input.Keyboard.KeyCodes.E],
  pause: [Phaser.Input.Keyboard.KeyCodes.ESC],
};

/**
 * Junta teclado + botões virtuais em um único estado por frame.
 * Controles touch futuros só precisam escrever em `virtual` (ex.: virtual.left = true).
 */
export class InputController {
  readonly virtual: Record<Action, boolean> = {
    left: false,
    right: false,
    down: false,
    jump: false,
    interact: false,
    pause: false,
  };

  private keys: Record<Action, Phaser.Input.Keyboard.Key[]>;
  private previous: Record<Action, boolean> = { ...this.virtual };

  constructor(scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;
    const bind = (codes: number[]) => (keyboard ? codes.map((c) => keyboard.addKey(c)) : []);

    this.keys = {
      left: bind(KEY_BINDINGS.left),
      right: bind(KEY_BINDINGS.right),
      down: bind(KEY_BINDINGS.down),
      jump: bind(KEY_BINDINGS.jump),
      interact: bind(KEY_BINDINGS.interact),
      pause: bind(KEY_BINDINGS.pause),
    };
  }

  /** Chamar uma vez por frame, no início do update da cena. */
  update(): InputState {
    const held = {
      left: this.isHeld('left'),
      right: this.isHeld('right'),
      down: this.isHeld('down'),
      jump: this.isHeld('jump'),
      interact: this.isHeld('interact'),
      pause: this.isHeld('pause'),
    };

    const state: InputState = {
      left: held.left,
      right: held.right,
      down: held.down,
      jump: held.jump,
      jumpPressed: held.jump && !this.previous.jump,
      interactPressed: held.interact && !this.previous.interact,
      pausePressed: held.pause && !this.previous.pause,
    };

    this.previous = held;
    return state;
  }

  /** Evita "toques fantasmas" depois de despausar (tecla que estava apertada antes). */
  sync(): void {
    (Object.keys(this.previous) as Action[]).forEach((a) => (this.previous[a] = this.isHeld(a)));
  }

  private isHeld(action: Action): boolean {
    return this.virtual[action] || this.keys[action].some((k) => k.isDown);
  }
}
