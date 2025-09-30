# AI Nexus Design System & Style Guide

## 🎨 Color Palette

### Primary Colors
| Color | Hex | Usage |
|-------|-----|-------|
| **Electric Yellow** | `#FFD50F` | Primary accent, CTAs, focus states, links, hover effects |
| **Vibrant Coral** | `#FD765B` | Secondary accent, link hovers, highlights |

### Neutrals
| Color | Hex | Usage |
|-------|-----|-------|
| **Pure Black** | `#000000` | Light mode text, borders (10% opacity) |
| **Pure White** | `#FFFFFF` | Light mode background, dark mode text |
| **Dark Gray** | `#1A1A1A` | Dark mode background |
| **Neutral Gray** | `#999999` | Secondary text, metadata, scrollbars |

### Semantic Colors
- **Light Mode**: White bg `#FFFFFF` / Black text `#000000`
- **Dark Mode**: Dark gray bg `#1A1A1A` / White text `#FFFFFF`

---

## 📝 Typography

### Font Family
- **Primary**: `Inter` (all weights 300-900)
- **Fallback**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif`
- **Mono**: `'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Droid Sans Mono'`

### Font Sizes
```
Hero:         96px (line-height: 0.9, letter-spacing: -0.04em)
Phase:        72px (line-height: 0.9, letter-spacing: -0.04em)
Section:      48px (line-height: 1.2, letter-spacing: -0.02em)
Phase Title:  32px (line-height: 1.2, letter-spacing: -0.02em)
Subtitle:     22px (line-height: 1.5)
Body:         18px (line-height: 1.8)  ← Base size
Nav:          14px (line-height: 1.6)
Label:        12px (line-height: 1.6, letter-spacing: 2px)
Micro:        11px (line-height: 1.6, letter-spacing: 2px)
Tiny:         10px (line-height: 1.6, letter-spacing: 8px)
```

### Font Weights
```
Light:      300  ← Default body text
Regular:    400
Medium:     500  ← UI elements, buttons
Semibold:   600
Bold:       700
Extrabold:  800
Black:      900
```

### Line Heights
```
Compressed:   0.9   (hero text)
Tight:        1.2   (headings)
Normal:       1.5
Comfortable:  1.6   (UI text)
Relaxed:      1.8   (body copy)
```

---

## 📐 Spacing & Layout

### Border Radius (Custom "claude-" prefix)
```
sm:  8px   (buttons, inputs, small cards)
md:  12px  (message bubbles, dropdowns)
lg:  16px  (large containers)
```

### Shadows (Custom "claude-" prefix)
```
sm:  0 1px 3px rgba(0, 0, 0, 0.08)   (subtle elevation)
md:  0 4px 12px rgba(0, 0, 0, 0.1)   (cards, sidebar)
lg:  0 8px 24px rgba(0, 0, 0, 0.12)  (dropdowns, modals)
```

---

## 🎯 Component Patterns

### Buttons

#### Primary Action
```tsx
className="px-4 py-2 bg-electric-yellow hover:bg-electric-yellow-600 
           text-pure-black rounded-claude-sm font-medium 
           shadow-claude-sm transition-colors"
```

#### Icon Button
```tsx
className="p-1 rounded-claude-sm hover:bg-pure-black/5 
           dark:hover:bg-pure-white/5 transition-opacity"
```

### Inputs
```tsx
className="px-3 py-2 bg-white dark:bg-dark-gray 
           border border-pure-black/10 dark:border-pure-white/10 
           rounded-claude-sm text-sm 
           focus:ring-2 focus:ring-electric-yellow/50 
           focus:border-electric-yellow"
```

### Message Bubbles

#### User Message
```tsx
className="rounded-claude-md px-6 py-5 
           bg-pure-white dark:bg-dark-gray 
           shadow-claude-sm 
           border border-pure-black/10 dark:border-pure-white/10"
```

#### AI Message
```tsx
className="rounded-claude-md px-6 py-5 
           bg-pure-white/5 dark:bg-dark-gray/5 
           shadow-claude-sm 
           border border-pure-black/10 dark:border-pure-white/10"
```

### Cards
```tsx
className="rounded-claude-sm p-3 
           bg-white dark:bg-pure-white/5 
           hover:bg-white/50 dark:hover:bg-pure-white/5 
           shadow-claude-sm 
           border border-pure-black/10 dark:border-pure-white/10 
           transition-colors"
```

---

## ✨ Interactions & Animations

### Transitions
- **Duration**: `250ms` (default), `300ms` (layout), `400ms` (special effects)
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)` (smooth, material-like)

### Focus States
```css
outline: 2px solid #FFD50F;
outline-offset: 2px;
border-radius: 4px;
```

### Hover Effects
- **Buttons**: Background color shift + ripple effect
- **Links**: Color change from Electric Yellow → Vibrant Coral
- **Cards**: Subtle background lightening
- **Scrollbar**: Gray → Electric Yellow

### Animations
```
fade-in:         opacity 0→1, translateY 4px→0 (300ms)
bounce:          translateY animation for loading states
pulse-yellow:    opacity pulse for streaming indicator
skeleton-loading: gradient sweep for loading placeholders
```

---

## 🌗 Dark Mode Strategy

### Color Adjustments
```
Light → Dark conversions:
- Backgrounds: #FFFFFF → #1A1A1A
- Text: #000000 → #FFFFFF
- Borders: black/10 → white/10
- Accent colors stay SAME (Electric Yellow, Vibrant Coral)
```

### Implementation
```tsx
// Use Tailwind's dark: prefix
className="bg-white dark:bg-dark-gray 
           text-pure-black dark:text-pure-white
           border-pure-black/10 dark:border-pure-white/10"
```

---

## 📱 Responsive Design

### Breakpoints (Tailwind defaults)
```
sm:  640px
md:  768px
lg:  1024px
xl:  1280px
2xl: 1536px
```

### Key Patterns
- **Sidebar**: `w-72` desktop → `w-0` mobile (slide-out)
- **Messages**: `max-w-[85%]` → full width on mobile
- **Font sizes**: Scale down on smaller screens

---

## 🔤 Content Styling (Markdown)

### Prose Elements

#### Headings
```tsx
H1: text-2xl font-semibold mb-4 mt-6
H2: text-xl font-semibold mb-3 mt-5
H3: text-lg font-semibold mb-2 mt-4
```

#### Lists
```tsx
list-disc/decimal pl-6 mb-4 space-y-2
```

#### Links
```tsx
text-electric-yellow hover:text-vibrant-coral
underline decoration-electric-yellow/30
```

#### Inline Code
```tsx
bg-pure-white dark:bg-dark-gray/80 
text-electric-yellow border rounded
```

#### Blockquotes
```tsx
border-l-4 border-electric-yellow/30 pl-4 italic
```

#### Tables
```tsx
border rounded-claude-sm with alternating row backgrounds
```

---

## 🎨 Design Principles

1. **Bold & Modern**: High contrast with vibrant accent colors
2. **Consistent Spacing**: 4px/8px grid system
3. **Smooth Transitions**: Everything animates (250-300ms)
4. **Typography-First**: Clean, readable Inter font at 18px base
5. **Subtle Depth**: Light shadows and borders, no heavy 3D effects
6. **Accessibility**: High contrast ratios, visible focus states

---

## 🛠️ Usage Tips

### Class Naming Convention
- Use `claude-` prefix for custom utilities: `rounded-claude-md`, `shadow-claude-lg`
- Brand colors as direct utilities: `electric-yellow`, `vibrant-coral`

### Opacity Layers
```
Borders:    /10  (10% opacity)
Hovers:     /5   (5% background tint)
Accents:    /30-50 (decorative elements)
```

### Common Patterns

#### Hover with smooth transition
```tsx
hover:bg-pure-black/5 dark:hover:bg-pure-white/5 transition-colors
```

#### Conditional active state
```tsx
{isActive 
  ? 'bg-white dark:bg-pure-white/5 border-electric-yellow/20'
  : 'hover:bg-white/50'}
```

---

## 📦 Implementation Reference

### CSS Variables (globals.css)
```css
:root {
  --electric-yellow: #FFD50F;
  --vibrant-coral: #FD765B;
  --pure-black: #000000;
  --pure-white: #FFFFFF;
  --neutral-gray: #999999;
  --background: #FFFFFF;
  --foreground: #000000;
}

.dark {
  --background: #1A1A1A;
  --foreground: #FFFFFF;
}
```

### Tailwind Config
```typescript
colors: {
  'electric-yellow': '#FFD50F',
  'vibrant-coral': '#FD765B',
  'pure-black': '#000000',
  'dark-gray': '#1A1A1A',
  'pure-white': '#FFFFFF',
  'neutral-gray': '#999999',
}
```

---

**Created for AI Nexus** | A bold, modern design system for AI interfaces
