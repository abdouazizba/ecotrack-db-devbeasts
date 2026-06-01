/**
 * SIGNAL SERVICE EVENT LISTENER
 * Subscribes to cross-service events and creates automatic signals
 * 
 * Listens for:
 * - container.maintenance_needed → Auto-create maintenance signal
 * - measurement.alert → Auto-create alert signal
 */

const EventService = require('./EventService');

class SignalEventListener {
  /**
   * Initialize all event subscriptions
   */
  static async initialize(sequelize) {
    try {
      console.log('🎧 Signal Event Listener: Initializing subscriptions...\n');
      
      this.sequelize = sequelize;
      
      // Initialize EventService first (RabbitMQ connection)
      await EventService.initialize();
      console.log('   ✓ EventService initialized');
      
      // Subscribe to container maintenance events
      await this.subscribeToMaintenanceAlerts();
      
      // Subscribe to measurement alerts
      await this.subscribeToMeasurementAlerts();
      
      console.log('✅ Signal Event Listener: All subscriptions active\n');
    } catch (error) {
      console.error('❌ Signal Event Listener initialization error:', error);
      throw error;
    }
  }

  /**
   * Listen for container.maintenance_needed events
   * Auto-create a signal for maintenance
   */
  static async subscribeToMaintenanceAlerts() {
    try {
      await EventService.subscribeEvent(
        'container.maintenance_needed',
        'SignalListener_maintenanceAlert',
        async (message) => {
          try {
            const { id_conteneur, taux_remplissage, reason } = message;
            const Signalement = this.sequelize.models.Signalement;
            
            // Check if signal already exists for this container
            const existingSignal = await Signalement.findOne({
              where: {
                id_conteneur,
                statut: ['ouvert', 'en_cours'], // Not closed
              },
            });
            
            if (!existingSignal) {
              // Create new signal
              const signal = await Signalement.create({
                id_conteneur,
                type_signalement: 'MAINTENANCE_REQUIRED',
                description: `Automatic alert: Container is ${taux_remplissage.toFixed(1)}% full. ${reason || 'Maintenance needed.'}`,
                localisation: 'AUTO_GENERATED',
                statut: 'ouvert',
                priorite: taux_remplissage > 95 ? 'URGENTE' : 'NORMALE',
                created_at: new Date(),
              });
              
              console.log(`\n📌 [AUTO-SIGNAL CREATED]`);
              console.log(`   Signal ID: ${signal.id}`);
              console.log(`   Container: ${id_conteneur}`);
              console.log(`   Fill Level: ${taux_remplissage.toFixed(1)}%`);
              console.log(`   Priority: ${signal.priorite}`);
              console.log(`   ⏰ ${new Date().toLocaleTimeString()}`);
            }
          } catch (error) {
            console.error('   ❌ Error creating maintenance signal:', error);
            throw error; // NACK for retry
          }
        }
      );
      
      console.log('   ✓ Subscribed to container.maintenance_needed events');
    } catch (error) {
      console.error('   ❌ Failed to subscribe to maintenance alerts:', error);
    }
  }

  /**
   * Listen for measurement.alert events
   * Auto-create a signal for high fill level
   */
  static async subscribeToMeasurementAlerts() {
    try {
      await EventService.subscribeEvent(
        'measurement.alert',
        'SignalListener_measurementAlert',
        async (message) => {
          try {
            const { id_conteneur, taux_remplissage, alert_type } = message;
            const Signalement = this.sequelize.models.Signalement;
            
            if (alert_type === 'HIGH_FILL_LEVEL' && taux_remplissage > 85) {
              // Create overflow alert signal
              const signal = await Signalement.create({
                id_conteneur,
                type_signalement: 'OVERFLOW_ALERT',
                description: `Automatic alert: Container overflow detected at ${taux_remplissage.toFixed(1)}%. Immediate collection recommended.`,
                localisation: 'AUTO_GENERATED',
                statut: 'ouvert',
                priorite: 'URGENTE',
                created_at: new Date(),
              });
              
              console.log(`\n🚨 [OVERFLOW ALERT CREATED]`);
              console.log(`   Signal ID: ${signal.id}`);
              console.log(`   Container: ${id_conteneur}`);
              console.log(`   Fill Level: ${taux_remplissage.toFixed(1)}%`);
              console.log(`   Status: URGENT`);
              console.log(`   ⏰ ${new Date().toLocaleTimeString()}`);
            }
          } catch (error) {
            console.error('   ❌ Error creating overflow signal:', error);
            throw error;
          }
        }
      );
      
      console.log('   ✓ Subscribed to measurement.alert events');
    } catch (error) {
      console.error('   ❌ Failed to subscribe to measurement alerts:', error);
    }
  }
}

module.exports = SignalEventListener;
