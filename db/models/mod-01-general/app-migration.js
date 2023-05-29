'use strict';

const {DataTypes, Model} = require("sequelize")

class AppMigration extends Model {
}

module.exports = function (sequelize) {
  AppMigration.init({
    migrationId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    dummyGuid: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    sequelize, // We need to pass the connection instance
    modelName: 'AppMigration' // We need to choose the model name
  });
  return AppMigration;
}
