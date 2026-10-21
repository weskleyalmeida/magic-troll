# Troll Game

Jogo 2D de plataforma e exploração com magia e trollagem. Feito com **Phaser 3 + TypeScript + Vite**.

## Rodando

Requer [Node.js](https://nodejs.org/) 18+.

```bash
npm install
npm run dev        # servidor local (também acessível na rede, para testar no celular)
npm run build      # build de produção em dist/
npm run typecheck  # checagem de tipos
```

Atalhos de desenvolvimento (na URL):

- `?debug`: mostra as hitboxes
- `?level=Level1Scene`: pula o menu e abre a fase direto (também `TestLevelScene`)
- Em modo dev, a instância do jogo fica em `window.__game` (útil no console do navegador)

## Fases

1. **Floresta Encantada** — o cenário engana (Cristal Verde atrás da cachoeira).
2. **Pântano das Ilusões** — as informações mentem (Chave Arcana à "direita").
3. **Torre do Feiticeiro** — até o objetivo é falso (Olho do Feiticeiro "Ou não...").
4. **Castelo Amaldiçoado** — tudo junto: barreira dos 3 artefatos, "NÃO APERTE." e o Guardião Troll.

As fases são escolhidas no **Mapa do Reino** (JOGAR no menu). A fase seguinte só é desbloqueada
ao concluir a anterior; o progresso fica salvo no navegador (localStorage).

Atalho só em desenvolvimento (`npm run dev`): `?level=Level1Scene` … `?level=Level4Scene`
(a Fase 4 ainda exige os 3 artefatos salvos). Para zerar o progresso, apague a chave
`troll-game-save` no localStorage do navegador.

## Controles

| Ação      | Teclas                |
| --------- | --------------------- |
| Mover     | ← → / A D             |
| Pular     | ↑ / W / Espaço        |
| Interagir | E                     |
| Pausar    | ESC (ou botão `II`)   |

## Estrutura

```
public/assets/          arte e sons definitivos (player, enemies, environment, items, ui, audio, backgrounds)
src/
  main.ts               ponto de entrada
  game/
    config/             constantes de jogabilidade, chaves de assets/cenas, registro de fases, animações
    scenes/             BootScene, MenuScene, PauseScene, BaseLevelScene e as fases
    entities/           Player (e futuramente Enemy, Boss...)
    components/         objetos interativos (Checkpoint, Sign, Trap, Door, Portal...)
    systems/            InputController, SaveSystem, AudioManager
    ui/                 componentes de interface
    utils/              texturas placeholder e utilidades
```

## Como adicionar uma fase

1. Crie `src/game/scenes/LevelNScene.ts` herdando de `BaseLevelScene` (implemente `getLayout()` e `buildLevel()`).
   Use os helpers da base (`addGround`, `addWoodPlatform`, `addSign`, `addChest`, `addPopupSpikes`,
   `addFakeWall`, `addEnemy`, `addCheckpoint`, `addArtifact`, `addExitPortal`...). Veja `Level1Scene` como exemplo.
2. Adicione a chave em `config/sceneKeys.ts` e a cena em `config/gameConfig.ts`.
3. Registre a fase em `config/levels.ts` (a ordem da lista define a progressão).

## Trocando placeholders por arte real

Todas as chaves de assets estão em `config/assetKeys.ts`. Carregue os arquivos no `BootScene.preload()`
usando as mesmas chaves e remova a geração correspondente em `utils/placeholderTextures.ts`.
