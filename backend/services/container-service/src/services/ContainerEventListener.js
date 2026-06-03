const { EVENTS } = require('../constants/events');
const EventService = require('./EventService');

/**
 * CONTAINER SERVICE EVENT LISTENER
 * Subscribes to cross-service events and reacts accordingly
 * 
 * Listens for:
 * - signal.created → Create automatic maintenance record
 * - measurement.alert → Update container status to "maintenance"
 */

class ContainerEventListener {
  /**
   * Initialize all event subscriptions
   */
  static async initialize(sequelize) {
    try {
      console.log('🎧 Container Event Listener: Initializing subscriptions...\n');

      this.sequelize = sequelize;

      // Initialize EventService first (RabbitMQ connection)
      await EventService.initialize();
      console.log('   ✓ EventService initialized');

      // Subscribe to signal.created events
      await this.subscribeToSignalCreated();

      // Subscribe to measurement alerts
      await this.subscribeToMeasurementAlerts();

      console.log('✅ Container Event Listener: All subscriptions active\n');
    } catch (error) {
      console.error('❌ Container Event Listener initialization error:', error);
      throw error;
    }
  }

  /**
   * Listen for signal.created events
   * When a signal is created for a container, log it for audit
   */
  static async subscribeToSignalCreated() {
    try {
      await EventService.subscribeEvent(
        EVENTS.SIGNAL_CREATED,
        'ContainerListener_signalCreated',
        async (message) => {
          try {
            const { id_conteneur, type_signalement, id_citoyen } = message;
            
            console.log(`\n📢 [SIGNAL RECEIVED]`);
            console.log(`   Container: ${id_conteneur}`);
            console.log(`   Type: ${type_signalement}`);
            console.log(`   Reporter: ${id_citoyen || 'Anonymous'}`);
            console.log(`   ⏰ ${new Date().toLocaleTimeString()}`);
            
            // TODO: Add logic to update container status if needed
            // e.g., if signal is about overflow, mark container as "plein"
            
          } catch (error) {
            console.error('   ❌ Error processing signal event:', error);
            throw error; // NACK the message for retry
          }
        }
      );
      
      console.log('   ✓ Subscribed to signal.created events');
    } catch (error) {
      console.error('   ❌ Failed to subscribe to signal.created:', error);
    }
  }

  /**
   * Listen for measurement.alert events
   * When a measurement alert is triggered (fill% > 80%), update container status
   */
  static async subscribeToMeasurementAlerts() {
    try {
      await EventService.subscribeEvent(
        EVENTS.MEASUREMENT_ALERT,
        'ContainerListener_measurementAlert',
        async (message) => {
          try {
            const { id_conteneur, taux_remplissage, alert_type } = message;

            console.log(`\n⚠️ [MAINTENANCE ALERT]`);
            console.log(`   Container: ${id_conteneur}`);
            console.log(`   Fill Level: ${taux_remplissage.toFixed(1)}%`);
            console.log(`   Alert Type: ${alert_type}`);
            console.log(`   ⏰ ${new Date().toLocaleTimeString()}`);

            // Passer le conteneur en maintenance si le taux dépasse 90%
            if (taux_remplissage >= 90) {
              const Conteneur = this.sequelize.models.Conteneur;
              const [updated] = await Conteneur.update(
                { statut: 'maintenance' },
                { where: { id: id_conteneur, statut: 'actif' } }
              );
              if (updated) {
                console.log(`   ✓ Container ${id_conteneur} → statut "maintenance"`);
              }
            }
          } catch (error) {
            console.error('   ❌ Error processing measurement alert:', error);
            throw error;
          }
        }
      );
      
      console.log('   ✓ Subscribed to measurement.alert events');
    } catch (error) {
      console.error('   ❌ Failed to subscribe to measurement.alert:', error);
    }
  }
}

module.exports = ContainerEventListener;
