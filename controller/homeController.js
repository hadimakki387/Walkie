const homeController = (req, res) => {
  let name = null;
  let id = null;
  let img = null;
  res.render("home/home", { name: name, img: img });
  
};

module.exports = homeController;
