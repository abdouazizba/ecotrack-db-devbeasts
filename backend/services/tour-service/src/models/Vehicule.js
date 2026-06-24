const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const Vehicule = sequelize.define('Vehicule', {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    immatriculation: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: false,
    },
    marque: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    modele: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    type_vehicule: {
      type: DataTypes.ENUM('BENNE', 'COMPACTEUR', 'UTILITAIRE', 'CAMION_GRUE'),
      defaultValue: 'BENNE',
      allowNull: false,
    },
    capacite_tonnes: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    kilometrage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: true,
    },
    statut: {
      type: DataTypes.ENUM('ACTIF', 'INACTIF', 'EN_MAINTENANCE'),
      defaultValue: 'ACTIF',
      allowNull: false,
    },
    id_agent: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    date_derniere_maintenance: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    date_prochain_controle: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'vehicules',
    timestamps: true,
    underscored: true,
  });

  return Vehicule;
};
