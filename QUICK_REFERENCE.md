# Quick Reference - IPAN STORE

## Commands
```bash
# Development
npm run dev           # Frontend at http://localhost:8080
cd server && npm start   # Backend at http://localhost:5159

# Build
npm run build         # Production build
npm run preview       # Preview production build

# Video
npm run video:studio  # Remotion video development
npm run video:render  # Render video output
```

## Port Mapping
- Frontend: `8080`
- Backend: `5159`
- Network: Available at local IP addresses too

## Environment Setup
Copy `.env.example` to `.env` and configure:
- DATABASE_URL
- FIREBASE_CONFIG
- DOKU_API_KEY
- SMTP_CONFIG (for email)
- Other credentials as needed

## Files Migration Summary
All moved files are organized in their respective directories:
- 📚 Docs → `/docs/`
- 📸 Screenshots → `/screenshots/`  
- 🗄️ SQL files → `/database/migrations/`
- 📝 Logs → `/logs/`
- ⚙️ Configs → `/config/`
