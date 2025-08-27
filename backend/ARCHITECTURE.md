# Backend Architecture

This document outlines the MVC (Model-View-Controller) architecture implemented in the Task Board Manager backend using TypeScript.

## Architecture Overview

The backend follows a clean separation of concerns with the following structure:

```
backend/
├── src/                 # TypeScript source code
│   ├── controllers/     # Request handlers (Controller layer)
│   ├── middleware/      # Express middleware
│   ├── models/          # Data models (Model layer)
│   ├── routes/          # Route definitions
│   ├── services/        # Business logic services
│   ├── types/           # TypeScript type definitions
│   └── server.ts        # Main application file
├── dist/                # Compiled JavaScript output
├── tsconfig.json        # TypeScript configuration
└── package.json         # Dependencies and scripts
```

## Layer Responsibilities

### **Models** (`/src/models`)
- **Task.ts**: Handles all data operations for tasks
  - Data generation and initialization
  - CRUD operations (Create, Read, Update, Delete)
  - Business logic for task management
  - Data validation

### **Controllers** (`/src/controllers`)
- **taskController.ts**: Handles HTTP requests for task operations
  - Request/response handling
  - Error handling and status codes
  - Input validation
  - Delegates business logic to models

- **systemController.ts**: Handles system-level endpoints
  - Cron job status
  - Security configuration status

### **Routes** (`/src/routes`)
- **taskRoutes.ts**: Defines task-related API endpoints
- **systemRoutes.ts**: Defines system-related API endpoints
- **index.ts**: Combines all routes and mounts them

### **Middleware** (`/src/middleware`)
- **security.ts**: Security-related middleware
  - CORS configuration
  - Rate limiting setup

### **Services** (`/src/services`)
- **cronService.ts**: Handles automated task reset functionality
  - Cron job scheduling
  - Status reporting

## Benefits of This Architecture

1. **Separation of Concerns**: Each layer has a specific responsibility
2. **Maintainability**: Easy to locate and modify specific functionality
3. **Testability**: Each component can be tested independently
4. **Scalability**: Easy to add new features without affecting existing code
5. **Reusability**: Components can be reused across different parts of the application

## TypeScript Benefits

1. **Type Safety**: Compile-time error checking prevents runtime errors
2. **Better IDE Support**: Enhanced autocomplete, refactoring, and debugging
3. **Self-Documenting Code**: Types serve as inline documentation
4. **Easier Refactoring**: Safe refactoring with confidence
5. **Better Team Collaboration**: Clear interfaces and contracts
6. **Enhanced Error Handling**: Type-safe error handling patterns

## API Endpoints

All endpoints are prefixed with `/api`:

### Task Endpoints
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PUT /api/tasks/:id/move` - Move task to different status
- `POST /api/tasks/reset` - Reset to initial data

### System Endpoints
- `GET /api/cron/status` - Get cron job status
- `GET /api/security/status` - Get security configuration

## Data Flow

1. **Request** → Routes → Controller → Model → Service
2. **Response** ← Controller ← Model ← Service

This ensures clean data flow and proper separation of concerns throughout the application.
