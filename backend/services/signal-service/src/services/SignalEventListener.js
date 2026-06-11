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
      
      // Auto-create CONTENEUR_PLEIN signal when measurement.created reports fill > 85%
      await this.subscribeToMeasurementCreated();

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

            // Check if signal already exists for this container (not yet resolved)
            const existingSignal = await Signalement.findOne({
              where: {
                id_conteneur,
                statut: ['OUVERT', 'EN_COURS_DE_TRAITEMENT'],
              },
            });

            if (!existingSignal) {
              const signal = await Signalement.create({
                id_conteneur,
                type: 'AUTRE',
                description: `Alerte automatique IoT : conteneur à ${taux_remplissage.toFixed(1)}% de remplissage. ${reason || 'Maintenance nécessaire.'}`,
                statut: 'OUVERT',
                priorite: taux_remplissage > 95 ? 'CRITIQUE' : 'HAUTE',
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
              const signal = await Signalement.create({
                id_conteneur,
                type: 'DÉBORDEMENT',
                description: `Alerte automatique IoT : débordement imminent détecté à ${taux_remplissage.toFixed(1)}%. Collecte urgente recommandée.`,
                statut: 'OUVERT',
                priorite: 'CRITIQUE',
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
  /**
   * Listen for measurement.created events (published by container-service after each INSERT)
   * Auto-create a CONTENEUR_PLEIN signal when fill > 85% — with deduplication
   */
  static async subscribeToMeasurementCreated() {
    try {
      await EventService.subscribeEvent(
        'measurement.created',
        'SignalListener_measurementCreated',
        async (message) => {
          try {
            const { id_conteneur, taux_remplissage } = message;
            if (!id_conteneur || taux_remplissage === undefined) return;
            if (taux_remplissage <= 85) return;

            const Signalement = this.sequelize.models.Signalement;

            // Deduplication: skip if there's already an open CONTENEUR_PLEIN for this container
            const existing = await Signalement.findOne({
              where: {
                id_conteneur,
                type: 'CONTENEUR_PLEIN',
                statut: ['OUVERT', 'EN_COURS_DE_TRAITEMENT'],
              },
            });

            if (existing) return;

            const priorite = taux_remplissage >= 95 ? 'CRITIQUE' : taux_remplissage >= 90 ? 'HAUTE' : 'NORMALE';

            const signal = await Signalement.create({
              id_conteneur,
              type: 'CONTENEUR_PLEIN',
              description: `Signalement automatique IoT : conteneur à ${taux_remplissage.toFixed(1)}% de remplissage. Collecte requise.`,
              statut: 'OUVERT',
              priorite,
              id_utilisateur: null,
            });

            console.log(`\n📌 [AUTO CONTENEUR_PLEIN]`);
            console.log(`   Signal ID : ${signal.id}`);
            console.log(`   Container : ${id_conteneur}`);
            console.log(`   Taux      : ${taux_remplissage.toFixed(1)}%  →  Priorité ${priorite}`);
            console.log(`   ⏰ ${new Date().toLocaleTimeString()}`);
          } catch (error) {
            console.error('   ❌ Error creating CONTENEUR_PLEIN signal:', error);
            throw error;
          }
        }
      );

      console.log('   ✓ Subscribed to measurement.created events (auto-signal fill > 85%)');
    } catch (error) {
      console.error('   ❌ Failed to subscribe to measurement.created:', error);
    }
  }
}

module.exports = SignalEventListener;
