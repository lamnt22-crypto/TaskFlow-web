const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middlewares/authMiddleware');

const multer = require('multer');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Protect all AI routes
router.use(authMiddleware);

router.post('/breakdown', aiController.breakdownTask);
router.get('/prioritize', aiController.prioritizeTasks);
router.get('/chat', aiController.getChatHistory);
router.post('/chat', aiController.chat);
router.post('/summarize', aiController.summarizeTask);
router.post('/generate-plan', aiController.generatePlan);
router.post('/generate-plan-from-file', upload.single('file'), aiController.generatePlanFromFile);
router.post('/parse-task', aiController.parseTaskFromText);

module.exports = router;
