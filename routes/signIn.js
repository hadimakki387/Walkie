const express = require('express');
const { index, create } = require('../controller/signInController');
const router = express.Router();




// Render initial page with no user information
router.get('/', index);
router.post('/',create)



module.exports = router;
