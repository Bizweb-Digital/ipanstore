# PROJECT STRUCTURE - IPAN STORE

## 📁 Complete Directory Tree

```
/ipanstore/
│
├── 🚀 FRONTEND (src/)
│   ├── src/                    # React source code
│   │   ├── components/        # Reusable React components
│   │   ├── pages/             # Page components  
│   │   ├── hooks/             # Custom React hooks
│   │   ├── utils/             # Utility functions
│   │   ├── types/             # TypeScript type definitions
│   │   └── App.tsx            # Main app component
│   │
│   ├── public/                # Static assets
│   │   ├── img/               # Images
│   │   ├── fonts/             # Fonts
│   │   └── favicon.png        # Favicon
│   │
│   ├── package.json           # Frontend dependencies & scripts
│   ├── vite.config.ts         # Vite configuration
│   ├── tailwind.config.ts     # Tailwind CSS config
│   └── tsconfig.json          # TypeScript config
│
├── 🔧 BACKEND (server/)
│   ├── server/
│   │   ├── index.js           # Main entry point
│   │   ├── lib/               # Backend libraries
│   │   ├── migrations/        # Database migration files
│   │   ├── secrets/           # Sensitive credentials
│   │   └── package.json       # Backend dependencies
│   │
│   ├── .env                   # Environment variables
│   └── DEPLOY.md              # Deployment guide
│
├── 🎬 VIDEO PRODUCTION (video/)
│   ├── video/
│   │   ├── index.ts           # Video entry point
│   │   ├── Root.tsx           # Video root component
│   │   ├── IpanStorePromo.tsx # Promo video template
│   │   ├── PanggilanJihad.tsx # Jihad call video
│   │   └── README.md          # Video docs
│   │
│   └── out/                   # Rendered output directory
│
├── ⚙️ CONFIGURATION (config/)
│   ├── config/
│   │   ├── docker/            # Docker configurations
│   │   │   ├── Dockerfile
│   │   │   ├── Dockerfile.deploy
│   │   │   └── docker-compose.yml
│   │   └── nginx.conf         # Nginx server configuration
│
├── 📚 DOCUMENTATION (docs/)
│   ├── docs/
│   │   ├── setup/             # Setup guides
│   │   │   ├── ADMIN_SETUP_GUIDE.md
│   │   │   ├── EMAIL_SETUP_GUIDE.md
│   │   │   ├── SETUP-DOKU.md
│   │   │   └── SETTINX_FIREBASE_AUTOGEN.md
│   │   │
│   │   ├── deployment/        # Deployment guides
│   │   │   ├── DEPLOY_INSTRUCTIONS.md
│   │   │   ├── DEPLOY.md
│   │   │   └── SECURITY.md
│   │   │
│   │   ├── DESIGN.md          # Design documentation
│   │   ├── LASTACTIVITY.md    # Project activity log
│   │   ├── copywriting-promo-ipanstore.txt  # Marketing text
│   │   └── README.md          # General project readme
│   │
│   ├── QUICK_REFERENCE.md     # Quick commands reference
│   └── README.md              # Main project overview
│
├── 🗄️ DATABASE (database/)
│   ├── database/migrations/   # SQL migration files
│   │   ├── supabase_migration.sql
│   │   ├── supabase_migration_v1.1.sql
│   │   ├── supabase_migration_v2.sql
│   │   ├── supabase_migration_v3.sql
│   │   ├── supabase_seed_data.sql
│   │   ├── supabase_setup_admin.sql
│   │   ├── SQL_COMPLETE_SECURITY_PATCH.sql
│   │   ├── SQL_TO_PASTE.sql
│   │   ├── SQL_DIAGNOSTIC.sql
│   │   └── sql_patches/       # Additional patch files
│   │
│   └── database/seeds/        # Database seed data
│
├── 🖼️ SCREENSHOTS (screenshots/)
│   └── screenshots/           # All screenshots & debug images
│       ├── screenshot-*.png
│       └── debug-screenshot.png
│
├── 📝 LOGS (logs/)
│   └── logs/                  # Application logs (gitignored)
│       ├── *.log
│       └── *.tsbuildinfo
│
├── .github/                   # GitHub workflows & CI/CD
│   └── .github/workflows/     # GitHub Actions
│
├── .opencode/                 # AI assistant configs
│
└── ROOT CONFIG FILES
    ├── .env.example           # Environment template
    ├── .env                   # Current env vars
    ├── package.json           # Root npm scripts
    ├── eslint.config.js       # ESLint configuration
    ├── postcss.config.js      # PostCSS configuration
    ├── tsconfig.app.json      # TypeScript app config
    ├── tsconfig.node.json     # TypeScript node config
    ├── vitest.config.ts       # Test configuration
    └── opencode.json          # Agent configuration
```

## 📊 Summary

### Total Structure:
- **Root directories**: 14 organized directories
- **Documentation**: 7+ files in docs/ with proper categorization
- **Database migrations**: 9+ SQL files + patches
- **Screenshots**: Organized in dedicated folder
- **Configuration**: Docker, Nginx, Build configs centralized
- **Logs**: Isolated from main codebase

### What Was Moved/Organized:
1. ✅ All `.md` files → `docs/`
2. ✅ All `.png` screenshots → `screenshots/`
3. ✅ All `.log` files → `logs/`
4. ✅ All SQL migration files → `database/migrations/`
5. ✅ Docker & Nginx configs → `config/`
6. ✅ Cleanup of build artifacts (`dist/`)
7. ✅ Removed duplicate/temp files

### Root Files Retained:
Only essential dev tools and configs remain at root:
- Configuration files for Node/Vite builds
- Documentation (README, QUICK_REFERENCE)
- Essential environment templates
- Tool configurations (ESLint, PostCSS, TypeScript)

## 🎯 Benefits of This Structure:

1. **Clear Separation**: Each concern has its own location
2. **Easy Navigation**: Developers can find anything quickly
3. **Scalability**: Easy to add new features without cluttering
4. **Maintainability**: Updates are isolated to specific areas
5. **Professional**: Industry-standard organization
6. **Git-Friendly**: Clean separation prevents accidental commits

---
Last Updated: Auto-generated structure cleanup
