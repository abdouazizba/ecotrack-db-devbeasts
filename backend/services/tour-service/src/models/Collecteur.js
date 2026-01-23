const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const Collecteur = sequelize.define('Collecteur', {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    code_collecteur: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false,
    },
    id_agent: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    statut: {
      type: DataTypes.ENUM('ACTIF', 'INACTIF', 'EN_MAINTENANCE'),
      defaultValue: 'ACTIF',
      allowNull: false,
    },
    model: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    batterie_actuelle: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    date_derniere_maintenance: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    timestamps: true,
    underscored: true,
  });

  return Collecteur;
};
