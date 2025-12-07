// profile Router
// /profile/me

const express = require('express');
const User = require('../models/user');
const Profile = require('../models/profile');
const userAuth = require('../middlewares/auth');

const profileRouter = express.Router();

// 
profileRouter.put("/", userAuth, async (req, res) => {

});


module.exports = profileRouter;
