const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const mongoose=require('mongoose');
const passport=require('passport')

app.set('view engine','ejs')
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: true}))

mongoose.connect('mongodb://127.0.0.1:27017/walkie')

const dogOwnerSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    address: String,
    dogs: [String]
})

const dogWalkerSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    address: String,
    availability: [String],
    specialSkills: [String]
})

const DogOwner = mongoose.model('DogOwner', dogOwnerSchema)
const DogWalker = mongoose.model('DogWalker', dogWalkerSchema)





  

app.get('/',(req,res)=>{
    res.render('home')
})
app.get('/signIn',(req,res)=>{
    res.render('signIn')
})

app.get('/signUp',(req,res)=>{
    res.render('signUp')
})

app.post('/signIn',(req,res)=>{
    res.render('signIn')
})

app.listen(3000,()=>{
    console.log("listening on port 3000")
})