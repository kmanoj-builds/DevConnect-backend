// profile Router
// /profile/me

const express = require("mongoose");
const User = require("../models/user");
const Profile = require("../models/profile");
const userAuth = require("../middlewares/auth");

const profileRouter = express.Router();

// /profile/me -- getMyProfile
profileRouter.get("/me", userAuth, async (req, res) => {

  try{

    const userId  = req.user._id;
    // check that id is in Profile 
    const profile = await Profile.findOne({ userId: userId}).lean();
    // that corressponding user
    const user = await User.findOne({_id: userId}).select("firstName lastName emailId").lean();

    return res.json({ok: true, profile, user});

  }
  catch(err){
    next(err);
  }

});