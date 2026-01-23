const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Admin = sequelize.define('admin', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      references: {
        model: 'utilisateurs',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    niveau_acces: {
      type: DataTypes.STRING,
      defaultValue: 'admin',
      comment: 'Administrator access level (super_admin or admin)',
    },
    permissions: {
      type: DataTypes.JSONB,
      defaultValue: {
        manage_users: true,
        manage_resources: true,
        manage_zones: true,
        view_statistics: true,
        manage_admins: false,
      },
    },
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'admins',
  });

  // Association with Utilisateur for inheritance
  Admin.belongsTo(sequelize.models.utilisateur, {
    foreignKey: 'id',
    targetKey: 'id',
  });

  return Admin;
};
