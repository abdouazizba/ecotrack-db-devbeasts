const EventService = require('./EventService');

/**
 * TOUR SERVICE EVENT LISTENER
 *
 * Listens for:
 * - measurement.created → if fill > 85%, flag the next PLANIFIÉE tournée as urgent
 */

class TourEventListener {
  static async initialize(sequelize) {
    try {
      console.log('🎧 Tour Event Listener: Initializing subscriptions...\n');
      this.sequelize = sequelize;

      await EventService.initialize();
      console.log('   ✓ EventService initialized');

      await this.subscribeToMeasurementCreated();

      console.log('✅ Tour Event Listener: All subscriptions active\n');
    } catch (error) {
      console.error('❌ Tour Event Listener initialization error:', error);
      // Non-fatal: tour service can run without event listener
    }
  }

  /**
   * When a measurement.created event reports fill > 85%,
   * add an urgency note to the next PLANIFIÉE tournée.
   */
  static async subscribeToMeasurementCreated() {
    try {
      await EventService.subscribeEvent(
        'measurement.created',
        'TourListener_measurementCreated',
        async (message) => {
          try {
            const { id_conteneur, id_zone, taux_remplissage } = message;
            if (!id_conteneur || taux_remplissage === undefined) return;
            if (taux_remplissage <= 85) return;

            const Tournee = this.sequelize.models.Tournee;

            // Find the next PLANIFIÉE tournée (any zone — we don't have zone mapping here)
            const tournee = await Tournee.findOne({
              where: { statut: 'PLANIFIÉE' },
              order: [['date', 'ASC']],
            });

            if (!tournee) return;

            // Append urgency note (avoid duplicating if already mentioned)
            const alertNote = `⚠️ URGENCE: container ${id_conteneur.substring(0, 8)} à ${taux_remplissage.toFixed(1)}% (zone ${id_zone || '?'})`;

            if (tournee.notes && tournee.notes.includes(id_conteneur.substring(0, 8))) return;

            const updatedNotes = tournee.notes
              ? `${tournee.notes}\n${alertNote}`
              : alertNote;

            await tournee.update({ notes: updatedNotes });

            console.log(`\n🚨 [TOURNÉE URGENCE]`);
            console.log(`   Tournée  : ${tournee.code}`);
            console.log(`   Container: ${id_conteneur}`);
            console.log(`   Taux     : ${taux_remplissage.toFixed(1)}%`);
            console.log(`   ⏰ ${new Date().toLocaleTimeString()}`);
          } catch (error) {
            console.error('   ❌ Error updating tournée urgency:', error);
            throw error;
          }
        }
      );

      console.log('   ✓ Subscribed to measurement.created (urgency flag fill > 85%)');
    } catch (error) {
      console.error('   ❌ Failed to subscribe to measurement.created:', error);
    }
  }
}

module.exports = TourEventListener;
