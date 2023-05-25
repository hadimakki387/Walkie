const { DogOwner, DogWalker, walkingPost } = require("../src/user/userModels");

const index = async (req, res) => {
  let coverImg;
  let profile;
  let description;
  let name;
  let address;
  await DogWalker.findOne({ id: req.query.id }).then((foundWalker) => {
    if (foundWalker) {
      res.render("profileWhenVisited/index", { foundWalker });
    } else {
      res.render("profileWhenVisited/index", {
        profile,
        coverImg,
        description,
        name,
        address,
      });
    }
  });
};


module.exports=index