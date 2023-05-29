'use strict';

const Sequelize = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('AppFolder', {
      folderId: {
        primaryKey: true,
        type: Sequelize.BIGINT,
        autoIncrement: true
      },
      parentFolderId: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'AppFolder',
          key: 'folderId',
        },
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      depth: {
        type: Sequelize.INTEGER,
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
      return queryInterface.addConstraint('AppFolder', {
        fields: ['parentFolderId', 'name'],
        type: "unique"
      })
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('AppFolder');
  }
};
