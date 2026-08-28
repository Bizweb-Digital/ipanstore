# IPAN STORE - Premium Service Provider Website

Modern web application built with React, TypeScript, Vite, and Node.js backend.

## 📁 Project Structure

```
/ipanstore
├── 📄 src/           # Frontend React source code
├── 📦 public/        # Static assets
├── 🔧 server/        # Backend Node.js API
├── 🎬 video/         # Remotion video projects
├── ⚙️ config/        # Docker & Nginx configurations
│   ├── docker/      # Docker files
│   └── nginx/       # Nginx configs
├── 📚 docs/          # Documentation
│   ├── setup/       # Setup guides
│   ├── deployment/  # Deployment guides
│   └── api/         # API documentation
├── 🗄️ database/      # Database files
│   ├── migrations/  # SQL migrations
│   └── seeds/       # Database seeds
├── 🖼️ screenshots/   # Screenshots & docs
├── 📝 logs/          # Logs directory
└── .github/         # GitHub workflows
```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- npm or yarn
- PostgreSQL/Supabase database
- Environment variables configured

### Installation

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install && cd ..

# Configure environment
cp .env.example .env
# Edit .env with your credentials
```

### Development

```bash
# Run frontend (port 8080)
npm run dev

# Run backend (port 5159)
cd server && npm start
```

## 📚 Documentation

Detailed guides available in `/docs`:
- [Setup Guide](./docs/setup/)
- [Deployment Guide](./docs/deployment/)
- [Design Documentation](./docs/DESIGN.md)
- [Security Guide](./docs/deployment/SECURITY.md)

## 🔒 Security

This project implements secure practices for:
- API Key management (stored server-side only)
- Payment gateway integration (DOKU & KlikQris/QRIS)
- Firebase Authentication
- Rate limiting & CORS protection

Refer to [SECURITY.md](./docs/deployment/SECURITY.md) for details.

## 🎥 Video Features

This project includes Remotion Studio for creating promotional videos:

```bash
# Open video studio
npm run video:studio

# Render video production
npm run video:render
```

See [video/README.md](./video/README.md) for details.

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS
- **Backend**: Node.js, Express, WebSocket
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Firebase Auth
- **Video**: Remotion Studio
- **Payment**: DOKU Gateway, KlikQris QRIS
- **Email**: Nodemailer

## 📞 Support

For issues or questions, refer to the documentation or contact support team.

---
Built with ❤️ for IPAN STORE
