const express = require('express');
const { index,update } = require('../controller/walkerProfileController');
const upload = require('../middleware/multer');
const isLoggedIn = require('../middleware/isLoggedIn');
const router = express.Router();



router.get('/',index)
router.post('/',isLoggedIn ,upload.fields([
    { name: 'profile', maxCount: 1 },
    { name: 'coverImg', maxCount: 1 }
  ]), update)

module.exports = router;