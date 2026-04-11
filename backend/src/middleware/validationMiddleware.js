import { validationResult } from 'express-validator';

// This acts as a security guard. If the rules we set are broken, it stops the request.
export const runValidation = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Return a 400 Bad Request with an array of all the specific errors
    return res.status(400).json({ errors: errors.array() });
  }
  
  // If there are no errors, let the request pass through to the Controller!
  next();
};
