const { DogOwner, DogWalker, walkingPost,Review } = require("../src/user/userModels");
const fs = require("fs");
const findReviews = require("../utils/findReviews");

const index = async (req, res) => {
  const { id } = req.session.user;
  const result = await findReviews(id);
  

  await DogWalker.findOne({ id: id }).then((foundWalker) => {
    if (foundWalker) {
      let name = foundWalker.name;
      let coverImg = foundWalker.coverImg ? foundWalker.coverImg : null;
      let profile = foundWalker.profile ? foundWalker.profile : null;
      let description = foundWalker.description;
      let address = foundWalker.address;
      let reviews = result.reviews

      res.render("walkerProfile/index", {
        profile,
        coverImg,
        description,
        name,
        address,
        reviews
      });
    } else {
      let coverImg;
      let profile;
      let description;
      let name;
      let address;
      let reviews = result.reviews
      res.render("walkerProfile/index", {
        profile,
        coverImg,
        description,
        name,
        address,
        reviews
      });
    }
  });
};

const update = async (req, res) => {
  let { fullName, description, address } = req.body;
  let id = req.session.user.id;

  if (req.files && req.files.profile) {
    await handleProfileUpdate(req, res, id);
  } else if (req.files && req.files.coverImg) {
    await handleCoverImgUpdate(req, res, id);
  } else if (fullName) {
    await updateName(req, res, id, fullName);
  } else if (description) {
    await updateDescription(req, res, id, description);
  } else if (address) {
    await updateAddress(req, res, id, address);
  }
};

async function handleProfileUpdate(req, res, id) {
  const profile = req.files["profile"][0].filename;
  const dogWalker = await DogWalker.findOne({ id: id });

  if (dogWalker && dogWalker.profile && dogWalker.profile !== profile) {
    const filePath = `public/uploads/${dogWalker.profile}`;
    fs.unlink(filePath, async (err) => {
      if (err) {
        console.log(err);
      }

      await DogWalker.findOneAndUpdate({ id: id }, { profile: profile });
      res.redirect("/WalkerProfile");
    });
  } else if (!dogWalker || !dogWalker.profile) {
    await DogWalker.findOneAndUpdate({ id: id }, { profile: profile });
    res.redirect("/WalkerProfile");
  } else {
    res.redirect("/WalkerProfile");
  }
}

async function handleCoverImgUpdate(req, res, id) {
  const cover = req.files["coverImg"][0].filename;
  await DogWalker.findOneAndUpdate({ id: id }, { coverImg: cover });
  res.redirect("/WalkerProfile");
}

async function updateName(req, res, id, fullName) {
  await DogWalker.findOneAndUpdate({ id: id }, { name: fullName });
  res.redirect("/WalkerProfile");
}

async function updateDescription(req, res, id, description) {
  await DogWalker.findOneAndUpdate({ id: id }, { description: description });
  res.redirect("/WalkerProfile");
}

async function updateAddress(req, res, id, address) {
  await DogWalker.findOneAndUpdate({ id: id }, { address: address });
  res.redirect("/WalkerProfile");
}

module.exports = {
  index,
  update,
};
