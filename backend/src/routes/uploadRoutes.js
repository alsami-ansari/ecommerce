import path from 'path';
import express from 'express';
import multer from 'multer';

const router = express.Router();

// 1. Configure where and how to save the file
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/'); // Saves right into your backend/uploads folder
  },
  filename(req, file, cb) {
    // Generates a unique filename like: image-16834098230.jpg
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

// 2. Validate that the file is an actual image
function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png|webp|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('You can only upload images!'));
  }
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

// 3. The actual API Route
// @route   POST /api/upload
// @access  Public (Keeping it public right now so it's easy to test in Postman!)
router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send({ message: 'No file uploaded' });
  }

  // Windows sometimes uses backslashes in paths, this fixes it so browsers can read it securely
  const filePath = `/${req.file.path.replace(/\\/g, '/')}`;

  res.send({
    message: 'Image Uploaded Successfully',
    image: filePath, // Send the unique URL back!
  });
});

export default router;
