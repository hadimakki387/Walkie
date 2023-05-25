const { DogOwner, DogWalker, walkingPost } = require("../src/user/userModels");

const index = async (req, res) => {
  const { id } = req.session.user;

  try {
    let foundPosts;
    const dogBreed = req.query.dogBreed;

    if (dogBreed) {
      foundPosts = await walkingPost.find({ dogBreed });
    } else {
      foundPosts = await walkingPost.find();
    }

    const postsCount = foundPosts.filter(
      (post) => post.availability === true
    ).length;
    const foundWalker = await DogWalker.findOne({ id });

    let profile = null;
    if (foundWalker && foundWalker.profile) {
      profile = foundWalker.profile;
    }

    res.render("posts/index", { foundPosts, postsCount, profile });
  } catch (error) {
    console.log(error);
    // Handle the error appropriately (e.g., send an error response to the client)
  }
};

const show = async(req,res)=>{
    const id=req.body.id
  await walkingPost.findOneAndUpdate({id:id},{availability:false,submittedBy:req.session.user.id})
    .then(err=>{
      console.log(err)
    })
  await DogOwner.findOneAndUpdate({id:req.session.user.id},{notification:true})
  .then(err=>{
    console.log(err)
  })
}

module.exports = {
  index,
  show
};
