import jwt from 'jsonwebtoken';

// Note: We now pass the 'res' object in, so we can physically attach a cookie!
const generateToken = (res, userId) => {
  // 1. Create short-lived Access Token (Expires in 15 Minutes)
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' });

  // 2. Create long-lived Refresh Token (Expires in 7 Days)
  const refreshToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

  // 3. Attach Refresh Token to a highly secure HTTP-Only Cookie
  res.cookie('jwt', refreshToken, {
    httpOnly: true, // The frontend's JavaScript cannot see or steal this cookie
    secure: process.env.NODE_ENV !== 'development', // Uses secure HTTPS in production
    sameSite: 'strict', // Stops Cross-Site Request Forgery (CSRF) attacks
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Days in milliseconds
  });

  // We return both so the controller can send one to the user, and save the other in the DB!
  return { accessToken, refreshToken }; 
};

export default generateToken;
