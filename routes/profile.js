const express = require('express');
const index = require('../controller/profileController');
const router = express.Router();

router.get('/',index)

module.exports = router