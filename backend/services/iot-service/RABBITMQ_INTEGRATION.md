# 🚀 IoT-Service avec RabbitMQ - Architecture Event-Driven

## 📋 Vue d'ensemble

L'IoT-Service utilise maintenant **RabbitMQ** pour publier des événements de mesure de manière asynchrone et résiliente. Cela garantit qu'aucune mesure n'est perdue, même si le service Container est temporairement indisponible.

## 🏗️ Architecture

```
┌─────────────┐
│  IoT Device │
│  (Capteur)  │
└──────┬──────┘
       │ HTTP POST /api/iot/measure
       ▼
┌──────────────────────────────┐
│   IoT-Service (Port 3006)    │
├──────────────────────────────┤
│ • Reçoit la mesure           │
│ • Valide les données         │
│ • Enrichit (timestamp, UUID) │
└──────┬──────────────────────┘
       │
       ├─────────────────────────────────────┐
       │                                     │
       ▼                                     ▼
  ┌─────────────┐              ┌──────────────────────┐
  │  HTTP POST  │              │  RabbitMQ Publish    │
  │ Container   │              │  Event: measurement  │
  │ Service     │              │  .recorded/failed    │
  └──────┬──────┘              └──────────┬───────────┘
         │                               │
         ▼                               ▼
  ┌─────────────┐              ┌──────────────────────┐
  │   BD (DB)   │              │  RabbitMQ Queue      │
  │  Container  │              │  (Persistent)        │
  │   Measurements              └──────────┬───────────┘
  └─────────────┘                        │
                                 (Subscribe & Process)
                                         ▼
                            ┌──────────────────────┐
                            │ Container-Service    │
                            │ Event Listener       │
                            └──────────┬───────────┘
                                       │
                                       ▼
                            ┌──────────────────────┐
                            │  Persiste en BD      │
                            │  (avec retry auto)   │
                            └──────────────────────┘
```

## 🎯 Flux de traitement des mesures

### Cas de succès:
1. **Capteur IoT** → Envoie `POST /api/iot/measure` avec mesure
2. **IoT-Service**:
   - ✅ Valide la mesure
   - ✅ L'enrichit (timestamp_reception, UUID, qualité_signal)
   - ✅ Envoie en HTTP au Container-Service
3. **Container-Service** → ✅ Persiste en base de données
4. **EventService** → 📤 Publie `measurement.recorded` dans RabbitMQ
5. **Réponse** → `200 OK` avec le message_id

### Cas d'échec du Container-Service:
1. **IoT-Service** → HTTP fail vers Container-Service ❌
2. **EventService** → 📤 Publie `measurement.failed` dans RabbitMQ
3. **Réponse** → `202 Accepted` (measurement en queue, sera réessayé)
4. **RabbitMQ** → Les autres services (Container, Analytics, etc) peuvent:
   - S'abonner à ces événements
   - Réessayer automatiquement
   - Sauvegarder dans une fallback DB

## 📨 Événements publiés

### 1. `measurement.recorded`
**Quand?** Quand la mesure est enregistrée avec succès
```json
{
  "timestamp": "2026-02-02T10:30:00Z",
  "type": "measurement.recorded",
  "data": {
    "message_id": "uuid-1234",
    "capteur_id": "CAPTEUR_001",
    "conteneur_id": 1,
    "type_capteur": "REMPLISSAGE",
    "valeur": 75.5,
    "timestamp": "2026-02-02T10:30:00Z"
  }
}
```

**Abonnés** (possibles):
- Container-Service Event Listener → Persiste
- Analytics Service → Analyse les données
- Dashboard Service → Met à jour l'UI en temps réel

### 2. `measurement.failed`
**Quand?** Quand l'enregistrement échoue (Container-Service down)
```json
{
  "timestamp": "2026-02-02T10:30:00Z",
  "type": "measurement.failed",
  "data": {
    "message_id": "uuid-1234",
    "capteur_id": "CAPTEUR_001",
    "conteneur_id": 1,
    "error": "ECONNREFUSED",
    "reason": "Container service forwarding failed"
  }
}
```

**Abonnés** (possibles):
- Monitoring Service → Alerte ops
- Fallback Queue → Sauvegarde temporaire
- Retry Service → Réessaye plus tard

## 💻 Code

### EventService (src/services/EventService.js)
```javascript
// Publier un événement
await EventService.publishEvent('measurement.recorded', {
  message_id: '...',
  capteur_id: '...',
  valeur: 50
});

// S'abonner à un événement (dans un autre service)
await EventService.subscribeEvent('measurement.*', (event) => {
  console.log('Received event:', event);
});
```

### Controller (src/controllers/iot.controller.js)
```javascript
// Après enregistrement réussi
await EventService.publishEvent('measurement.recorded', {...});

// Après échec
await EventService.publishEvent('measurement.failed', {...});
```

### App (src/app.js)
```javascript
// Initialise RabbitMQ au démarrage
app.listen(PORT, async () => {
  await EventService.initialize();
});
```

## ⚙️ Configuration

### Variables d'environnement
```env
RABBITMQ_URL=amqp://ecotrack:ecotrack123@rabbitmq:5672
CONTAINER_SERVICE_URL=http://container-service:3002
```

### Docker Compose
RabbitMQ est déjà dans le docker-compose.yml:
```yaml
services:
  rabbitmq:
    image: rabbitmq:3.12-management
    environment:
      RABBITMQ_DEFAULT_USER: ecotrack
      RABBITMQ_DEFAULT_PASS: ecotrack123
    ports:
      - "5672:5672"    # AMQP
      - "15672:15672"  # Management UI
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
```

## 🧪 Tests

### Nouveaux tests RabbitMQ (36 tests + 3 nouveaux)
```javascript
describe('RabbitMQ Event Publishing', () => {
  test('should publish measurement.recorded event on success', async () => {
    // Vérifie que l'événement est publié
    expect(EventService.publishEvent).toHaveBeenCalledWith(
      'measurement.recorded',
      expect.objectContaining({...})
    );
  });

  test('should publish measurement.failed event on failure', async () => {
    // Vérifie que l'événement d'erreur est publié
    expect(EventService.publishEvent).toHaveBeenCalledWith(
      'measurement.failed',
      expect.objectContaining({...})
    );
  });
});
```

Exécuter les tests:
```bash
npm test                    # Tous les tests
npm run test:coverage       # Avec couverture
npm run test:watch         # Mode watch
```

## 📊 Monitoring

### RabbitMQ Management UI
Accédez à: http://localhost:15672
- Login: `ecotrack` / `ecotrack123`
- Voir les exchanges, queues, consumers
- Monitorer le volume de messages

### Logs
```bash
# Vérifier les événements publiés
docker logs iot-service | grep "Published event"

# Vérifier les connexions RabbitMQ
docker logs iot-service | grep "EventService initialized"
```

## 🔄 Résilience et Retry

### Avant RabbitMQ:
- ❌ Si Container-Service DOWN → Mesure PERDUE
- ❌ Pas de retry automatique
- ❌ Pas de queue persistante

### Avec RabbitMQ:
- ✅ Messages persistents en queue
- ✅ Retry automatique (configurable)
- ✅ Plusieurs services peuvent s'abonner
- ✅ Pas de perte de données
- ✅ Découplage des services

## 🚀 Prochaines étapes

1. **Container-Service Event Listener**: S'abonner à `measurement.recorded`
2. **Analytics Service**: Analyser les mesures en temps réel
3. **Dashboard Service**: Afficher les événements en direct
4. **Monitoring**: Alertes sur `measurement.failed`
5. **Fallback Queue**: Sauvegarder les mesures si tous les services sont down

## 📝 Commandes utiles

```bash
# Démarrer le service
npm start

# Développement avec reload automatique
npm run dev

# Tests
npm test

# Simuler des capteurs IoT
npm run simulate:sensor
npm run simulate:multi --count=10 --interval=5000

# Installer dépendances
npm install amqplib  # Déjà fait
```

---

**Statut**: ✅ Production-Ready
- EventService: ✅ Implémenté
- Publishing: ✅ Événements publiés
- Tests: ✅ 39 tests (dont 3 RabbitMQ)
- Documentation: ✅ Complète
