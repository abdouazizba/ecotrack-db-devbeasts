const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Citoyen = sequelize.define('citoyen', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      references: {
        model: 'utilisateurs',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    nombre_signalements: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    score_reputation: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
      comment: 'Citizen reputation score (0-100 or more)',
    },
    telephone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'citoyens',
  });

  // Association with Utilisateur for inheritance
  Citoyen.belongsTo(sequelize.models.utilisateur, {
    foreignKey: 'id',
    targetKey: 'id',
  });

  return Citoyen;
};
