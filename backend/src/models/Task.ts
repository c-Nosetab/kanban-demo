import { Task as TaskType, CreateTaskRequest, UpdateTaskRequest, TaskStatus } from '../types';

class Task {
  private tasks: TaskType[] = [];
  private nextId: number = 5;

  constructor() {
    this.initializeTasks();
  }

  private getTaskIndex(id: number): number {
    return this.tasks.findIndex(task => task.id === id);
  }

  private generateDate(dayDelta: number): string {
    const today = new Date();
    today.setDate(today.getDate() + dayDelta);
    return today.toISOString();
  }

  private generateTasks(): TaskType[] {
    return [
      // ! todo
      {
        id: 4,
        order: 0,
        title: "Drag me to another column!",
        description: "Check out how the drag and drop works!",
        status: "todo",
        priority: "low",
        dueDate: this.generateDate(10),
        createdAt: this.generateDate(0)
      },
      {
        id: 1,
        order: 1,
        title: "Design user interface mockups",
        description: "Create wireframes and high-fidelity designs for the main dashboard",
        status: "todo",
        priority: "high",
        dueDate: this.generateDate(-2),
        createdAt: this.generateDate(-20)
      },
      {
        id: 6,
        order: 2,
        title: "Medium Todo",
        description: "This is a task that is in the todo status.",
        status: "todo",
        priority: "medium",
        dueDate: this.generateDate(60),
        createdAt: this.generateDate(-3)
      },

      // ! in-progress
      {
        id: 2,
        order: 0,
        title: "Set up authentication system",
        description: "Implement JWT-based login and registration",
        status: "in-progress",
        priority: "medium",
        dueDate: this.generateDate(1),
        createdAt: this.generateDate(-25)
      },
      {
        id: 5,
        order: 1,
        title: "Wow, look at this task!",
        description: "Click to see the full description. This is a task that is in the in-progress status. Character limits for these are followed, but you can always see the full description details!",
        status: "in-progress",
        priority: "low",
        dueDate: this.generateDate(-20),
        createdAt: this.generateDate(-50)
      },
      // ! done
      {
        id: 3,
        order: 0,
        title: "Deploy to production",
        description: "Configure hosting and deployment pipeline",
        status: "done",
        priority: "low",
        dueDate: this.generateDate(-3),
        createdAt: this.generateDate(-5)
      },
    ];
  }

  private initializeTasks(): void {
    this.tasks = this.generateTasks();
    this.nextId = this.tasks.length + 1;
  }

  public resetTasks(): void {
    this.initializeTasks();
    console.log(`[${new Date().toISOString()}] Tasks reset by cron job`);
  }

  public getAllTasks({ sortBy = 'order', sortDirection = 'asc', priority = [], filterString = '' }:
    {
      sortBy?: keyof TaskType | undefined,
      sortDirection?: 'asc' | 'desc',
      priority?: ('low' | 'medium' | 'high')[],
      filterString?: string
    } = {}): TaskType[] {
    let tasks = this.tasks;


    // filter all the tasks
    tasks = tasks.filter(task => {
      let passes = true;

      if (filterString) {
        const inTitle = task.title.toLowerCase().includes(filterString.toLowerCase());
        const inDescription = task.description.toLowerCase().includes(filterString.toLowerCase());

        passes = inTitle || inDescription
      }

      return passes && priority.includes(task.priority);
    })

    if (!sortBy) {
      return tasks;
    }

    // sort the tasks
    if (sortBy === 'priority') {
      let priorityOrder = ['high', 'medium', 'low'];
      if (sortDirection === 'desc') {
        priorityOrder = priorityOrder.reverse();
      }

      tasks.sort((a, b) => {
        const aIndex = priorityOrder.indexOf(a.priority);
        const bIndex = priorityOrder.indexOf(b.priority);
        return aIndex - bIndex;
      });
      return tasks;
    }

    return tasks.sort((a, b) => {
      if ((a[sortBy] !== undefined) && (b[sortBy] !== undefined)) {
        if (a[sortBy]! < b[sortBy]!) return sortDirection === 'asc' ? -1 : 1;
        if (a[sortBy]! > b[sortBy]!) return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  public getTaskById(id: number): TaskType | undefined {
    return this.tasks.find(task => task.id === id);
  }

  public createTask(taskData: CreateTaskRequest): TaskType {
    const { title, description, priority, dueDate } = taskData;

    if (!title) {
      throw new Error('Title is required');
    }

    let newOrder = taskData?.order;

    if (!newOrder) {
      const todoTasks = this.tasks.filter(task => task.status === 'todo');
      const maxOrder = Math.max(...todoTasks.map(task => task.order));
      newOrder = maxOrder + 1;
    }

    const newTask: TaskType = {
      id: this.nextId++,
      order: newOrder,
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
    const taskIndex = this.getTaskIndex(id);

    if (taskIndex === -1) {
      throw new Error('Task not found');
    }
    const taskToUpdate = this.tasks[taskIndex]!;

    if (taskToUpdate.status !== updateData.status) {
      this.moveTask(id, updateData.status!);
    }

    const updatedTask: TaskType = { ...taskToUpdate, ...updateData };

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

  public moveTask(id: number, newStatus: TaskStatus, newOrder: number = 0): TaskType {
    const taskIndex = this.getTaskIndex(id);

    if (taskIndex === -1) {
      throw {
        err: new Error(`Task not found top - ${id}`),
        tasks: this.tasks,
      };
    }
    const taskToUpdate = this.tasks[taskIndex]!;


    const updateBodies = [];
    if (newStatus !== taskToUpdate.status) {
      const tasksInPreviousStatus = this.tasks
        .filter(task => task.status === taskToUpdate.status && task.id !== id)
        .sort((a, b) => a.order - b.order);
      const prevUpdateBodies = tasksInPreviousStatus.map((task, i) => ({ ...task, order: i }));

      updateBodies.push(...prevUpdateBodies);
    }

    const tasksInNewStatus = this.tasks
      .filter(task => task.status === newStatus && task.id !== id)
      .sort((a, b) => a.order - b.order);
    const newUpdateBodies = tasksInNewStatus.map((task, i) => {
      return {
        ...task,
        order: i < newOrder ? i : i + 1,
      }
    })
    updateBodies.push(...newUpdateBodies);

    const updatedTask: TaskType = {
      ...taskToUpdate,
      status: newStatus,
      order: newOrder,
    };
    updateBodies.push(updatedTask);

    updateBodies.forEach(task => {
      const taskIndex = this.getTaskIndex(task.id)

      if (taskIndex === -1) {
        throw new Error(`Task not found loop - ${task.title}`);
      }

      const taskToUpdate = this.tasks[taskIndex]!;
      this.tasks[taskIndex] = { ...taskToUpdate, ...task };
    });

    return updatedTask;
  }
}

export default new Task();
