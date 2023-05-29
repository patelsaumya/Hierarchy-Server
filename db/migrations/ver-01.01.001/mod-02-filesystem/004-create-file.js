'use strict';

const Sequelize = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('AppFile', {
      fileId: {
        primaryKey: true,
        type: Sequelize.BIGINT,
        autoIncrement: true
      },
      folderId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'AppFolder',
          key: 'folderId'
        }
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      content: {
        type: Sequelize.BLOB('long'),
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
    }).then(() => {
      return queryInterface.addConstraint('AppFile', {
        fields: ['folderId', 'name'],
        type: "unique"
      })
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('AppFile');
  }
};
