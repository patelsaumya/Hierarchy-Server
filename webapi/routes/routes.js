const express = require('express');
const hierarchyController = require("../controllers/hierarchy.controller");

const router = express.Router();

router.post('/folder/create', hierarchyController.createFolder);
router.post('/folder/update/:folderId', hierarchyController.updateFolder);
router.post('/folder/delete/:folderId', hierarchyController.deleteFolder);

module.exports = router;
