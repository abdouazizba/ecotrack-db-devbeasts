'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('Migration [Up]: Creating containers, measurements, and zones tables...');
    
    try {
      // Create zones table
      await queryInterface.createTable('zones', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        description: {
          type: Sequelize.TEXT,
        },
        latitude: {
          type: Sequelize.DECIMAL(10, 8),
        },
        longitude: {
          type: Sequelize.DECIMAL(11, 8),
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

      // Create containers table
      await queryInterface.createTable('containers', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        zone_id: {
          type: Sequelize.INTEGER,
          references: {
            model: 'zones',
            key: 'id',
          },
          onDelete: 'SET NULL',
        },
        container_number: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true,
        },
        type: {
          type: Sequelize.ENUM('recyclage', 'dechets', 'verre', 'compost'),
          allowNull: false,
        },
        capacity: {
          type: Sequelize.INTEGER, // in liters
          allowNull: false,
        },
        current_fill: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
        },
        status: {
          type: Sequelize.ENUM('active', 'maintenance', 'damaged'),
          defaultValue: 'active',
        },
        latitude: {
          type: Sequelize.DECIMAL(10, 8),
        },
        longitude: {
          type: Sequelize.DECIMAL(11, 8),
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

      // Create measurements table
      await queryInterface.createTable('measurements', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        container_id: {
          type: Sequelize.INTEGER,
          references: {
            model: 'containers',
            key: 'id',
          },
          onDelete: 'CASCADE',
          allowNull: false,
        },
        fill_percentage: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: false,
        },
        temperature: {
          type: Sequelize.DECIMAL(5, 2),
        },
        weight: {
          type: Sequelize.DECIMAL(8, 2),
        },
        sensor_id: {
          type: Sequelize.STRING,
        },
        created_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
        },
      });

      // Create indexes
      await queryInterface.addIndex('containers', ['zone_id']);
      await queryInterface.addIndex('containers', ['container_number']);
      await queryInterface.addIndex('measurements', ['container_id']);
      await queryInterface.addIndex('measurements', ['created_at']);

      console.log('✅ Tables créées avec succès pour container-service');
    } catch (error) {
      console.error('❌ Erreur lors de la migration:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('Migration [Down]: Dropping tables...');
    
    try {
      await queryInterface.dropTable('measurements');
      await queryInterface.dropTable('containers');
      await queryInterface.dropTable('zones');
      
      console.log('✅ Tables supprimées avec succès');
    } catch (error) {
      console.error('❌ Erreur lors du rollback:', error.message);
      throw error;
    }
  },
};
