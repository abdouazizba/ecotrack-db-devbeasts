FROM node:18-alpine

WORKDIR /app

# Installer dumb-init pour gérer les signaux correctement
RUN apk add --no-cache dumb-init

# Copier les fichiers package
COPY package*.json ./

# Installer les dépendances
RUN npm install --only=production

# Copier le code source
COPY . .

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Exposer le port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Utiliser dumb-init pour lancer l'app
ENTRYPOINT ["dumb-init", "--"]

# Commande de démarrage
CMD ["npm", "start"]
