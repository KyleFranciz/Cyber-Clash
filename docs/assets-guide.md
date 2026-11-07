# Assets guide

Designs live in Paper (file `01K4XVGQHJKESN857335275T69`). Exports are 2x PNGs. Put them in `frontend/public/assets/` and show them at **1x size** (the 2x file gives sharp images on high-density screens).

## Rename the exports

| Paper export | Rename to |
|---|---|
| `Balatro — Survival HUD@2x (1).png` | `bg-office-bright.png` |
| `Dark — Survival HUD@2x (1).png` | `bg-office-dark.png` |
| `Balatro — Camera View@2x (1).png` | `bg-camera.png` |
| `SVG@2x (2).png` | `bg-encounter.png` |
| `SVG@2x (1).png` | `bg-corridor.png` |
| `Office Background@2x.png` / `(1)` | `office-bright.png` / `office-dark.png` |
| Hand Card files | `card-1.png`, `card-2.png`, `card-3.png` |
| Enemy Sprite (walk) | `enemy-walk.png` |
| Enemy Head | `enemy-head.png` |
| Camera Feed | `camera-feed.png` |

The full-screen references (`Balatro — Survival HUD@2x.png` and similar) are for looking at, not for use in code.

## Positions on the 1440×900 stage (1x)

| Part | Position / size |
|---|---|
| Office background | (0,0) 1440×640 |
| Desk | (0,640) |
| Monitor bezel | (336,56) 768×478 |
| Monitor screen (email list goes here) | (362,82) 716×426 |
| Clock panel | (18,92) |
| Power panel | (18,272) |
| Integrity panel | (1290,92) |
| ATB panel | (48,676) |
| Hand (3 cards, 220×200) | (370,676); cards at x 370 / 610 / 850, tilt −2° / +0.5° / +2° |
| Control buttons | (1100,672) |
| Camera feed | (174,104) 1080×540 |
| Enemy on camera screen | (672,350) |
| Encounter head | (640,144) |

## Draw in code, not images

Clock, power, integrity and ATB values, all text, and the three decision buttons. The backgrounds are art only, so numbers stay live.

## Plain-color screens

Shift Terminated `#050A0B`. Night Complete `#3B4750`.

## Key Paper artboards

U1-0 bright HUD, 1JZ-0 dark HUD, 10X-0 and 1O8-0 email modals (three-button decision bar: Leave it outline `#1B2A3A`, Verify separately `#2B6CB0`, Report phishing `#D64545`), 1BC-0 blackout, 156-0 wrong answer, 19F-0 camera, 1FZ-0 encounter, 1HE-0 shift terminated, 1HF-0 night complete, Q2-0 ability cards.
