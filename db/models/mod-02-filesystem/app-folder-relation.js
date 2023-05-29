'use strict';

const {DataTypes, Model} = require("sequelize");

class AppFolderRelation extends Model {
  static associate(models) {
    AppFolderRelation.belongsTo(models.AppFolder, {foreignKey: 'parentFolderId', as: 'parent'}); //getParent
    AppFolderRelation.belongsTo(models.AppFolder, {foreignKey: 'childFolderId', as: 'child'}); //getChild
  }
}

module.exports = function (sequelize) {
  AppFolderRelation.init({
    childFolderId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false
    },
    parentFolderId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false
    },
  }, {
    sequelize, // We need to pass the connection instance
    modelName: 'AppFolderRelation' // We need to choose the model name
  });
  return AppFolderRelation;
}
