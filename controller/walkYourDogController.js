const { DogOwner, DogWalker, walkingPost } = require("../src/user/userModels");
const _ = require('lodash');

const index = (req,res)=>{
    res.render("walkForm");
}

const create = async(req,res)=>{
   
          // Handles posting walk data
          const id=req.user?req.user.id:req.session.user.id
          const name = req.user?req.user.displayName:req.session.user.name
      
          const { address, dogName, dogBreed, DogDescription } = req.body;
          const dogImage = req.file.filename;
      
          const walkPost = new walkingPost({
            id: id,
            ownerName: name,
            dogName: dogName,
            dogBreed: _.capitalize(dogBreed),
            address: address,
            descriptions: DogDescription,
            availability:true,
            img: dogImage, // Set image with uploaded file converted to base64 format string
          });
      
          await walkingPost
            .findOne({ id: id }) // Searches for an existing post by user ID
            .then((foundPost) => {
              if (foundPost) {
                // Post exists so redirect back to homepage
                setTimeout(() => {
                  res.redirect("/dashboard");
                }, 2000);
              } else {
                // Save new post item and redirect
                walkPost.save();
                setTimeout(() => {
                  res.redirect("/dashboard");
                }, 2000);
              }
            })
            .catch((err) => {
              console.log(err);
            }); 
}

module.exports={
    index,
    create
}