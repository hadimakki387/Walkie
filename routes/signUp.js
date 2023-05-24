const express = require('express');
const { index, create } = require('../controller/signUpController');
const router = express.Router();


router.get('/',index)

module.exports = router