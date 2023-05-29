const settings = require('../config/settings.config');
const {Sequelize, QueryTypes} = require('sequelize');
const path = require("path");
const fs = require("fs");

const models = {};

const sequelize = new Sequelize(settings.currentDatabase.databaseName, settings.currentDatabase.username, settings.currentDatabase.password, {
  host: settings.currentDatabase.host,
  port: settings.currentDatabase.port,
  dialect: settings.currentDatabase.dialect,
  quoteIdentifiers: false, //For Postgres
  define: {
    freezeTableName: true,
    version: true,
    timestamps: true
  }
});

async function createDatabase() {
  const sequelizeTmp = new Sequelize("", settings.currentDatabase.username, settings.currentDatabase.password, {
    host: settings.currentDatabase.host,
    port: settings.currentDatabase.port,
    dialect: settings.currentDatabase.dialect
  });
  if(settings.currentDatabase.dbms === 'mysql') {
    let sql = `SELECT SCHEMA_NAME\n
        FROM INFORMATION_SCHEMA.SCHEMATA\n
        WHERE SCHEMA_NAME = \'${settings.currentDatabase.databaseName}\'`;
    const result = await sequelizeTmp.query(sql, {type: QueryTypes.SELECT});
    if(result.length === 0) {
      sql = 'CREATE DATABASE `' + settings.currentDatabase.databaseName + '`';
      await sequelizeTmp.query(sql, {type: QueryTypes.RAW});
    }
  }
}

async function startMigration(migrationDir) {
  let existingMigrations = [];
  let checkMigrationTable = null;

  if (settings.currentDatabase.dbms === 'mysql') {
    sql =
      "SELECT * \n" +
      "FROM information_schema.tables\n" +
      "WHERE table_schema = '" + settings.currentDatabase.databaseName + "'\n" +
      "    AND table_name = 'AppMigration'";
    checkMigrationTable = await sequelize.query(sql, {type: QueryTypes.SELECT});
  } else {
    throw new Error(`Invalid value ${settings.currentDatabase.dialect} of database.dialect!`);
  }

  if (checkMigrationTable.length !== 0) {
    //Fetch AppMigration table records using raw SQL
    //migrations = await sequelize.query("SELECT name FROM `AppMigration`", { typ: QueryTypes.SELECT });

    //Fetch AppMigration table records using Sequelize Model
    existingMigrations = await models.AppMigration.findAll();
  }

  await applyMigrations(existingMigrations, migrationDir);
}

async function applyMigrations(existingMigrations, migrationDir) {
  let filesAndFolders = fs.readdirSync(migrationDir);
  for(const fileOrFolder of filesAndFolders) {
    if(fs.lstatSync(path.join(migrationDir, fileOrFolder)).isDirectory()) {
      await applyMigrations(existingMigrations, path.join(migrationDir, fileOrFolder));
    } else {
      if(path.extname(fileOrFolder).toLowerCase() === '.js') {
        const migrationName = path.join(path.basename(path.dirname(migrationDir)),path.basename(migrationDir),fileOrFolder);
        const found = existingMigrations.find(p => {
          return p.name === migrationName;
        });
        if(!found) {
          const migrationScript = require(path.join(migrationDir, fileOrFolder));
          const model = await migrationScript.up(sequelize.getQueryInterface());
          await models.AppMigration.create({
            name: migrationName
          });
        }
      }
    }
  }

}

function setupModels(modelDir) {
  let filesAndFolders = fs.readdirSync(modelDir);
  filesAndFolders.forEach(fileOrFolder => {
    if(fs.lstatSync(path.join(modelDir, fileOrFolder)).isDirectory()) {
      setupModels(path.join(modelDir, fileOrFolder));
    } else {
      if(path.extname(fileOrFolder).toLowerCase() === '.js') {
       const registerModel = require(path.join(modelDir, fileOrFolder));
       const model = registerModel(sequelize);
       models[model.name] = model;
      }
    }
  });
}

function associateModels() {
  Object.keys(models).forEach(model => {
    models[model].associate?.(models);
  });
}

module.exports = async function init() {
  try{
    await createDatabase();
    await sequelize.authenticate();
    init.sequelize = sequelize;
    init.models = models;

    setupModels(path.join(__dirname, 'models'));
    associateModels();

    await startMigration(path.join(__dirname, 'migrations'));
  } catch (e) {
    console.log(e);
  }
}
