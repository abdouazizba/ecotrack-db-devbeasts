# Tour Service

The Tour Service manages collection tours, agent assignments, and collector (IoT device) tracking for the EcoTrack application.

## Features

- Tour scheduling and status management
- Agent assignment to tours with role-based duties (driver/collector)
- Collector device inventory with battery tracking
- Maintenance scheduling for IoT devices
- Analytics: tour statistics, collector status reports

## Setup

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
NODE_ENV=development
DB_HOST=tour-db
DB_PORT=5432
DB_NAME=ecotrack_tour
DB_USER=postgres
DB_PASSWORD=postgres
AUTH_SERVICE_URL=http://auth-service:3001
CONTAINER_SERVICE_URL=http://container-service:3002
SERVER_PORT=3003
```

### Database Migrations

```bash
npx sequelize-cli db:migrate
```

### Running the Service

```bash
npm start
```

Service runs on port 3003.

## API Endpoints

### Tours
- `POST /api/tournees` - Create new tour (Admin only)
- `GET /api/tournees` - List all tours
- `GET /api/tournees/:id` - Get tour by ID
- `PUT /api/tournees/:id` - Update tour (Admin only)
- `DELETE /api/tournees/:id` - Delete tour (Admin only)
- `GET /api/tournees/agent/:agentId` - Get tours for specific agent
- `GET /api/tournees/:id/stats` - Get tour statistics

### Agents on Tours
- `POST /api/tournees/:id/agents` - Add agent to tour (Admin only)
- `DELETE /api/tournees/:id/agents/:agentId` - Remove agent from tour (Admin only)

### Collectors (IoT Devices)
- `POST /api/collecteurs` - Create new collector (Admin only)
- `GET /api/collecteurs` - List all collectors
- `GET /api/collecteurs/:id` - Get collector by ID
- `GET /api/collecteurs/agent/:agentId` - Get collectors assigned to agent
- `GET /api/collecteurs/low-battery` - Get collectors with low battery
- `PUT /api/collecteurs/:id` - Update collector (Admin only)
- `DELETE /api/collecteurs/:id` - Delete collector (Admin only)
- `POST /api/collecteurs/:id/maintenance` - Record maintenance (Admin only)

## Database Schema

### TOURNEES Table
- `id`: UUID primary key
- `code`: Unique tour code
- `date`: Tour date
- `statut`: Status (PLANIFIÉE, EN_COURS, TERMINÉE, ANNULÉE)
- `heure_debut`: Scheduled start time
- `heure_fin`: Scheduled end time
- `distance_km`: Total distance
- `conteneurs_collectes`: Number of containers collected
- `notes`: Tour notes

### TOURNEE_AGENTS Table (M:N)
- `id`: UUID primary key
- `id_tournee`: Foreign key to TOURNEES
- `id_agent`: Agent UUID from auth-service
- `role`: CONDUCTEUR or COLLECTEUR
- `heure_debut_reel`: Actual start time
- `heure_fin_reelle`: Actual end time

### COLLECTEURS Table
- `id`: UUID primary key
- `code_collecteur`: Unique device code
- `id_agent`: Assigned agent UUID
- `statut`: Status (ACTIF, INACTIF, EN_MAINTENANCE)
- `model`: Device model
- `batterie_actuelle`: Current battery %
- `date_derniere_maintenance`: Last maintenance date
- `notes`: Device notes

## Dependencies

- **express**: Web framework
- **sequelize**: ORM for PostgreSQL
- **pg**: PostgreSQL driver
- **helmet**: Security headers
- **cors**: Cross-origin requests
- **express-validator**: Input validation
- **dotenv**: Environment variables
