// This runs if someone visits a route we didn't create (like /api/fake-route)
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error); // Passes the error down to the errorHandler
};

// This catches any actual server crashes or Mongoose errors
export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // If Mongoose complains about a broken ID length
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    message = 'Resource not found (Invalid ID)';
    statusCode = 404;
  }

  res.status(statusCode).json({
    message,
    // Provide stack traces only in development mode!
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};
