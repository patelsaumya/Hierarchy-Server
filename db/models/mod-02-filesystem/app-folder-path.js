'use strict';

const {DataTypes, Model} = require("sequelize");

class AppFolderPath extends Model {
  static associate(models) {
    AppFolderPath.belongsTo(models.AppFolder, {foreignKey: 'folderId'});
  }
}

module.exports = function (sequelize) {
  AppFolderPath.init({
    folderId: {
      type: DataTypes.BIGINT,
      primaryKey: true
    },
    idPath: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    namePath: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize, // We need to pass the connection instance
    modelName: 'AppFolderPath' // We need to choose the model name
  });
  return AppFolderPath;
}
