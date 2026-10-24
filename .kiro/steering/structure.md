# SelfSnap — Project Structure

```
selfsnap/
├── .kiro/steering/          # AI steering rules
├── selfsnap-web/            # Frontend Vue application
│   ├── src/
│   │   ├── App.vue          # Root component (radial background + router-view)
│   │   ├── router.ts        # Vue Router config (/, /settings, /booth, /result)
│   │   ├── views/           # Page-level components (one per route)
│   │   │   ├── LandingView.vue   # Entry screen
│   │   │   ├── SettingsView.vue  # Frame/filter/timer selection
│   │   │   ├── BoothView.vue     # Camera + capture sequence
│   │   │   └── ResultView.vue    # Canvas composition + download/share
│   │   ├── lib/             # Shared utility modules
│   │   │   ├── layout.ts    # Frame layouts (grid4, strip3) + compute4GridSlots
│   │   │   ├── frames.ts    # Local frames + Cloudinary frame list (tag -> layout)
│   │   │   ├── filters.ts   # CSS filter string helpers
│   │   │   └── time.ts      # sleep utility
│   │   ├── components/      # Reusable UI components (currently empty)
│   │   ├── assets/          # Static assets bundled by Vite
│   │   └── style.css        # Global styles + Tailwind directives
│   ├── public/              # Static assets served as-is (local-frames/)
│   ├── vercel.json          # SPA rewrite for Vercel
│   ├── index.html           # Vite entry HTML
│   ├── vite.config.ts       # Vite config (vue plugin, @ alias)
│   ├── tailwind.config.js   # Tailwind config (custom radial gradient)
│   ├── postcss.config.js    # PostCSS (tailwind + autoprefixer)
│   ├── tsconfig.json        # Root TS config (references app + node)
│   ├── tsconfig.app.json    # App TS config (src code)
│   └── tsconfig.node.json   # Node TS config (vite.config)
├── package.json             # Shortcuts to selfsnap-web scripts
└── README.md                # Project documentation
```

## Architecture Notes

- **Frontend only**: `selfsnap-web/` is the Vue SPA. No backend; frames come from Cloudinary.
- **Views are self-contained**: Each view manages its own state and side effects via Composition API. No shared store — data flows through `sessionStorage`.
- **`lib/` is for pure utility functions**: Layout math, filter helpers, and timing. These must remain framework-agnostic (no Vue imports).
- **New frontend pages** go in `selfsnap-web/src/views/` and must be registered in `router.ts`.
- **Reusable UI pieces** go in `selfsnap-web/src/components/`.
