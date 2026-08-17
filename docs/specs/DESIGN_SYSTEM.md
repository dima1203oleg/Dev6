/**
 * PREDATOR Design System — DESIGN_SYSTEM.md
 * 
 * Central reference for the visual intelligence language.
 * All tokens defined here are implemented in index.css @theme.
 */

# PREDATOR Design System

## 1. Colors

### Surface Palette (Dark Professional Command Interface)
| Token | Value | Usage |
|-------|-------|-------|
| `surface-base` | `#0a0a0f` | App background |
| `surface-raised` | `#12121a` | Cards, panels |
| `surface-overlay` | `#1a1a25` | Modals, drawers |
| `surface-hover` | `#252532` | Hover state |
| `surface-active` | `#1e1e28` | Active/pressed |

### Accent Colors
| Token | Value | Usage |
|-------|-------|-------|
| `accent-primary` | `#6366f1` (Indigo) | Primary actions, selected states |
| `accent-secondary` | `#8b5cf6` (Purple) | Secondary emphasis |
| `accent-success` | `#10b981` (Emerald) | VERIFIED, success |
| `accent-warning` | `#f59e0b` (Amber) | PARTIALLY_VERIFIED, caution |
| `accent-danger` | `#ef4444` (Red) | CONFLICTING, errors |

### Status / Verification Colors
| Status | Color | Label |
|--------|-------|-------|
| VERIFIED | Emerald `#10b981` | ✓ Підтверджено |
| PARTIALLY_VERIFIED | Amber `#f59e0b` | ⚠ Частково |
| UNVERIFIED | Slate `#64748b` | ? Не підтверджено |
| CONFLICTING | Red `#ef4444` | ✕ Конфлікт |
| NOT_FOUND | Gray `#6b7280` | — Не знайдено |
| SOURCE_UNAVAILABLE | Orange `#f97316` | ⊘ Джерело недоступне |
| UPSTREAM_MAINTENANCE | Yellow `#eab308` | ⚙ Технічне обслуговування |
| INFERRED | Blue `#3b82f6` | ∿ Визначено AI |

## 2. Typography
- **Display**: Space Grotesk 600-700 (Headlines, hero text)
- **Body**: Inter 400-600 (All body text)
- **Mono**: JetBrains Mono 400-600 (Code, IDs, hashes, evidence)

## 3. Spacing Scale (4px base)
`4, 8, 12, 16, 20, 24, 32, 40, 48`

## 4. Radii
`8px (sm), 12px (md), 16px (lg), 20px (xl), 24px (2xl), 9999px (full)`

## 5. Motion
- **Fast**: 150ms ease-out (hover, focus)
- **Normal**: 250ms ease-out (panel transitions)
- **Slow**: 400ms ease-out (page transitions)
- **Bounce**: 500ms spring (playful interactions)
- **Respect**: `prefers-reduced-motion: reduce` disables all non-essential animation.

## 6. Touch Targets
- Minimum: `44px × 44px` on touch devices
- Minimum: `32px × 32px` on pointer devices

## 7. Glass Surfaces
- `.glass-panel`: blur(20px), semi-transparent bg
- `.glass-panel-premium`: blur(24px), stronger opacity, inset highlight
- `.glass-panel-accent`: indigo-tinted glass with glow border

## 8. Breakpoints (Capability-Based)
| Profile | Width | Pointer | Composition |
|---------|-------|---------|-------------|
| Phone | < 768px | coarse | Bottom nav, single column, bottom sheets |
| Tablet | 768–1023px | coarse/fine | Split view, sidebar, larger cards |
| Laptop | 1024–1439px | fine | Sidebar + main + evidence rail |
| Desktop | 1440–2559px | fine | Multi-column intelligence workspace |
| Ultrawide | ≥ 2560px | fine | Multi-panel command center |
