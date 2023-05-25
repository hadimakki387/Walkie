const express = require("express");
const { index, show } = require("../controller/postsController");
const isLoggedIn = require("../middleware/isLoggedIn");
const router = express.Router();

router.get("/", isLoggedIn, index);
router.post("/",show)

module.exports = router;
