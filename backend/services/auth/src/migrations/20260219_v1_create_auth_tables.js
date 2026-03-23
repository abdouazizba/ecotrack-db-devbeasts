'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('Migration [Up]: Creating users, agents, citoyens, and admins tables...');
    
    try {
      // Create users table (base class - Table Per Type)
      await queryInterface.createTable('users', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        email: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true,
        },
        password: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        phone: {
          type: Sequelize.STRING,
        },
        role: {
          type: Sequelize.ENUM('agent', 'citoyen', 'admin'),
          allowNull: false,
        },
        status: {
          type: Sequelize.ENUM('active', 'inactive', 'suspended'),
          defaultValue: 'active',
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

      // Create agents table (child of users for TPT)
      await queryInterface.createTable('agents', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          references: {
            model: 'users',
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
        zone_id: {
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

      // Create citoyens table (child of users for TPT)
      await queryInterface.createTable('citoyens', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          references: {
            model: 'users',
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
        created_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
        },
        updated_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
        },
      });

      // Create admins table (child of users for TPT)
      await queryInterface.createTable('admins', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          references: {
            model: 'users',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        level: {
          type: Sequelize.ENUM('super', 'standard'),
          defaultValue: 'standard',
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

      // Create indexes for performance
      await queryInterface.addIndex('users', ['email']);
      await queryInterface.addIndex('users', ['role']);
      await queryInterface.addIndex('agents', ['badge_number']);

      console.log('✅ Tables créées avec succès pour auth-service');
    } catch (error) {
      console.error('❌ Erreur lors de la migration:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('Migration [Down]: Dropping tables...');
    
    try {
      // Drop in reverse order (due to foreign keys)
      await queryInterface.dropTable('admins');
      await queryInterface.dropTable('citoyens');
      await queryInterface.dropTable('agents');
      await queryInterface.dropTable('users');
      
      console.log('✅ Tables supprimées avec succès');
    } catch (error) {
      console.error('❌ Erreur lors du rollback:', error.message);
      throw error;
    }
  },
};
