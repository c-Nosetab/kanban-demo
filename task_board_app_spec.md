# Task Board Manager - Complete Development Specification

## Project Overview
A kanban-style task management application demonstrating Angular frontend with Express.js backend integration. Data stored in memory for simplified portfolio demonstration.

## Technology Stack
- **Frontend**: Angular 15+ with TypeScript, Angular CDK (drag-drop)
- **Backend**: Express.js with Node.js
- **Data Storage**: In-memory JavaScript arrays
- **Styling**: Angular Material or plain CSS with Flexbox/Grid

## Application Structure

### Frontend Pages (2 total)

#### 1. Dashboard (Main Board)
- **Route**: `/dashboard` (default route)
- **Components**: 
  - `BoardComponent` (main container)
  - `ColumnComponent` (todo, in-progress, done)
  - `TaskCardComponent` (individual tasks)
  - `TaskFormComponent` (create/edit modal)

#### 2. Task Details Modal
- **Trigger**: Click on task card or "Add Task" button
- **Form Fields**:
  - Title (required, max 100 chars)
  - Description (optional, max 500 chars)
  - Priority (High/Medium/Low dropdown)
  - Due Date (date picker)
  - Status (Todo/In Progress/Done)

### Backend API Endpoints

#### Task Management
```javascript
GET    /api/tasks           // Retrieve all tasks
POST   /api/tasks           // Create new task
PUT    /api/tasks/:id       // Update existing task
DELETE /api/tasks/:id       // Delete task
PUT    /api/tasks/:id/move  // Update task status (for drag-drop)
```

#### Request/Response Examples
```javascript
// GET /api/tasks Response
[
  {
    id: 1,
    title: "Design user interface mockups",
    description: "Create wireframes and high-fidelity designs",
    status: "todo",
    priority: "high",
    dueDate: "2025-09-15",
    createdAt: "2025-08-26T10:00:00Z"
  }
]

// POST /api/tasks Request Body
{
  title: "Implement authentication",
  description: "Add login/logout functionality",
  priority: "medium",
  dueDate: "2025-09-20"
}

// PUT /api/tasks/1/move Request Body
{
  status: "in-progress"
}
```

## Data Model

### Task Object Structure
```typescript
interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string; // ISO date string
  createdAt: string; // ISO date string
}
```

## Backend Implementation

### Server Setup (server.js)
```javascript
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// In-memory data store
let tasks = [
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
  }
];

let nextId = 4;

// API routes implementation here...
```

## Frontend Implementation

### Angular Service (task.service.ts)
```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface Task {
  id?: number;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/tasks`);
  }

  createTask(task: Task): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/tasks`, task);
  }

  updateTask(id: number, task: Partial<Task>): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/tasks/${id}`, task);
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tasks/${id}`);
  }

  moveTask(id: number, newStatus: string): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/tasks/${id}/move`, { status: newStatus });
  }
}
```

## UI Design Specifications

### Board Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ TASK BOARD MANAGER                               [+ Add Task]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   TODO              IN PROGRESS           DONE                  │
│ ┌─────────────┐   ┌─────────────┐   ┌─────────────┐             │
│ │ Task Title  │   │ Task Title  │   │ Task Title  │             │
│ │ [High] 🔴    │   │ [Med] 🟡     │   │ [Low] 🟢     │             │
│ │ Due: 9/15   │   │ Due: 9/20   │   │ Due: 8/25   │             │
│ │ [Edit][Del] │   │ [Edit][Del] │   │ [Edit][Del] │             │
│ └─────────────┘   └─────────────┘   └─────────────┘             │
│                                                                 │
│ ┌─────────────┐   ┌─────────────┐                               │
│ │ Task Title  │   │ Task Title  │                               │
│ │ [Med] 🟡     │   │ [High] 🔴    │                               │
│ │ Due: 9/18   │   │ Due: 9/25   │                               │
│ │ [Edit][Del] │   │ [Edit][Del] │                               │
│ └─────────────┘   └─────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

### Task Card Design
- **Title**: Bold, truncated at 2 lines
- **Priority**: Color-coded badge (Red=High, Yellow=Medium, Green=Low)
- **Due Date**: Small text, highlight if overdue
- **Actions**: Edit and Delete icons on hover
- **Drag Handle**: Subtle visual indicator for dragging

### Color Scheme
- **Primary**: #2196F3 (Blue)
- **Success**: #4CAF50 (Green)
- **Warning**: #FF9800 (Orange)  
- **Danger**: #F44336 (Red)
- **Background**: #F5F5F5 (Light Gray)
- **Cards**: #FFFFFF (White)

## Key Features Implementation

### 1. Drag and Drop
- Use Angular CDK's drag-drop module
- Allow dropping tasks between columns
- Visual feedback during drag operations
- Update task status via API on successful drop

### 2. Task Priority
- Visual indicators using color-coded badges
- Sort tasks by priority within each column
- Filter/search by priority level

### 3. Due Date Management
- Highlight overdue tasks
- Sort by due date within priority groups
- Date picker for setting due dates

### 4. Responsive Design
- Mobile-friendly layout (stack columns vertically)
- Touch-friendly drag operations on mobile
- Responsive task card sizing

## Development Workflow

### Phase 1: Backend Setup (Day 1)
1. Initialize Express.js project
2. Set up basic API endpoints with in-memory data
3. Add CORS for Angular integration
4. Test API endpoints with Postman/curl

### Phase 2: Angular Frontend (Day 2-3)
1. Create Angular project with routing
2. Set up TaskService with HTTP client
3. Build basic board layout with static data
4. Create task card component with styling

### Phase 3: Integration (Day 4)
1. Connect Angular service to Express API
2. Implement CRUD operations
3. Add form validation and error handling
4. Test full application flow

### Phase 4: Polish (Day 5)
1. Add drag-and-drop functionality
2. Implement responsive design
3. Add loading states and animations
4. Deploy to hosting platforms

## Deployment Strategy

### Frontend (Vercel)
- Build Angular app for production
- Deploy to Vercel with automatic builds
- Configure environment variables for API URL

### Backend (Railway/Heroku)
- Deploy Express.js server
- Set up CORS for production domain
- Configure port for hosting platform

## Portfolio Positioning
This project demonstrates:
- Full-stack TypeScript development
- Angular component architecture and state management
- Express.js API design and implementation
- Modern UI/UX patterns (drag-drop, responsive design)
- Integration between frontend and backend systems
- Practical business application (task management)