//authRouter
//POST /signup
//POST /login
//GET /logout

const express = require('express');
const authRouter = express.Router();
const { validateSignUpData } = require('../utils/validation');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const userAuth = require('../middlewares/auth');

//Signup route
authRouter.post('/signup', async (req, res) => {
  try {
    //validate data
    validateSignUpData(req);

    const { firstName, lastName, emailId, password } = req.body;

    //Encrypt password
    const passwordHash = await bcrypt.hash(password, 10);

    //Create user
    const newUser = new User({
      firstName,
      lastName,
      emailId,
      password: passwordHash,
    });

    //Save user to DB
    const savedUser = await newUser.save();
    //get JWT from the Schema method
    const token = await newUser.getJWT();

    //added to cookies
    res.cookie('token', token, {
      expires: new Date(Date.now() + 8 * 3600000), // 8 hours
    });

    //send response
    res
      .status(201)
      .json({ message: 'User created successfully', user: savedUser });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

//Login route
authRouter.post('/login', async (req, res) => {
  try {
    const { emailId, password } = req.body;

    //Phase 1: check if user exists
    const user = await User.findOne({ emailId: emailId });

    //user not exists
    if (!user) {
      return res
        .status(404)
        .json({ error: 'User not found. Please sign up first.' });
    }

    //Phase 2: check if password is correct
    const isPasswordValid = await user.validatePassword(password);

    if (isPasswordValid) {
      //create JWT token
      const token = await user.getJWT();

      //add token to cookies and send response
      res.cookie('token', token, {
        expires: new Date(Date.now() + 8 * 3600000),
      }); // 8 hours

      res.status(200).json({ message: 'Login successful', user: user });
    } else {
      res.status(401).json({ error: 'Invalid credentials. Please try again.' });
    }
  } catch (err) {
    //send error response
    res.status(500).json({ error: err.message });
  }
});

//Logout route
authRouter.post('/logout', (req, res) => {
  res.cookie('token', null, {
    expires: new Date(Date.now()),
  });
  res.status(200).json({ message: 'Logout successful' });
});

// me
authRouter.get('/view', userAuth, async (req, res) => {
  try {
    //get user from req object
    const user = req.user;
    //send user profile as response
    res.status(200).json({ profile: user });
  } catch (err) {
    //handle errors
    return res
      .status(500)
      .json({ message: 'Server Error', error: err.message });
  }
});

module.exports = authRouter;
