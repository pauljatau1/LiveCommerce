
const express = require('express');
const router = express.Router();
const errorLoggingController = require('../controllers/error-logging.controller');

router.get('/', errorLoggingController.getErrors);

module.exports = router;
