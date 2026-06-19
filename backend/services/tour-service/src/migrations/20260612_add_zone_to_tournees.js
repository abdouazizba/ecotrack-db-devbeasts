'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('tournees', 'id_zone', {
      type: Sequelize.UUID,
      allowNull: true,
    });
    await queryInterface.addIndex('tournees', ['id_zone']);
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('tournees', ['id_zone']);
    await queryInterface.removeColumn('tournees', 'id_zone');
  },
};
