const express = require('express');
const { index,create } = require('../controller/dashboardController');
const isLoggedIn = require('../middleware/isLoggedIn');
const upload = require('../middleware/multer');
const router = express.Router()

router.get('/',isLoggedIn,index)
router.post('/',upload.single("profileImg"),create)

module.exports =router