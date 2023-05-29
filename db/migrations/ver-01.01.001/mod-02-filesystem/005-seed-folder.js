'use strict';

const db = require('../../../db');

module.exports = {
  up: async (queryInterface) => {
    const t = await db.sequelize.transaction();
    try {
      let virtualFolder = await db.models.AppFolder.create({
        name: 'Virtual',
        depth: -1
      }, { transaction: t });

      await db.models.AppFolderPath.create({
        folderId: virtualFolder.folderId,
        idPath: '\\',
        namePath: '\\'
      }, { transaction: t });

      await db.models.AppFolderRelation.create({
        childFolderId: virtualFolder.folderId,
        parentFolderId: virtualFolder.folderId
      }, { transaction: t });

      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  },
  down: async (queryInterface) => {
  }
};
