# SelfSnap — Project Structure

Repo root is the app. No subproject nesting.

```
selfsnap/                     # repo root = Vercel project root
├── .kiro/steering/           # AI steering rules
├── api/                      # Vercel Functions (serverless)
│   └── send-photo.ts         # POST strip -> Cloudinary upload + Resend email
├── src/
│   ├── App.vue               # Root component (radial background + router-view)
│   ├── router.ts             # Vue Router config (/, /settings, /booth, /result)
│   ├── views/                # Page-level components (one per route)
│   │   ├── LandingView.vue   # Entry screen
│   │   ├── SettingsView.vue  # Frame/filter/timer selection
│   │   ├── BoothView.vue     # Camera + capture sequence
│   │   └── ResultView.vue    # Canvas composition + download/share
│   ├── lib/                  # Shared utility modules
│   │   ├── layout.ts         # Frame layouts (grid4, strip3) + compute4GridSlots
│   │   ├── frames.ts         # Local frames + Cloudinary frame list (tag -> layout)
│   │   ├── filters.ts        # CSS filter string helpers
│   │   ├── canvasColor.ts    # Canvas color helpers
│   │   ├── print.ts          # Print paper settings (orientation, rotation)
│   │   └── time.ts           # sleep utility
│   ├── components/           # Reusable UI (TopBar, BrandMark, StripPreview,
│   │                         # ShutterButton, EmailDialog)
│   └── style.css             # Global styles + Tailwind directives
├── public/                   # Static assets served as-is (local-frames/, favicon)
├── .env.example              # Template for env vars (cloud name, email keys)
├── .vercelignore             # Keeps .env*.local out of deployments
├── vercel.json               # SPA rewrite for Vercel
├── index.html                # Vite entry HTML
├── vite.config.ts            # Vite config (vue plugin, @ alias, /api dev server)
├── tailwind.config.js        # Tailwind config (custom radial gradient)
├── postcss.config.js         # PostCSS (tailwind + autoprefixer)
├── tsconfig.json             # Root TS config (references app + node)
├── tsconfig.app.json         # App TS config (src code)
├── tsconfig.node.json        # Node TS config (vite.config)
├── package.json              # Scripts: dev / build / preview / deploy
└── README.md                 # Project documentation
```

## Architecture Notes

- **Frontend + one serverless function**: `src/` is the Vue SPA; `api/` holds Vercel Functions. No database; frames come from Cloudinary, email via Resend.
- **Views are self-contained**: Each view manages its own state and side effects via Composition API. No shared store — data flows through `sessionStorage`.
- **`lib/` is for pure utility functions**: Layout math, filter helpers, and timing. These must remain framework-agnostic (no Vue imports).
- **New frontend pages** go in `src/views/` and must be registered in `router.ts`.
- **Reusable UI pieces** go in `src/components/`.
- **Env vars**: `.env.local` (gitignored) for dev; Vercel project settings for production.
