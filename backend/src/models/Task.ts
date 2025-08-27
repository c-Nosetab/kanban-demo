import { Task as TaskType, CreateTaskRequest, UpdateTaskRequest, TaskStatus } from '../types';

class Task {
  private tasks: TaskType[] = [];
  private nextId: number = 5;

  constructor() {
    this.initializeTasks();
  }

  private generateDate(dayDelta: number): string {
    const today = new Date();
    today.setDate(today.getDate() + dayDelta);
    return today.toISOString();
  }

  private generateTasks(): TaskType[] {
    return [
      {
        id: 1,
        title: "Design user interface mockups",
        description: "Create wireframes and high-fidelity designs for the main dashboard",
        status: "todo",
        priority: "high",
        dueDate: this.generateDate(-2),
        createdAt: "2025-08-26T10:00:00Z"
      },
      {
        id: 2,
        title: "Set up authentication system",
        description: "Implement JWT-based login and registration",
        status: "in-progress",
        priority: "medium",
        dueDate: this.generateDate(1),
        createdAt: "2025-08-26T11:00:00Z"
      },
      {
        id: 3,
        title: "Deploy to production",
        description: "Configure hosting and deployment pipeline",
        status: "done",
        priority: "low",
        dueDate: this.generateDate(-3),
        createdAt: "2025-08-25T09:00:00Z"
      },
      {
        id: 4,
        title: "Drag me to another column!",
        description: "Check out how the drag and drop works!",
        status: "todo",
        priority: "low",
        dueDate: this.generateDate(10),
        createdAt: "2025-09-03T10:00:00Z"
      },
    ];
  }

  private initializeTasks(): void {
    this.tasks = [...JSON.parse(JSON.stringify(this.generateTasks()))];
    this.nextId = 5;
  }

  public resetTasks(): void {
    this.initializeTasks();
    console.log(`[${new Date().toISOString()}] Tasks reset by cron job`);
  }

  public getAllTasks(): TaskType[] {
    return this.tasks;
  }

  public getTaskById(id: number): TaskType | undefined {
    return this.tasks.find(task => task.id === id);
  }

  public createTask(taskData: CreateTaskRequest): TaskType {
    const { title, description, priority, dueDate } = taskData;

    if (!title) {
      throw new Error('Title is required');
    }

    const newTask: TaskType = {
      id: this.nextId++,
      title,
      description: description || '',
      status: 'todo',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      createdAt: new Date().toISOString()
    };

    this.tasks.push(newTask);
    return newTask;
  }

  public updateTask(id: number, updateData: UpdateTaskRequest): TaskType {
    const taskIndex = this.tasks.findIndex(task => task.id === id);

    if (taskIndex === -1) {
      throw new Error('Task not found');
    }

    const updatedTask: TaskType = { ...this.tasks[taskIndex], ...updateData } as TaskType;
    this.tasks[taskIndex] = updatedTask;
    return updatedTask;
  }

  public deleteTask(id: number): boolean {
    const taskIndex = this.tasks.findIndex(task => task.id === id);

    if (taskIndex === -1) {
      throw new Error('Task not found');
    }

    this.tasks.splice(taskIndex, 1);
    return true;
  }

  public moveTask(id: number, status: TaskStatus): TaskType {
    if (!['todo', 'in-progress', 'done'].includes(status)) {
      throw new Error('Invalid status');
    }

    return this.updateTask(id, { status });
  }
}

export default new Task();
