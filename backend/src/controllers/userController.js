const userService = require('../services/userService');

const getMyProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const userProfile = await userService.getUserProfile(userId);
    
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: userProfile
    });
  } catch (error) {
    next(error);
  }
};

const updateMyProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    let { username, email, theme_color } = req.body;
    
    const data = {};
    
    if (username !== undefined) {
      if (typeof username !== 'string' || username.trim() === '') {
        return res.status(400).json({ success: false, message: 'Username cannot be empty' });
      }
      data.username = username.trim();
      if (data.username.length > 50) {
        return res.status(400).json({ success: false, message: 'Username is too long (max 50)' });
      }
    }
    
    if (email !== undefined) {
      if (typeof email !== 'string' || email.trim() === '') {
        return res.status(400).json({ success: false, message: 'Email cannot be empty' });
      }
      data.email = email.trim().toLowerCase();
      
      // Basic email validation regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        return res.status(400).json({ success: false, message: 'Invalid email format' });
      }
      
      if (data.email.length > 255) {
        return res.status(400).json({ success: false, message: 'Email is too long (max 255)' });
      }
    }
    
    if (theme_color !== undefined) {
      if (typeof theme_color !== 'string' || theme_color.trim() === '') {
        return res.status(400).json({ success: false, message: 'Theme color must be a valid string' });
      }
      data.theme_color = theme_color.trim();
    }
    
    // Check if nothing to update
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided for update' });
    }
    
    try {
      const updatedProfile = await userService.updateUserProfile(userId, data);
      
      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedProfile
      });
    } catch (error) {
      if (error.statusCode === 409) {
        return res.status(409).json({ success: false, message: error.message });
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

const uploadAvatar = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: 'No image provided' });
    }

    const mimeType = req.file.mimetype || 'image/jpeg';
    const base64Data = req.file.buffer.toString('base64');
    const avatarUrl = `data:${mimeType};base64,${base64Data}`;

    // Update user profile in PostgreSQL so avatar persists across ephemeral restarts
    const updatedProfile = await userService.updateUserProfile(userId, { avatar_url: avatarUrl });

    return res.status(200).json({
      success: true,
      message: 'Avatar updated successfully',
      data: updatedProfile,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  uploadAvatar
};
