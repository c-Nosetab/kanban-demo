# Task Board Manager

A kanban-style task management application built with Angular and Express.js for portfolio demonstration.

## Project Structure

```
kanban/
├── backend/          # Express.js API server
│   ├── server.js     # Main server file
│   └── package.json  # Backend dependencies
├── frontend/         # Angular application
│   ├── src/app/      # Angular app source
│   └── package.json  # Frontend dependencies
└── task_board_app_spec.md  # Complete project specification
```

## Quick Start

### 1. Start the Backend Server
```bash
cd backend
npm install
npm run dev
```
Server runs on http://localhost:3000

### 2. Start the Frontend Application
```bash
cd frontend
npm install
npm start
```
Application runs on http://localhost:4200

## Technology Stack

- **Frontend**: Angular 20+ with TypeScript, Angular CDK
- **Backend**: Express.js with Node.js
- **Data Storage**: In-memory JavaScript arrays
- **Styling**: CSS with custom design system

## Features

### Implemented (Skeleton)
- ✅ Express.js API with full CRUD operations
- ✅ Angular components and routing structure
- ✅ TypeScript interfaces and models
- ✅ Responsive CSS styling system
- ✅ Task priority and due date support
- ✅ Modal forms for task management

### TODO (Business Logic)
- 🔄 API integration in Angular components
- 🔄 Drag and drop functionality
- 🔄 Form validation and error handling
- 🔄 Loading states and animations
- 🔄 Task filtering and sorting

## API Endpoints

- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create a new task  
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task
- `PUT /api/tasks/:id/move` - Move task to different status
- `POST /api/tasks/reset` - Reset to initial data

## Development Notes

This project provides a complete skeleton structure with:
- Fully functional backend API
- Complete component architecture
- Styling and design system
- TypeScript interfaces and types
- Routing configuration
- Service layer structure

The business logic implementation (API calls, drag/drop, validation) is marked with TODO comments for future development.

## Portfolio Positioning

Demonstrates:
- Full-stack TypeScript development
- Angular component architecture and state management
- Express.js API design and implementation
- Modern UI/UX patterns and responsive design
- Clean code organization and documentation