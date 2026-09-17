const gamificationService = require('../services/gamificationService');

exports.getGamificationData = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const data = await gamificationService.getGamificationData(userId);
    
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};
