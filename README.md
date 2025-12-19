# ecotrack-db-devbeasts

Application de gestion des déchets dans les métropoles urbaines modernes

## Quick start

- Install node dependencies:

```powershell
npm install
```

- Launch in development (requires `nodemon`):

```powershell
npm run dev
```

- Or with Docker Compose (starts MongoDB):

```powershell
docker compose up -d
```

## Project structure

```
├── src/
│   ├── controllers/
│   │   └── user.controller.js
│   ├── api/
│   │   └── routes/
│   │       └── user.routes.js
│   │   └── server.js
│   ├── models/
│   │   └── user.model.js
│   ├── views/
│   │   └── user.view.js
│   └── app.js
├── package.json
├── .env.example
├── .env
└── docker-compose.yml
```

## Notes

- The API root is mounted at `/api`. Example endpoints:
  - `POST /api/users/register` to register a user
  - `POST /api/users/login` to authenticate
- Environment variables: see `.env.example` (or copy to `.env`).
# ecotrack-db-devbeasts
Application de gestion des déchets dans les métropoles urbaines modernes
