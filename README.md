# TASKMAN (Tasking Manager)

TASKMAN is a premium, full-stack project governance and team management platform. Designed for high-performance delivery, it provides a command-layer view of project health, employee staffing, and real-time task tracking.

## 🚀 Key Features

- **Advanced Branding**: New identity as "TASKMAN" with a professional transparent flying-man logo integrated throughout the platform.
- **Secure Authentication**: 
  - Dual-mode (Login/Signup) panel with role selection (Admin/Employee).
  - **Company ID Verification**: New mandatory security layer requiring a company-issued ID for all new signups.
- **Role-Based Access Control (RBAC)**:
  - **Admins**: Full management of the project portfolio, team staffing, and task delegation.
  - **Employees**: Focused "My Work" view limited to assigned projects and tasks to ensure maximum productivity.
- **Dynamic Project Governance**:
  - **Member Invitation**: Admins can invite team members via email directly from the Projects page.
  - **Interactive Kanban Board**: Visual task tracking with status-specific columns and real-time updates.
  - **Project Portfolio**: Management-level view of all active work streams.
- **Real-Time Analytics**: 
  - Automated dashboard metrics for completion rates, overdue work, and overall project health.
  - Live activity feed tracking project and task lifecycle events.
- **Responsive UI**: Premium "Light Theme" design with dynamic page headers and high-contrast accessibility.

## 🛠 Tech Stack

- **Frontend**: React.js with `react-router-dom` for multi-page navigation.
- **Styling**: Vanilla CSS with a custom design system and Lucide-React icons.
- **Backend**: Node.js & Express.
- **Database**: SQLite with Sequelize ORM for persistent data management.
- **Security**: JWT (JSON Web Tokens) for session management and Bcrypt for password hashing.

## 📦 Getting Started

### Prerequisites
- Node.js (v16+)
- npm

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

3. **Access**:
   Open `http://localhost:5173` in your browser.

## 📋 Credentials
For testing purposes, the following roles are available:
- **Admin**: `admin@taskflow.dev` (Password: `Taskflow@123`)
- **Employee**: `maya@taskflow.dev` (Password: `Taskflow@123`)
