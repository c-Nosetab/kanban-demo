import { Router } from 'express';
import taskController from '../controllers/task.controller';

const router = Router();

// GET /api/tasks - Retrieve all tasks
router.get('/', taskController.getAllTasks);

// GET /api/tasks/:id - Retrieve single task
router.get('/:id', taskController.getTaskById);

// POST /api/tasks - Create new task
router.post('/', taskController.createTask);

// PUT /api/tasks/:id - Update existing task
router.put('/:id', taskController.updateTask);

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', taskController.deleteTask);

// PUT /api/tasks/:id/move - Update task status (for drag-drop)
router.put('/:id/move', taskController.moveTask);

// POST /api/tasks/reset - Reset to initial data
router.post('/reset', taskController.resetTasks);

export default router;
