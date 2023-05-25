const { session } = require("passport");

const homeController = (req, res) => {
  const { name, img } = req.session.user || {}; // Use an empty object as default value
  res.render("home/index", { name: name || "", img: img || "" });
};

module.exports = homeController;

