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
    console.log('🎧 Container Event Listener: Initializing subscriptions...\n');

    this.sequelize = sequelize;

    const channel = await EventService.initialize();

    if (!channel) {
      console.warn('⚠️  Container Event Listener: RabbitMQ unavailable — event subscriptions skipped\n');
      return;
    }

    console.log('   ✓ EventService initialized');

    await this.subscribeToSignalCreated();
    await this.subscribeToMeasurementAlerts();
    await this.subscribeToSignalClosed();

    console.log('✅ Container Event Listener: All subscriptions active\n');
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
            const { id_conteneur, type, id_utilisateur } = message;

            console.log(`\n📢 [SIGNAL RECEIVED]`);
            console.log(`   Container: ${id_conteneur}`);
            console.log(`   Type: ${type}`);
            console.log(`   Reporter: ${id_utilisateur || 'IoT/Anonymous'}`);
            console.log(`   ⏰ ${new Date().toLocaleTimeString()}`);

            // If signal indicates the container is full or overflowing, mark it for maintenance
            if (['CONTENEUR_PLEIN', 'DÉBORDEMENT'].includes(type)) {
              const Conteneur = this.sequelize.models.Conteneur;
              const [updated] = await Conteneur.update(
                { statut: 'maintenance' },
                { where: { id: id_conteneur, statut: 'actif' } }
              );
              if (updated) {
                console.log(`   ✓ Container ${id_conteneur} → statut "maintenance" (signal: ${type})`);
              }
            }
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
  /**
   * Listen for signalement.closed / signalement.rejected events
   * When all open signalements for a container are resolved, reset status to 'actif'
   */
  static async subscribeToSignalClosed() {
    try {
      const handler = async (message) => {
        try {
          const { id_conteneur } = message;
          if (!id_conteneur) return;

          const Conteneur = this.sequelize.models.Conteneur;
          const conteneur = await Conteneur.findByPk(id_conteneur);
          if (!conteneur || conteneur.statut !== 'maintenance') return;

          const axios = require('axios');
          const SIGNAL_SERVICE_URL = process.env.SIGNAL_SERVICE_URL || 'http://signal-service:3004';

          let stillOpen = 0;
          try {
            const { data } = await axios.get(
              `${SIGNAL_SERVICE_URL}/api/signalements/container/${id_conteneur}`,
              { timeout: 5000 }
            );
            const signalements = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
            stillOpen = signalements.filter(
              (s) => s.statut === 'OUVERT' || s.statut === 'EN_COURS_DE_TRAITEMENT'
            ).length;
          } catch {
            return;
          }

          if (stillOpen === 0) {
            await conteneur.update({ statut: 'actif' });
            console.log(`\n✅ [CONTENEUR RÉACTIVÉ]`);
            console.log(`   ${conteneur.code_conteneur} → statut "actif" (tous signalements résolus)`);
            console.log(`   ⏰ ${new Date().toLocaleTimeString()}`);
          }
        } catch (error) {
          console.error('   ❌ Error processing signal closed event:', error);
          throw error;
        }
      };

      await EventService.subscribeEvent('signalement.closed', 'ContainerListener_signalClosed', handler);
      await EventService.subscribeEvent('signalement.rejected', 'ContainerListener_signalRejected', handler);

      console.log('   ✓ Subscribed to signalement.closed/rejected events (auto-reset container status)');
    } catch (error) {
      console.error('   ❌ Failed to subscribe to signal closed/rejected:', error);
    }
  }
}

module.exports = ContainerEventListener;
