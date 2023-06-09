const {
  DogOwner,
  DogWalker,
  walkingPost,
  Review,
} = require("../src/user/userModels");
const findReviews = require("../utils/findReviews");

const index = async (req, res) => {
  let coverImg;
  let profile;
  let description;
  let name;
  let address;
  let id = req.query.id;

  const result = await findReviews(id);
  let reviews = result.reviews;
  console.log(result.reviews);

  await DogWalker.findOne({ id: id }).then((foundWalker) => {
    if (foundWalker) {
      res.render("profileWhenVisited/index", { foundWalker, reviews });
    } else {
      res
        .status(500)
        .render("errors/error", { error: "User Not Found", errorCode: 404 });
    }
  });
};

module.exports = index;
