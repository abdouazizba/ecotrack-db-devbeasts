const { Utilisateur } = require('../models');

/**
 * Seed User Service Database
 * NOTE: User profiles are created by UserEventListener
 * when auth-service publishes "user.created" events
 * 
 * This seeder only ensures database is initialized
 */
async function seedUserDatabase(sequelize) {
  try {
    // Check if users already exist
    const existingUsers = await Utilisateur.count();
    
    if (existingUsers > 0) {
      console.log('✓ User database already populated. Skipping seed...');
      return;
    }

    console.log('ℹ️  Waiting for user.created events from auth-service...');
    console.log('✓ User profiles will be created automatically via events');

    return { message: 'Event-driven seeding enabled' };
  } catch (error) {
    console.error('Error in user database seeding:', error.message);
    throw error;
  }
}

module.exports = { seedUserDatabase };

