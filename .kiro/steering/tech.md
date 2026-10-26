# SelfSnap — Tech Stack & Build

## Frontend (`src/`)

- **Framework**: Vue 3 (Composition API with `<script setup lang="ts">`)
- **Language**: TypeScript
- **Build tool**: Vite 7
- **Styling**: Tailwind CSS 3 + PostCSS + Autoprefixer
- **Routing**: Vue Router 4 (history mode)
- **Icons**: Phosphor Icons (`@phosphor-icons/vue`)
- **Type checking**: vue-tsc
- **Path alias**: `@` → `./src` (configured in vite.config.ts and tsconfig)

### Frontend Commands

```bash
# From repo root
npm run dev        # Start Vite dev server
npm run build      # Type-check (vue-tsc) then build for production
npm run preview    # Preview production build locally
npm run deploy     # Deploy to Vercel production
```

## Hosting & Media

- **Hosting**: Vercel (static Vite build, `vercel.json` SPA rewrite)
- **Frames**: Cloudinary, listed client-side via `res.cloudinary.com/<cloud>/image/list/<tag>.json`
- **Backend**: one Vercel Function, `api/send-photo.ts` (Cloudinary signed upload + Resend email). No database.
- Photos leave the browser only when the visitor chooses Email.

## Key Conventions

- Frontend uses Vue SFCs with `<script setup lang="ts">` exclusively.
- No state management library; views share data via `sessionStorage`.
- Canvas operations use a shared layout function (`compute4GridSlots`) for consistency between preview and output.
- All env vars live in `.env.local` (gitignored). The browser only sees `VITE_*` and `CLOUDINARY_CLOUD_NAME` (`envPrefix` in vite.config.ts); everything else is server-only.
