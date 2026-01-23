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
      allowNull: false,
    },
    prenom: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    date_naissance: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('agent', 'citoyen', 'admin'),
      allowNull: false,
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
