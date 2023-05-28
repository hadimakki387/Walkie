const {
  DogOwner,
  DogWalker,
  walkingPost,
  Review,
} = require("../src/user/userModels");

const index = async (req, res) => {
  if (req.user) {
    const { displayName, name, photos, emails, id } = req.user;
    const [img] = photos[0].value;
    const [email] = emails[0].value;
    const dogOwner = new DogOwner({
      Fname: name.givenName,
      Lname: name.familyName,
      name: displayName,
      id,
      email,
    });

    try {
      const foundOwner = await DogOwner.findOne({ id });
      if (!foundOwner) {
        await dogOwner.save();
      }

      res.render("dashboard/index", { img, name: displayName, foundPost });
    } catch (err) {
      console.log(err);
    }
  } else {
    const { user } = req.session;
    const { name, id, email, img } = user;

    try {
      const foundOwner = await DogOwner.findOne({ email });
      if (foundOwner) {
        let imageSrc = img ? img : null;
        const { foundPost, foundWalker } = await getFoundPostAndWalker(id);
        

        res.render("dashboard/index", {
          img: imageSrc,
          name,
          foundPost,
          foundwalker: foundWalker,
        });
      } else {
        res.redirect("/signUp?error=account-not-existing");
      }
    } catch (err) {
      console.log(err);
    }
  }
};

async function getFoundPostAndWalker(id) {
  let foundPost;
  let foundWalker;

  try {
    foundPost = await walkingPost.findOne({ id,isDone:undefined });
    if (foundPost) {
      const walkerId = foundPost.submittedBy;
      foundWalker = await DogWalker.findOne({ id: walkerId });
    }
  } catch (err) {
    console.log(err);
  }

  return { foundPost, foundWalker };
}

const create = async (req, res) => {
  const { profileImg, approve, decline, isDoneWalking, review, reviewTitle } = req.body;
  const { user } = req.session;
  const { name, id, email, img } = user;

  if (profileImg) {
    await handleProfileImage(req, email);
  } else if (approve) {
    await handlePostApproval(id);
  } else if (decline) {
    await handlePostDecline(id);
  } else if (isDoneWalking) {
    await handleWorkDone(id,review,reviewTitle);
  }

  res.redirect("/dashboard");
};

async function handleProfileImage(req, email) {
  try {
    const profImg = req.file.filename;
    await DogOwner.findOneAndUpdate({ email: email }, { profImg: profImg });
  } catch (err) {
    console.log(err);
  }
}

async function handlePostApproval(id) {
  try {
    const post = await walkingPost.findOne({ id: id });
    if (post) {
      await walkingPost.findOneAndUpdate(
        { id: id , beingWalkedBy:undefined},
        { beingWalkedBy: post.submittedBy }
      );
    } else {
      console.log("Post not found");
    }
  } catch (err) {
    console.log(err);
  }
}

async function handlePostDecline(id) {
  try {
    await walkingPost.findOneAndUpdate(
      { id: id },
      { availability: true, submittedBy: "", beingWalkedBy: "" }
    );
  } catch (err) {
    console.log(err);
  }
}

async function handleWorkDone(id,review,reviewTitle) {
  try {
    const post = await walkingPost.findOne({ id: id });
    const walker = await DogWalker.findOne({ id: post.submittedBy });

    let WorkedWithOwners = walker.OwnersWorkedWith || [];
    WorkedWithOwners.push(id);

    let walkedDogs = walker.OwnersWorkedWith.length

    walker.walkedDogs = walkedDogs;
    walker.OwnersWorkedWith = WorkedWithOwners;

    const newReview = new Review({
      title:reviewTitle,
      content: review,
      dogWalker:walker.id,
      dogOwner:id
    })

    try {
      const replacedWalker = await DogWalker.findByIdAndUpdate(
        walker._id,
        walker,
        { new: true }
      );
      const updatePost = await walkingPost.findOneAndUpdate({id:id ,isDone:undefined},{isDone:true})
      newReview.save()
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
}

module.exports = {
  index,
  create,
};
