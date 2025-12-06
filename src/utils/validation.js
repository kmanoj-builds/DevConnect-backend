const validator = require('validator');

const validateSignUpData = (req) => {
  const { firstName, lastName, emailId, password } = req.body;
  if (!firstName || !lastName || !emailId || !password) {
    return { valid: false, message: 'All fields are required.' };
  } else if (!validator.isEmail(emailId)) {
    return { valid: false, message: 'Invalid email format.' };
  } else if (!validator.isStrongPassword(password)) {
    return { valid: false, message: 'Password is not strong enough.' };
  }
  return { valid: true };

};

module.exports = { validateSignUpData };