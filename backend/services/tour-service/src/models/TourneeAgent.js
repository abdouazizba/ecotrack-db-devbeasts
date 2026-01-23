const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const TourneeAgent = sequelize.define('TourneeAgent', {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    id_tournee: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'tournees',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    id_agent: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('CONDUCTEUR', 'COLLECTEUR'),
      defaultValue: 'COLLECTEUR',
      allowNull: false,
    },
    heure_debut_reel: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    heure_fin_reelle: {
      type: DataTypes.TIME,
      allowNull: true,
    },
  }, {
    timestamps: true,
    underscored: true,
  });

  return TourneeAgent;
};
