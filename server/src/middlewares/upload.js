const multer = require('multer');
const path = require('path');

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload an image file.'), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
}).fields([
  { name: 'images', maxCount: 10 },
  { name: /^variant-[^-]+-images$/, maxCount: 10 },                    // For variant-red-images
  { name: /^variant-[^-]+-[^-]+-images$/, maxCount: 10 },             // For variant-red-large-images
  { name: /^variant-[^-]+-[^-]+-[^-]+-images$/, maxCount: 10 }        // For variant-red-large-cotton-images
]);

module.exports = upload;