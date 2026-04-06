import jwt from 'jsonwebtoken';

// This function takes a user's ID, signs it with our secret key, and creates a token valid for 30 days
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

export default generateToken;
