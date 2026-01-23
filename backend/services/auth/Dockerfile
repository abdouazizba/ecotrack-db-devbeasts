# Stage 1: Build (réduit la taille de l'image)
FROM node:18-alpine AS builder

WORKDIR /app

# Copier les fichiers package
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Stage 2: Runtime (image finale optimisée)
FROM node:18-alpine

WORKDIR /app

# Installer dumb-init pour gérer les signaux correctement
RUN apk add --no-cache dumb-init

# Copier les dépendances depuis le stage builder
COPY --from=builder /app/node_modules ./node_modules

# Copier le code source
COPY . .

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Exposer le port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Utiliser dumb-init pour lancer l'app
ENTRYPOINT ["dumb-init", "--"]

# Commande de démarrage
CMD ["npm", "start"]
