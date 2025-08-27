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
- `GET /api/cron/status` - Get cron job status
- `GET /api/security/status` - Get security configuration status

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

## Cron Jobs

The server includes an automated task reset that runs every 20 minutes using node-cron. This ensures the demo data is regularly refreshed for demo purposes.

- **Schedule**: Every 20 minutes (`*/20 * * * *`)
- **Timezone**: UTC
- **Function**: Resets all tasks to initial demo data

## Security Features

### CORS Protection
- **Whitelist Only**: Only requests from the configured `FRONTEND_ORIGIN` are allowed
- **Environment Configurable**: Set via `FRONTEND_ORIGIN` environment variable
- **Credentials Support**: CORS credentials are enabled for authenticated requests

### Rate Limiting
- **Request Limits**: Configurable requests per time window (default: 100 requests per 15 minutes)
- **IP-based**: Limits are applied per IP address
- **Custom Messages**: Configurable error messages via environment variables
- **Headers**: Standard rate limit headers are included in responses

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```bash
# CORS Configuration
FRONTEND_ORIGIN=http://localhost:4200

# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_MESSAGE=Too many requests from this IP, please try again later.

# Server Configuration
PORT=3000
NODE_ENV=development
```

## Dependencies

- express
- cors
- node-cron
- express-rate-limit
- dotenv

Server runs on http://localhost:3000