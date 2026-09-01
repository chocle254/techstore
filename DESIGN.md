## Vibe
- Cyberpunk × Industrial Interface — dark navy command-console aesthetic, electric blue accents, crisp grid structure inspired by high-end tech retail interfaces

## Color
- Primary: #3b82f6
- On Primary: #ffffff
- Accent: #06b6d4
- On Accent: #0a0f1e
- Background: #0a0f1e
- Foreground: #f1f5f9
- Muted: #1a2236
- Border: #1e2d45
- Secondary: #1e3a5f

## Typography
- Heading: Inter (family: 'Inter', sans-serif, weight: 700, url: https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap)
- Body: Inter (family: 'Inter', sans-serif, weight: 400, url: https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap)

## Visual Language
- Core visual signature: electric-blue neon border glow on interactive cards — `box-shadow: 0 0 0 1px #3b82f6, 0 4px 24px rgba(59,130,246,0.15)` on hover — giving each product card a power-on feel
- Material & depth: layered dark surfaces (#0a0f1e base → #111827 sections → #1a2236 cards), subtle blue-tinted inner shadows, no frosted glass
- Containers & buttons: cards with `border: 1px solid #1e2d45` resting state; primary CTAs filled #3b82f6 with white text; ghost buttons outline #3b82f6 text #3b82f6; badge pills with tight radius
- Layout rhythm: category sidebar pinned left with tight list; main content 3–4 column grid; blue accents concentrated on interactive states, badges, and CTAs — maximum 10% of any surface

## Animation
- Entrance: product cards fade-up with stagger (150ms each, ease-out 200ms)
- Interaction: card hover scale 1.02 + neon border glow (150ms ease)
- Scroll / transition: page route fade (opacity 0→1, 200ms)

## Forbidden
- Large blue/colored background fills on section headers or hero backgrounds
- Frosted glass overlays or backdrop-blur
- Generic drop-shadow-only depth (use border glow instead)

## Additional Notes
- All user-visible copy in English
- Dark theme is the sole theme — no light mode toggle
- Admin dashboard uses the same color tokens but with a separate sidebar layout
- Login page: full-bleed dark background with centered card form and blue accent border
