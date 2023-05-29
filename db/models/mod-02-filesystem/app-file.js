'use strict';

const {DataTypes, Model} = require("sequelize");

class AppFile extends Model {
  static associate(models) {
    AppFile.belongsTo(models.AppFolder, {foreignKey: 'folderId'});
  }
}

module.exports = function (sequelize) {
  AppFile.init({
    fileId: {
      type: DataTypes.BIGINT,
      primaryKey: true
    },
    folderId: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    content: {
      type: DataTypes.BLOB('long'),
      allowNull: false
    },
  }, {
    sequelize, // We need to pass the connection instance
    modelName: 'AppFile', // We need to choose the model name
    indexes: [{
      unique: true,
      fields: ['folderId', 'name']
    }]
  });
  return AppFile;
}
