# PREDATOR Responsive System

## Core Principle
**NOT just `@media (max-width)`**. PREDATOR uses a **capability-based** device classification.

| Signal | CSS Query | Purpose |
|--------|-----------|---------|
| Pointer type | `(pointer: coarse)` | Touch vs mouse |
| Hover support | `(hover: hover)` | Enable hover-dependent UI |
| Width | Standard breakpoints | Column count |
| Orientation | `orientation: portrait` | Layout axis |
| Motion | `prefers-reduced-motion` | Disable animations |
| Safe areas | `env(safe-area-inset-*)` | iOS notch/Dynamic Island |

## Device Profiles

### Phone (< 768px, coarse pointer)
- **Navigation**: Bottom tab bar
- **Layout**: Single column, vertical scroll
- **Details**: Bottom sheets
- **Cards**: Full-width, compact
- **Graph**: Simplified 2D node graph
- **Map**: Full-screen + bottom sheet details
- **Touch targets**: ≥ 44px
- **Safe areas**: Dynamic Island + Home Indicator respected

### Tablet (768–1023px)
- **Navigation**: Side rail or collapsible sidebar
- **Layout**: Split view (master-detail)
- **Details**: Side panel
- **Cards**: 2-column grid
- **Graph**: 2D optimized
- **Map**: Split map + details

### Laptop (1024–1439px)
- **Navigation**: Full sidebar
- **Layout**: Sidebar + Main + Evidence rail (optional)
- **Cards**: Responsive grid
- **Graph**: Full 2D/3D

### Desktop (1440–2559px)
- **Navigation**: Persistent sidebar
- **Layout**: Multi-column workspace
- **Evidence**: Persistent right rail
- **Graph/Map**: Full panels

### Ultrawide (≥ 2560px)
- **Navigation**: Persistent sidebar
- **Layout**: Multi-panel command center
- **Max content width**: Enforced to maintain readability

## Implementation
- `useDeviceProfile()` hook in `src/hooks/useDeviceProfile.ts`
- CSS adaptive classes in `src/index.css`
- `BottomNavigation` for phone
- `BottomSheet` for phone-class detail views
- `EvidenceDrawer` adapts between BottomSheet (phone) and side rail (desktop)
