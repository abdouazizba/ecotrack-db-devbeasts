'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('Migration [Up]: Creating tours and collection_points tables...');
    
    try {
      // Create tours table
      await queryInterface.createTable('tours', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        agent_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        tour_date: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        zone: {
          type: Sequelize.STRING,
        },
        status: {
          type: Sequelize.ENUM('planned', 'in_progress', 'completed', 'cancelled'),
          defaultValue: 'planned',
        },
        start_time: {
          type: Sequelize.TIME,
        },
        end_time: {
          type: Sequelize.TIME,
        },
        distance_km: {
          type: Sequelize.DECIMAL(7, 2),
        },
        notes: {
          type: Sequelize.TEXT,
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

      // Create collection_points table
      await queryInterface.createTable('collection_points', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        tour_id: {
          type: Sequelize.INTEGER,
          references: {
            model: 'tours',
            key: 'id',
          },
          onDelete: 'CASCADE',
          allowNull: false,
        },
        container_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        sequence_order: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        weight_collected: {
          type: Sequelize.DECIMAL(8, 2),
        },
        status: {
          type: Sequelize.ENUM('pending', 'collected', 'skipped'),
          defaultValue: 'pending',
        },
        collection_time: {
          type: Sequelize.TIME,
        },
        created_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
        },
      });

      // Create indexes
      await queryInterface.addIndex('tours', ['agent_id']);
      await queryInterface.addIndex('tours', ['tour_date']);
      await queryInterface.addIndex('collection_points', ['tour_id']);

      console.log('✅ Tables créées avec succès pour tour-service');
    } catch (error) {
      console.error('❌ Erreur lors de la migration:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('Migration [Down]: Dropping tables...');
    
    try {
      await queryInterface.dropTable('collection_points');
      await queryInterface.dropTable('tours');
      
      console.log('✅ Tables supprimées avec succès');
    } catch (error) {
      console.error('❌ Erreur lors du rollback:', error.message);
      throw error;
    }
  },
};
