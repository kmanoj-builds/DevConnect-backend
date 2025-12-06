const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      minLength: 3,
      maxLength: 50,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    emailId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
      trim: true,
      minLength: 8,
    },

    avatarUrl: {
      type: String,
    },

    bio: {
      type: String,
    },

    skills: {
      type: [String],
    },

    githubUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

userSchema.methods.getJWT = async function () {
  //get the user
  const user = this;

  //generate JWT token
  const token = await jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  //return the token
  return token;
};

userSchema.methods.validatePassword = async function (passwordInputByUser) {
  //get the user
  const user = this;

  //get the hashed password from DB
  const passwordHash = user.password;

  //compare the passwords
  const isPasswordValid = await bcrypt.compare(
    passwordInputByUser,
    passwordHash
  );

  //return the result
  return isPasswordValid;
};

module.exports = mongoose.model('User', userSchema);
