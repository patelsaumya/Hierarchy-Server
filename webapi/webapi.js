const express = require('express');
const cors = require('cors');
const compression = require('compression');
const bodyParser = require('body-parser');
const settings = require('../config/settings.config');

const app = express();

function setupExpress() {
  app.use(cors('*'));

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(compression());
}


function registerRoutes() {
  const router = require('./routes/routes');
  app.use('/api', router);
}


module.exports = function init() {
  setupExpress();

  registerRoutes();

  app.listen(settings.webApiPort, 'localhost', () => {
    console.log(`Started listening at port number ${settings.webApiPort}`);
  });
}
