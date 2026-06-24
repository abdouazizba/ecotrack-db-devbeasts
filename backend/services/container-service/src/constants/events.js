/**
 * EVENT DEFINITIONS FOR ECOTRACK MICROSERVICES
 * Central registry of all RabbitMQ events
 * 
 * Event Flow:
 * 1. container.created → Published when container is created
 * 2. zone.created → Published when zone is created
 * 3. measurement.created → Published when measurement is recorded
 * 4. container.maintenance_needed → Published when fill% > 80%
 * 5. signal.created → Published when signal/report is filed
 * 
 * Pattern: domain.action
 */

const EVENTS = {
  // CONTAINER EVENTS
  CONTAINER_CREATED: 'container.created',
  CONTAINER_UPDATED: 'container.updated',
  CONTAINER_DELETED: 'container.deleted',
  CONTAINER_STATUS_CHANGED: 'container.status_changed',
  CONTAINER_ZONE_CHANGED: 'container.zone_changed',
  CONTAINER_MAINTENANCE_NEEDED: 'container.maintenance_needed',
  
  // ZONE EVENTS
  ZONE_CREATED: 'zone.created',
  ZONE_UPDATED: 'zone.updated',
  ZONE_DELETED: 'zone.deleted',
  
  // MEASUREMENT EVENTS
  MEASUREMENT_CREATED: 'measurement.created',
  MEASUREMENT_ALERT: 'measurement.alert',
  
  // SIGNAL/REPORT EVENTS
  SIGNAL_CREATED: 'signal.created',
  SIGNAL_UPDATED: 'signal.updated',
  SIGNAL_CLOSED: 'signalement.closed',
  SIGNAL_REJECTED: 'signalement.rejected',
  
  // USER EVENTS (already exists)
  USER_CREATED: 'user.created',
};

/**
 * Event payload schemas for validation
 */
const EVENT_SCHEMAS = {
  [EVENTS.CONTAINER_CREATED]: {
    required: ['id', 'code_conteneur', 'type_conteneur', 'id_zone'],
    optional: ['capacite', 'latitude', 'longitude', 'statut'],
  },
  
  [EVENTS.ZONE_CREATED]: {
    required: ['id', 'nom', 'code_zone'],
    optional: ['latitude', 'longitude', 'population_estimee', 'description'],
  },
  
  [EVENTS.MEASUREMENT_CREATED]: {
    required: ['id', 'id_conteneur', 'taux_remplissage'],
    optional: ['temperature', 'batterie', 'signal_force'],
  },
  
  [EVENTS.CONTAINER_MAINTENANCE_NEEDED]: {
    required: ['id_conteneur', 'taux_remplissage'],
    optional: ['reason', 'priority', 'alert_type'],
  },
  
  [EVENTS.SIGNAL_CREATED]: {
    required: ['id', 'id_conteneur', 'type_signalement'],
    optional: ['id_citoyen', 'description', 'localisation'],
  },
};

module.exports = {
  EVENTS,
  EVENT_SCHEMAS,
};
