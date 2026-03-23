# 🌐 IoT Service - Gateway pour Capteurs

**Port:** 3006  
**Rôle:** Recevoir, valider et forwarding les mesures capteurs IoT vers container-service

---

## 📋 Endpoints

### 1. Enregistrer Mesure
```
POST /api/iot/measure
Content-Type: application/json

{
  "capteur_id": "CAPTEUR_ZONE_A_001",
  "conteneur_id": 42,
  "type_capteur": "REMPLISSAGE",
  "valeur": 87.5,
  "unite": "%",
  "timestamp_capteur": "2026-01-29T10:30:00Z",
  "qualite_signal": 85,
  "batterie": 95
}

Response (200):
{
  "status": "success",
  "message": "Measurement recorded",
  "message_id": "uuid",
  "forwarded_to": "container-service",
  "container_id": 42,
  "measurement": {
    "type": "REMPLISSAGE",
    "value": 87.5,
    "unit": "%"
  }
}
```

### 2. Enregistrer Capteur
```
POST /api/iot/device/register
Content-Type: application/json

{
  "capteur_id": "CAPTEUR_ZONE_A_001",
  "type_capteur": "REMPLISSAGE",
  "conteneur_id": 42,
  "api_key": "your_device_api_key"
}

Response (201):
{
  "status": "success",
  "message": "Device registered",
  "device_id": "uuid",
  "device": {
    "capteur_id": "CAPTEUR_ZONE_A_001",
    "type_capteur": "REMPLISSAGE",
    "container_id": 42
  }
}
```

### 3. Obtenir Info Capteur
```
GET /api/iot/device/:capteur_id

Response (200):
{
  "capteur_id": "CAPTEUR_ZONE_A_001",
  "type_capteur": "REMPLISSAGE",
  "conteneur_id": 42,
  "last_measurement": {
    "timestamp": "2026-01-29T10:30:00Z",
    "value": 87.5,
    "unit": "%"
  },
  "status": "ACTIVE",
  "battery": 95,
  "signal_quality": 85
}
```

### 4. État du Service
```
GET /api/iot/status

Response (200):
{
  "service": "iot-service",
  "status": "RUNNING",
  "timestamp": "2026-01-29T10:30:00Z",
  "version": "1.0.0",
  "endpoints": [...]
}
```

### 5. Health Check
```
GET /health

Response (200):
{
  "status": "OK",
  "service": "iot-service",
  "timestamp": "2026-01-29T10:30:00Z",
  "container_service": "http://container-service:3002"
}
```

---

## 🔌 Types de Capteurs Supportés

| Type | Exemple | Unité |
|------|---------|-------|
| `REMPLISSAGE` | Capteur ultrasonic | `%` |
| `TEMPERATURE` | Capteur température | `°C` |
| `POIDS` | Load cell | `kg` |
| `HUMIDITE` | Capteur humidité | `%RH` |
| `GPS` | Localisation capteur | `lat,lng` |

---

## 🔄 Architecture: IoT → Container-Service

```
┌──────────────┐
│ Capteur IoT  │
└──────┬───────┘
       │ HTTP POST
       │ {"conteneur_id": 42, "valeur": 87.5}
       │
┌──────▼──────────────────┐
│ IoT-Service (Port 3006)  │
│                          │
│ 1. Reçoit mesure         │
│ 2. Valide format & plages│
│ 3. Enrichit data         │
│ 4. Forward au service 3  │
└──────┬──────────────────┘
       │ HTTP POST
       │ /api/container/42/measure
       │
┌──────▼──────────────────┐
│ Container-Service        │
│ (Port 3002)              │
│                          │
│ • Insère dans BD         │
│ • Publie event RabbitMQ  │
│ • Check seuils           │
└──────────────────────────┘
```

---

## 📝 Exemple: CURL Commands

### Enregistrer mesure
```bash
curl -X POST http://localhost:3006/api/iot/measure \
  -H "Content-Type: application/json" \
  -d '{
    "capteur_id": "CAPTEUR_001",
    "conteneur_id": 1,
    "type_capteur": "REMPLISSAGE",
    "valeur": 75.5,
    "unite": "%",
    "qualite_signal": 90
  }'
```

### Enregistrer capteur
```bash
curl -X POST http://localhost:3006/api/iot/device/register \
  -H "Content-Type: application/json" \
  -d '{
    "capteur_id": "CAPTEUR_001",
    "type_capteur": "REMPLISSAGE",
    "conteneur_id": 1,
    "api_key": "your_device_api_key_here"
  }'
```

### Vérifier santé
```bash
curl http://localhost:3006/health
```

---

## 🧪 Validation Automatique

**Champs requis:**
- `capteur_id`: String, non-vide
- `conteneur_id`: Integer positif
- `type_capteur`: Doit être REMPLISSAGE, TEMPERATURE, POIDS, HUMIDITE ou GPS
- `valeur`: Number (float ou int)
- `unite`: String (%, °C, kg, etc)

**Champs optionnels:**
- `timestamp_capteur`: ISO 8601 (défaut: maintenant)
- `qualite_signal`: 0-100 (défaut: 100)
- `batterie`: 0-100 (défaut: 100)

---

## 🚀 Déploiement

```bash
# Via docker-compose (déjà configuré)
docker-compose up -d iot-service

# Vérifier démarrage
docker logs iot-service

# Test
curl http://localhost:3006/health
```

---

## 🔐 Sécurité

- **API Key:** Requis pour enregistrer nouveau capteur
- **Validation:** Toutes les données validées avant forwarding
- **Timeout:** 5s vers container-service
- **Error Handling:** Mesures acceptées même si container-service fail (202)

---

## 📊 Intégration Event-Driven

Quand une mesure est enregistrée:

1. IoT-Service reçoit → Valide
2. Forwarde à Container-Service
3. Container-Service retourne confirmation

**Phase 1 (Actuel):** Mesures stockées en DB, queryables via API  
**Phase 2 (Futur):** Alert-Service écoutera seuils, Analytics-Service accumulera stats

---

## 📚 Références

- [ARCHITECTURE.md](../../ARCHITECTURE.md) - Vue générale
- [QUICK_START.md](../../QUICK_START.md) - Guide démarrage
- Container-Service [README_CONTAINER.md](../container-service/README_CONTAINER.md)
