# Task Board Manager - Backend

Express.js API server for the Task Board Manager application.

## Setup

```bash
npm install
npm run dev
```

## API Endpoints

- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task
- `PUT /api/tasks/:id/move` - Move task to different status
- `POST /api/tasks/reset` - Reset to initial data

## Data Model

```javascript
{
  id: number,
  title: string,
  description?: string,
  status: 'todo' | 'in-progress' | 'done',
  priority: 'low' | 'medium' | 'high',
  dueDate?: string,
  createdAt: string
}
```

Server runs on http://localhost:3000