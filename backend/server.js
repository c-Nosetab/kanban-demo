require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const app = express();
const PORT = process.env.PORT || 3000;

// CORS Configuration - Whitelist only frontend origin
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:4200';

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (origin === allowedOrigin) {
      callback(null, true);
    } else {
      console.log(`Blocked request from unauthorized origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: process.env.RATE_LIMIT_MESSAGE || 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    console.log(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: process.env.RATE_LIMIT_MESSAGE || 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS) / 1000 / 60) // minutes
    });
  }
});

// Apply rate limiting to all routes
app.use(limiter);

app.use(express.json());

const generateDate = (dayDelta) => {
  const today = new Date();
  today.setDate(today.getDate() + dayDelta);
  return today.toISOString();
}

// In-memory data store
const generateTasks = () => {
  return [
    {
      id: 1,
      title: "Design user interface mockups",
      description: "Create wireframes and high-fidelity designs for the main dashboard",
      status: "todo",
      priority: "high",
      dueDate: generateDate(-2),
      createdAt: "2025-08-26T10:00:00Z"
    },
    {
      id: 2,
      title: "Set up authentication system",
      description: "Implement JWT-based login and registration",
      status: "in-progress",
      priority: "medium",
      dueDate: generateDate(1),
      createdAt: "2025-08-26T11:00:00Z"
    },
    {
      id: 3,
      title: "Deploy to production",
      description: "Configure hosting and deployment pipeline",
      status: "done",
      priority: "low",
      dueDate: generateDate(-3),
      createdAt: "2025-08-25T09:00:00Z"
    },
    {
      id: 4,
      title: "Drag me to another column!",
      description: "Check out how the drag and drop works!",
      status: "todo",
      priority: "low",
      dueDate: generateDate(10),
      createdAt: "2025-09-03T10:00:00Z"
    },
  ];
}

let tasks = [...JSON.parse(JSON.stringify(generateTasks()))];

let nextId = 5;

// Function to reset tasks
const resetTasks = () => {
  tasks = [...JSON.parse(JSON.stringify(generateTasks()))];
  nextId = 5;
  console.log(`[${new Date().toISOString()}] Tasks reset by cron job`);
};

// Set up cron job to run every 20 minutes
cron.schedule('*/20 * * * *', () => {
  resetTasks();
}, {
  scheduled: true,
  timezone: "UTC"
});

console.log('Cron job scheduled: Tasks will reset every 20 minutes');

app.post('/api/tasks/reset', (req, res) => {
  resetTasks();
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

// GET /api/cron/status - Get cron job status
app.get('/api/cron/status', (req, res) => {
  const now = new Date();
  const nextRun = new Date(now.getTime() + (20 * 60 * 1000)); // 20 minutes from now

  res.json({
    status: 'active',
    schedule: 'every 20 minutes',
    nextRun: nextRun.toISOString(),
    lastReset: now.toISOString(),
    timezone: 'UTC'
  });
});

// GET /api/security/status - Get security configuration status
app.get('/api/security/status', (req, res) => {
  res.json({
    cors: {
      enabled: true,
      allowedOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:4200',
      credentials: true
    },
    rateLimit: {
      enabled: true,
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
      windowMinutes: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000 / 60)
    },
    environment: process.env.NODE_ENV || 'development'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔒 CORS enabled - Allowed origin: ${process.env.FRONTEND_ORIGIN || 'http://localhost:4200'}`);
  console.log(`⏱️  Rate limiting: ${process.env.RATE_LIMIT_MAX_REQUESTS || 100} requests per ${Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000 / 60)} minutes`);
  console.log(`🔄 Cron job active: Tasks will reset every 20 minutes`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});