const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Agent = sequelize.define('agent', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      references: {
        model: 'utilisateurs',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    numero_badge: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
    },
    id_zone: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Reference to the zone where the agent operates',
    },
    date_assignment_zone: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'agents',
  });

  // Association with Utilisateur for inheritance
  Agent.belongsTo(sequelize.models.utilisateur, {
    foreignKey: 'id',
    targetKey: 'id',
  });

  return Agent;
};
