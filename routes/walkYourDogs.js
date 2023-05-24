const express = require('express');
const { index , create} = require('../controller/walkYourDogController');
const isLoggedIn = require('../middleware/isLoggedIn');
const upload = require('../middleware/multer');
const router = express.Router();

router.get('/',index)
router.post('/',isLoggedIn,upload.single("image"),create)

module.exports=router