# Homepage

## Overview

Convert the static prototype in `prototypes/homepage/` into the actual Next.js app homepage at `/` (root route). Match the mockup's layout, content, and dark theme using Tailwind CSS and ShadCN components.

## Sections

1. **Navbar** — Fixed top nav with logo, Features/Pricing anchor links, Sign In (`/sign-in`) and Get Started (`/register`) buttons, mobile hamburger menu
2. **Hero** — Headline, subtitle, CTA buttons (Get Started → `/register`, See Features → `#features`), chaos-to-order visual (floating icons → dashboard preview)
3. **Features** — 6-card grid (Snippets, AI Prompts, Search, Commands, Files & Docs, Collections) with icons and descriptions
4. **AI Section** — Pro badge, checklist of AI features, code mockup with auto-generated tags
5. **Pricing** — Monthly/Yearly toggle, Free vs Pro cards with feature lists, CTA buttons → `/register`
6. **CTA** — Final call-to-action → `/register`
7. **Footer** — Logo, tagline, Product/Resources/Company link columns, copyright with dynamic year

## Component Breakdown

### Server Components
- `src/app/page.tsx` — Root page, composes all sections
- `src/components/homepage/Navbar.tsx` — Static nav links (no state needed for scroll effect — handle via CSS or minimal client wrapper)
- `src/components/homepage/FeaturesSection.tsx` — Static feature cards grid
- `src/components/homepage/AiSection.tsx` — AI showcase with code mockup
- `src/components/homepage/CtaSection.tsx` — Final CTA block
- `src/components/homepage/Footer.tsx` — Footer with links and copyright year

### Client Components (`'use client'`)
- `src/components/homepage/HeroSection.tsx` — Chaos icon animation (requestAnimationFrame, mouse tracking)
- `src/components/homepage/PricingSection.tsx` — Monthly/Yearly toggle state
- `src/components/homepage/MobileNav.tsx` — Mobile menu open/close state (used inside Navbar)

## Requirements

- Use Tailwind classes matching the prototype's CSS variables/colors (defined in `globals.css` `@theme` block)
- Use ShadCN `Button` component for all buttons/CTAs
- Use Lucide React icons instead of inline SVGs where matching icons exist
- Chaos animation: port `script.js` physics logic (floating icons, mouse repulsion, wall bounce) into a React `useEffect` with `requestAnimationFrame`
- Navbar scroll effect: add `scrolled` class on scroll > 20px (backdrop blur + border)
- Scroll fade-in: use IntersectionObserver in a reusable hook or component
- Pricing toggle: swap RM29/mo ↔ RM21/mo billed yearly
- All anchor links (`#features`, `#pricing`) use smooth scroll
- Responsive: match prototype breakpoints (1024px, 768px, 480px)
- Buttons/links go to correct routes: Sign In → `/sign-in`, Get Started/Register → `/register`, Logo → `/`

## Link Mapping

| Button/Link | Destination |
|---|---|
| Logo | `/` |
| Features | `#features` |
| Pricing | `#pricing` |
| Sign In | `/sign-in` |
| Get Started / Get Started Free | `/register` |
| Upgrade to Pro | `/register` |
| Footer: Features | `#features` |
| Footer: Pricing | `#pricing` |
| Footer: Changelog, Docs, API, Blog, About, Privacy, Terms | `#` (placeholder) |

## References

- `prototypes/homepage/index.html` — HTML structure
- `prototypes/homepage/styles.css` — Styling reference
- `prototypes/homepage/script.js` — Animation and interaction logic
