const {
  DogOwner,
  DogWalker,
  walkingPost,
  Review,
} = require("../src/user/userModels");

const FindDogWalkers = async (id) => {
  try {
    const dogWalkers = await DogWalker.find({ id: id }).exec();
    return dogWalkers;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const FindDogOwners = async (id) => {
  try {
    const dogOwners = await DogOwner.find({ id: id }).exec();
    return dogOwners;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const FindWalkerReviews = async (walkeId, ownerId = null) => {
  try {
    const dogReviews = ownerId
      ? await Review.find({ dogWalker: walkeId, dogOwner: ownerId }).exec()
      : await Review.find({ dogWalker: walkeId }).exec();
    return dogReviews;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

module.exports = {
  FindDogWalkers,
  FindDogOwners,
  FindWalkerReviews,
};
