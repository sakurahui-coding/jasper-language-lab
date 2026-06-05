# Design System

## Brand

- Name: Jasper Language Lab
- Tagline: Learn. Save. Repeat. Grow.
- Tone: 現代、乾淨、沉穩，適合高中生，不幼稚。

## Color Tokens

The source of truth is `web/assets/css/variables.css`.

| Token | Value | Usage |
| --- | --- | --- |
| `--color-primary` | `#6658E8` | Main actions and active states |
| `--color-primary-light` | `#EFEDFF` | Soft panels and badges |
| `--color-background` | `#F7F8FC` | Page background |
| `--color-text` | `#17203A` | Main text |
| `--color-muted` | `#6F7892` | Secondary text |
| `--color-english` | `#E9EFFF` | English language badge |
| `--color-japanese` | `#FFF0E5` | Japanese language badge |
| `--color-german` | `#E9F8F1` | German language badge |

## Layout

- Mobile first.
- Use clear content sections and 8px-16px spacing rhythm.
- Cards use modest rounded corners.
- Text must remain readable at 375px, 768px, and 1440px widths.

## Accessibility

- Use semantic HTML landmarks.
- All buttons need accessible names.
- Maintain readable contrast.
- Support keyboard operation.
- Respect `prefers-reduced-motion`.

