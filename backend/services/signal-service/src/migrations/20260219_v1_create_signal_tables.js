'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('Migration [Up]: Creating signals and alerts tables...');
    
    try {
      // Create signals table
      await queryInterface.createTable('signals', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        citoyen_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        container_id: {
          type: Sequelize.INTEGER,
        },
        title: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        description: {
          type: Sequelize.TEXT,
        },
        type: {
          type: Sequelize.ENUM('overflow', 'damage', 'odor', 'illegal_dump', 'other'),
          allowNull: false,
        },
        latitude: {
          type: Sequelize.DECIMAL(10, 8),
        },
        longitude: {
          type: Sequelize.DECIMAL(11, 8),
        },
        photo_url: {
          type: Sequelize.STRING,
        },
        status: {
          type: Sequelize.ENUM('open', 'in_progress', 'resolved', 'closed'),
          defaultValue: 'open',
        },
        priority: {
          type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
          defaultValue: 'medium',
        },
        assigned_to: {
          type: Sequelize.INTEGER,
        },
        created_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
        },
        updated_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
        },
      });

      // Create alerts table
      await queryInterface.createTable('alerts', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        container_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        alert_type: {
          type: Sequelize.ENUM('overflow', 'temperature', 'low_battery', 'sensor_error'),
          allowNull: false,
        },
        severity: {
          type: Sequelize.ENUM('warning', 'critical'),
          defaultValue: 'warning',
        },
        message: {
          type: Sequelize.TEXT,
        },
        is_resolved: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        resolved_at: {
          type: Sequelize.DATE,
        },
        created_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
        },
      });

      // Create indexes
      await queryInterface.addIndex('signals', ['citoyen_id']);
      await queryInterface.addIndex('signals', ['status']);
      await queryInterface.addIndex('signals', ['created_at']);
      await queryInterface.addIndex('alerts', ['container_id']);
      await queryInterface.addIndex('alerts', ['alert_type']);

      console.log('✅ Tables créées avec succès pour signal-service');
    } catch (error) {
      console.error('❌ Erreur lors de la migration:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('Migration [Down]: Dropping tables...');
    
    try {
      await queryInterface.dropTable('alerts');
      await queryInterface.dropTable('signals');
      
      console.log('✅ Tables supprimées avec succès');
    } catch (error) {
      console.error('❌ Erreur lors du rollback:', error.message);
      throw error;
    }
  },
};
