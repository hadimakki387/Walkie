const express = require('express')
const destroy = require('../controller/logout')
const router = express.Router()

router.get('/',destroy)

module.exports = router