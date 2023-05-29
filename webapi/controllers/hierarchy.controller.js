'use strict';

const db = require('../../db/db');

async function createFolder(req, res, next) {
  const t = await db.sequelize.transaction();
  const data = req.body.data;
  const parentFolderId = data.parentFolderId;
  let name = data.name;
  name = name.replace(/\\/g, '/');

  //Get Parent Folder
  const parentFolder = await db.models.AppFolder.findOne({
    where: {
      folderId: parentFolderId
    },
    include: [{
      model: db.models.AppFolderPath
    }]
  }, { transaction: t });

  if(!parentFolder) {
    return res.status('400').send("Error creating Folder: Specified Parent Folder does not exist!");
  }


  //Create entry in Folder Table
  const newFolder = await db.models.AppFolder.create({
    parentFolderId: parentFolderId,
    name: name,
    depth: parentFolder? parentFolder.depth + 1 : 0
  }, { transaction: t });


  //Create entry in FolderPath Table
  await db.models.AppFolderPath.create({
    folderId: newFolder.folderId,
    idPath: parentFolder.AppFolderPath.idPath + newFolder.folderId + '\\',
    namePath: parentFolder.AppFolderPath.namePath + newFolder.name + '\\'
  }, { transaction: t });


  //Create entries in FolderRelation Table
  await db.sequelize.query(
    `
            INSERT INTO AppFolderRelation (childFolderId, parentFolderId, createdAt, updatedAt, version) 
                SELECT ${newFolder.folderId}, parentFolderId, Now(), Now(), 0
                    FROM AppFolderRelation WHERE childFolderId = ${newFolder.parentFolderId}`
    , { transaction: t })
    .then((r) => r)
    .catch((err) => {
      throw err;
    });

  await db.models.AppFolderRelation.create({
    parentFolderId: newFolder.folderId,
    childFolderId: newFolder.folderId
  }, { transaction: t });

  await t.commit();
  return res.json(newFolder);
}

async function updateFolder(req, res, next) {
  const t = await db.sequelize.transaction();

  const currentFolderId = req.params['folderId'];
  const currentFolderInfo = req.body.data.folder;
  const currentFolderInfoDb = await db.models.AppFolder.findOne({
    where: {
      folderId: currentFolderId,
      version: currentFolderInfo.version
    },
    include: [{
      model: db.models.AppFolderPath
    }]
  });

  if (!currentFolderInfoDb) {
    return res.status(400).send("Specified Folder does not exist!");
  }

  const isInvalid = await db.models.AppFolderRelation.findOne({
    where: {
      childFolderId: currentFolderInfo.parentFolderId,
      parentFolderId: currentFolderId
    }
  });
  if(isInvalid) {
    return res.status(400).send("Cyclical relationship not allowed!");
  }

  let folderMoved = false;
  let folderRenamed = false;
  if(currentFolderInfoDb.name !== currentFolderInfo.name) {
    folderRenamed = true;
  }
  if(currentFolderInfoDb.parentFolderId !== currentFolderInfo.parentFolderId) {
    folderMoved = true;
  }

  const existingParentFolder = await db.models.AppFolder.findOne({
    where: {
      folderId: currentFolderInfoDb.parentFolderId
    },
    include:[{
      model: db.models.AppFolderPath
    }]
  }, { transaction: t });

  const newParentFolder = await db.models.AppFolder.findOne({
    where: {
      folderId: currentFolderInfo.parentFolderId
    },
    include: [{
      model: db.models.AppFolderPath
    }]
  }, { transaction: t });

  let namePathToBeReplaced = currentFolderInfoDb.AppFolderPath.namePath;
  let idPathToBeReplaced = currentFolderInfoDb.AppFolderPath.idPath;
  let newNamePathValue = '';
  let newIdPathValue = '';
  if(folderMoved) {
    newNamePathValue = newParentFolder.AppFolderPath.namePath + currentFolderInfo.name + '\\';
    newIdPathValue = newParentFolder.AppFolderPath.idPath + currentFolderId + '\\';
  } else { //Renamed
    newNamePathValue = existingParentFolder.AppFolderPath.namePath + currentFolderInfo.name + '\\';
    newIdPathValue = existingParentFolder.AppFolderPath.idPath + currentFolderId + '\\';
  }

  newNamePathValue = newNamePathValue.replace(/\\/g, '\\\\');
  newIdPathValue = newIdPathValue.replace(/\\/g, '\\\\');

  const depthDiff = newParentFolder.depth - existingParentFolder.depth;

  currentFolderInfoDb.name = currentFolderInfo.name;
  currentFolderInfoDb.parentFolderId = currentFolderInfo.parentFolderId;
  await currentFolderInfoDb.save({transaction: t}).catch(err => {
    throw err;
  });

  await db.sequelize.query(
    `
          UPDATE AppFolderPath t1
          INNER JOIN AppFolderRelation t2 ON t1.folderId = t2.childFolderId
          SET
              t1.namePath = CONCAT('${newNamePathValue}', SUBSTRING(t1.namePath, ${namePathToBeReplaced.length + 1})),
              t1.idPath = CONCAT('${newIdPathValue}', SUBSTRING(t1.idPath, ${idPathToBeReplaced.length + 1}))
          WHERE t2.parentFolderId = ${currentFolderId}
      `
    , { transaction: t })
    .then((r) => r)
    .catch((err) => {
      throw err;
    });

  await db.sequelize.query(
    `
          UPDATE AppFolder t1
          INNER JOIN AppFolderRelation t2 ON t1.folderId = t2.childFolderId
          SET
              t1.depth = t1.depth + ${depthDiff}
          WHERE t2.parentFolderId = ${currentFolderId}
      `
    , { transaction: t })
    .then((r) => r)
    .catch((err) => {
      throw err;
    });


  if(folderMoved) {
    await db.sequelize.query(
      `
            DELETE FROM AppFolderRelation
            WHERE
            childFolderId in (
                SELECT childFolderId FROM (
                SELECT childFolderId FROM AppFolderRelation t3
                WHERE t3.parentFolderId = ${currentFolderId}) x
            ) AND
            parentFolderId in (
                SELECT parentFolderId FROM (
                SELECT parentFolderId FROM AppFolderRelation t2
                WHERE t2.childFolderId = ${existingParentFolder.folderId}) y
            )
       `
      , { transaction: t })
      .then((r) => r)
      .catch((err) => {
        throw err;
      });

    await db.sequelize.query(
      `
            INSERT INTO AppFolderRelation (childFolderId, parentFolderId, createdAt, updatedAt, version) 
                SELECT x2.childFolderId, y2.parentFolderId, Now(), Now(), 0
                    FROM (
                        SELECT childFolderId FROM (
                        SELECT childFolderId FROM AppFolderRelation t2
                        WHERE t2.parentFolderId = ${currentFolderId}) x1
                    ) x2
                    CROSS JOIN (
                        SELECT parentFolderId FROM (
                        SELECT parentFolderId FROM AppFolderRelation t3
                        WHERE t3.childFolderId = ${newParentFolder.folderId}) y1
                    ) y2
          `
      , { transaction: t })
      .then((r) => r)
      .catch((err) => {
        throw err;
      });
  }
  await t.commit();
  res.json({message: 'Updated Successfully!'})

}

async function deleteFolder(req, res, next) {
  const t = await db.sequelize.transaction();

  const currentFolderId = req.params['folderId'];
  const version = req.body.data.folder.version;
  const folder = await db.models.AppFolder.findOne({
    where: {
      folderId: currentFolderId,
      version: version
    }
  }, {transaction: t});
  if(!folder) {
    return res.status(400).send("Specified Folder does not exist!");
  }

  await folder.destroy();

  // const results = await db.sequelize.query(
  //   `
  //               SELECT t1.folderId
  //               FROM AppFolder t1
  //               INNER JOIN AppFolderRelation t2 on t2.childFolderId = t1.folderId
  //               WHERE
	//                   t2.parentFolderId = ${currentFolderId}
  //               ORDER BY t1.depth DESC;
  //         `
  //   , { transaction: t })
  //   .then((r) => r)
  //   .catch((err) => {
  //     throw err;
  //   });

  // const folderIds = results[0].map(x => x.folderId);
  // await db.sequelize.query(
  //   `
  //               DELETE FROM AppFolderPath t4
  //               WHERE t4.folderId in
  //               (
  //                   SELECT t3.folderId FROM
  //                 (
  //                     SELECT t1.folderId
  //                     FROM AppFolder t1
  //                     INNER JOIN AppFolderRelation t2 on t2.childFolderId = t1.folderId
  //                     WHERE
  //                       t2.parentFolderId = ${currentFolderId}
  //                 ) t3
  //               )
  //         `
  //   , { transaction: t })
  //   .then((r) => r)
  //   .catch((err) => {
  //     throw err;
  //   });
  // await db.sequelize.query(
  //   `
  //               DELETE FROM AppFolderRelation t4
  //               WHERE t4.childFolderId in
  //               (
  //                   SELECT t3.folderId FROM
  //                 (
  //                     SELECT t1.folderId
  //                     FROM AppFolder t1
  //                     INNER JOIN AppFolderRelation t2 on t2.childFolderId = t1.folderId
  //                     WHERE
  //                       t2.parentFolderId = ${currentFolderId}
  //                 ) t3
  //               )
  //         `
  //   , { transaction: t })
  //   .then((r) => r)
  //   .catch((err) => {
  //     throw err;
  //   });
  //
  // for (let i = 0; i < folderIds.length; ++i) {
  //   await db.sequelize.query(
  //     `
  //               DELETE FROM AppFolder t3
  //               WHERE
	//                   t3.folderId = ${folderIds[i]}
  //         `
  //     , { transaction: t })
  //     .then((r) => r)
  //     .catch((err) => {
  //       throw err;
  //     });
  // }
  // await t.commit();
  res.json({message: 'Deleted Successfully!'});
}

module.exports = {
  createFolder,
  updateFolder,
  deleteFolder
}
