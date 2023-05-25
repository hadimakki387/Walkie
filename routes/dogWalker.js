const express = require('express');
const { index, create } = require('../controller/dogWalkerController');
const router = express.Router();


router.get('/',index)
router.post('/',create)

module.exports = router

