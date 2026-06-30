const EventService = require('./EventService');

/**
 * AUTH SERVICE EVENT LISTENER
 * RGPD — droit a l'oubli : purge les credentials quand un utilisateur est supprime
 */
class AuthEventListener {
  static async initialize(sequelize) {
    this.sequelize = sequelize;
    console.log('🎧 Auth Event Listener: Initializing subscriptions...\n');

    await this.subscribeToUserDeleted();

    console.log('✅ Auth Event Listener: All subscriptions active\n');
  }

  static async subscribeToUserDeleted() {
    try {
      await EventService.subscribeEvent(
        'user.deleted',
        'auth-service-user-deleted',
        async (message) => {
          try {
            const { id } = message;
            if (!id) return;

            const User = this.sequelize.models.User;
            const deleted = await User.destroy({ where: { id } });

            if (deleted) {
              console.log(`\n🗑️ [RGPD] Credentials purged for user ${id}`);
            }
          } catch (error) {
            console.error('   ❌ Error purging user credentials:', error);
            throw error;
          }
        }
      );

      console.log('   ✓ Subscribed to user.deleted events (RGPD credential purge)');
    } catch (error) {
      console.error('   ❌ Failed to subscribe to user.deleted:', error);
    }
  }
}

module.exports = AuthEventListener;
