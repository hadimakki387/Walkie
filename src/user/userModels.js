const mongoose = require("mongoose");

// Define dog owner schema
const dogOwnerSchema = new mongoose.Schema({
  Fname: String,
  Lname: String,
  name: String,
  email: String,
  id: String,
  address: String,
  password: String,
  profImg: Buffer,
  notification:Boolean,
  dogs: [String],
});

// Define dog walker schema
const dogWalkerSchema = new mongoose.Schema({
  Fname: String,
  Lname: String,
  name:String,
  email: String,
  password: String,
  address: String,
  telNumber: Number,
  address: String,
  age: Number,
  id: String,
  descriptions:String,
  profile:Buffer,
  coverImg:Buffer,
  availability: [String],
  specialSkills: [String],
});

// Define walking post schema
const walkingPostSchema = new mongoose.Schema({
  ownerName: String,
  id: String,
  dogName: String,
  dogBreed: String,
  address: String,
  descriptions:String,
  img: Buffer,
  password: String,
  availability:Boolean,
  submittedBy:String,
});

// Create models for each schema
const DogOwner = mongoose.model("DogOwner", dogOwnerSchema);
const DogWalker = mongoose.model("DogWalker", dogWalkerSchema);
const walkingPost = mongoose.model("walkingPost", walkingPostSchema);

module.exports = {
  DogOwner,
  DogWalker,
  walkingPost,
};
