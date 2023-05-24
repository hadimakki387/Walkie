const { DogOwner, DogWalker, walkingPost } = require("../src/user/userModels");

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

      res.render("dashboard", { img, name: displayName, foundPost });
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

        res.render("dashboard", { img: imageSrc, name, foundPost, foundwalker : foundWalker });
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
    foundPost = await walkingPost.findOne({ id });
    if (foundPost) {
      const walkerId = foundPost.submittedBy;
      foundWalker = await DogWalker.findOne({ id: walkerId });
    }
  } catch (err) {
    console.log(err);
  }

  return { foundPost, foundWalker };
}

const create  = async(req,res)=>{

  const { user } = req.session;
  let { name, id, email, img } = user;
  const profImg = req.file.filename; // Get the path of the uploaded file

  await DogOwner.findOneAndUpdate(
    { email: email },
    { profImg: profImg } // Save the file path in the profImg field
  ).catch((err) => {
    console.log(err);
  });

  res.redirect("/dashboard");
}


module.exports = {
    index,
    create
}