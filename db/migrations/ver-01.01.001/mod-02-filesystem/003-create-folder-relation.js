'use strict';

const Sequelize = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('AppFolderRelation', {
      childFolderId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'AppFolder',
          key: 'folderId'
        },
        onDelete: 'CASCADE'
      },
      parentFolderId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'AppFolder',
          key: 'folderId'
        },
        onDelete: 'CASCADE'
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
      return queryInterface.addConstraint('AppFolderRelation', {
        fields: ['parentFolderId', 'childFolderId'],
        type: "primary key"
      });
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('AppFolderPath');
  }
};
