# Plano de Melhoria de UI e Visual "Arcade"

**Escopo:** UI + juice do gameplay · **Tom:** arcade/máquina de fliperama · **Restrição:** manter 1-bit (2 cores por tema, `grayCount() === 0`, dithering em vez de alpha) · **Assets externos:** nenhum (zero dependências novas).

## Direção estética

O chassi de console existente em `css/style.css` vira a moldura de uma máquina de fliperama. Tudo dentro da tela se comporta como jogo de arcade: bounce, hit-stop, contadores rolando, seleção piscando, recompensa visível.

- **DFII:** 4 + 5 + 5 + 5 − 2 = 17 (nível "Excelente").
- **Âncora de diferenciação:** "juice" arcade dentro de pixel art 1-bit — nada se move em velocidade constante: tudo tem squash, bounce ou dither animado.
- **Invariantes preservados:** 2 cores por tema (`pal.bg`/`pal.fg`), `grayCount() === 0` (`js/game.js:2465`), sem dependências novas.

## Fase 1 — Chrome DOM: máquina de fliperama (CSS/HTML)

Arquivos: `css/style.css`, `index.html`

1. **Ativar o `#screen-glare` morto** (`index.html:28`, sem regra em CSS): reflexo diagonal sutil de tela CRT — gradiente com opacidade baixa + `pointer-events: none`.
2. **Estados de botão do bezel** (`style.css:167–193`): adicionar `:active` com `transform: translateY(1px)` e borda invertida, `:focus-visible` com contorno `--accent` 2px, micro-animação de clique.
3. **LED de poder** (`--led`): pulsar lentamente enquanto o jogo roda.
4. **Hierarquia tipográfica no chrome**: `letter-spacing` no header, `font-variant-numeric: tabular-nums` no footer/toast, tamanho maior no título do bezel. Sem webfont nova.
5. **Toast** (`style.css:216–238`): entrada com bounce + borda dither, em vez de fade simples.

## Fase 2 — Botões e menus com vida (canvas)

Arquivos: `js/game.js` — `drawPixelButton` (1979), `drawScreens` (2064), registro de botões (1372–1402)

1. **Estado pressionado**: clique desloca o botão 2px e inverte a borda por ~100ms (`pointerdown`/`pointerup`).
2. **Cursor de seleção arcade**: seta `▸` piscando à esquerda do item hover/focado + sublinhado animado, em vez de inversão de cor pura.
3. **Entrada escalonada dos menus**: cada botão entra com atraso e bounce vertical (helper `easeOutBack` reaproveitado em todas as telas).
4. **Título do menu**: letter-spacing que respira + sombra dithered deslocada 2px.
5. **Layout**: extrair números mágicos (`startY=100, step=27`) para constantes nomeadas.

## Fase 3 — HUD arcade

Arquivo: `js/game.js` — `drawHUD` (1988–2044)

1. **Contador de pontos "rolando"**: score interpola em direção ao valor real (efeito slot machine).
2. **Medidor de velocidade com pulso**: ao subir de faixa, `SPD [■■■□□]` pisca.
3. **Pulso do ovo**: contador de ovos dá bounce ao coletar.
4. **Banner de milestone** (2029): entrar com bounce e sair com dither.
5. **Combo/sequência**: popup `STREAK` quando houver sequência de ovos, usando `floatingTexts` (2039).

## Fase 4 — Juice do gameplay ⏸ SEPARADA (aguarda validação das fases 1/2/3/5)

Arquivo: `js/game.js` — `update()` (1743–1835), `render()` (2382–2425), sprites (683–1130)

1. **Hit-stop na morte**: congelar ~6 frames antes do shake.
2. **Squash & stretch** na galinha ao pular/aterrissar.
3. **Rastro de velocidade** atrás da galinha acima de 70% da velocidade.
4. **Poeira no aterrissar** usando `parts[]` existente.
5. **Confete dithered** em milestones.
6. **Parallax extra**: camada de nuvens mais lenta (`drawCloud` 1918).

## Fase 5 — Tela de game over "recibo de fliperama"

Arquivo: `js/game.js` (2293–2344)

1. **Pontuação contando para cima** ao abrir (~0.6s).
2. **Carimbo "NEW HI"** entrando com bounce quando bate recorde.
3. **Linhas do recibo** entrando escalonadas, como impressão de máquina.
4. Botões herdam o cursor `▸` e o pressed da Fase 2.

## Verificação

- Testar os 5 temas (mono/gameboy/amber/mac/cyber) — `applyTheme` em `game.js:479`.
- Rodar `grayCount()` (`game.js:2465`) garantindo 0 pixels cinza.
- Responsivo em `max-width: 680px` (`style.css:330`) e controles de toque.
- Medir fps/longtasks antes e depois (comparação A/B/A).
- Conferir contraste e `:focus-visible` (WCAG AA) no chrome DOM.

## Ordem de execução

Fases 1 → 2 → 3 → 5 primeiro (baixo risco, locais e delimitadas).
Fase 4 fica separada e só começa após validação das demais — é a única que toca o core de render e exige cuidado extra com `grayCount` e a ordem de camadas em `render()`.
