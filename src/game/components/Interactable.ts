/** Qualquer coisa que o jogador possa usar com a tecla E (placas, baús, botões, portas...). */
export interface Interactable {
  readonly x: number;
  readonly y: number;
  /** Altura (y do mundo) onde o indicador "E" aparece. */
  getPromptY(): number;
  canInteract(): boolean;
  interact(): void;
  /** Chamado quando o jogador se afasta (ex.: fechar o balão da placa). */
  onFocusLost?(): void;
}
