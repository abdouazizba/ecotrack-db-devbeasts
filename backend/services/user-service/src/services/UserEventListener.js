const EventService = require('./EventService');
const { Utilisateur, Agent, Citoyen, Admin } = require('../models');

/**
 * User Event Listeners
 * Handles incoming events from auth-service
 */
class UserEventListener {
  /**
   * Initialize event listeners
   */
  static async initialize() {
    try {
      // Subscribe to user.created events with unique queue name per subscriber
      await EventService.subscribeEvent('user.created', 'user-service', this.handleUserCreated.bind(this));
      console.log('✓ UserEventListener initialized - Listening for user.created events');
    } catch (error) {
      console.error('✗ Error initializing UserEventListener:', error.message);
      throw error;
    }
  }

  /**
   * Handle user.created event from auth-service
   * Creates Utilisateur + Citoyen profile (default role for new registrations)
   * Admin can later upgrade to Agent or Admin via PUT /users/:id/role
   * @param {object} eventData - {id, email, created_at}
   */
  static async handleUserCreated(eventData) {
    try {
      const { id, email, created_at } = eventData;

      console.log(`\n📥 Processing user.created event: ${email}`);

      // Check if user already exists in user-service
      let user = await Utilisateur.findByPk(id);
      if (user) {
        console.log(`⚠️  User ${id} already exists in user-service. Skipping creation.`);
        return;
      }

      // CREATE UTILISATEUR (parent table) with default role: 'citoyen'
      user = await Utilisateur.create({
        id,
        email,
        nom: '',  // Will be updated by user later
        prenom: '',
        date_naissance: null,
        role: 'citoyen',  // Default role for new registrations
        is_active: true,
        last_login: null,
        created_at,
        updated_at: created_at
      });

      console.log(`✓ Created Utilisateur: ${id} (role: citoyen)`);

      // CREATE CITOYEN PROFILE (child table, TPT pattern)
      await Citoyen.create({
        id,
        email_verified: false,
        nombre_signalements: 0,
        score_reputation: 50,
        telephone: null,
        created_at,
        updated_at: created_at
      });

      console.log(`✓ Created Citoyen profile: ${id}`);

      // Admin can later upgrade to Agent or Admin via PUT /users/:id/role
      console.log(`✅ User profile created successfully: ${email} (role: citoyen)\n`);

    } catch (error) {
      console.error(`✗ Error handling user.created event:`, error.message);
      throw error; // Will be requeued by EventService
    }
  }
}

module.exports = UserEventListener;
