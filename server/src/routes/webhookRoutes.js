const express = require('express');
const router = express.Router();
const terminalWebhook = require('../webhooks/terminalWebhook');

router.post('/terminal', express.raw({ type: 'application/json' }), terminalWebhook.handleWebhook);

module.exports = router; 