'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('Migration [Up]: Creating utilisateurs table...');
    
    try {
      // Create utilisateurs table (synced from auth-service events)
      await queryInterface.createTable('utilisateurs', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        auth_user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          unique: true,
        },
        email: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true,
        },
        role: {
          type: Sequelize.ENUM('agent', 'citoyen', 'admin'),
          allowNull: false,
        },
        profile_complete: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
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

      // Create agents table (child)
      await queryInterface.createTable('agents', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          references: {
            model: 'utilisateurs',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        badge_number: {
          type: Sequelize.STRING,
          unique: true,
        },
        department: {
          type: Sequelize.STRING,
        },
        experience_years: {
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

      // Create citoyens table (child)
      await queryInterface.createTable('citoyens', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          references: {
            model: 'utilisateurs',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        address: {
          type: Sequelize.STRING,
        },
        city: {
          type: Sequelize.STRING,
        },
        postal_code: {
          type: Sequelize.STRING,
        },
        phone_verified: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
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

      // Create admins table (child)
      await queryInterface.createTable('admins', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          references: {
            model: 'utilisateurs',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        level: {
          type: Sequelize.ENUM('super', 'standard'),
          defaultValue: 'standard',
        },
        permissions: {
          type: Sequelize.JSON,
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

      // Create indexes
      await queryInterface.addIndex('utilisateurs', ['email']);
      await queryInterface.addIndex('utilisateurs', ['role']);

      console.log('✅ Tables créées avec succès pour user-service');
    } catch (error) {
      console.error('❌ Erreur lors de la migration:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('Migration [Down]: Dropping tables...');
    
    try {
      await queryInterface.dropTable('admins');
      await queryInterface.dropTable('citoyens');
      await queryInterface.dropTable('agents');
      await queryInterface.dropTable('utilisateurs');
      
      console.log('✅ Tables supprimées avec succès');
    } catch (error) {
      console.error('❌ Erreur lors du rollback:', error.message);
      throw error;
    }
  },
};
