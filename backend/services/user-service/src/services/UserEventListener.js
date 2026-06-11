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
      const { id, email, nom, prenom, role, created_at } = eventData;
      const userRole = role || 'citoyen';

      console.log(`\n📥 Processing user.created event: ${email} (role: ${userRole})`);

      // Check if user already exists in user-service
      let user = await Utilisateur.findByPk(id);
      if (user) {
        console.log(`⚠️  User ${id} already exists in user-service. Skipping creation.`);
        return;
      }

      // CREATE UTILISATEUR (parent table) with role from event
      user = await Utilisateur.create({
        id,
        email,
        nom: nom || '',
        prenom: prenom || '',
        date_naissance: null,
        role: userRole,
        is_active: true,
        last_login: null,
        created_at,
        updated_at: created_at
      });

      console.log(`✓ Created Utilisateur: ${id} (role: ${userRole})`);

      // CREATE role-specific profile (TPT pattern)
      if (userRole === 'agent') {
        await Agent.create({
          id,
          numero_badge: `AGENT-${id.substring(0, 8)}`,
          id_zone: null,
          date_assignment_zone: new Date(),
          created_at,
          updated_at: created_at
        });
        console.log(`✓ Created Agent profile: ${id}`);
      } else if (userRole === 'admin' || userRole === 'super_admin') {
        await Admin.create({
          id,
          niveau_acces: userRole === 'super_admin' ? 'super_admin' : 'admin',
          permissions: {
            manage_users: true,
            manage_resources: true,
            manage_zones: userRole === 'super_admin',
            view_statistics: true,
            manage_admins: userRole === 'super_admin',
          },
          created_at,
          updated_at: created_at
        });
        console.log(`✓ Created Admin profile: ${id}`);
      } else {
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
      }

      console.log(`✅ User profile created successfully: ${email} (role: ${userRole})\n`);

    } catch (error) {
      console.error(`✗ Error handling user.created event:`, error.message);
      throw error; // Will be requeued by EventService
    }
  }
}

module.exports = UserEventListener;
