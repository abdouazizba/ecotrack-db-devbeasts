const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const Tournee = sequelize.define('Tournee', {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    statut: {
      type: DataTypes.ENUM('PLANIFIÉE', 'EN_COURS', 'TERMINÉE', 'ANNULÉE'),
      defaultValue: 'PLANIFIÉE',
      allowNull: false,
    },
    heure_debut: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    heure_fin: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    distance_km: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    conteneurs_collectes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    timestamps: true,
    underscored: true,
  });

  return Tournee;
};
