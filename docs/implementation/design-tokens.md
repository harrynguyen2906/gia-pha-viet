# Heritage Cloud — Design Tokens Configuration

> Chuyển đổi PRD-00 Global Design System thành file config thực tế, sẵn sàng dùng trong code.

---

## 1. Tailwind Config (`tailwind.config.ts`)

```typescript
import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // ============================================
      // COLORS — PRD-00 §2 Global Color Palette
      // ============================================
      colors: {
        // Core
        primary: '#8a0000',
        'imperial-crimson': '#8B0000',
        'bg-dark': '#230f0f',
        'bg-light': '#f8f5f5',
        'lacquer-dark': '#1a0808',
        'royal-lacquer': '#1a0000',

        // Gold & Accent
        'antique-gold': '#C5A059',
        'gold-leaf': '#E5C17C',
        'accent-gold': '#d4af37',

        // Surface
        parchment: '#F4EBD0',
        'aged-silk': '#FFF8DC',
        'temple-stone': '#2D241E',
        'panel-dark': '#361818',
        'dark-paper': '#2d1b1b',
        charcoal: '#1a1a1a',

        // Border
        'border-muted': '#4b2020',
      },

      // ============================================
      // FONTS — PRD-00 §3 Global Typography
      // ============================================
      fontFamily: {
        display: ['Noto Serif', 'serif'],
        header: ['Cinzel', 'serif'],
        ornate: ['Cinzel Decorative', 'serif'],
        calligraphy: ['Pinyon Script', 'cursive'],
        serif: ['Playfair Display', 'serif'],
        sans: ['Noto Sans', 'sans-serif'],
      },

      // ============================================
      // LETTER SPACING — PRD-00 §3.2
      // ============================================
      letterSpacing: {
        widest: '0.2em',
        'ultra-wide': '0.3em',
      },

      // ============================================
      // BOX SHADOW — PRD-00 §4 Components
      // ============================================
      boxShadow: {
        'parchment': '15px 15px 35px rgba(0, 0, 0, 0.4)',
        'lacquer': '0 4px 10px rgba(0, 0, 0, 0.3)',
        'soft-glow': '0 0 15px rgba(138, 0, 0, 0.1)',
        'gold-frame': '0 0 20px rgba(197, 160, 89, 0.2)',
      },

      // ============================================
      // BACKGROUND IMAGE — PRD-00 §4 Textures
      // ============================================
      backgroundImage: {
        'lacquer-gradient': 'linear-gradient(145deg, #3a0000, #8B0000)',
        'gold-shimmer': 'linear-gradient(135deg, #c5a059 0%, #f1e0b0 50%, #c5a059 100%)',
        'parchment-gradient': 'radial-gradient(ellipse at center, #F4EBD0, #E6D5B8)',
        'wood-carving': 'linear-gradient(45deg, #4b2020, transparent), linear-gradient(-45deg, #4b2020, transparent)',
      },

      // ============================================
      // BORDER IMAGE — PRD-00 §4.5 Wood Carving
      // ============================================
      borderWidth: {
        '3': '3px',
      },

      // ============================================
      // ANIMATION — PRD-00 §6.2 Transitions
      // ============================================
      transitionDuration: {
        '0': '0ms',
        '200': '200ms',
        '300': '300ms',
        '700': '700ms',
      },

      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },

      animation: {
        'fade-in': 'fade-in 200ms ease-in-out',
        'slide-in-right': 'slide-in-right 300ms ease-out',
        'scale-in': 'scale-in 300ms ease-out',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
      },
    },
  },

  plugins: [
    // ============================================
    // CUSTOM UTILITIES — PRD-00 §4 Components
    // ============================================
    plugin(function ({ addUtilities, addComponents }) {
      // Deceased member grayscale filter
      addUtilities({
        '.deceased-filter': {
          filter: 'grayscale(0.6)',
          transition: 'filter 700ms ease',
          '&:hover': {
            filter: 'grayscale(0)',
          },
        },
      });

      // Parchment Card component
      addComponents({
        '.card-parchment': {
          background: 'radial-gradient(ellipse at center, #F4EBD0, #E6D5B8)',
          border: '1px solid #C5A059',
          boxShadow: '15px 15px 35px rgba(0, 0, 0, 0.4)',
          position: 'relative',
          transition: 'transform 300ms ease',
          '&:hover': {
            transform: 'scale(1.01)',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: '6px',
            border: '1px solid rgba(138, 0, 0, 0.2)',
            pointerEvents: 'none',
          },
        },

        // Lacquer Button component
        '.btn-lacquer': {
          background: 'linear-gradient(145deg, #3a0000, #8B0000)',
          border: '1px solid #C5A059',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
          color: '#E5C17C',
          fontFamily: 'Cinzel, serif',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          transition: 'filter 200ms ease, color 200ms ease',
          '&:hover': {
            filter: 'brightness(1.1)',
            color: '#ffffff',
          },
        },

        // Gold Shimmer Button component
        '.btn-gold-shimmer': {
          background: 'linear-gradient(135deg, #c5a059 0%, #f1e0b0 50%, #c5a059 100%)',
          color: '#230f0f',
          fontWeight: '900',
          textTransform: 'uppercase',
          transition: 'filter 200ms ease',
          '&:hover': {
            filter: 'brightness(1.1)',
          },
        },

        // Gold Leaf Border Frame
        '.frame-gold-leaf': {
          border: '1px solid #d4af37',
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: '2px',
            border: '2px solid rgba(212, 175, 55, 0.3)',
            pointerEvents: 'none',
          },
        },
      });
    }),
  ],
};

export default config;
```

---

## 2. CSS Variables (`globals.css`)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Core */
    --color-primary: #8a0000;
    --color-imperial-crimson: #8B0000;
    --color-bg-dark: #230f0f;
    --color-bg-light: #f8f5f5;
    --color-lacquer: #1a0808;
    --color-royal-lacquer: #1a0000;

    /* Gold & Accent */
    --color-gold: #C5A059;
    --color-gold-leaf: #E5C17C;
    --color-accent-gold: #d4af37;

    /* Surface */
    --color-parchment: #F4EBD0;
    --color-aged-silk: #FFF8DC;
    --color-temple-stone: #2D241E;
    --color-panel-dark: #361818;
    --color-dark-paper: #2d1b1b;
    --color-charcoal: #1a1a1a;

    /* Border */
    --color-border-muted: #4b2020;

    /* Focus ring */
    --ring-color: var(--color-primary);
  }

  /* Default dark mode (lacquer background) */
  body {
    background-color: var(--color-bg-dark);
    color: var(--color-parchment);
    font-family: 'Noto Sans', sans-serif;
  }

  /* Focus ring for accessibility — PRD-00 §10 */
  *:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  /* Respect reduced motion — PRD-00 §10 */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
}

@layer components {
  /* Skeleton shimmer for loading states — PRD-00 §6.4 */
  .skeleton {
    background: linear-gradient(
      90deg,
      var(--color-panel-dark) 25%,
      var(--color-border-muted) 50%,
      var(--color-panel-dark) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
    border-radius: 0.375rem;
  }
}
```

---

## 3. Google Fonts Loading (`layout.tsx`)

```typescript
import { Noto_Serif, Noto_Sans, Cinzel, Cinzel_Decorative, Playfair_Display, Pinyon_Script } from 'next/font/google';

const notoSerif = Noto_Serif({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '700'],
  variable: '--font-display',
  display: 'swap',
});

const notoSans = Noto_Sans({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-header',
  display: 'swap',
});

const cinzelDecorative = Cinzel_Decorative({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-ornate',
  display: 'swap',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '700'],
  variable: '--font-serif',
  display: 'swap',
});

const pinyonScript = Pinyon_Script({
  subsets: ['latin', 'vietnamese'],
  weight: ['400'],
  variable: '--font-calligraphy',
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="vi"
      className={`
        ${notoSerif.variable}
        ${notoSans.variable}
        ${cinzel.variable}
        ${cinzelDecorative.variable}
        ${playfairDisplay.variable}
        ${pinyonScript.variable}
        dark
      `}
    >
      <body className="bg-bg-dark text-parchment font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
```

---

## 4. Usage Examples

### Parchment Card
```tsx
<div className="card-parchment p-6 rounded-lg">
  <h3 className="font-header text-xl text-temple-stone tracking-widest uppercase">
    Family Lineage
  </h3>
  <p className="font-sans text-sm text-charcoal mt-2">
    128 members across 14 generations
  </p>
</div>
```

### Lacquer Button
```tsx
<button className="btn-lacquer px-6 py-3 rounded-lg text-sm">
  Add New Member
</button>
```

### Deceased Avatar
```tsx
<div className="relative">
  <img
    src={member.avatarUrl}
    alt={member.fullName}
    className={member.isDeceased ? 'deceased-filter border-2 border-accent-gold rounded-full' : 'border-2 border-primary rounded-full'}
  />
  {member.isDeceased && (
    <span className="absolute -top-1 -right-1 text-accent-gold">
      <span className="material-symbols-outlined text-sm">filter_vintage</span>
    </span>
  )}
</div>
```

### Status Badges
```tsx
<span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/20 text-primary">Active</span>
<span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-600">Available</span>
<span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">Pending</span>
```

### Gold Leaf Frame
```tsx
<div className="frame-gold-leaf p-8 rounded-lg bg-bg-dark">
  <p className="font-calligraphy text-3xl text-gold-leaf text-center">
    "Uống nước nhớ nguồn"
  </p>
</div>
```
