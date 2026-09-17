const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// Routes
router.get('/', taskController.getTasks);
router.get('/stats', taskController.getTaskStats); // MUST BE BEFORE /:id
router.get('/:id', taskController.getTaskById);
router.post('/', taskController.createTask);
router.put('/subtasks/:id', taskController.updateSubtask);
router.put('/:id', taskController.updateTask);
router.post('/:id/pomodoro', taskController.incrementPomodoro);
router.delete('/:id', taskController.deleteTask);

module.exports = router;
