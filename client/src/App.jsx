import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, NavLink, useLocation } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  Clock3,
  Edit3,
  Filter,
  KanbanSquare,
  ListChecks,
  Lock,
  LogOut,
  Mail,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X
} from 'lucide-react';

const AUTH_KEY = 'taskflow_auth';

const PROJECT_STATUSES = [
  { id: 'not-started', label: 'Not started', short: 'Start', tone: 'neutral' },
  { id: 'in-progress', label: 'Under progress', short: 'Active', tone: 'blue' },
  { id: 'blocked', label: 'Blocked', short: 'Risk', tone: 'red' },
  { id: 'done', label: 'Done', short: 'Done', tone: 'green' }
];

const TASK_STATUSES = [
  { id: 'todo', label: 'To do', tone: 'neutral' },
  { id: 'in-progress', label: 'In progress', tone: 'blue' },
  { id: 'review', label: 'Review', tone: 'amber' },
  { id: 'blocked', label: 'Blocked', tone: 'red' },
  { id: 'done', label: 'Done', tone: 'green' }
];

const PRIORITIES = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
  { id: 'urgent', label: 'Urgent' }
];

const todayInput = () => new Date().toISOString().slice(0, 10);

const addDaysInput = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const statusLabel = (collection, value) =>
  collection.find((item) => item.id === value)?.label || value;

const statusTone = (collection, value) =>
  collection.find((item) => item.id === value)?.tone || 'neutral';

const formatDate = (date) =>
  new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(`${date}T00:00:00`));

const isOverdue = (date, status) => {
  const due = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today && status !== 'done';
};

async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const response = await fetch(`/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Request failed. Please try again.');
  }
  return data;
}

function useStoredAuth() {
  const [auth, setAuthState] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(AUTH_KEY)) || { token: '', user: null };
    } catch {
      return { token: '', user: null };
    }
  });

  const setAuth = useCallback((nextAuth) => {
    setAuthState(nextAuth);
    if (nextAuth?.token) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(nextAuth));
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
  }, []);

  return [auth, setAuth];
}

function AuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('ADMIN');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    companyId: ''
  });
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const updateForm = (field, value) => {
    setMessage('');
    setForm((current) => ({ ...current, [field]: value }));
  };

  const fillDemo = (nextRole) => {
    setMode('login');
    setRole(nextRole);
    setMessage('');
    setForm({
      name: '',
      email: nextRole === 'ADMIN' ? 'admin@taskflow.dev' : 'maya@taskflow.dev',
      password: 'Taskflow@123'
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');

    try {
      const data = await apiRequest(`/auth/${mode === 'login' ? 'login' : 'signup'}`, {
        method: 'POST',
        body: {
          role,
          name: form.name,
          email: form.email,
          password: form.password,
          companyId: form.companyId
        }
      });
      onAuthSuccess({ token: data.token, user: data.user });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-screen">
      <section className="auth-shell" aria-label="TASKMAN authentication">
        <div className="auth-copy">
          <div className="brand-lockup">
            <span className="brand-mark" style={{ background: 'transparent', padding: 0 }}>
              <img src="/logo-transparent.png" alt="TASKMAN Icon" style={{ height: '32px', width: 'auto' }} />
            </span>
            <span>TASKMAN</span>
          </div>
          <h1>Team delivery, controlled from one sharp workspace.</h1>
          <p>
            A focused command layer for project ownership, employee delivery, and
            deadline visibility.
          </p>
          <div className="auth-proof">
            <span>
              <ShieldCheck size={16} /> RBAC
            </span>
            <span>
              <BarChart3 size={16} /> Analytics
            </span>
            <span>
              <KanbanSquare size={16} /> Live board
            </span>
          </div>
        </div>

        <form className="auth-card" onSubmit={submit}>
          <div className="form-head">
            <div>
              <p className="eyebrow">Secure access</p>
              <h2>{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
            </div>
            <div className="mode-tabs" role="tablist" aria-label="Auth mode">
              <button
                type="button"
                className={mode === 'login' ? 'active' : ''}
                onClick={() => {
                  setMode('login');
                  setMessage('');
                }}
              >
                Login
              </button>
              <button
                type="button"
                className={mode === 'signup' ? 'active' : ''}
                onClick={() => {
                  setMode('signup');
                  setMessage('');
                }}
              >
                Signup
              </button>
            </div>
          </div>

          <div className="role-choice" aria-label="Choose login role">
            <button
              type="button"
              className={role === 'ADMIN' ? 'active' : ''}
              onClick={() => setRole('ADMIN')}
            >
              <ShieldCheck size={18} />
              <span>Admin</span>
            </button>
            <button
              type="button"
              className={role === 'MEMBER' ? 'active' : ''}
              onClick={() => setRole('MEMBER')}
            >
              <UserCheck size={18} />
              <span>Employee</span>
            </button>
          </div>

          {mode === 'signup' && (
            <>
              <label className="input-field">
                <span>Company ID</span>
                <input
                  value={form.companyId}
                  onChange={(event) => updateForm('companyId', event.target.value)}
                  placeholder="Enter Company ID"
                  required={mode === 'signup'}
                />
              </label>
              <label className="input-field">
                <span>Full name</span>
                <input
                  value={form.name}
                  onChange={(event) => updateForm('name', event.target.value)}
                  placeholder="Enter name"
                  autoComplete="name"
                  required={mode === 'signup'}
                />
              </label>
            </>
          )}

          <label className="input-field">
            <span>Email</span>
            <div className="input-with-icon">
              <Mail size={18} />
              <input
                value={form.email}
                onChange={(event) => updateForm('email', event.target.value)}
                placeholder="name@company.com"
                autoComplete="email"
              />
            </div>
          </label>

          <label className="input-field">
            <span>Password</span>
            <div className="input-with-icon">
              <Lock size={18} />
              <input
                type="password"
                value={form.password}
                onChange={(event) => updateForm('password', event.target.value)}
                placeholder="Minimum 8 characters"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>
          </label>

          {message && (
            <div className="form-alert" role="alert">
              <AlertTriangle size={16} />
              <span>{message}</span>
            </div>
          )}

          <button className="primary-action" type="submit" disabled={busy}>
            {busy ? 'Processing...' : mode === 'login' ? 'Login' : 'Create workspace'}
          </button>


        </form>
      </section>
    </main>
  );
}

function App() {
  const [auth, setAuth] = useStoredAuth();
  const [checking, setChecking] = useState(Boolean(auth.token));

  useEffect(() => {
    let ignore = false;
    if (!auth.token) {
      setChecking(false);
      return undefined;
    }

    apiRequest('/auth/me', { token: auth.token })
      .then((data) => {
        if (!ignore) setAuth({ token: auth.token, user: data.user });
      })
      .catch(() => {
        if (!ignore) setAuth({ token: '', user: null });
      })
      .finally(() => {
        if (!ignore) setChecking(false);
      });

    return () => {
      ignore = true;
    };
  }, [auth.token, setAuth]);

  if (checking) {
    return (
      <main className="loading-screen">
        <CircleDot className="spin" size={28} />
        <span>Opening workspace</span>
      </main>
    );
  }

  if (!auth.user) {
    return <AuthPage onAuthSuccess={setAuth} />;
  }

  return (
    <Workspace
      auth={auth}
      onLogout={() => {
        setAuth({ token: '', user: null });
      }}
    />
  );
}

function Workspace({ auth, onLogout }) {
  const { token, user } = auth;
  const location = useLocation();
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [editingProject, setEditingProject] = useState(null);
  const [projectFilter, setProjectFilter] = useState('all');
  const [taskFilter, setTaskFilter] = useState('all');
  const [memberFilter, setMemberFilter] = useState('all');
  const [search, setSearch] = useState('');

  const isAdmin = user.role === 'ADMIN';

  const loadWorkspace = useCallback(async () => {
    setError('');
    const [projectData, dashboardData, userData] = await Promise.all([
      apiRequest('/projects', { token }),
      apiRequest('/dashboard', { token }),
      isAdmin
        ? apiRequest('/users?role=MEMBER', { token })
        : Promise.resolve({ users: [] })
    ]);

    setProjects(projectData.projects);
    setDashboard(dashboardData);
    setMembers(userData.users);
  }, [isAdmin, token]);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    loadWorkspace()
      .catch((loadError) => {
        if (!ignore) setError(loadError.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [loadWorkspace]);

  const allTasks = useMemo(
    () =>
      projects.flatMap((project) =>
        project.tasks.map((task) => ({
          ...task,
          projectName: project.name,
          projectStatus: project.status,
          projectDeadline: project.deadline,
          projectMembers: project.members
        }))
      ),
    [projects]
  );

  const filteredProjects = useMemo(() => {
    const term = search.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesSearch =
        !term ||
        [project.name, project.type, project.description]
          .join(' ')
          .toLowerCase()
          .includes(term);
      const matchesStatus =
        projectFilter === 'all' || project.status === projectFilter;
      const matchesMember =
        memberFilter === 'all' ||
        project.members.some((member) => String(member.id) === memberFilter);
      return matchesSearch && matchesStatus && matchesMember;
    });
  }, [memberFilter, projectFilter, projects, search]);

  const filteredTasks = useMemo(() => {
    const term = search.trim().toLowerCase();
    return allTasks.filter((task) => {
      const matchesSearch =
        !term ||
        [task.title, task.description, task.projectName, task.assignee?.name]
          .join(' ')
          .toLowerCase()
          .includes(term);
      const matchesStatus = taskFilter === 'all' || task.status === taskFilter;
      const matchesMember =
        memberFilter === 'all' || String(task.assigneeId) === memberFilter;
      return matchesSearch && matchesStatus && matchesMember;
    });
  }, [allTasks, memberFilter, search, taskFilter]);

  const runAction = async (action, successMessage) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
      await loadWorkspace();
      if (successMessage) setNotice(successMessage);
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setBusy(false);
    }
  };

  const inviteMember = async (email) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/users/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`
        },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        setMembers((prev) => [...prev, data.user]);
        setNotice('Member invited successfully.');
        setTimeout(() => setNotice(null), 3000);
        return { success: true };
      } else {
        return { success: false, error: data.message };
      }
    } catch (err) {
      return { success: false, error: 'Network error.' };
    } finally {
      setBusy(false);
    }
  };

  const createProject = (payload) =>
    runAction(
      () =>
        apiRequest('/projects', {
          method: 'POST',
          token,
          body: payload
        }),
      'Project created and assigned.'
    );

  const updateProject = (projectId, payload, message = 'Project updated.') =>
    runAction(
      () =>
        apiRequest(`/projects/${projectId}`, {
          method: 'PUT',
          token,
          body: payload
        }),
      message
    );

  const deleteProject = (projectId) => {
    if (!window.confirm('Delete this project and all related tasks?')) return;
    runAction(
      () =>
        apiRequest(`/projects/${projectId}`, {
          method: 'DELETE',
          token
        }),
      'Project deleted.'
    );
  };

  const createTask = (projectId, payload) =>
    runAction(
      () =>
        apiRequest(`/projects/${projectId}/tasks`, {
          method: 'POST',
          token,
          body: payload
        }),
      'Task assigned.'
    );

  const updateTask = (taskId, payload, message = 'Task updated.') =>
    runAction(
      () =>
        apiRequest(`/tasks/${taskId}`, {
          method: 'PUT',
          token,
          body: payload
        }),
      message
    );

  const deleteTask = (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    runAction(
      () =>
        apiRequest(`/tasks/${taskId}`, {
          method: 'DELETE',
          token
        }),
      'Task deleted.'
    );
  };

  return (
    <main className="workspace-screen">
      <Topbar user={user} onLogout={onLogout} />
      <div className="workspace-grid">
        <aside className="rail">
          <div className="rail-card">
            <p className="eyebrow">Signed in</p>
            <h2>{user.name}</h2>
            <span className={`role-pill ${isAdmin ? 'admin' : 'member'}`}>
              {isAdmin ? <ShieldCheck size={14} /> : <UserCheck size={14} />}
              {isAdmin ? 'Admin' : 'Employee'}
            </span>
          </div>
          <nav className="rail-nav" aria-label="Workspace sections">
            <NavLink to="/dashboard" className={({isActive}) => isActive ? 'active' : ''}>
              <BarChart3 size={17} /> Dashboard
            </NavLink>
            <NavLink to="/projects" className={({isActive}) => isActive ? 'active' : ''}>
              <BriefcaseBusiness size={17} /> Projects
            </NavLink>
            <NavLink to="/tasks" className={({isActive}) => isActive ? 'active' : ''}>
              <ListChecks size={17} /> Tasks
            </NavLink>
          </nav>

        </aside>

        <section className="workspace-content">
          {(() => {
            const path = location.pathname;
            let eyebrow = isAdmin ? 'Command center' : 'My work';
            let title = isAdmin ? 'Project operations dashboard' : 'Assigned workspace';
            
            if (path.includes('/projects')) {
              eyebrow = 'Management';
              title = 'Project Portfolio';
            } else if (path.includes('/tasks')) {
              eyebrow = 'Delivery';
              title = 'Task Management';
            }

            return (
              <div className="page-title">
                <div>
                  <p className="eyebrow">{eyebrow}</p>
                  <h1>{title}</h1>
                </div>
                <div className="title-actions">
                  <div className="search-box">
                    <Search size={17} />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search projects, tasks, people"
                    />
                  </div>
                </div>
              </div>
            );
          })()}

          {(error || notice) && (
            <div className={`notice ${error ? 'error' : 'success'}`} role="status">
              {error ? <AlertTriangle size={17} /> : <CheckCircle2 size={17} />}
              <span>{error || notice}</span>
            </div>
          )}

          {loading ? (
            <LoadingPanel />
          ) : (
            <>
              <FilterBar
                isAdmin={isAdmin}
                members={members}
                projectFilter={projectFilter}
                setProjectFilter={setProjectFilter}
                taskFilter={taskFilter}
                setTaskFilter={setTaskFilter}
                memberFilter={memberFilter}
                setMemberFilter={setMemberFilter}
              />

              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route
                  path="/dashboard"
                  element={
                    <>
                      <DashboardSummary dashboard={dashboard} />
                      <section className="section-block mt-4">
                        <SectionHeader
                          icon={<Activity size={19} />}
                          title="Recent activity"
                          meta="Latest changes"
                        />
                        <ActivityFeed activities={dashboard?.activities || []} />
                      </section>
                    </>
                  }
                />
                <Route
                  path="/projects"
                  element={
                    <>
                      {isAdmin && (
                        <section className="admin-tools mb-4">
                          <ProjectForm
                            members={members}
                            editingProject={editingProject}
                            busy={busy}
                            onCancel={() => setEditingProject(null)}
                            onSubmit={async (payload) => {
                              if (editingProject) {
                                await updateProject(editingProject.id, payload);
                                setEditingProject(null);
                              } else {
                                await createProject(payload);
                              }
                            }}
                          />
                          <InviteMemberForm busy={busy} onInvite={inviteMember} />
                        </section>
                      )}
                      <section id="projects" className="section-block">
                        <SectionHeader
                          icon={<KanbanSquare size={19} />}
                          title={isAdmin ? 'Project status board' : 'Assigned projects'}
                          meta={`${filteredProjects.length} visible`}
                        />
                        <ProjectBoard
                          isAdmin={isAdmin}
                          projects={filteredProjects}
                          busy={busy}
                          onStatusChange={(projectId, status) =>
                            updateProject(projectId, { status }, 'Project status changed.')
                          }
                          onEdit={(project) => setEditingProject(project)}
                          onDelete={deleteProject}
                        />
                      </section>
                    </>
                  }
                />
                <Route
                  path="/tasks"
                  element={
                    <>
                      {isAdmin && (
                        <section className="admin-tools mb-4">
                          <TaskForm
                            members={members}
                            projects={projects}
                            busy={busy}
                            onSubmit={createTask}
                          />
                        </section>
                      )}
                      <section id="tasks" className="section-block">
                        <SectionHeader
                          icon={<ListChecks size={19} />}
                          title={isAdmin ? 'Task control table' : 'My assigned tasks'}
                          meta={`${filteredTasks.length} visible`}
                        />
                        <TaskTable
                          isAdmin={isAdmin}
                          members={members}
                          tasks={filteredTasks}
                          busy={busy}
                          onUpdate={updateTask}
                          onDelete={deleteTask}
                        />
                      </section>
                    </>
                  }
                />
              </Routes>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function Topbar({ user, onLogout }) {
  return (
    <header className="topbar">
      <div className="brand-lockup compact">
        <span className="brand-mark" style={{ background: 'transparent', padding: 0 }}>
          <img src="/logo-transparent.png" alt="TASKMAN Icon" style={{ height: '24px', width: 'auto' }} />
        </span>
        <span>TASKMAN</span>
      </div>
      <div className="topbar-right">
        <span className="user-email">{user.email}</span>
        <button className="icon-button" onClick={onLogout} aria-label="Logout">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}

function LoadingPanel() {
  return (
    <div className="empty-panel">
      <CircleDot className="spin" size={24} />
      <span>Loading workspace</span>
    </div>
  );
}

function DashboardSummary({ dashboard }) {
  const metrics = dashboard?.metrics || {};
  const statusCounts = dashboard?.statusCounts || {};
  const projectStatusCounts = dashboard?.projectStatusCounts || {};

  const metricCards = [
    {
      label: 'Projects',
      value: metrics.projects || 0,
      icon: <BriefcaseBusiness size={19} />,
      tone: 'blue'
    },
    {
      label: 'Active tasks',
      value: metrics.activeTasks || 0,
      icon: <Clock3 size={19} />,
      tone: 'amber'
    },
    {
      label: 'Overdue',
      value: metrics.overdueTasks || 0,
      icon: <AlertTriangle size={19} />,
      tone: 'red'
    },
    {
      label: 'Completion',
      value: `${metrics.completionRate || 0}%`,
      icon: <CheckCircle2 size={19} />,
      tone: 'green'
    }
  ];

  return (
    <section className="dashboard-grid">
      <div className="metric-grid">
        {metricCards.map((card) => (
          <article className={`metric-card ${card.tone}`} key={card.label}>
            <span>{card.icon}</span>
            <div>
              <p>{card.label}</p>
              <strong>{card.value}</strong>
            </div>
          </article>
        ))}
      </div>

      <div className="analytics-panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Analysis</p>
            <h2>Status distribution</h2>
          </div>
          <BarChart3 size={20} />
        </div>

        <div className="bar-list">
          {TASK_STATUSES.map((status) => {
            const value = statusCounts[status.id] || 0;
            const total = Math.max(metrics.tasks || 1, 1);
            return (
              <div className="bar-row" key={status.id}>
                <span>{status.label}</span>
                <div className="bar-track">
                  <i
                    className={`tone-${status.tone}`}
                    style={{ width: `${Math.max((value / total) * 100, value ? 8 : 0)}%` }}
                  />
                </div>
                <b>{value}</b>
              </div>
            );
          })}
        </div>
      </div>

      <div className="analytics-panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Portfolio</p>
            <h2>Project health</h2>
          </div>
          <Activity size={20} />
        </div>

        <div className="project-health">
          {PROJECT_STATUSES.map((status) => (
            <div key={status.id}>
              <span className={`status-dot tone-${status.tone}`} />
              <p>{status.label}</p>
              <strong>{projectStatusCounts[status.id] || 0}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FilterBar({
  isAdmin,
  members,
  projectFilter,
  setProjectFilter,
  taskFilter,
  setTaskFilter,
  memberFilter,
  setMemberFilter
}) {
  return (
    <section className="filter-bar">
      <div className="filter-label">
        <Filter size={18} />
        <span>Filters</span>
      </div>
      <label>
        <span>Project</span>
        <select
          value={projectFilter}
          onChange={(event) => setProjectFilter(event.target.value)}
        >
          <option value="all">All project statuses</option>
          {PROJECT_STATUSES.map((status) => (
            <option value={status.id} key={status.id}>
              {status.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Task</span>
        <select value={taskFilter} onChange={(event) => setTaskFilter(event.target.value)}>
          <option value="all">All task statuses</option>
          {TASK_STATUSES.map((status) => (
            <option value={status.id} key={status.id}>
              {status.label}
            </option>
          ))}
        </select>
      </label>
      {isAdmin && (
        <label>
          <span>Employee</span>
          <select
            value={memberFilter}
            onChange={(event) => setMemberFilter(event.target.value)}
          >
            <option value="all">All employees</option>
            {members.map((member) => (
              <option value={member.id} key={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>
      )}
    </section>
  );
}

function SectionHeader({ icon, title, meta }) {
  return (
    <div className="section-head">
      <div>
        {icon}
        <h2>{title}</h2>
      </div>
      <span>{meta}</span>
    </div>
  );
}

function ProjectForm({ members, editingProject, busy, onCancel, onSubmit }) {
  const [form, setForm] = useState(() => projectFormDefaults());

  useEffect(() => {
    if (editingProject) {
      setForm({
        name: editingProject.name,
        type: editingProject.type,
        description: editingProject.description || '',
        deadline: editingProject.deadline,
        priority: editingProject.priority,
        status: editingProject.status,
        memberIds: editingProject.members.map((member) => member.id)
      });
    } else {
      setForm(projectFormDefaults());
    }
  }, [editingProject]);

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const toggleMember = (memberId) => {
    setForm((current) => ({
      ...current,
      memberIds: current.memberIds.includes(memberId)
        ? current.memberIds.filter((id) => id !== memberId)
        : [...current.memberIds, memberId]
    }));
  };

  return (
    <form
      className="tool-panel"
      onSubmit={async (event) => {
        event.preventDefault();
        await onSubmit(form);
      }}
    >
      <div className="panel-head">
        <div>
          <p className="eyebrow">{editingProject ? 'Edit project' : 'New project'}</p>
          <h2>{editingProject ? editingProject.name : 'Create and assign'}</h2>
        </div>
        {editingProject ? (
          <button className="ghost-icon" type="button" onClick={onCancel} aria-label="Cancel">
            <X size={18} />
          </button>
        ) : (
          <Plus size={20} />
        )}
      </div>

      <div className="form-grid">
        <label>
          <span>Project name</span>
          <input
            value={form.name}
            onChange={(event) => update('name', event.target.value)}
            placeholder="Client portal launch"
            required
          />
        </label>
        <label>
          <span>Type</span>
          <input
            value={form.type}
            onChange={(event) => update('type', event.target.value)}
            placeholder="Web platform"
            required
          />
        </label>
        <label>
          <span>Deadline</span>
          <input
            type="date"
            min={todayInput()}
            value={form.deadline}
            onChange={(event) => update('deadline', event.target.value)}
            required
          />
        </label>
        <label>
          <span>Priority</span>
          <select
            value={form.priority}
            onChange={(event) => update('priority', event.target.value)}
          >
            {PRIORITIES.map((priority) => (
              <option value={priority.id} key={priority.id}>
                {priority.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Status</span>
          <select value={form.status} onChange={(event) => update('status', event.target.value)}>
            {PROJECT_STATUSES.map((status) => (
              <option value={status.id} key={status.id}>
                {status.label}
              </option>
            ))}
          </select>
        </label>
        <label className="span-2">
          <span>Description</span>
          <textarea
            value={form.description}
            onChange={(event) => update('description', event.target.value)}
            placeholder="Short project brief"
            rows={3}
          />
        </label>
      </div>

      <div className="member-picker">
        <span>Team members</span>
        <div>
          {members.map((member) => (
            <button
              type="button"
              className={form.memberIds.includes(member.id) ? 'selected' : ''}
              key={member.id}
              onClick={() => toggleMember(member.id)}
            >
              <Users size={15} />
              {member.name}
            </button>
          ))}
        </div>
      </div>

      <button className="primary-action compact-action" disabled={busy} type="submit">
        {editingProject ? <Save size={17} /> : <Plus size={17} />}
        {editingProject ? 'Save changes' : 'Add project'}
      </button>
    </form>
  );
}

function projectFormDefaults() {
  return {
    name: '',
    type: '',
    description: '',
    deadline: addDaysInput(14),
    priority: 'medium',
    status: 'not-started',
    memberIds: []
  };
}

function InviteMemberForm({ busy, onInvite }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    const res = await onInvite(email);
    if (res.success) {
      setEmail('');
      setMessage(null);
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to invite member.' });
    }
  };

  return (
    <form className="tool-panel" onSubmit={handleSubmit}>
      <div className="panel-head">
        <h2>Invite Team Member</h2>
      </div>
      <div className="input-field mt-4">
        <label>
          <span>Email Address</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
            placeholder="member@company.com"
            required
          />
        </label>
      </div>
      {message && (
        <div className={`notice mt-2 ${message.type}`}>
          <p>{message.text}</p>
        </div>
      )}
      <button className="primary-action compact-action mt-4" type="submit" disabled={busy}>
        {busy ? 'Inviting...' : 'Send Invite'}
      </button>
    </form>
  );
}

function TaskForm({ members, projects, busy, onSubmit }) {
  const [form, setForm] = useState(() => taskFormDefaults(projects[0]?.id));

  useEffect(() => {
    if (!form.projectId && projects[0]?.id) {
      setForm((current) => ({ ...current, projectId: projects[0].id }));
    }
  }, [form.projectId, projects]);

  const selectedProject = projects.find((project) => project.id === Number(form.projectId));

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  return (
    <form
      className="tool-panel"
      onSubmit={async (event) => {
        event.preventDefault();
        await onSubmit(Number(form.projectId), form);
        setForm(taskFormDefaults(form.projectId));
      }}
    >
      <div className="panel-head">
        <div>
          <p className="eyebrow">Task assignment</p>
          <h2>Assign employee work</h2>
        </div>
        <UserPlus size={20} />
      </div>

      <div className="form-grid">
        <label className="span-2">
          <span>Project</span>
          <select
            value={form.projectId || ''}
            onChange={(event) => {
              const project = projects.find(
                (item) => item.id === Number(event.target.value)
              );
              setForm((current) => ({
                ...current,
                projectId: event.target.value,
                dueDate: project?.deadline || current.dueDate
              }));
            }}
            required
          >
            <option value="" disabled>
              Select project
            </option>
            {projects.map((project) => (
              <option value={project.id} key={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
        <label className="span-2">
          <span>Task title</span>
          <input
            value={form.title}
            onChange={(event) => update('title', event.target.value)}
            placeholder="Build API validation"
            required
          />
        </label>
        <label>
          <span>Assignee</span>
          <select
            value={form.assigneeId}
            onChange={(event) => update('assigneeId', event.target.value)}
            required
          >
            <option value="" disabled>
              Select employee
            </option>
            {members.map((member) => (
              <option value={member.id} key={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Due date</span>
          <input
            type="date"
            min={todayInput()}
            value={form.dueDate}
            onChange={(event) => update('dueDate', event.target.value)}
            max={selectedProject?.deadline || undefined}
            required
          />
        </label>
        <label>
          <span>Priority</span>
          <select
            value={form.priority}
            onChange={(event) => update('priority', event.target.value)}
          >
            {PRIORITIES.map((priority) => (
              <option value={priority.id} key={priority.id}>
                {priority.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Status</span>
          <select value={form.status} onChange={(event) => update('status', event.target.value)}>
            {TASK_STATUSES.map((status) => (
              <option value={status.id} key={status.id}>
                {status.label}
              </option>
            ))}
          </select>
        </label>
        <label className="span-2">
          <span>Description</span>
          <textarea
            value={form.description}
            onChange={(event) => update('description', event.target.value)}
            placeholder="Expected outcome"
            rows={3}
          />
        </label>
      </div>

      <button className="primary-action compact-action" disabled={busy || !projects.length}>
        <Plus size={17} />
        Assign task
      </button>
    </form>
  );
}

function taskFormDefaults(projectId = '') {
  return {
    projectId: projectId || '',
    title: '',
    description: '',
    assigneeId: '',
    dueDate: addDaysInput(7),
    priority: 'medium',
    status: 'todo'
  };
}

function ProjectBoard({ isAdmin, projects, busy, onStatusChange, onEdit, onDelete }) {
  const [draggedProjectId, setDraggedProjectId] = useState(null);

  if (!projects.length) {
    return <EmptyState text="No projects match the current filters." />;
  }

  return (
    <div className="status-board">
      {PROJECT_STATUSES.map((status) => {
        const columnProjects = projects.filter((project) => project.status === status.id);
        return (
          <div
            className="status-column"
            key={status.id}
            onDragOver={(event) => {
              if (isAdmin) event.preventDefault();
            }}
            onDrop={() => {
              if (isAdmin && draggedProjectId) {
                onStatusChange(draggedProjectId, status.id);
                setDraggedProjectId(null);
              }
            }}
          >
            <div className="column-head">
              <span className={`status-dot tone-${status.tone}`} />
              <h3>{status.label}</h3>
              <b>{columnProjects.length}</b>
            </div>

            {columnProjects.map((project) => (
              <article
                className="project-card"
                draggable={isAdmin}
                onDragStart={() => setDraggedProjectId(project.id)}
                onDragEnd={() => setDraggedProjectId(null)}
                key={project.id}
              >
                <div className="project-card-head">
                  <div>
                    <span className="type-chip">{project.type}</span>
                    <h4>{project.name}</h4>
                  </div>
                  {isAdmin && (
                    <div className="card-actions">
                      <button
                        type="button"
                        className="ghost-icon"
                        onClick={() => onEdit(project)}
                        aria-label={`Edit ${project.name}`}
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        type="button"
                        className="ghost-icon danger"
                        onClick={() => onDelete(project.id)}
                        aria-label={`Delete ${project.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
                <p>{project.description || 'No description added.'}</p>
                <div className="progress-row">
                  <span>{project.progress}%</span>
                  <div>
                    <i style={{ width: `${project.progress}%` }} />
                  </div>
                </div>
                <div className="project-meta">
                  <span className={isOverdue(project.deadline, project.status) ? 'late' : ''}>
                    <CalendarClock size={14} /> {formatDate(project.deadline)}
                  </span>
                  <span>
                    <Users size={14} /> {project.members.length}
                  </span>
                  <span>
                    <ListChecks size={14} /> {project.tasks.length}
                  </span>
                </div>
                <div className="member-line">
                  {project.members.slice(0, 4).map((member) => (
                    <span key={member.id}>{member.name}</span>
                  ))}
                  {project.members.length > 4 && <span>+{project.members.length - 4}</span>}
                </div>
                {isAdmin && (
                  <select
                    className="status-select"
                    value={project.status}
                    disabled={busy}
                    onChange={(event) => onStatusChange(project.id, event.target.value)}
                  >
                    {PROJECT_STATUSES.map((option) => (
                      <option value={option.id} key={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
              </article>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function TaskTable({ isAdmin, members, tasks, busy, onUpdate, onDelete }) {
  if (!tasks.length) {
    return <EmptyState text="No tasks match the current filters." />;
  }

  return (
    <div className="table-shell">
      <table>
        <thead>
          <tr>
            <th>Task</th>
            <th>Project</th>
            <th>Assignee</th>
            <th>Due</th>
            <th>Status</th>
            <th>Priority</th>
            {isAdmin && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td>
                <strong>{task.title}</strong>
                <span>{task.description || 'No description'}</span>
              </td>
              <td>{task.projectName}</td>
              <td>
                {isAdmin ? (
                  <select
                    value={task.assigneeId || ''}
                    disabled={busy}
                    onChange={(event) =>
                      onUpdate(task.id, { assigneeId: Number(event.target.value) })
                    }
                  >
                    {members.map((member) => (
                      <option value={member.id} key={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  task.assignee?.name || 'Unassigned'
                )}
              </td>
              <td>
                <span className={isOverdue(task.dueDate, task.status) ? 'late' : ''}>
                  {formatDate(task.dueDate)}
                </span>
              </td>
              <td>
                <select
                  value={task.status}
                  disabled={busy}
                  className={`status-select tone-${statusTone(TASK_STATUSES, task.status)}`}
                  onChange={(event) =>
                    onUpdate(
                      task.id,
                      { status: event.target.value },
                      'Task status updated.'
                    )
                  }
                >
                  {TASK_STATUSES.map((status) => (
                    <option value={status.id} key={status.id}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <span className={`priority-pill ${task.priority}`}>{task.priority}</span>
              </td>
              {isAdmin && (
                <td>
                  <button
                    type="button"
                    className="ghost-icon danger"
                    onClick={() => onDelete(task.id)}
                    aria-label={`Delete ${task.title}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActivityFeed({ activities }) {
  if (!activities.length) {
    return <EmptyState text="No activity yet." />;
  }

  return (
    <div className="activity-feed">
      {activities.map((activity) => (
        <article key={activity.id}>
          <span className="activity-icon">
            <Activity size={16} />
          </span>
          <div>
            <strong>{activity.detail}</strong>
            <p>
              {activity.project?.name || 'Workspace'} ·{' '}
              {new Intl.DateTimeFormat('en', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              }).format(new Date(activity.createdAt))}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="empty-panel">
      <CircleDot size={22} />
      <span>{text}</span>
    </div>
  );
}

export default App;
