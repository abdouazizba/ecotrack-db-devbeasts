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

      // Auto-assign OUVERT signalements when a tournée starts
      await this.subscribeToTourneeStarted();

      // Auto-close signalements linked to a completed tournée
      await this.subscribeToTourneeCompleted();

      // Auto-close signalements when a container is deleted or retired
      await this.subscribeToContainerLifecycle();

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
              let latitude = null, longitude = null;
              try {
                const axios = require('axios');
                const CONTAINER_URL = process.env.CONTAINER_SERVICE_URL || 'http://container-service:3002';
                const { data } = await axios.get(`${CONTAINER_URL}/internal/containers/${id_conteneur}`, { timeout: 5000 });
                latitude = data.latitude || null;
                longitude = data.longitude || null;
              } catch {}

              const signal = await Signalement.create({
                id_conteneur,
                type: 'AUTRE',
                description: `Alerte automatique IoT : conteneur à ${taux_remplissage.toFixed(1)}% de remplissage. ${reason || 'Maintenance nécessaire.'}`,
                statut: 'OUVERT',
                priorite: taux_remplissage > 95 ? 'CRITIQUE' : 'HAUTE',
                latitude,
                longitude,
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
              let latitude = null, longitude = null;
              try {
                const axios = require('axios');
                const CONTAINER_URL = process.env.CONTAINER_SERVICE_URL || 'http://container-service:3002';
                const { data } = await axios.get(`${CONTAINER_URL}/internal/containers/${id_conteneur}`, { timeout: 5000 });
                latitude = data.latitude || null;
                longitude = data.longitude || null;
              } catch {}

              const signal = await Signalement.create({
                id_conteneur,
                type: 'DÉBORDEMENT',
                description: `Alerte automatique IoT : débordement imminent détecté à ${taux_remplissage.toFixed(1)}%. Collecte urgente recommandée.`,
                statut: 'OUVERT',
                priorite: 'CRITIQUE',
                latitude,
                longitude,
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
            const { id_conteneur, taux_remplissage, id_zone } = message;
            if (!id_conteneur || taux_remplissage === undefined) return;
            if (taux_remplissage <= 85) return;

            const Signalement = this.sequelize.models.Signalement;

            const existing = await Signalement.findOne({
              where: {
                id_conteneur,
                type: 'CONTENEUR_PLEIN',
                statut: ['OUVERT', 'EN_COURS_DE_TRAITEMENT'],
              },
            });

            if (existing) return;

            // Fetch container coordinates from container-service
            let latitude = null, longitude = null;
            try {
              const axios = require('axios');
              const CONTAINER_URL = process.env.CONTAINER_SERVICE_URL || 'http://container-service:3002';
              const { data } = await axios.get(`${CONTAINER_URL}/internal/containers/${id_conteneur}`, { timeout: 5000 });
              latitude = data.latitude || null;
              longitude = data.longitude || null;
            } catch {}

            const priorite = taux_remplissage >= 95 ? 'CRITIQUE' : taux_remplissage >= 90 ? 'HAUTE' : 'NORMALE';

            const signal = await Signalement.create({
              id_conteneur,
              type: 'CONTENEUR_PLEIN',
              description: `Signalement automatique IoT : conteneur à ${taux_remplissage.toFixed(1)}% de remplissage. Collecte requise.`,
              statut: 'OUVERT',
              priorite,
              id_utilisateur: null,
              id_zone: id_zone || null,
              latitude,
              longitude,
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
  /**
   * Listen for tournee.started events (published by tour-service)
   * Auto-assign OUVERT signalements that share the same id_tournee (linked via seed/manual)
   * and mark them EN_COURS_DE_TRAITEMENT
   */
  static async subscribeToTourneeStarted() {
    try {
      await EventService.subscribeEvent(
        'tournee.started',
        'SignalListener_tourneeStarted',
        async (message) => {
          try {
            const { id_tournee, code } = message;
            if (!id_tournee) return;

            const Signalement = this.sequelize.models.Signalement;

            const openSignals = await Signalement.findAll({
              where: { id_tournee, statut: 'OUVERT' },
            });

            if (openSignals.length === 0) return;

            let updated = 0;
            for (const sig of openSignals) {
              await sig.update({ statut: 'EN_COURS_DE_TRAITEMENT' });
              updated++;
            }

            console.log(`\n🚀 [TOURNÉE DÉMARRÉE → SIGNALEMENTS]`);
            console.log(`   Tournée : ${code || id_tournee}`);
            console.log(`   ${updated} signalement(s) passé(s) EN_COURS_DE_TRAITEMENT`);
            console.log(`   ⏰ ${new Date().toLocaleTimeString()}`);
          } catch (error) {
            console.error('   ❌ Error auto-assigning signalements:', error);
            throw error;
          }
        }
      );

      console.log('   ✓ Subscribed to tournee.started events (auto-assign signalements)');
    } catch (error) {
      console.error('   ❌ Failed to subscribe to tournee.started:', error);
    }
  }

  /**
   * Listen for tournee.completed events (published by tour-service)
   * Auto-close linked signalements that are still EN_COURS_DE_TRAITEMENT
   */
  static async subscribeToTourneeCompleted() {
    try {
      await EventService.subscribeEvent(
        'tournee.completed',
        'SignalListener_tourneeCompleted',
        async (message) => {
          try {
            const { id_tournee, code } = message;
            if (!id_tournee) return;

            const Signalement = this.sequelize.models.Signalement;
            const { Op } = require('sequelize');

            const openSignals = await Signalement.findAll({
              where: {
                id_tournee,
                statut: { [Op.in]: ['EN_COURS_DE_TRAITEMENT', 'OUVERT'] },
              },
            });

            if (openSignals.length === 0) return;

            const now = new Date();
            let closed = 0;

            for (const sig of openSignals) {
              await sig.update({
                statut: 'FERMÉ',
                date_resolution: now,
                notes_resolution: `Résolu lors de la tournée ${code || id_tournee}`,
              });
              closed++;
            }

            console.log(`\n✅ [TOURNÉE TERMINÉE → SIGNALEMENTS]`);
            console.log(`   Tournée : ${code || id_tournee}`);
            console.log(`   ${closed} signalement(s) auto-fermé(s)`);
            console.log(`   ⏰ ${now.toLocaleTimeString()}`);
          } catch (error) {
            console.error('   ❌ Error auto-closing signalements:', error);
            throw error;
          }
        }
      );

      console.log('   ✓ Subscribed to tournee.completed events (auto-close linked signalements)');
    } catch (error) {
      console.error('   ❌ Failed to subscribe to tournee.completed:', error);
    }
  }

  /**
   * Listen for container.deleted and container.status_changed events
   * Auto-close/reject open signalements when a container is deleted or retired
   */
  static async subscribeToContainerLifecycle() {
    try {
      const handler = async (message) => {
        try {
          const { id, code_conteneur, new_statut } = message;
          if (!id) return;

          const isRetired = new_statut === 'retire';
          const isDeleted = !new_statut;

          if (!isRetired && !isDeleted) return;

          const Signalement = this.sequelize.models.Signalement;
          const { Op } = require('sequelize');

          const openSignals = await Signalement.findAll({
            where: {
              id_conteneur: id,
              statut: { [Op.in]: ['OUVERT', 'EN_COURS_DE_TRAITEMENT'] },
            },
          });

          if (openSignals.length === 0) return;

          const now = new Date();
          const reason = isDeleted
            ? `Conteneur ${code_conteneur || id} supprimé`
            : `Conteneur ${code_conteneur || id} retiré du service`;

          for (const sig of openSignals) {
            await sig.update({
              statut: 'REJETÉ',
              date_resolution: now,
              notes_resolution: reason,
            });
          }

          console.log(`\n🗑️ [CONTENEUR ${isDeleted ? 'SUPPRIMÉ' : 'RETIRÉ'} → SIGNALEMENTS]`);
          console.log(`   ${code_conteneur || id}`);
          console.log(`   ${openSignals.length} signalement(s) rejeté(s)`);
          console.log(`   ⏰ ${now.toLocaleTimeString()}`);
        } catch (error) {
          console.error('   ❌ Error processing container lifecycle event:', error);
          throw error;
        }
      };

      await EventService.subscribeEvent('container.deleted', 'SignalListener_containerDeleted', handler);
      await EventService.subscribeEvent('container.status_changed', 'SignalListener_containerStatus', handler);

      console.log('   ✓ Subscribed to container.deleted/status_changed events (auto-reject signalements)');
    } catch (error) {
      console.error('   ❌ Failed to subscribe to container lifecycle:', error);
    }
  }
}

module.exports = SignalEventListener;
