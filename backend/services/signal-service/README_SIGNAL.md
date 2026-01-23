# Signal Service

The Signal Service handles citizen reports and complaints about waste container issues in the EcoTrack application.

## Features

- Signal creation and management (citizen reports)
- Multi-type signal support (full, damaged, odor, overflow, other)
- Priority-based routing and sorting
- Location tracking with coordinates and photos
- Status workflow (open, in-progress, closed, rejected)
- Statistics and reporting by type, priority, and status
- Container-specific signal history

## Setup

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
NODE_ENV=development
DB_HOST=signal-db
DB_PORT=5432
DB_NAME=ecotrack_signal
DB_USER=postgres
DB_PASSWORD=postgres
AUTH_SERVICE_URL=http://auth-service:3001
CONTAINER_SERVICE_URL=http://container-service:3002
SERVER_PORT=3004
```

### Database Migrations

```bash
npx sequelize-cli db:migrate
```

### Running the Service

```bash
npm start
```

Service runs on port 3004.

## API Endpoints

### Signals
- `POST /api/signalements` - Create new signal (Citoyen only)
- `GET /api/signalements` - List all signals with filters
- `GET /api/signalements/open` - Get all open signals
- `GET /api/signalements/:id` - Get signal by ID
- `PUT /api/signalements/:id` - Update signal (Admin only)
- `DELETE /api/signalements/:id` - Delete signal (Admin only)

### Citizen Reports
- `GET /api/signalements/citoyen/:citoyenId` - Get signals reported by citizen

### Container Reports
- `GET /api/signalements/container/:containerId` - Get all signals for a container

### Signal Status Management
- `POST /api/signalements/:id/in-progress` - Mark signal as in-progress (Admin/Agent)
- `POST /api/signalements/:id/close` - Close signal with resolution notes (Admin/Agent)
- `POST /api/signalements/:id/reject` - Reject signal with reason (Admin only)

## Database Schema

### SIGNALEMENTS Table
- `id`: UUID primary key
- `type`: Signal type enum (CONTENEUR_PLEIN, CONTENEUR_ENDOMMAGÉ, MAUVAISE_ODEUR, DÉBORDEMENT, AUTRE)
- `description`: Detailed report text
- `statut`: Status enum (OUVERT, EN_COURS_DE_TRAITEMENT, FERMÉ, REJETÉ)
- `priorite`: Priority level enum (BASSE, NORMALE, HAUTE, CRITIQUE)
- `id_conteneur`: Foreign key to container (from container-service)
- `id_utilisateur`: Foreign key to citizen (from auth-service)
- `latitude`, `longitude`: Geographic coordinates
- `photo_url`: Link to uploaded image
- `date_resolution`: When signal was resolved
- `notes_resolution`: Resolution details
- `created_at`, `updated_at`: Timestamps

## Query Parameters

### List Signals
- `type`: Filter by signal type
- `statut`: Filter by status
- `priorite`: Filter by priority
- `idConteneur`: Filter by container
- `idUtilisateur`: Filter by reporter

## Response Format

```json
{
  "success": true,
  "data": {},
  "count": 0,
  "message": "Operation completed"
}
```

## Signal Types

- **CONTENEUR_PLEIN**: Container is full, needs immediate collection
- **CONTENEUR_ENDOMMAGÉ**: Container is broken or damaged
- **MAUVAISE_ODEUR**: Strong odor from container
- **DÉBORDEMENT**: Waste is overflowing
- **AUTRE**: Other issues

## Priority Levels

- **BASSE**: Low priority, can be addressed in regular schedule
- **NORMALE**: Normal priority
- **HAUTE**: High priority, should be addressed soon
- **CRITIQUE**: Critical issue, immediate action required

## Dependencies

- **express**: Web framework
- **sequelize**: ORM for PostgreSQL
- **pg**: PostgreSQL driver
- **helmet**: Security headers
- **cors**: Cross-origin requests
- **express-validator**: Input validation
- **dotenv**: Environment variables
