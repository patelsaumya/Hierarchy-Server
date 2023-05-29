'use strict';

const Sequelize = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('AppMigration', {
      migrationId: {
        primaryKey: true,
        autoIncrement: true,
        type: Sequelize.BIGINT
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      dummyGuid: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      version: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('AppMigration');
  }
};
