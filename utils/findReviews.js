const { DogOwner, DogWalker, walkingPost, Review } = require("../src/user/userModels");

const findReviews = async (id) => {
    const reviews = await Review.find({ dogWalker: id });
  
    const result = {
      reviews: []
    };
  
    const userPromises = reviews.map(review => {
      return DogOwner.findOne({ id: review.dogOwner }).then(owner => {
        result.reviews.push({
          owner: owner,
          review: review,
        });
      });
    });
  
    await Promise.all(userPromises);
    return result;
  };

  module.exports=findReviews
  