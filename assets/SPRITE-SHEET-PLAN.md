# Plano de Sprite Sheets: Chicken Runner

`Pipeline 1-bit` · `Gemini / Nano Banana` · `HTML5 Canvas` · `Sem engine`

Este documento contém **tudo** para trocar os sprites desenhados em código por sprite sheets PNG:
o pipeline técnico, os **18 prompts prontos para colar no Gemini**, a especificação da ferramenta de
pós-processamento e a lista de mudanças no código.

---

## Sumário

1. [Visão geral do pipeline](#1-visão-geral-do-pipeline)
2. [Regras de arte (1-bit + fundo magenta)](#2-regras-de-arte-1-bit--fundo-magenta)
3. [Bloco de estilo usado em todos os prompts](#3-bloco-de-estilo-usado-em-todos-os-prompts)
4. [Os 18 prompts](#4-os-18-prompts)
5. [Convenção de arquivos e pastas](#5-convenção-de-arquivos-e-pastas)
6. [Ferramenta `sheet-tool.html` (especificação)](#6-ferramenta-sheet-tool-html-especificação)
7. [Mudanças no código (`js/game.js`)](#7-mudanças-no-código-jsgamejs)
8. [O que continua desenhado no código](#8-o-que-continua-desenhado-no-código)
9. [Checklist de testes](#9-checklist-de-testes)
10. [Inventário completo de frames](#10-inventário-completo-de-frames)

---

## 1. Visão geral do pipeline

O jogo **não usa engine** (não precisa de Construct/Godot): é HTML5 Canvas puro. Sprite sheet é
apenas um PNG que o navegador carrega com `drawImage`.

O jogo hoje desenha **tudo por código** (`fillRect` com pixels inteiros) e recoloriza tudo em tempo
real para **5 temas** (B&W, DMG, AMBER, MAC, CYBER) com inversão **dia/noite**. Para manter isso com
PNGs, o pipeline é:

```
FASE 1 (você): gerar as imagens no Gemini
  Copiar prompt do §4 → colar no Gemini → anexar imagem de referência
  (quando houver) → salvar PNG em assets/raw-sprites/pNN-nome.png

FASE 2 (ferramenta local): pós-processamento
  assets/sheet-tool.html (página HTML, sem dependências, abre com duplo clique)
  Arrasta os PNGs → a ferramenta:
    1. corta o fundo magenta (vira transparência)
    2. quantiza para 2 cores puras (preto/branco, elimina cinza da IA)
    3. detecta as frames pelos espaços magenta entre elas
    4. redimensiona cada frame ao tamanho exato (vizinho mais próximo, sem borrar)
    5. monta a folha master + assets/sprites/manifest.json
    6. gera 10 variações já tingidas (5 temas x dia/noite)
  Você confere o preview e regenera no Gemini só o que saiu errado

FASE 3 (código): carregar e usar
  js/game.js carrega folha + manifesto → cada drawXxx() vira drawImage()
  Fallback: se a folha falhar, o desenho antigo continua funcionando
```

### Por que fundo magenta e não fundo branco

A IA gera o sprite com um fundo. Se o fundo for branco, ele é igual ao branco da barriga/olho da
galinha e **não dá para recortar automaticamente**. Magenta (#FF00FF) é uma cor que não existe em
nenhum sprite 1-bit, então o corte é trivial e preciso. Na arte final **não sobra nenhum pixel
magenta**.

### Por que preto/branco funciona com os 5 temas

A folha master guarda formas em preto (traço) e branco (miolo/detalhe). Na hora de desenhar, o jogo
substitui: preto → cor do tema (`fg`) e branco → cor de fundo (`bg`). Assim os 5 temas + dia/noite
continuam funcionando exatamente como hoje, sem gerar 10 versões de cada sprite manualmente.

---

## 2. Regras de arte (1-bit + fundo magenta)

Regras fixas que valem para **todos** os prompts e todas as gerações:

| Regra | Detalhe |
|--|--|
| Cores | Apenas preto puro `#000000` e branco puro `#FFFFFF`. Nada de cinza, antialias, gradiente ou sombra |
| Fundo | Magenta sólido `#FF00FF` em toda a imagem, sem nada desenhado nele |
| Estilo | Pixel art grosso e visível (cada pixel da arte = um bloco quadrado grande na imagem) |
| Sem | Texto, legenda, moldura, borda, watermark, chão, sombra projetada, cenário |
| Frames | Mesmo tamanho, alinhadas, mesma altura dos pés, espaçadas igual com fundo magenta entre elas |
| Tamanho da imagem | Pequeno: o ideal é a imagem sair com pixels da arte já grandes (ex.: cada "bolinha" de pixel tem 8x8 px na imagem gerada). Se sair minúsculo e detalhado demais, pedir de novo "bigger pixels, chunkier, less detail per pixel" |

### Tamanhos alvo por frame (após a ferramenta redimensionar)

| Categoria | Frame | Tamanho lógico (px de jogo) |
|--|--|--|
| Galinha (correr/pular/cair) | 1 frame | 16 x 22 |
| Galinha (deslizar/duck) | 1 frame | 22 x 12 |
| Galinha (peck / morte) | 1 frame | 16 x 22 (mesma caixa, pose menor cabe dentro) |
| Chapéu | 1 frame | 16 x 10 (cabeça da galinha em cima, chapéu no topo) |
| Obstáculo spike/fence | 1 frame | 54 x 21 / 54 x 36 |
| Obstáculo barrier/stack/hay | 1 frame | 48 x 42 / 36 x 51 / 46 x 46 |
| Obstáculo fox | 2 frames | 58 x 32 |
| Obstáculo falcon/owl | 2 frames | 56 x 24 / 48 x 24 |
| Estrela | 1 frame | 7 x 6 |
| Pluma (morte) | 2 frames | 4 x 4 |
| Partículas (pétala/folha/neve) | 2 frames cada | 4 x 4 / 3 x 3 / 7 x 7 |
| Nuvem grande/pequena | 1 frame cada | 60 x 36 / 40 x 24 |
| Sol / Lua | 1 frame cada | 36 x 40 / 30 x 36 |
| Chão (tile base + 5 decorações) | 6 frames | tile 48 x 20, decorações menores |
| Ícone badge / skill / som | 1 frame | 16 x 16 |

Esses tamanhos são o **alvo final**; a geração sai maior e a ferramenta reduz com
"vizinho mais próximo" (nearest-neighbor), que preserva o pixel nítido.

---

## 3. Bloco de estilo usado em todos os prompts

Copie o bloco abaixo **inteiro no início de todo prompt**. Ele garante consistência entre todas as
folhas (é o que faz 18 imagens separadas parecerem o mesmo jogo).

```text
1-bit black and white pixel art for a retro endless-runner browser game.
CRITICAL STYLE RULES:
- Only two colors: pure black (#000000) and pure white (#FFFFFF). No gray, no anti-aliasing,
  no shading, no gradients, no color, no blur. Every edge must be a hard pixel step.
- The background must be solid flat magenta (#FF00FF) everywhere, completely empty.
- Chunky visible pixel grid: each art pixel is a large square block (aim for a low-resolution
  grid, roughly 24-32 pixels wide for a character, not a smooth hi-res drawing).
- No text, no letters, no numbers, no watermark, no border, no frame around the image,
  no ground line, no drop shadow, no scenery.
- Sprites are side-view, facing RIGHT, drawn as clean silhouettes that read clearly at small size.
- Multiple frames in one image: arrange them in a single horizontal row, evenly spaced,
  same size, same baseline (feet aligned at the bottom), separated only by magenta gaps.
- Keep the character design EXACTLY consistent across all frames: same proportions,
  same colors, only the pose changes.
If you cannot keep the rules, prefer: (a) pure black/white over detail, (b) fewer clean frames
over many messy ones, (c) consistent sizes over creative variation.
```

### Como usar no Gemini (Nano Banana)

1. Cole o bloco de estilo + o texto específico do prompt (§4)
2. **Anexe a imagem de referência** quando o prompt pedir (cluck: o seu modelo; os outros: `Ref/Char/*.png`)
3. Se sair cinza/borrado: responda no mesmo chat *"remake with only pure black and pure white, threshold it, no gray at all"*
4. Se as frames saírem de tamanhos diferentes: *"all frames exactly the same size and height, feet aligned"*
5. Salve o PNG em `assets/raw-sprites/` com o nome indicado no prompt

---

## 4. Os 18 prompts

> Em todos: **cole primeiro o Bloco de Estilo do §3**, depois o texto do prompt.
> Nomes de arquivo já definidos: siga-os para a ferramenta achar tudo automaticamente.

### P01: Pi-Cluck correndo e pulando (4 frames)

- **Arquivo:** `assets/raw-sprites/p01-cluck-run-jump.png`
- **Anexe:** sua referência do cluck
- **Frames na ordem:** run-0, run-1, jump-0, jump-1

```text
CHARACTER: "PI-CLUCK", a classic plump farmyard hen (keep the design from the attached
reference image identical). Side view, facing RIGHT.

She has: a 3-spike comb on top of the head, round head with a small square eye, pointed
beak, small wattle under the chin, plump body with one folded wing on the side, a fanned
stepped tail of 3 plumes at the back, two thin legs with 3-toed feet.

FRAME 1 - RUN stride 0: running right. Head bobbed one step forward, front leg stretched
forward with the foot on the ground, back leg pushed behind, wing tucked low against
the body, tail fanned up.
FRAME 2 - RUN stride 1: same run with the legs swapped (other leg forward), wing slightly
raised, head back to the neutral position.
FRAME 3 - JUMP wings up: airborne, both legs tucked up under the body, both wings raised
high above the back, tail fanned.
FRAME 4 - JUMP wings down: airborne, legs still tucked, wings beaten down low beside
the body.

All 4 frames: identical character size, feet on the same bottom line, evenly spaced.
```

### P02: Pi-Cluck quedas e poses especiais (4 frames)

- **Arquivo:** `assets/raw-sprites/p02-cluck-poses.png`
- **Anexe:** sua referência do cluck
- **Frames:** fall, duck, peck, dead

```text
CHARACTER: the same PI-CLUCK hen from the attached reference image. Side view, facing RIGHT.

FRAME 1 - FALL: airborne and falling. Legs stretched slightly forward and apart (reaching
down, not tucked), wings raised high up for balance, tail up, alert pose.
FRAME 2 - DUCK SLIDE: sliding very low: body stretched flat and horizontal, much shorter
than standing, head thrust forward, comb flattened against the head, wing tucked in,
both feet tucked flat under the body, sharp beak pointing forward.
FRAME 3 - PECK: standing with the head dropped low, beak touching the ground, tail
plumes pointed high in the air, legs planted under the body.
FRAME 4 - DEAD: sitting slumped on the ground: butt down, both legs stretched forward
with feet pointing up, wing drooping, the eye is an X (dizzy), tail propped behind.

All 4 frames: identical character size, feet on the same bottom line, evenly spaced.
```

### P03: Rooster Rex correndo e pulando (4 frames)

- **Arquivo:** `assets/raw-sprites/p03-rex-run-jump.png`
- **Anexe:** `Ref/Char/rex.png`
- **Frames:** run-0, run-1, jump-0, jump-1

```text
CHARACTER: "ROOSTER REX", a majestic king rooster (keep the design from the attached
reference image identical). Side view, facing RIGHT.

He has: a GIANT 4-spike crown comb towering on his head, a fierce eyebrow ridge over the
eye, a hooked beak, a long hanging double wattle, a sawtooth feathered neck ruff (mane)
around the neck, massive arched sickle tail plumes curving high at the back, a body with
one folded wing, powerful drumstick legs with sharp heel spurs on the feet.

FRAME 1 - RUN stride 0: running right, head bobbed forward, front leg stretched forward,
back leg pushed behind, wing tucked.
FRAME 2 - RUN stride 1: legs swapped, wing raised slightly, head neutral.
FRAME 3 - JUMP wings up: airborne, legs tucked under the body, wings raised high above
the back, sickle tail flowing up.
FRAME 4 - JUMP wings down: airborne, legs tucked, wings beaten down low.

All 4 frames: identical character size, feet on the same bottom line, evenly spaced.
```

### P04: Rooster Rex quedas e poses especiais (4 frames)

- **Arquivo:** `assets/raw-sprites/p04-rex-poses.png`
- **Anexe:** `Ref/Char/rex.png`
- **Frames:** fall, duck, peck, dead

```text
CHARACTER: the same ROOSTER REX from the attached reference image. Side view, facing RIGHT.

FRAME 1 - FALL: airborne falling, legs stretched forward and apart reaching down, wings
raised high for balance, giant comb and sickle tail flowing up.
FRAME 2 - DUCK SLIDE: sliding low: body flat and stretched, head thrust forward, giant
comb swept back, long wattle trailing, arched tail raised, feet tucked flat under.
FRAME 3 - PECK: standing, head dropped low, hooked beak touching the ground, giant
sickle tail towering high behind, legs planted.
FRAME 4 - DEAD: sitting slumped, butt on the ground, both drumstick legs stretched
forward with heel spurs, eye is an X, giant comb bent slightly, sickle tail propped
behind on the ground.

All 4 frames: identical character size, feet on the same bottom line, evenly spaced.
```

### P05: Chubby Chick correndo e pulando (4 frames)

- **Arquivo:** `assets/raw-sprites/p05-chubby-run-jump.png`
- **Anexe:** `Ref/Char/chubby.png`
- **Frames:** run-0, run-1, jump-0, jump-1

```text
CHARACTER: "CHUBBY CHICK", a round fluffball chick (keep the design from the attached
reference image identical). Side view, facing RIGHT.

She is a perfect sphere: head and body merged into one fluffy ball, a tiny sprout-like
comb bud on top, a very big round eye with a white glint highlight, a tiny stubby beak,
a small round tail puff at the back, tiny stub wings on the sides, short stubby feet,
and a small dithered (checkerboard) rosy cheek patch under the eye.

FRAME 1 - RUN stride 0: running right, the ball rolling forward, both little feet
spread in a stride, wing low.
FRAME 2 - RUN stride 1: feet swapped in the stride, tiny wings lifted up in a flutter.
FRAME 3 - JUMP wings up: airborne ball, feet tucked under, tiny wings raised high.
FRAME 4 - JUMP wings down: airborne ball, feet tucked, tiny wings beaten down low.

All 4 frames: identical ball size, feet on the same bottom line, evenly spaced.
```

### P06: Chubby Chick quedas e poses especiais (4 frames)

- **Arquivo:** `assets/raw-sprites/p06-chubby-poses.png`
- **Anexe:** `Ref/Char/chubby.png`
- **Frames:** fall, duck, peck, dead

```text
CHARACTER: the same CHUBBY CHICK fluffball from the attached reference image.
Side view, facing RIGHT.

FRAME 1 - FALL: airborne falling, the round ball with both little wings raised high
above for balance, feet reaching down and apart, worried big eye.
FRAME 2 - DUCK SLIDE: flattened pancake ball: the sphere squashed low and stretched
horizontal, sliding, feet tucked flat underneath, tiny beak forward.
FRAME 3 - PECK: round ball with the front of the body tilted down so the tiny beak
touches the ground, tail puff raised, feet planted.
FRAME 4 - DEAD: the fluffball puddled flat on the ground, bottom row of the ball
resting on the ground, both little legs stretched out in front with webbed feet up,
eye is an X, tiny comb bud bent.

All 4 frames: identical character size, feet on the same bottom line, evenly spaced.
```

### P07: Mecha-Pi correndo e pulando (4 frames)

- **Arquivo:** `assets/raw-sprites/p07-mecha-run-jump.png`
- **Anexe:** `Ref/Char/mecha.png`
- **Frames:** run-0, run-1, jump-0, jump-1

```text
CHARACTER: "MECHA-PI", a cybernetic robot chicken (keep the design from the attached
reference image identical). Side view, facing RIGHT.

She has: a digital antenna mast with a small signal light on top of the head, an angular
mecha helmet chassis for a head, a horizontal sensor visor slot with a bright scanning
dot inside, a riveted titanium beak, an armored torso with panel seam lines, one aerofoil
solar wing on the side, a rocket engine nozzle at the back, hydraulic piston legs with
robotic shock-pad feet.

FRAME 1 - RUN stride 0: running right, head bobbed forward, front piston leg stretched
forward, back leg pushed behind, wing tucked, signal light on.
FRAME 2 - RUN stride 1: legs swapped, wing raised, scanning dot moved to the other side
of the visor, signal light flashing (draw a small extra dash above the antenna).
FRAME 3 - JUMP wings up: airborne, legs tucked, solar wing raised high, small exhaust
spark coming out of the rocket nozzle.
FRAME 4 - JUMP wings down: airborne, legs tucked, wing beaten down low, exhaust spark
still at the nozzle.

All 4 frames: identical character size, feet on the same bottom line, evenly spaced.
```

### P08: Mecha-Pi quedas e poses especiais (4 frames)

- **Arquivo:** `assets/raw-sprites/p08-mecha-poses.png`
- **Anexe:** `Ref/Char/mecha.png`
- **Frames:** fall, duck, peck, dead

```text
CHARACTER: the same MECHA-PI robot chicken from the attached reference image.
Side view, facing RIGHT.

FRAME 1 - FALL: airborne falling, piston legs stretched down and apart, solar wing
raised high for balance, exhaust firing from the nozzle.
FRAME 2 - DUCK SLIDE: sliding low: armored body stretched flat and horizontal, head
thrust forward, visor slot leading, rocket nozzle at the back, legs tucked flat under.
FRAME 3 - PECK: standing, head dropped low, titanium beak touching the ground, nozzle
behind, legs planted.
FRAME 4 - DEAD (power-down): sitting slumped, butt on the ground, legs stretched
forward, antenna limp and bent, the visor shows an X error mark instead of the
scanning dot, panel seams visible.

All 4 frames: identical character size, feet on the same bottom line, evenly spaced.
```

### P09: Shinobi Hen correndo e pulando (4 frames)

- **Arquivo:** `assets/raw-sprites/p09-shinobi-run-jump.png`
- **Anexe:** `Ref/Char/shinobi.png`
- **Frames:** run-0, run-1, jump-0, jump-1

```text
CHARACTER: "SHINOBI HEN", a stealth ninja chicken (keep the design from the attached
reference image identical). Side view, facing RIGHT.

She has: a ninja cowl covering the head, a forehead headband plate across the brow,
a sharp narrow eye slit, a face mask with the beak poking out, LONG billowing headband
ribbons fluttering behind the head, an aerodynamic ninja tunic with a belt sash and a
small kunai knife at the waist, a sleek katana-shaped blade wing on the side, a swept
stepped tail, wrapped tabi ninja legs with silent tread feet.

FRAME 1 - RUN stride 0: running right, head bobbed forward, front leg stretched forward,
back leg pushed behind, long ribbons streaming straight back, blade wing tucked.
FRAME 2 - RUN stride 1: legs swapped, wing slightly raised, ribbons fluttering in a
second lower wave shape.
FRAME 3 - JUMP wings up: airborne, legs tucked, blade wing raised high, ribbons flying
up behind.
FRAME 4 - JUMP wings down: airborne, legs tucked, wing beaten down low.

All 4 frames: identical character size, feet on the same bottom line, evenly spaced.
```

### P10: Shinobi Hen quedas e poses especiais (4 frames)

- **Arquivo:** `assets/raw-sprites/p10-shinobi-poses.png`
- **Anexe:** `Ref/Char/shinobi.png`
- **Frames:** fall, duck, peck, dead

```text
CHARACTER: the same SHINOBI HEN ninja chicken from the attached reference image.
Side view, facing RIGHT.

FRAME 1 - FALL: airborne falling, tabi legs stretched down and apart, blade wing raised
high for balance, headband ribbons flying upward behind.
FRAME 2 - DUCK SLIDE: sliding low: slim body stretched flat and horizontal, head thrust
forward, cowl leading, ribbons streaming flat behind, feet tucked under.
FRAME 3 - PECK: standing, head dropped low under the mask, beak touching the ground,
ribbons hanging down, legs planted.
FRAME 4 - DEAD (stealth fail): sitting slumped, butt on the ground, both legs stretched
forward with tabi feet up, eye is an X, headband ribbons pooled on the ground behind,
blade wing resting.

All 4 frames: identical character size, feet on the same bottom line, evenly spaced.
```

### P11: Chapéus (6 frames)

- **Arquivo:** `assets/raw-sprites/p11-hats.png`
- **Anexe:** `Ref/Hats/Grad.png`, `Ref/Hats/Top.png`, `Ref/Hats/Vik.png` (3 dos 6)
- **Frames:** grad-cap, egg-crown, ribbon, viking, top-hat, chef-toque

```text
Six cosmetic HATS for a chicken character, each hat drawn ALONE as it would sit on a
round head, with a flat bottom edge (no head, no character, no mannequin). Side view
slightly angled, facing RIGHT. Keep consistent scale: all six fit the same head size.

FRAME 1 - GRADUATE CAP: flat square mortarboard plate on top of a small skullcap,
with a tassel hanging down from the center of the plate (small button + dangling cord
+ fringe at the end).
FRAME 2 - EGG CROWN: a small crown band with three egg-shaped spikes (left, taller
middle, right) and three little jewel dots on the band.
FRAME 3 - RIBBON COMB: two little fabric bows side by side with a knot in the middle,
like a hair ribbon sitting on the head.
FRAME 4 - VIKING HELM: an iron dome helmet with two horns curving up from the sides
(step-shaped horn tips) and two small rivets on the dome.
FRAME 5 - TOP HAT: a tall black cylinder with a wide flat brim and a lighter silk
band ribbon around the base of the cylinder.
FRAME 6 - CHEF TOQUE: a tall puffy chef's toque with a brim band at the bottom and
three vertical pleat creases in the puffy dome.

All 6 frames: same size cells, evenly spaced, feet-aligned baseline (flat bottom).
```

### P12: Obstáculos do chão (5 frames)

- **Arquivo:** `assets/raw-sprites/p12-obstacles-ground.png`
- **Anexe:** nenhuma
- **Frames:** spike, barrier, stack, fence, hay

```text
Five GROUND OBSTACLES for a retro side-scroller, each one an isolated sprite sitting
on an invisible ground line (flat bottom), side view. Keep each in its own equal-size
cell with magenta gaps.

FRAME 1 - SPIKE TRAP: a row of 3 stepped triangular spikes rising from the ground
(each spike is a 3-step pyramid), solid black, spanning the full width of the cell.
FRAME 2 - BARRIER: a construction barrier: a wide horizontal striped top bar (black
bar with two vertical white notches), two vertical legs going down from the bar, and
two flat feet at the bottom.
FRAME 3 - CRATE STACK: two wooden shipping crates stacked: a bigger crate on the
bottom and a smaller crate on top, each crate with white cross/line details on its face.
FRAME 4 - FARM FENCE: a wooden fence: two vertical posts (left and right) connected
by two horizontal rails, small white notch details on the posts.
FRAME 5 - HAY BALE: a round hay bale: a big rounded rectangle body with curved straw
line details inside and a vertical twine band across the middle-right.

All 5 frames: same height cells, flat bottom baseline, evenly spaced.
```

### P13: Obstáculos animados - raposa, falcão e coruja (6 frames)

- **Arquivo:** `assets/raw-sprites/p13-obstacles-animals.png`
- **Anexe:** nenhuma
- **Frames:** fox-0, fox-1, falcon-0, falcon-1, owl-0, owl-1

```text
Six frames: three animal obstacles in two animation frames each, side view, facing
RIGHT, isolated sprites on invisible ground baseline.

FRAMES 1-2 - FOX (2 frames): a crouched fox ready to pounce, in profile facing right.
Big brush tail at the back-left, body low, front paws planted, pointed snout with a
small nose at the right, one upright ear, white tip on the tail, white belly shading,
small eye. FRAME 1: normal crouch. FRAME 2: same fox breathing/tensing - body pressed
DOWN 1 step (body and haunch 1 pixel lower, head slightly lower), legs stay planted.
The two frames must be identical except for the body bob.

FRAMES 3-4 - FALCON (2 frames): a sleek falcon skimming low, in profile facing right,
horizontal streamlined body, pointed hooked beak, small eye, tail feathers at the left.
FRAME 1: wings UP (raised above the body in a beat). FRAME 2: wings DOWN (swept low
below the body). Legs not visible (it flies).

FRAMES 5-6 - OWL (2 frames): a night owl with wings spread wide, front view of the
body but head turned right, round body, two big round eyes with pupils, two pointed
ear tufts on top, small beak, pale chest, two small talons at the bottom. FRAME 1:
wings RAISED up beside the body. FRAME 2: wings SWEPT down low.

All 6 frames: same size cells, evenly spaced, consistent scale between the pairs.
```

### P14: Itens e partículas (9 frames)

- **Arquivo:** `assets/raw-sprites/p14-items-particles.png`
- **Anexe:** nenhuma
- **Frames:** star, feather-0, feather-1, petal-0, petal-1, leaf-0, leaf-1, flake-big, flake-small

```text
Nine small collectible/particle sprites for a retro 1-bit game, each in its own
equal-size cell, evenly spaced, centered.

FRAME 1 - STAR: a classic 5-point arcade star (chunky, symmetric, pointed top,
two side arms, two bottom legs), solid black silhouette. This is the collectible.
FRAME 2 - FEATHER A: a tiny falling feather, small diagonal plume shape with a
central quill line, tilted one way.
FRAME 3 - FEATHER B: the same feather flipped/tilted the other way (second animation
frame).
FRAME 4 - PETAL A: a tiny flower petal, 4x4-ish, one simple rounded shape.
FRAME 5 - PETAL B: the same petal shifted shape (flipped) for flutter animation.
FRAME 6 - LEAF A: a tiny autumn leaf, square-ish with one notch, small stem.
FRAME 7 - LEAF B: the same leaf flipped horizontally (animation frame).
FRAME 8 - SNOWFLAKE BIG: a big snowflake: a plus/cross of 2 crossed bars with small
end ticks.
FRAME 9 - SNOWFLAKE SMALL: a smaller simpler version of the same cross snowflake.

All 9 frames: same size cells, evenly spaced, consistent pixel scale.
```

### P15: Decorações do chão (5 frames)

- **Arquivo:** `assets/raw-sprites/p15-ground-decor.png`
- **Anexe:** nenhuma
- **Frames:** stone, flower, mushroom, snow-mound, pebbles

```text
Five tiny GROUND DECORATION sprites that sit on an invisible ground line (flat bottom),
isolated on magenta, for a retro 1-bit side-scroller. Each in its own equal-size cell.

FRAME 1 - STONE: a small rounded rock with a white highlight notch on top.
FRAME 2 - FLOWER (spring): a small flower: a round petaled blossom head on a short
stem with two tiny leaves.
FRAME 3 - MUSHROOM (autumn): a small mushroom: a wide rounded cap with white spots
and a short thick stem.
FRAME 4 - SNOW MOUND (winter): a low wide mound of snow with a rounded bumpy top and
a flat bottom on the ground line.
FRAME 5 - PEBBLES: a small scatter of 3 tiny pebbles of different sizes.

All 5 frames: same size cells, flat bottom baseline, evenly spaced, consistent scale.
```

### P16: Céu - nuvens, sol e lua (4 frames)

- **Arquivo:** `assets/raw-sprites/p16-sky.png`
- **Anexe:** nenhuma
- **Frames:** cloud-big, cloud-small, sun, moon

```text
Four SKY sprites for a retro 1-bit game, isolated on magenta, each in its own
equal-size cell, evenly spaced.

FRAME 1 - CLOUD BIG: a blocky pixel cloud: a wide flat bottom, a middle bump, a
smaller top bump (3-step stepped silhouette), outlined in black with white interior.
FRAME 2 - CLOUD SMALL: a smaller version of the same blocky cloud style (2 bumps).
FRAME 3 - SUN: a small round pixel sun disc with four short triangular ray spikes
(top, bottom, left, right), solid black.
FRAME 4 - MOON: a round pixel moon disc made of stepped rows (slightly flattened
circle), solid black.

All 4 frames: same size cells, evenly spaced, consistent pixel scale.
```

### P17: Ícones - badges e som (9 frames)

- **Arquivo:** `assets/raw-sprites/p17-ui-badges-speaker.png`
- **Anexe:** nenhuma
- **Frames:** badge-first-flight, badge-night-owl, badge-four-seasons, badge-star-magnate, badge-speed-demon, badge-close-call, speaker-all, speaker-sfx, speaker-muted
- **Layout:** duas linhas: 6 badges em cima, 3 alto-falantes embaixo

```text
Nine small UI ICONS in clean 1-bit pixel art, each in its own equal-size square cell.
Layout: TOP ROW = 6 achievement badge icons, BOTTOM ROW = 3 speaker/audio icons.

BADGES (top row, left to right):
1. FIRST FLIGHT: an outstretched feathered wing in flight.
2. NIGHT OWL: a crescent moon with a small star beside it.
3. FOUR SEASONS: a single leaf with a small snowflake overlapping its corner.
4. STAR MAGNATE: one big star with two small stars around it.
5. SPEED DEMON: a chicken foot with two speed motion lines trailing behind it.
6. CLOSE CALL: an exclamation mark with a small swishing motion arc beside it.

SPEAKERS (bottom row, left to right) - all three are the same side-view speaker shape
(a small box + a cone pointing right):
7. SPEAKER ALL: speaker with two sound wave arcs in front of the cone.
8. SPEAKER SFX: speaker with one sound wave arc.
9. SPEAKER MUTED: speaker with a big X over the waves (no arcs).

All 9 cells: same size, evenly spaced, centered, consistent pixel scale.
```

### P18: Ícones da árvore de skills (10 frames)

- **Arquivo:** `assets/raw-sprites/p18-ui-skills.png`
- **Anexe:** nenhuma
- **Frames:** nest, armor-feathers, double-sequence, elastic-jump, escape-reflex, blazing-hen, slide-blade, golden-hen, perfect-hunt, tail-turbo
- **Layout:** duas linhas de 5

```text
Ten small SKILL TREE ICONS in clean 1-bit pixel art, each in its own equal-size
square cell. Layout: TWO ROWS OF FIVE, evenly spaced, centered.

ROW 1 (left to right):
1. NEST OF EVOLUTION: a bird nest with one egg in it.
2. ARMOR FEATHERS: a shield with a feather overlaid on it.
3. DOUBLE SEQUENCE: two overlapping stars (a big star and a small star behind it).
4. ELASTIC JUMP: a coiled spring with a small up arrow above it.
5. ESCAPE REFLEX: a lightning bolt with a small shield behind it.

ROW 2 (left to right):
6. BLAZING HEN: a flame shape.
7. SLIDE BLADE: a horizontal blade/sword with a small motion swoosh under it.
8. GOLDEN HEN: a hen silhouette with a small star above it.
9. PERFECT HUNT: a target/crosshair with a tiny star in the center.
10. TAIL TURBO: a turbo exhaust swirl (spiral) with a small flame tail.

All 10 cells: same size, evenly spaced, centered, consistent pixel scale.
```

---

### Dicas de regeneração (qualquer prompt)

| Problema no resultado | Responda no chat do Gemini |
|--|--|
| Cinza / borrado | "remake with ONLY pure black and pure white, threshold it, no gray, no anti-aliasing" |
| Frames de tamanhos diferentes | "all frames exactly the same size and height, feet aligned on the same baseline" |
| Fundo não é magenta liso | "flat solid magenta #FF00FF background, no gradient, no texture" |
| Personagem mudou de desenho entre frames | "keep the character design identical across all frames, only the pose changes" |
| Muita detalhagem (pixel fino) | "bigger pixels, chunkier, lower resolution grid, less detail per pixel" |
| Texto/moldura apareceu | "no text, no border, no frame, just the sprites on magenta" |
| Saiu um frame a menos | "add the missing frame N, same row, same size" |

Se depois de 2 tentativas não sair limpo, siga em frente: a ferramenta marca a frame ruim e você
regenera só ela com um prompt curto descrevendo aquela pose.

---

## 5. Convenção de arquivos e pastas

```
assets/
├── SPRITE-SHEET-PLAN.md        ← este documento
├── raw-sprites/                ← PNGs crus que você baixa do Gemini
│   ├── p01-cluck-run-jump.png
│   ├── p02-cluck-poses.png
│   ├── ... (p03 a p18)
├── sheet-tool.html             ← ferramenta de pós-processamento (fase 2)
└── sprites/                    ← saída da ferramenta (fase 2/3)
    ├── sheet-master.png        ← folha com todas as frames (preto/branco + alfa)
    ├── manifest.json           ← retângulo de cada frame na folha
    ├── sheet-mono-day.png      ← versões já tingidas (5 temas x dia/noite)
    ├── sheet-mono-night.png
    ├── sheet-gameboy-day.png   ... (10 no total)
    └── ...
```

**manifest.json** (formato planejado):

```json
{
  "frameW": 16, "frameH": 22,
  "frames": {
    "cluck-run-0":   { "x": 0,   "y": 0,   "w": 16, "h": 22 },
    "cluck-run-1":   { "x": 16,  "y": 0,   "w": 16, "h": 22 },
    "obstacle-fox-0":{ "x": 0,   "y": 88,  "w": 58, "h": 32 }
  }
}
```

A folha master guarda as formas em **preto (traço) + branco (miolo) + alfa (fora)**. As 10
variações tingidas são geradas pela ferramenta substituindo preto→`fg` e branco→`bg` de cada
tema/fase. O jogo escolhe a variante certa por tema + dia/noite.

---

## 6. Ferramenta `sheet-tool.html` (especificação)

Página HTML única, aberta com duplo clique, **sem dependências** (sem npm, sem build). Usa só APIs
do navegador (`FileReader`, `<canvas>`, `createObjectURL`).

### Passo a passo da interface

1. **Arrastar** os PNGs de `raw-sprites/` (um ou vários)
2. Para cada imagem, a ferramenta mostra:
   - **Preview** da imagem original
   - **Detecção automática** de frames (linhas/colunas 100% magenta como separadores)
   - **Campos manuais de ajuste** quando a detecção erra: número de colunas/linhas, margem,
     tamanho alvo por frame (preenchido da tabela do §2)
   - Toggle **"inverter preto/branco"** caso a IA inverta traço e miolo
   - Slider de **limiar (threshold)** para o corte do magenta e do cinza
3. **Processamento** por frame:
   - Recorta a região da frame
   - Chaveia magenta → transparência (por diferença de cor com #FF00FF, tolerância ajustável)
   - Quantiza: pixel com luminância `< limiar` → preto, senão → branco (elimina cinza/antialias)
   - Redimensiona ao tamanho alvo com **nearest-neighbor** (não borra)
   - Auto-trim de bordas totalmente transparentes + realinhamento pela linha dos pés
4. **Preview pós-processado** de todas as frames lado a lado (é aqui que você vê o que saiu ruim)
5. **Exportar:**
   - `sheet-master.png` (todas as frames empacotadas em grade)
   - `manifest.json`
   - 10 variações tingidas (5 temas × dia/noite), usando as paletas do `PALETTES` em `game.js`
   - Download em lote (`.zip` manual: a página pode pedir para escolher a pasta de destino
     via `showDirectoryPicker()` quando disponível, senão um download por arquivo)

### Regras de empacotamento

- Grade de células com **2 px de gutter** entre frames (o gutter fica transparente)
- Ordem estável: na mesma ordem do inventário (§10), para o manifesto ficar previsível
- Frames de tamanho diferente convivem na mesma folha (cada entrada do manifesto tem seu `w/h`)
- A folha é potência de 2 quando possível (ex.: 512×512, 1024×512) para margem de crescimento

### Modo "conferência" (checklist visual)

Checkbox por frame: ✅ ok / ❌ regenerar. Ao exportar, a ferramenta gera
`assets/raw-sprites/REGENERATE.md` listando os prompts (IDs do §4) das frames marcadas ❌.

---

## 7. Mudanças no código (`js/game.js`)

### 7.1 Carregamento

```js
// novo, perto das constantes
const SPRITES = { manifest: null, sheets: {}, ready: false };
function loadSprites() {
  return fetch('assets/sprites/manifest.json')
    .then(r => r.json())
    .then(m => {
      SPRITES.manifest = m;
      // carrega as 10 variantes tingidas em paralelo (Image objects)
      // ...
    })
    .catch(() => { SPRITES.ready = false; });  // fallback: código antigo continua
}
```

- Chamar `loadSprites()` no boot; o jogo só passa a usar sprites quando `SPRITES.ready === true`
- **Fallback:** enquanto `!ready`, todas as funções `drawXxx` antigas continuam chamadas (nada é
  apagado). Isso garante que o jogo nunca fique sem desenhar.
- Se aberto por `file://` e o `fetch` do manifesto falhar (CORS de arquivo), alternativa: o
  manifesto embutido como `assets/sprites/manifest.js` (`window.SPRITE_MANIFEST = {...}`) carregado
  por `<script>` — decide-se na implementação o que funcionar melhor nos dois modos

### 7.2 Funções que passam a usar `drawImage`

| Função hoje | Passa a desenhar |
|--|--|
| `drawPiCluck`, `drawRoosterRex`, `drawChubbyChick`, `drawMechaPi`, `drawShinobiHen` | frames `chicken-{id}-{pose}` do manifesto |
| `drawHat` | frames `hat-{n}`; continua usando `HAT_ANCHORS` para posicionar |
| `drawObstacle` (8 tipos) | frames `obs-{tipo}-{0\|1}`; fox/falcon/owl alternam frame por tempo (como hoje) |
| `drawStar` | frame `star`; continua aplicando `window._starScaleCurrent` |
| `drawFeather` | frames `feather-{0\|1}` por `ph` |
| partículas em `drawSeasonFx` | `petal-*`, `leaf-*`, `flake-*` (flip por tempo, como hoje) |
| `drawCloud` | `cloud-big`, `cloud-small` |
| `drawSky` (sol/lua) | `sun`, `moon`; estrelas do céu continuam em código (são 2-6 px, não vale sheet) |
| decorações em `drawGround` | `ground-stone`, `ground-flower`, `ground-mushroom`, `ground-snow`, `ground-pebbles` |
| ícones nos menus (novo) | badges: frames `badge-*` desenhados na tela BADGES ao lado do texto; skills: ícone no nó quando desbloqueado; `drawSpeaker`: frames `speaker-{all\|sfx\|muted}` |

### 7.3 Pose "fall" (nova)

Hoje `jump` cobre subida e queda. Mudança mínima em `drawPlayer`:

```js
// hoje:
else if (!player.onGround) drawChicken(pal, bx, player.y, 'jump', player.frame, false);
// passa a ser:
else if (!player.onGround)
  drawChicken(pal, bx, player.y, player.vy > 0 ? 'fall' : 'jump', player.frame, false);
```

E no dispatcher de frames, `fall` mapeia para o frame `fall` do manifesto.

### 7.4 Recolorização (temas × dia/noite)

- O jogo mantém `PALETTES` como está
- Na renderização, escolhe a variante: `SPRITES.sheets[currentThemeKey + (night ? '-night' : '-day')]`
- `imageSmoothingEnabled` continua `false` (já está)
- Nenhuma mudança na lógica de tema/dia-noite existente

### 7.5 O que NÃO muda

- Hitboxes (`playerBox`, `obsBox`, `overlap`) — idênticas
- Física, velocidade, spawn, dificuldade
- Áudio, LocalStorage, XP, skills, badges (só o desenho muda)
- Fonte 5×7, botões, HUD, barras, painéis — continuam em código (§8)

---

## 8. O que continua desenhado no código

| Item | Por quê |
|--|--|
| Fonte bitmap 5×7 (`GLYPHS`, `drawText`) | precisa escrever qualquer texto dinâmico |
| Botões, painéis, barras do HUD, combo, speed meter | retângulos + texto; mudam de tamanho dinamicamente |
| Colinas em dither (`drawHills`, `ditherRect`) | preenchimento procedural por tema, não é sprite fixo |
| Sombra do jogador (`drawShadow`) | elipse de dither posicional |
| Estrelas do céu (piscar) | pontos de 2-6 px; sheet não melhora |
| Linha do chão sólida (`box(0, GROUND, W, 3)`) | faixa de largura total; as decorações em cima viram sprite |
| Dither de sombra de painéis, cortina de transição | efeitos de UI procedural |
| Controles touch do HTML | são elementos DOM/CSS fora do canvas |

---

## 9. Checklist de testes

Após a implementação (§7), verificar:

- [x] Jogo abre por duplo clique (`file://`) e por servidor local, sem erros no console
- [x] Se `assets/sprites/` falhar, o jogo ainda desenha tudo (fallback)
- [x] Os 5 temas (T) mostram os sprites recoloridos corretamente, dia e noite
- [x] Menu principal, roster (C), HAT SHOP, SKILLS, BADGES, HALL OF FAME, HOW TO PLAY
- [x] Galinha: corrida (2 frames + bob), pulo, queda (frame nova), deslizar, peck (menu), morte
- [ ] Pisca (blink) continua funcionando nos personagens
- [x] Os 6 chapéus posicionados certos nas 5 galinhas em todas as poses (âncoras `HAT_ANCHORS`)
- [ ] Os 8 obstáculos: spawn, hitbox (pulo/deslize), animação da raposa/falcão/coruja
- [ ] Estrela coletável: tamanho do HUD, tamanho no jogo, tamanho na morte (configs de `starSize*`)
- [ ] Partículas das 4 estações + nuvens + sol (verão) + lua (noite)
- [ ] Decorações do chão por estação (flor/primavera, cogumelo/outono, neve/inverno)
- [ ] Ícones de badge/som/skills aparecem e ficam nítidos
- [ ] Tutorial, combo, near-miss, escudo da skill, sequência de morte
- [ ] Controles de toque (mobile) e teclado
- [x] Medir FPS com a skill `browser-perf` antes/depois (não pode cair)
- [ ] Salvar/recarregar (LocalStorage) sem perda de progresso

> Itens marcados foram verificados por scripts (`check.js` → `chk-01..20`, `hat-gap.js`,
> `filetest.js`, `fps.js`). Os não marcados **não chegaram a ser verificados** nesta rodada
> (não são regressão conhecida — a maioria é código que não foi alterado).

---

## 10. Inventário completo de frames

**Total: 94 frames em 18 prompts**

> **Status pós-Fase 2 (11/11/2026):** processadas **80 frames** (P01–P14, P16, P18).
> **P15** (decorações do chão) e **P17** (badges + som) continuam **desenhados no código**
> (fallback) — as imagens desses prompts nunca saíram corretas no Gemini.
> O arquivo `p17-ui-badges-speaker.png.jpg` na verdade continha os ícones de skills e foi
> renomeado para `p18-skills.png.jpg`. Ver `assets/sprites/` para a saída da ferramenta.

> **Status pós-Fase 3 (12/11/2026):** integração concluída em `js/game.js` + `index.html`.
> Carregamento por `<script src="assets/sprites/manifest.js">` (funciona também em `file://`);
> `spr()`/`sprInk()` desenham por `drawImage` e retornam `false` quando folha/frame faltam →
> todo o desenho antigo continua como **fallback** (nada foi apagado).
>
> - **Funções que usam sheet:** galinha (`drawChickenSprite`), chapéus (`drawHat`), estrela,
>   pena, obstáculos, efeitos de estação, nuvem/sky, pose `fall`, ícone de skill. P15/P17
>   continuam em código (decidido).
> - **Achado do tamanho da galinha:** a arte bruta do Gemini tem ~16×17 px-art, mas o desenho
>   em código ocupa ~21×23 unidades → desenhada na caixa antiga ela saía ~30% menor e o chapéu
>   flutuava. Correção: a `sheet-tool.html` emite **`ink`** (bbox real da tinta na frame, 73/80
>   frames) e o `game.js` ganhou a tabela **`CHICKEN_ART`** (bbox da arte em código por
>   galinha/pose, medido executando as funções `drawXxx` com `box`/`ctx` mockados).
>   `drawChickenSprite` mapeia ink→caixa casando a **altura** (pés no chão, chapéu exato) e a
>   **largura só no peck** (arte do sheet é em pé, a do código é agachada); sem `CHICKEN_ART` ou
>   frame → `return false` e o código desenha.
> - **Inversão dia/noite:** por frame (`INV_FRAMES` XOR com o checkbox global da tool).
>
> **Bugs corrigidos na validação pós-Fase 3 (12/11/2026):**
> - `CHICKEN_ART[pose]` buscava a pose como se fosse chave de galinha (`CHICKEN_ART['run']`
>   → `undefined`) → `T` sempre faltava e **todas** as galinhas caíam silenciosamente no
>   desenho em código. Achado instrumentando os guards com `window.__sprdbg` (`hasT:false`
>   em toda tela); correção: `CHICKEN_ART[id][pose]`.
> - `Array.isArray(art)` não distingue a caixa `[x,y,w,h]` de lista `[[..],[..]]` — em
>   duck/peck/dead `art[0]` é número → fallback silencioso. Correção:
>   `Array.isArray(art) && Array.isArray(art[0])`.
> - Peck + chapéu: a arte do sheet é em pé, a âncora `peck` do código espera a galinha
>   agachada → `drawChickenSprite` devolve o topo real (`dy`) e `drawChicken` ancora o
>   chapéu pela geometria da corrida (`hY = spTop - T0[1]*S`, modo `run`) sobre esse topo.
>   O chapéu fica no ponto mais alto da sprite (mesma lógica do código, que o senta sobre
>   as costas agachadas) e encosta na arte nos dois modos.
>
> **Validações (12/11/2026, pós-correções):** checklist §9 (`chk-01..20`) completo com
> FPS 60 (p50 16,7 ms, sem longtasks); `hat-ascii`/`hat-gap` com os 7 chapéus encostando
> nos modos normal e 404 (`erros: []` nos dois); `peckhat` com chapéu 5 nas 4 poses
> (run/peck/duck/dead) nos 2 modos — peck do sprite detectado por hook no `drawImage` da
> frame `cluck-peck` e o do código pela queda da banda da cabeça; `chick-measure` sprite
> 53×65 vs código 63×69 (só pixels escuros — a arte tem detalhes `bg` nas bordas);
> `shop-ascii` com as 2 frames de corrida diferentes do código (sprite ativo no preview);
> `file://` com 80 frames, `grayCount` 0 e `erros: []`; FPS 53,3/60 (mesma faixa do
> baseline 53,5–59,8, sem regressão).


| # | Prompt | Frames | Qtd | Tamanho alvo (px) |
|--|--|--|--|--|
| P01 | cluck run/jump | run-0, run-1, jump-0, jump-1 | 4 | 16×22 |
| P02 | cluck poses | fall, duck, peck, dead | 4 | 16×22 (duck 22×12) |
| P03 | rex run/jump | run-0, run-1, jump-0, jump-1 | 4 | 16×22 |
| P04 | rex poses | fall, duck, peck, dead | 4 | 16×22 (duck 22×12) |
| P05 | chubby run/jump | run-0, run-1, jump-0, jump-1 | 4 | 16×22 |
| P06 | chubby poses | fall, duck, peck, dead | 4 | 16×22 (duck 22×12) |
| P07 | mecha run/jump | run-0, run-1, jump-0, jump-1 | 4 | 16×22 |
| P08 | mecha poses | fall, duck, peck, dead | 4 | 16×22 (duck 22×12) |
| P09 | shinobi run/jump | run-0, run-1, jump-0, jump-1 | 4 | 16×22 |
| P10 | shinobi poses | fall, duck, peck, dead | 4 | 16×22 (duck 22×12) |
| P11 | chapéus | grad, crown, ribbon, viking, top, chef | 6 | 16×10 |
| P12 | obstáculos chão | spike, barrier, stack, fence, hay | 5 | 54×21, 48×42, 36×51, 54×36, 46×46 |
| P13 | obstáculos animais | fox×2, falcon×2, owl×2 | 6 | 58×32, 56×24, 48×24 |
| P14 | itens/partículas | star, feather×2, petal×2, leaf×2, flake×2 | 9 | 7×6, 4×4, 3×3, 7×7 |
| P15 | decorações chão | stone, flower, mushroom, snow, pebbles | 5 | ~8×8 |
| P16 | céu | cloud-big, cloud-small, sun, moon | 4 | 60×36, 40×24, 36×40, 30×36 |
| P17 | badges + som | 6 badges + 3 speakers | 9 | 16×16 |
| P18 | skills | 10 ícones | 10 | 16×16 |

### Ordem de geração sugerida

1. **P01 + P02 (cluck)** primeiro: valide o pipeline inteiro com o personagem principal
2. Rode a ferramenta nesses 2 PNGs, confira o preview, ajuste o que for preciso
3. Só então gere P03 a P10 (as outras 4 galinhas), seguindo o mesmo padrão que funcionou
4. P11 a P18 (itens, cenário, UI) por último
5. Implemente o código (§7) com as frames prontas

### Dependências por fase

```
Fase 1 (prompts/geração)  ──→  Fase 2 (ferramenta)  ──→  Fase 3 (código)
     você + Gemini                sheet-tool.html             game.js + testes
```

A Fase 3 só começa quando a Fase 2 exportar `manifest.json` + as 10 variantes tingidas.
A Fase 2 pode ser desenvolvida em paralelo com a geração das imagens (usa frames de exemplo).