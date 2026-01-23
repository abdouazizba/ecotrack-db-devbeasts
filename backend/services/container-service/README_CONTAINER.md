# Container Service

The Container Service manages waste containers, zones, and measurement data for the EcoTrack application.

## Features

- Zone management with geographic data (GeoJSON coordinates)
- Container lifecycle management with status tracking
- Real-time measurement data collection (fill rates, temperature, battery, signal)
- Analytics: average fill rates, containers needing service
- Role-based access control (Admin, Agent, Citoyen)

## Setup

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
NODE_ENV=development
DB_HOST=container-db
DB_PORT=5432
DB_NAME=ecotrack_container
DB_USER=postgres
DB_PASSWORD=postgres
AUTH_SERVICE_URL=http://auth-service:3001
SERVER_PORT=3002
```

### Database Migrations

Run migrations to create tables:

```bash
npx sequelize-cli db:migrate
```

### Running the Service

```bash
npm start
```

The service will start on port 3002 and automatically perform database migrations.

## API Endpoints

### Zones
- `GET /api/zones` - List all zones
- `GET /api/zones/:id` - Get zone by ID
- `POST /api/zones` - Create new zone (Admin only)
- `PUT /api/zones/:id` - Update zone (Admin only)
- `DELETE /api/zones/:id` - Delete zone (Admin only)

### Containers
- `GET /api/conteneurs` - List all containers
- `GET /api/conteneurs/:id` - Get container by ID
- `POST /api/conteneurs` - Create new container (Admin only)
- `PUT /api/conteneurs/:id` - Update container (Admin only)
- `DELETE /api/conteneurs/:id` - Delete container (Admin only)
- `GET /api/conteneurs/needing-service` - Get containers needing service

### Measurements
- `GET /api/mesures` - List all measurements
- `GET /api/mesures/container/:containerId` - Get measurements for a container
- `POST /api/mesures` - Record new measurement (Agent only)
- `GET /api/mesures/analytics/average-fill` - Get average fill rates by zone

## Database Schema

### ZONES Table
- `id`: UUID primary key
- `nom`: Zone name
- `code_zone`: Unique zone code
- `geometrie`: GeoJSON geometry
- `population_estimee`: Estimated population
- `created_at`, `updated_at`: Timestamps

### CONTENEURS Table
- `id`: UUID primary key
- `code_conteneur`: Unique container code
- `type_conteneur`: Type (PLASTIQUE, METAL, VERRE, PAPIER)
- `capacité`: Capacity in liters
- `latitude`, `longitude`: Coordinates
- `statut`: Status (ACTIF, MAINTENANCE, DESACTIF)
- `id_zone`: Foreign key to ZONES
- `created_at`, `updated_at`: Timestamps

### MESURES Table
- `id`: UUID primary key
- `date_mesure`: Measurement timestamp
- `taux_remplissage`: Fill rate (0-100)
- `temperature`: Temperature in Celsius
- `batterie`: Battery percentage
- `signal_force`: Signal strength
- `id_conteneur`: Foreign key to CONTENEURS
- `created_at`, `updated_at`: Timestamps

## Dependencies

- **express**: Web framework
- **sequelize**: ORM for PostgreSQL
- **pg**: PostgreSQL driver
- **helmet**: Security headers
- **cors**: Cross-origin requests
- **express-validator**: Input validation
- **dotenv**: Environment variables

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": []
}
```

## Authentication

All protected routes require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

Tokens are issued by the Auth Service. Role-based access control is enforced on protected endpoints.
