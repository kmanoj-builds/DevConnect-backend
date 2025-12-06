//Middleware
const User = require('../models/user');
const jwt = require('jsonwebtoken');

const userAuth = async (req, res, next) => {
  try {
    // Get token from cookies
    const { token } = req.cookies;

    // If no token, unauthorized
    if (!token) {
      return res
        .status(401)
        .json({ message: 'Unauthorized: No token provided' });
    }

    // Verify token
    const decodedData = await jwt.verify(token, process.env.JWT_SECRET);
    //extract user id
    const { _id } = decodedData;

    //find user
    const user = await User.findOne({ _id: _id });

    //if no user found
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized: User not found' });
    }

    //attach user to req object
    req.user = user;
    //proceed to next middleware
    next();
  } catch (err) {
    //handle errors
    return res
      .status(401)
      .json({ message: 'Unauthorized: Invalid token', error: err.message });
  }
};


module.exports = userAuth;