import { Request, Response } from 'express';
import Task from '../models/Task';
import { CreateTaskRequest, UpdateTaskRequest, MoveTaskRequest } from '../types';
import { QueryParser } from '../utils/queryParser';

class TaskController {
  private sanitizeData(data: CreateTaskRequest | UpdateTaskRequest): UpdateTaskRequest | CreateTaskRequest {
    if (!data.title) {
      throw new Error('Title is required');
    }

    const newData: UpdateTaskRequest = {
      id: 'id' in data ? data.id : -1,
      title: QueryParser.sanitizeString(data.title, 100),
      description: QueryParser.sanitizeString(data.description, 1000),
      priority: QueryParser.parseEnum(data.priority, ['low', 'medium', 'high'], 'medium'),
      dueDate: data.dueDate ? QueryParser.parseDate(data.dueDate) : null,
      status: QueryParser.parseEnum(data?.status, ['todo', 'in-progress', 'done'], 'todo'),
    }

    return newData;
  }

  // GET /api/tasks - Retrieve all tasks
  public getAllTasks(req: Request, res: Response): void {
    try {
      const query = req.query;

      const sortBy = QueryParser.parseEnum(
        query['sortBy'],
        ['order', 'title', 'priority', 'dueDate'],
        'order',
      )

      const sortDirection = QueryParser.parseEnum(
        query['sortDirection'],
        ['asc', 'desc'],
        'asc',
      );

      const priority = QueryParser.parseStringArray(query['priority'])
        .filter(p => ['low', 'medium', 'high'].includes(p)) as ('low' | 'medium' | 'high')[];

      const filterString = QueryParser.sanitizeString(query['filterString']);

      const tasks = Task.getAllTasks({
        sortBy,
        sortDirection,
        priority,
        filterString,
      });

      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  // GET /api/tasks/:id - Retrieve a single task
  public getTaskById(req: Request<{ id: string }>, res: Response): void {
    try {
      const taskId = QueryParser.parseStringInt(req.params.id);
      const task = Task.getTaskById(taskId);

      if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }

      res.json(task);
    } catch (error) {
      if ((error as Error).message === 'Task not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(500).json({ error: (error as Error).message });
    }
  }

  // POST /api/tasks - Create new task
  public createTask(req: Request<{}, {}, CreateTaskRequest>, res: Response): void {
    try {
      const newData = this.sanitizeData(req.body) as CreateTaskRequest;

      delete newData.id;
      delete newData.order;

      const newTask = Task.createTask(newData);

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
      const taskId = QueryParser.parseStringInt(req.params.id);
      const newData = this.sanitizeData(req.body) as UpdateTaskRequest;

      const updatedTask = Task.updateTask(taskId, newData);
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
      const taskId = QueryParser.parseStringInt(req.params.id);
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
      const taskId = QueryParser.parseStringInt(req.params.id);
      const { status, order } = req.body;

      const newStatus = QueryParser.parseEnum(status, ['todo', 'in-progress', 'done'], 'todo');

      const newOrder = QueryParser.parseNumber(order);

      const updatedTask = Task.moveTask(taskId, newStatus, newOrder);
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
      res.status(500).json({ error: (error as Error).message, tasks: (error as any).tasks });
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
