# TASKMAN (Tasking Manager)

TASKMAN is a premium, full-stack project governance and team management platform. Designed for high-performance delivery, it provides a command-layer view of project health, employee staffing, and real-time task tracking.

## 🚀 Key Features

### 💎 Premium Interface & UX
- **Modern Aesthetic**: A sleek "Light Theme" design utilizing glassmorphism, subtle shadows, and a professional monochrome palette with vibrant accent colors.
- **Dynamic Headers**: Context-aware page headers that change automatically (e.g., "Project Portfolio", "Task Management") as you navigate the workspace.
- **Responsive Layout**: A fully adaptive interface featuring a persistent sidebar (Rail Navigation) for seamless transitions between sections.
- **Advanced Branding**: Integrated "TASKMAN" identity with a custom transparent flying-man logo and premium Syne typography.

### 📊 Intelligent Dashboard
- **Real-Time Analytics**: Instant visibility into critical KPIs:
  - **Completion Rate**: Dynamic calculation of overall team productivity.
  - **Overdue Work**: Automatic flagging of tasks past their deadline.
  - **Active Workload**: Tracking of all projects currently under progress.
- **Project Health Monitoring**: High-level status distribution (Not Started, In Progress, Blocked, Done) to identify risks at a glance.
- **Activity Feed**: A live chronological log of all platform events, including project creation, task assignments, and status changes.

### 🛡️ Project Governance (Admin)
- **Member Invitation**: Effortlessly scale your team by inviting members via email address directly into the workspace.
- **Portfolio Management**: Create, edit, and archive projects with detailed metadata (Type, Priority, Deadlines).
- **Kanban Task Board**: A drag-and-drop style interface for moving tasks through the delivery pipeline.
- **Resource Allocation**: Assign specific team members to projects and tasks with granular control.
- **Company ID Verification**: A secure signup hurdle requiring a company-authorized ID to prevent unauthorized access.

### 🏃 Employee Experience
- **Focused Queue**: A personalized "My Work" view that hides management complexity and highlights immediate task priorities.
- **Task Lifecycle**: Simple status toggling (To Do, In Progress, Done) allowing employees to signal progress without friction.
- **Collaboration**: Direct visibility into project team members and shared deadlines.

## 🛠 Tech Stack

- **Frontend**: React.js with `react-router-dom` for SPA routing.
- **Styling**: Vanilla CSS with custom property variables and Lucide-React icons.
- **Backend**: Node.js & Express.
- **Database**: SQLite with Sequelize ORM.
- **Security**: JWT session management & Bcrypt hashing.

## 📦 Getting Started

### Prerequisites
- Node.js (v16+)

### Installation

1. **Backend Setup**:
   ```bash
   cd server
   npm install
   npm start
   ```

2. **Frontend Setup**:
   ```bash
   cd client
   npm install
   npm run dev
   ```

## 📋 Credentials
For testing purposes, the following roles are available:
- **Admin**: `admin@taskflow.dev` (Password: `Taskflow@123`)
- **Employee**: `maya@taskflow.dev` (Password: `Taskflow@123`)
