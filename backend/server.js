const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// In-memory data store
const initialTasks = Object.freeze([
  {
    id: 1,
    title: "Design user interface mockups",
    description: "Create wireframes and high-fidelity designs for the main dashboard",
    status: "todo",
    priority: "high",
    dueDate: "2025-09-15",
    createdAt: "2025-08-26T10:00:00Z"
  },
  {
    id: 2,
    title: "Set up authentication system",
    description: "Implement JWT-based login and registration",
    status: "in-progress",
    priority: "medium",
    dueDate: "2025-09-20",
    createdAt: "2025-08-26T11:00:00Z"
  },
  {
    id: 3,
    title: "Deploy to production",
    description: "Configure hosting and deployment pipeline",
    status: "done",
    priority: "low",
    dueDate: "2025-08-25",
    createdAt: "2025-08-25T09:00:00Z"
  },
  {
    id: 4,
    title: "Drag me to another column!",
    description: "Check out how the drag and drop works!",
    status: "todo",
    priority: "low",
    dueDate: "2025-09-15",
    createdAt: "2025-09-03T10:00:00Z"
  },
]); // freeze array

let tasks = [...JSON.parse(JSON.stringify(initialTasks))];

let nextId = 4;

app.post('/api/tasks/reset', (req, res) => {
  tasks = [...JSON.parse(JSON.stringify(initialTasks))];
  nextId = 4;

  res.status(200).json(tasks);
});

// GET /api/tasks - Retrieve all tasks
app.get('/api/tasks', (req, res) => {
  res.json(tasks);
});

// POST /api/tasks - Create new task
app.post('/api/tasks', (req, res) => {
  const { title, description, priority, dueDate } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const newTask = {
    id: nextId++,
    title,
    description: description || '',
    status: 'todo',
    priority: priority || 'medium',
    dueDate: dueDate || null,
    createdAt: new Date().toISOString()
  };

  tasks.push(newTask);
  res.status(201).json(newTask);
});

// PUT /api/tasks/:id - Update existing task
app.put('/api/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const taskIndex = tasks.findIndex(task => task.id === taskId);

  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const updatedTask = { ...tasks[taskIndex], ...req.body };
  tasks[taskIndex] = updatedTask;
  res.json(updatedTask);
});

// DELETE /api/tasks/:id - Delete task
app.delete('/api/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const taskIndex = tasks.findIndex(task => task.id === taskId);

  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  tasks.splice(taskIndex, 1);
  res.status(204).send();
});

// PUT /api/tasks/:id/move - Update task status (for drag-drop)
app.put('/api/tasks/:id/move', (req, res) => {
  const taskId = parseInt(req.params.id);
  const { status } = req.body;
  const taskIndex = tasks.findIndex(task => task.id === taskId);

  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  if (!['todo', 'in-progress', 'done'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  tasks[taskIndex].status = status;
  res.json(tasks[taskIndex]);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});