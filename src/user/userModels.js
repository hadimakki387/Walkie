const mongoose = require("mongoose");

const dogOwnerSchema = new mongoose.Schema({
  Fname: String,
  Lname: String,
  name: String,
  email: String,
  id: String,
  address: String,
  password: String,
  profImg: String,
  notification: Boolean,
  dogs: [String],
  reviews: [
    {
      type: mongoose.Schema.Types.String,
      ref: "Review"
    }
  ]
});

const dogWalkerSchema = new mongoose.Schema({
  Fname: String,
  Lname: String,
  name: String,
  email: String,
  password: String,
  address: String,
  telNumber: Number,
  age: Number,
  id: String,
  description: String,
  profile: String,
  coverImg: String,
  walkedDogs:Number,
  OwnersWorkedWith: {
    type: [String], // Define OwnersWorkedWith as an array of strings
    default: [], // Set a default empty array if not provided
  },
});

const walkingPostSchema = new mongoose.Schema({
  ownerName: String,
  id: String,
  dogName: String,
  dogBreed: String,
  address: String,
  descriptions: String,
  img: String,
  password: String,
  availability: Boolean,
  submittedBy: String,
  beingWalkedBy:String,
  isDone:Boolean
});

const reviewSchema = new mongoose.Schema({
  title: String,
  content: String,
  rating: Number,
  dogWalker: {
    type: mongoose.Schema.Types.String,
    ref: "DogWalker"
  },
  dogOwner: {
    type: mongoose.Schema.Types.String,
    ref: "DogOwner"
  }
});

const DogOwner = mongoose.model("DogOwner", dogOwnerSchema);
const DogWalker = mongoose.model("DogWalker", dogWalkerSchema);
const walkingPost = mongoose.model("walkingPost", walkingPostSchema);
const Review = mongoose.model("Review", reviewSchema);

module.exports = {
  DogOwner,
  DogWalker,
  walkingPost,
  Review
};
