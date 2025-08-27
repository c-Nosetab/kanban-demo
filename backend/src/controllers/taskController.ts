import { Request, Response } from 'express';
import Task from '../models/Task';
import { CreateTaskRequest, UpdateTaskRequest, MoveTaskRequest } from '../types';

class TaskController {
  // GET /api/tasks - Retrieve all tasks
  public getAllTasks(_req: Request, res: Response): void {
    try {
      const tasks = Task.getAllTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  // POST /api/tasks - Create new task
  public createTask(req: Request<{}, {}, CreateTaskRequest>, res: Response): void {
    try {
      const newTask = Task.createTask(req.body);
      res.status(201).json(newTask);
    } catch (error) {
      if ((error as Error).message === 'Title is required') {
        res.status(400).json({ error: (error as Error).message });
        return;
      }
      res.status(500).json({ error: (error as Error).message });
    }
  }

  // PUT /api/tasks/:id - Update existing task
  public updateTask(req: Request<{ id: string }, {}, UpdateTaskRequest>, res: Response): void {
    try {
      const taskId = parseInt(req.params.id);
      const updatedTask = Task.updateTask(taskId, req.body);
      res.json(updatedTask);
    } catch (error) {
      if ((error as Error).message === 'Task not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(500).json({ error: (error as Error).message });
    }
  }

  // DELETE /api/tasks/:id - Delete task
  public deleteTask(req: Request<{ id: string }>, res: Response): void {
    try {
      const taskId = parseInt(req.params.id);
      Task.deleteTask(taskId);
      res.status(204).send();
    } catch (error) {
      if ((error as Error).message === 'Task not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(500).json({ error: (error as Error).message });
    }
  }

  // PUT /api/tasks/:id/move - Update task status (for drag-drop)
  public moveTask(req: Request<{ id: string }, {}, MoveTaskRequest>, res: Response): void {
    try {
      const taskId = parseInt(req.params.id);
      const { status } = req.body;
      const updatedTask = Task.moveTask(taskId, status);
      res.json(updatedTask);
    } catch (error) {
      if ((error as Error).message === 'Task not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      if ((error as Error).message === 'Invalid status') {
        res.status(400).json({ error: (error as Error).message });
        return;
      }
      res.status(500).json({ error: (error as Error).message });
    }
  }

  // POST /api/tasks/reset - Reset to initial data
  public resetTasks(_req: Request, res: Response): void {
    try {
      Task.resetTasks();
      res.status(200).json(Task.getAllTasks());
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
}

export default new TaskController();
