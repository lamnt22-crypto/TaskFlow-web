const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');

// Use memory storage so avatars persist in PostgreSQL as Data URLs across ephemeral cloud restarts (Render)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      const err = new Error('Only image files are allowed');
      err.statusCode = 400;
      return cb(err);
    }
    cb(null, true);
  },
});

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get current user profile
router.get('/me', userController.getMyProfile);

// Update current user profile
router.put('/me', userController.updateMyProfile);

// Upload avatar
router.post('/me/avatar', upload.single('avatar'), userController.uploadAvatar);

module.exports = router;
