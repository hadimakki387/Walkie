const express = require('express');
const router = express.Router();
const homeController = require('../controller/homeController');

// Render initial page with no user information
router.get('/', homeController);

module.exports = router;
