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
      // Subscribe to user.created events
      await EventService.subscribeEvent('user.created', this.handleUserCreated.bind(this));
      console.log('✓ UserEventListener initialized');
    } catch (error) {
      console.error('✗ Error initializing UserEventListener:', error.message);
      throw error;
    }
  }

  /**
   * Handle user.created event from auth-service
   * Creates user profile in user-service database
   * @param {object} eventData - {id, email, role, created_at}
   */
  static async handleUserCreated(eventData) {
    try {
      const { id, email, role, created_at } = eventData;

      console.log(`\n📥 Processing user.created event: ${email} (${role})`);

      // Check if user already exists in user-service
      let user = await Utilisateur.findByPk(id);
      if (user) {
        console.log(`⚠️  User ${id} already exists in user-service. Skipping creation.`);
        return;
      }

      // 1️⃣ CREATE UTILISATEUR (parent table)
      user = await Utilisateur.create({
        id,
        email,
        nom: '',  // Will be updated by user later
        prenom: '',
        date_naissance: null,
        role,
        is_active: true,
        last_login: null,
        created_at,
        updated_at: created_at
      });

      console.log(`✓ Created Utilisateur: ${id}`);

      // 2️⃣ CREATE ROLE-SPECIFIC PROFILE (TPT pattern)
      if (role === 'agent') {
        await Agent.create({
          id,
          numero_badge: `TEMP-${id.substring(0, 8)}`, // Temporary badge
          id_zone: null, // Will be assigned later
          date_assignment_zone: null
        });
        console.log(`✓ Created Agent profile: ${id}`);

      } else if (role === 'citoyen') {
        await Citoyen.create({
          id,
          email_verified: false,
          nombre_signalements: 0,
          score_reputation: 50, // Starting reputation
          telephone: null
        });
        console.log(`✓ Created Citoyen profile: ${id}`);

      } else if (role === 'admin') {
        await Admin.create({
          id,
          niveau_acces: 'admin', // Default to regular admin
          permissions: {
            manage_users: true,
            manage_resources: true,
            manage_zones: false,
            view_statistics: true,
            manage_admins: false
          }
        });
        console.log(`✓ Created Admin profile: ${id}`);
      }

      console.log(`✅ User profile created successfully: ${email} (${role})\n`);

    } catch (error) {
      console.error(`✗ Error handling user.created event:`, error.message);
      throw error; // Will be requeued by EventService
    }
  }
}

module.exports = UserEventListener;
