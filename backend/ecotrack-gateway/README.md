# 🌍 EcoTrack API Gateway

**API Gateway for the EcoTrack Waste Management System**

A professional-grade API Gateway that routes requests to 4 independent microservices, providing a single entry point for the entire EcoTrack platform.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install axios helmet
```

### 2. Start the Gateway
```bash
npm start
```

### 3. Test Health Check
```bash
curl http://localhost:3000/health
```

**Gateway will be available at:** `http://localhost:3000`

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **[QUICK_START.md](./QUICK_START.md)** | ⚡ 5-minute setup guide |
| **[GATEWAY_README.md](./GATEWAY_README.md)** | 📖 Complete guide with all features |
| **[GATEWAY_STRUCTURE.md](./GATEWAY_STRUCTURE.md)** | 🏗️ Architecture & implementation details |
| **[ENDPOINTS_REFERENCE.md](./ENDPOINTS_REFERENCE.md)** | 📋 Complete API endpoints reference |
| **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** | 📝 Summary of changes from original |

---

## 🎯 What Does This Gateway Do?

```
Client (localhost:3000)
    ↓
  Gateway
    ├─→ Auth Service (3001)
    ├─→ Container Service (3002)
    ├─→ Tour Service (3003)
    └─→ Signal Service (3004)
```

The Gateway:
- ✅ Routes 40+ API endpoints
- ✅ Logs every request with timestamps
- ✅ Checks health of all services
- ✅ Handles errors gracefully
- ✅ Provides security headers
- ✅ Supports CORS

---

## 📡 Available Services

| Service | Port | Endpoints | Description |
|---------|------|-----------|-------------|
| **Auth** | 3001 | `/api/auth/*`, `/api/users/*` | User authentication & management |
| **Container** | 3002 | `/api/zones/*`, `/api/conteneurs/*`, `/api/mesures/*` | Waste container management |
| **Tour** | 3003 | `/api/tournees/*`, `/api/collecteurs/*` | Collection route management |
| **Signal** | 3004 | `/api/signalements/*` | Citizen reports system |

---

## 🏃 Running the Gateway

### Development Mode
```bash
npm start
```

### With Docker
```bash
docker build -t ecotrack-gateway .
docker run -p 3000:3000 ecotrack-gateway
```

### With Docker Compose (All Services)
```bash
cd ..
docker-compose up -d
```

---

## 🧪 Testing

### Health Check
```bash
curl http://localhost:3000/health | jq
```

### Test Auth Service
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","name":"Test","role":"CITOYEN"}'
```

### Automated Tests
```bash
# Bash
bash test-gateway.sh

# PowerShell
.\test-gateway.ps1
```

---

## 📂 File Structure

```
ecotrack-gateway/
├── src/
│   ├── app.js                 # Main Gateway application (225 lines)
│   ├── api/
│   │   ├── server.js          # Deprecated router
│   │   └── routes/            # Legacy routes (deprecated)
│   └── supabaseClient.js      # Optional Supabase integration
├── package.json               # Dependencies
├── Dockerfile                 # Docker build configuration
├── .env                      # Configuration (dev)
├── .env.example              # Configuration template
├── README.md                 # This file
├── QUICK_START.md           # 5-minute setup guide
├── GATEWAY_README.md        # Detailed documentation
├── GATEWAY_STRUCTURE.md     # Architecture details
├── ENDPOINTS_REFERENCE.md   # Complete API reference
├── IMPLEMENTATION_SUMMARY.md # Change summary
├── test-gateway.sh          # Bash test script
└── test-gateway.ps1         # PowerShell test script
```

---

## 🔧 Configuration

Set these environment variables in `.env`:

```env
# Server
NODE_ENV=development
GATEWAY_PORT=3000

# Service URLs
AUTH_SERVICE_URL=http://localhost:3001
CONTAINER_SERVICE_URL=http://localhost:3002
TOUR_SERVICE_URL=http://localhost:3003
SIGNAL_SERVICE_URL=http://localhost:3004

# Security
CORS_ORIGIN=*
```

---

## 📊 Key Features

### 1. Request Logging
Every request is logged with timestamp and response time:
```
[2024-01-15T10:30:45.123Z] GET /api/zones
[2024-01-15T10:30:45.234Z] GET /api/zones - 200 (50ms)
```

### 2. Health Checks
```bash
GET /health
```
Returns status of all services:
```json
{
  "status": "healthy",
  "services": {
    "auth": "healthy",
    "container": "healthy",
    "tour": "healthy",
    "signal": "healthy"
  }
}
```

### 3. Error Handling
- **503 Service Unavailable** - Service is down
- **404 Not Found** - Endpoint doesn't exist
- **500 Server Error** - Unexpected error

### 4. Security
- Helmet.js for security headers
- CORS support
- Request body size limits (10MB)

---

## 🚀 Next Steps

1. **Start the Gateway:**
   ```bash
   npm start
   ```

2. **Verify it's working:**
   ```bash
   curl http://localhost:3000/health
   ```

3. **See all endpoints:**
   - Open [ENDPOINTS_REFERENCE.md](./ENDPOINTS_REFERENCE.md)

4. **Test the services:**
   ```bash
   # Register a user
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123","name":"John","role":"CITOYEN"}'
   ```

---

## 📞 Troubleshooting

### Error: "Cannot find module 'axios'"
```bash
npm install axios
```

### Error: "Service unavailable"
Check that all services are running:
```bash
curl http://localhost:3001/health  # Auth
curl http://localhost:3002/health  # Container
curl http://localhost:3003/health  # Tour
curl http://localhost:3004/health  # Signal
```

### Port 3000 already in use
```bash
# Change port in .env
GATEWAY_PORT=3001
```

---

## 📚 Learn More

For detailed information, see:
- [QUICK_START.md](./QUICK_START.md) - Start in 5 minutes
- [GATEWAY_README.md](./GATEWAY_README.md) - Complete guide
- [ENDPOINTS_REFERENCE.md](./ENDPOINTS_REFERENCE.md) - All API endpoints
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Technical details

---

## 🎯 Summary

The **EcoTrack API Gateway** is now:
- ✅ Fully functional with 40+ endpoints
- ✅ Production-ready with proper error handling
- ✅ Well-documented with guides and examples
- ✅ Tested with automated test scripts
- ✅ Deployable with Docker

**Status:** 🟢 READY TO USE

---

**Start the gateway now:**
```bash
npm start
```

**Happy coding! 🚀**
