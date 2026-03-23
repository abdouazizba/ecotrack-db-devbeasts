const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('utilisateur', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    nom: {
      type: DataTypes.STRING,
      allowNull: true,  // Will be updated by user later
    },
    prenom: {
      type: DataTypes.STRING,
      allowNull: true,  // Will be updated by user later
    },
    date_naissance: {
      type: DataTypes.DATE,
      allowNull: true,  // Will be updated by user later
    },
    role: {
      type: DataTypes.ENUM('super_admin', 'admin', 'agent', 'citoyen'),
      allowNull: false,
      defaultValue: 'citoyen',  // Default role for new registrations
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'utilisateurs',
  });

  return User;
};
