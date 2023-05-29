'use strict';

const {DataTypes, Model} = require("sequelize");

class AppFolder extends Model {
  //learning-point: Usage
  // const tmp = await models.AppFolder.findOne({
  //   where: {
  //     name: 'India'
  //   },
  //   include: [{
  //     model: models.AppFolder,
  //     as: 'parent'
  //   }, {
  //     model: models.AppFolder,
  //     as: 'children'
  //   }]
  // });
  //
  // const children = await tmp.getChildren();
  // const parent = await tmp.getParent();

  static associate(models) {
    AppFolder.hasMany(models.AppFolder, {foreignKey: 'parentFolderId', as: 'immediateChildren'}); //getImmediateChildren
    AppFolder.belongsTo(models.AppFolder, {foreignKey: 'parentFolderId', as: 'immediateParent'}); //getImmediateParent

    AppFolder.hasOne(models.AppFolderPath, {foreignKey: 'folderId'});

    AppFolder.hasMany(models.AppFolderRelation, {foreignKey: 'parentFolderId', as: 'allChildren'}); //getAllChildren
    AppFolder.hasMany(models.AppFolderRelation, {foreignKey: 'childFolderId', as: 'allParents'}); //getAllParents

    AppFolder.hasMany(models.AppFile, {foreignKey: 'folderId'});
  }
}

module.exports = function (sequelize) {
  AppFolder.init({
    folderId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    depth: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    parentFolderId: {
      type: DataTypes.BIGINT,
      allowNull: true
    }
  }, {
    sequelize, // We need to pass the connection instance
    modelName: 'AppFolder', // We need to choose the model name,
    indexes: [{
      unique: true,
      fields: ['parentFolderId', 'name']
    }]
  });
  return AppFolder;
}
