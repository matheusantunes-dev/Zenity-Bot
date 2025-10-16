# BotFly • Cloud API (Frontend + Backend)

## Pastas
- `frontend/` • site Netlify (SPA) com `index.html`, `style.css` e `app.js`.
- `backend/`  • API Node/Express que chama o WhatsApp Cloud API.
- `backend/data/` • arquivos JSON persistidos (usuários, settings e grupos).

## Variáveis (.env)
Veja `backend/.env.example` e preencha:
- `WABA_TOKEN` • token da Cloud API (Facebook Developers > WhatsApp > Getting Started)
- `WABA_PHONE_ID` • *phone_number_id*
- `WABA_API_VER` • ex: v21.0
- `JWT_SECRET`, `CORS_ORIGIN`, `PORT`, `DATA_DIR`

## Netlify (frontend)
1) Suba a pasta `frontend/` para um repositório (ou arraste no Netlify).
2) `netlify.toml` já faz proxy: `/api/*` -> seu backend (troque `YOUR-BACKEND-DOMAIN`).

## Backend (Oracle/VM ou qualquer VPS)
- Docker:
  docker build -t botfly-api backend
  docker run -d --name botfly -p 8080:8080     -e WABA_TOKEN=... -e WABA_PHONE_ID=... -e WABA_API_VER=v21.0     -e JWT_SECRET=... -e CORS_ORIGIN=https://SEU-SITE.netlify.app     -e DATA_DIR=/srv/data     -v botfly_data:/srv/data botfly-api

- Sem Docker:
  cd backend
  npm i
  export WABA_TOKEN=...
  export WABA_PHONE_ID=...
  export JWT_SECRET=...
  node server.js

## Rotas
- POST /auth/signup  • {username,password} (apenas 1ª vez)
- POST /auth/login   • {username,password}
- GET/POST /api/power
- GET/POST /api/message
- GET/POST /api/schedule
- GET/POST /api/groups
- POST /api/send     • {to,text}
- GET  /health
