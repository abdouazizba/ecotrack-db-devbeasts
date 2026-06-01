'use strict';

/**
 * Migration: Add latitude and longitude to zones table
 * Ensures zones table has geographic coordinates for map display
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('Migration [Up]: Adding latitude and longitude to zones table...');
    
    try {
      // Check if columns already exist
      const table = await queryInterface.describeTable('zones');
      
      // Add latitude if it doesn't exist
      if (!table.latitude) {
        await queryInterface.addColumn('zones', 'latitude', {
          type: Sequelize.DECIMAL(10, 8),
          allowNull: true,
          comment: 'Latitude coordinate of the zone center',
        });
        console.log('✓ Added latitude column');
      }
      
      // Add longitude if it doesn't exist
      if (!table.longitude) {
        await queryInterface.addColumn('zones', 'longitude', {
          type: Sequelize.DECIMAL(11, 8),
          allowNull: true,
          comment: 'Longitude coordinate of the zone center',
        });
        console.log('✓ Added longitude column');
      }
      
      console.log('✅ Migration completed: zones table now has geographic coordinates');
    } catch (error) {
      console.error('❌ Migration error:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('Migration [Down]: Reverting latitude and longitude from zones table...');
    
    try {
      const table = await queryInterface.describeTable('zones');
      
      if (table.latitude) {
        await queryInterface.removeColumn('zones', 'latitude');
        console.log('✓ Removed latitude column');
      }
      
      if (table.longitude) {
        await queryInterface.removeColumn('zones', 'longitude');
        console.log('✓ Removed longitude column');
      }
      
      console.log('✅ Rollback completed');
    } catch (error) {
      console.error('❌ Rollback error:', error.message);
      throw error;
    }
  }
};
