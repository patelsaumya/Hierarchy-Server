'use strict';

const Sequelize = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('AppFolderPath', {
      folderId: {
        primaryKey: true,
        type: Sequelize.BIGINT,
        references: {
          model: 'AppFolder',
          key: 'folderId'
        },
        onDelete: 'CASCADE'
      },
      idPath: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      namePath: {
        type: Sequelize.STRING,
        allowNull: false
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
    await queryInterface.dropTable('AppFolderPath');
  }
};
