# 📚 EcoTrack API Documentation

## Quick Access

### Swagger UI (Interactive)
```
http://localhost:3000/api-docs
```
- Full interactive documentation
- Try endpoints directly from the browser
- See request/response examples
- Test with real data

### Raw Swagger Spec
```
http://localhost:3000/swagger-spec
```
- YAML format
- Copy-paste into Postman/Insomnia if needed

---

## Before You Start

1. **Start Docker services first:**
   ```bash
   cd backend
   docker-compose up -d
   ```

2. **Wait 30 seconds** for all services to be healthy

3. **Verify gateway is running:**
   ```bash
   curl http://localhost:3000/health
   ```
   You should see all services marked as "healthy"

4. **Open Swagger UI:**
   ```
   http://localhost:3000/api-docs
   ```

---

## 🧪 Testing the API

### Step 1: Register & Login
1. In Swagger UI, find **Authentication** section
2. Click **POST /auth/register**
3. Enter test credentials:
   ```json
   {
     "email": "test@ecotrack.com",
     "password": "Test@12345"
   }
   ```
4. Click "Execute" → Copy the `accessToken`

### Step 2: Authorize in Swagger
1. Click the green "Authorize" button at top of page
2. Paste token in format: `Bearer YOUR_TOKEN_HERE`
3. Click "Authorize" then "Close"

### Step 3: Test Protected Endpoints
1. Now you can test any protected endpoint
2. Try **GET /users** to see all users
3. Try **GET /container/conteneurs** to see all containers

---

## 📝 API Structure

### Authentication (No auth needed)
- `POST /auth/register` - Create account
- `POST /auth/login` - Get token
- `POST /auth/logout` - Logout
- `POST /auth/verify` - Check token validity
- `POST /auth/refresh-token` - Get new token

### Container Management (Auth required)
- `GET /container/conteneurs` - List all containers
- `POST /container/conteneurs` - Create container
- `GET /container/conteneurs/{id}` - Get details
- `PUT /container/conteneurs/{id}` - Update container
- `DELETE /container/conteneurs/{id}` - Delete container

### Measurements (Auth required)
- `POST /container/mesures` - Record measurement
- `GET /container/mesures/conteneur/{id}` - Get measurements
- `GET /container/mesures/conteneur/{id}/latest` - Latest measurement
- `GET /container/mesures/conteneur/{id}/stats` - Statistics

### Tours/Routes (Auth required)
- `GET /tour/tournees` - List all tours
- `POST /tour/tournees` - Create tour
- `GET /tour/tournees/{id}` - Get tour details
- `POST /tour/tournees/{id}/agents` - Assign agent to tour

### Citizen Reports (Auth required)
- `POST /signal/signalements` - Report problem
- `GET /signal/signalements` - Get all reports
- `GET /signal/signalements/open` - Get open reports
- `POST /signal/signalements/{id}/in-progress` - Mark as being fixed
- `POST /signal/signalements/{id}/close` - Mark as resolved

### Users (Auth required)
- `GET /users` - List users
- `GET /users/{id}` - Get user details
- `PUT /users/{id}` - Update user
- `DELETE /users/{id}` - Delete user

### IoT Sensors (Public)
- `POST /iot/sensor/data` - Send sensor reading
- `POST /iot/device/register` - Register new sensor
- `GET /iot/device/{capteur_id}` - Get sensor info

---

## 🔑 Test User Accounts

The system comes pre-seeded with 9 test users. Use any of these to login:

```
Email: aminata.ba@ecotrack.com
Password: password123

Email: jean.martin@ecotrack.com
Password: password456

Email: christophe.tshisekedi@ecotrack.com
Password: agentpass123
```

(See `backend/services/auth/src/seeds/seed.js` for full list)

---

## 📊 Common Workflows

### Scenario 1: Create a Container & Take Measurement
1. **POST /container/zones** - Create a zone first
2. **POST /container/conteneurs** - Create container in that zone
3. **POST /container/mesures** - Add measurement for that container
4. **GET /container/conteneurs/needs-service** - Check if needs emptying

### Scenario 2: Report a Problem & Track Resolution
1. **POST /signal/signalements** - Citizen reports overflowing container
2. **GET /signal/signalements/open** - Admin sees open reports
3. **POST /signal/signalements/{id}/in-progress** - Agent marks as being fixed
4. **POST /signal/signalements/{id}/close** - Mark as resolved

### Scenario 3: Plan a Collection Tour
1. **GET /container/conteneurs/needs-service** - See which containers are full
2. **POST /tour/tournees** - Create tour for today
3. **POST /tour/tournees/{id}/agents** - Assign agent
4. **GET /tour/tournees/{id}/stats** - Track progress

---

## 🐛 Troubleshooting

**Q: Swagger UI shows "Failed to load"?**
A: Gateway might not be running. Check: `docker-compose ps` and `docker-compose logs gateway`

**Q: Getting 401 Unauthorized?**
A: Token might be expired or missing. 
- Login again with `/auth/login`
- Use new token in Authorize
- Remember to use format: `Bearer TOKEN_HERE`

**Q: Endpoints returning 504 Bad Gateway?**
A: A service might be down.
- Check: `curl http://localhost:3000/health`
- Restart if needed: `docker-compose restart`

**Q: Port 3000 already in use?**
A: Change port in `.env`: `GATEWAY_PORT=3001`

---

## 📚 More Documentation

- **Architecture:** See `backend/ARCHITECTURE.md`
- **Quick Start:** See `backend/QUICK_START.md`
- **Event-Driven:** See `.github/EVENT_DRIVEN_ARCHITECTURE.md`

---

## 💡 Tips

1. **Copy entire responses** by clicking the copy button in Swagger UI
2. **Use the "Try it out" button** to populate example JSON
3. **Check response codes** - 200/201 = success, 400 = bad input, 401 = auth, 404 = not found, 500 = error
4. **Enable request/response logging** in browser DevTools (Network tab)

---

**Created:** April 2026  
**Last Updated:** April 15, 2026
