import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { DataTypes, Op, Sequelize } from 'sequelize';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;
const JWT_SECRET =
  process.env.JWT_SECRET || 'taskflow-local-development-secret-change-me';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir =
  process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(__dirname, 'data');
fs.mkdirSync(dataDir, { recursive: true });

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.SQLITE_PATH || path.join(dataDir, 'taskflow.sqlite'),
  logging: false
});

const ROLES = ['ADMIN', 'MEMBER'];
const PROJECT_STATUSES = ['not-started', 'in-progress', 'blocked', 'done'];
const TASK_STATUSES = ['todo', 'in-progress', 'review', 'blocked', 'done'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const User = sequelize.define(
  'User',
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { len: [2, 80] }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM(...ROLES),
      allowNull: false,
      defaultValue: 'MEMBER'
    }
  },
  {
    indexes: [{ unique: true, fields: ['email'] }]
  }
);

const Project = sequelize.define('Project', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { len: [3, 120] }
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { len: [2, 80] }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: ''
  },
  status: {
    type: DataTypes.ENUM(...PROJECT_STATUSES),
    allowNull: false,
    defaultValue: 'not-started'
  },
  deadline: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM(...PRIORITIES),
    allowNull: false,
    defaultValue: 'medium'
  }
});

const ProjectMember = sequelize.define(
  'ProjectMember',
  {},
  {
    indexes: [{ unique: true, fields: ['projectId', 'userId'] }]
  }
);

const Task = sequelize.define('Task', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { len: [3, 140] }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: ''
  },
  status: {
    type: DataTypes.ENUM(...TASK_STATUSES),
    allowNull: false,
    defaultValue: 'todo'
  },
  priority: {
    type: DataTypes.ENUM(...PRIORITIES),
    allowNull: false,
    defaultValue: 'medium'
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  }
});

const Activity = sequelize.define('Activity', {
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  detail: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

User.belongsToMany(Project, {
  through: ProjectMember,
  as: 'projects',
  foreignKey: 'userId'
});
Project.belongsToMany(User, {
  through: ProjectMember,
  as: 'members',
  foreignKey: 'projectId'
});
Project.belongsTo(User, { as: 'owner', foreignKey: 'createdById' });
Project.hasMany(Task, {
  as: 'tasks',
  foreignKey: 'projectId',
  onDelete: 'CASCADE',
  hooks: true
});
Task.belongsTo(Project, { as: 'project', foreignKey: 'projectId' });
Task.belongsTo(User, { as: 'assignee', foreignKey: 'assigneeId' });
User.hasMany(Task, { as: 'assignedTasks', foreignKey: 'assigneeId' });
Project.hasMany(Activity, { as: 'activities', foreignKey: 'projectId' });
Activity.belongsTo(Project, { as: 'project', foreignKey: 'projectId' });
Activity.belongsTo(User, { as: 'actor', foreignKey: 'actorId' });

app.set('trust proxy', 1);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 400,
    standardHeaders: true,
    legacyHeaders: false
  })
);
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const sanitizeUser = (user) => {
  const plain = user.get ? user.get({ plain: true }) : user;
  return {
    id: plain.id,
    name: plain.name,
    email: plain.email,
    role: plain.role
  };
};

const serializeTask = (task) => {
  const plain = task.get ? task.get({ plain: true }) : task;
  return {
    id: plain.id,
    title: plain.title,
    description: plain.description,
    status: plain.status,
    priority: plain.priority,
    dueDate: plain.dueDate,
    projectId: plain.projectId,
    assigneeId: plain.assigneeId,
    assignee: plain.assignee ? sanitizeUser(plain.assignee) : null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt
  };
};

const serializeProject = (project) => {
  const plain = project.get ? project.get({ plain: true }) : project;
  const tasks = (plain.tasks || []).map(serializeTask);
  const completedTasks = tasks.filter((task) => task.status === 'done').length;

  return {
    id: plain.id,
    name: plain.name,
    type: plain.type,
    description: plain.description,
    status: plain.status,
    deadline: plain.deadline,
    priority: plain.priority,
    createdById: plain.createdById,
    owner: plain.owner ? sanitizeUser(plain.owner) : null,
    members: (plain.members || []).map(sanitizeUser),
    tasks,
    progress: tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt
  };
};

const createToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Please login to continue.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(payload.id);
    if (!user) {
      return res.status(401).json({ message: 'Session expired. Login again.' });
    }
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ message: 'Session expired. Login again.' });
  }
});

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res
      .status(403)
      .json({ message: 'Admin access is required for this action.' });
  }
  return next();
};

const validateRole = (role) => ROLES.includes(String(role || '').toUpperCase());

const ensureValidDate = (date) => {
  if (!date) return false;
  const parsed = new Date(`${date}T00:00:00`);
  return !Number.isNaN(parsed.getTime());
};

const ensureMembers = async (memberIds = []) => {
  const cleanIds = [...new Set(memberIds.map(Number).filter(Boolean))];
  if (!cleanIds.length) return [];

  const users = await User.findAll({
    where: { id: { [Op.in]: cleanIds }, role: 'MEMBER' }
  });

  if (users.length !== cleanIds.length) {
    const error = new Error('Select valid employee members before assigning.');
    error.status = 400;
    throw error;
  }

  return users;
};

const createActivity = async ({ action, detail, projectId, actorId }) => {
  await Activity.create({ action, detail, projectId, actorId });
};

const syncProjectStatusFromTasks = async (projectId) => {
  const project = await Project.findByPk(projectId);
  if (!project) return;

  const tasks = await Task.findAll({ where: { projectId } });
  if (!tasks.length) {
    project.status = 'not-started';
  } else if (tasks.every((task) => task.status === 'done')) {
    project.status = 'done';
  } else if (tasks.some((task) => task.status === 'blocked')) {
    project.status = 'blocked';
  } else if (tasks.some((task) => task.status !== 'todo')) {
    project.status = 'in-progress';
  } else {
    project.status = 'not-started';
  }

  await project.save();
};

const loadProjectById = (id) =>
  Project.findByPk(id, {
    include: [
      { model: User, as: 'owner', attributes: ['id', 'name', 'email', 'role'] },
      {
        model: User,
        as: 'members',
        attributes: ['id', 'name', 'email', 'role'],
        through: { attributes: [] }
      },
      {
        model: Task,
        as: 'tasks',
        include: [
          { model: User, as: 'assignee', attributes: ['id', 'name', 'email', 'role'] }
        ]
      }
    ],
    order: [[{ model: Task, as: 'tasks' }, 'dueDate', 'ASC']]
  });

const getVisibleProjectIds = async (user) => {
  if (user.role === 'ADMIN') {
    const projects = await Project.findAll({ attributes: ['id'] });
    return projects.map((project) => project.id);
  }

  const memberships = await ProjectMember.findAll({
    where: { userId: user.id },
    attributes: ['projectId']
  });
  const assignedTasks = await Task.findAll({
    where: { assigneeId: user.id },
    attributes: ['projectId']
  });

  return [
    ...new Set([
      ...memberships.map((membership) => membership.projectId),
      ...assignedTasks.map((task) => task.projectId)
    ])
  ];
};

const getVisibleProjects = async (user) => {
  const ids = await getVisibleProjectIds(user);
  if (!ids.length) return [];

  const projects = await Project.findAll({
    where: { id: { [Op.in]: ids } },
    include: [
      { model: User, as: 'owner', attributes: ['id', 'name', 'email', 'role'] },
      {
        model: User,
        as: 'members',
        attributes: ['id', 'name', 'email', 'role'],
        through: { attributes: [] }
      },
      {
        model: Task,
        as: 'tasks',
        include: [
          { model: User, as: 'assignee', attributes: ['id', 'name', 'email', 'role'] }
        ]
      }
    ],
    order: [['deadline', 'ASC']]
  });

  const serializedProjects = projects.map(serializeProject);
  if (user.role === 'ADMIN') return serializedProjects;

  return serializedProjects.map((project) => {
    const tasks = project.tasks.filter((task) => task.assigneeId === user.id);
    const completedTasks = tasks.filter((task) => task.status === 'done').length;

    return {
      ...project,
      tasks,
      progress: tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0
    };
  });
};

const isProjectMember = async (projectId, userId) => {
  const membership = await ProjectMember.findOne({ where: { projectId, userId } });
  return Boolean(membership);
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'TaskFlow', database: 'sqlite' });
});

app.post(
  '/api/auth/signup',
  asyncHandler(async (req, res) => {
    const name = String(req.body.name || '').trim();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');
    const role = String(req.body.role || '').toUpperCase();
    const companyId = String(req.body.companyId || '').trim();

    if (!companyId) {
      return res.status(400).json({ message: 'Enter your Company ID.' });
    }

    if (!name || name.length < 2) {
      return res.status(400).json({ message: 'Enter a full name.' });
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: 'Enter a valid email address.' });
    }
    if (!validateRole(role)) {
      return res.status(400).json({ message: 'Choose Admin or Employee.' });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: 'Password must contain at least 8 characters.' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res
        .status(409)
        .json({ message: 'Email already exists. Please login instead.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash, role });

    res.status(201).json({
      token: createToken(user),
      user: sanitizeUser(user)
    });
  })
);

app.post(
  '/api/auth/login',
  asyncHandler(async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');
    const role = String(req.body.role || '').toUpperCase();

    if (!email || !password || !validateRole(role)) {
      return res
        .status(400)
        .json({ message: 'Choose a role, then enter email and password.' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'No account found for this email.' });
    }
    if (user.role !== role) {
      return res.status(403).json({
        message: `This email is registered as ${
          user.role === 'ADMIN' ? 'Admin' : 'Employee'
        }.`
      });
    }

    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) {
      return res.status(401).json({ message: 'Wrong password. Please try again.' });
    }

    res.json({ token: createToken(user), user: sanitizeUser(user) });
  })
);

app.get(
  '/api/auth/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: sanitizeUser(req.user) });
  })
);

app.get(
  '/api/users',
  requireAuth,
  asyncHandler(async (req, res) => {
    const where = req.query.role ? { role: String(req.query.role).toUpperCase() } : {};
    if (req.user.role !== 'ADMIN') {
      where.id = req.user.id;
    }

    const users = await User.findAll({
      where,
      order: [
        ['role', 'ASC'],
        ['name', 'ASC']
      ]
    });
    res.json({ users: users.map(sanitizeUser) });
  })
);

app.post(
  '/api/users/invite',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      return res.status(400).json({ message: 'Enter a valid email address.' });
    }
    const exists = await User.findOne({ where: { email: normalizedEmail } });
    if (exists) {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }
    const namePart = normalizedEmail.split('@')[0];
    const passwordHash = await bcrypt.hash('Welcome123!', 12);
    const user = await User.create({
      name: namePart,
      email: normalizedEmail,
      passwordHash,
      role: 'MEMBER'
    });
    res.status(201).json({ message: 'User invited successfully.', user: sanitizeUser(user) });
  })
);

app.get(
  '/api/dashboard',
  requireAuth,
  asyncHandler(async (req, res) => {
    const projects = await getVisibleProjects(req.user);
    const tasks = projects.flatMap((project) =>
      req.user.role === 'ADMIN'
        ? project.tasks
        : project.tasks.filter((task) => task.assigneeId === req.user.id)
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const statusCounts = TASK_STATUSES.reduce((acc, status) => {
      acc[status] = tasks.filter((task) => task.status === status).length;
      return acc;
    }, {});

    const projectStatusCounts = PROJECT_STATUSES.reduce((acc, status) => {
      acc[status] = projects.filter((project) => project.status === status).length;
      return acc;
    }, {});

    const overdueTasks = tasks.filter((task) => {
      const due = new Date(`${task.dueDate}T00:00:00`);
      return due < today && task.status !== 'done';
    });

    const dueSoonTasks = tasks.filter((task) => {
      const due = new Date(`${task.dueDate}T00:00:00`);
      return due >= today && due <= nextWeek && task.status !== 'done';
    });

    const visibleIds = projects.map((project) => project.id);
    const activities = visibleIds.length
      ? await Activity.findAll({
          where: { projectId: { [Op.in]: visibleIds } },
          include: [
            { model: User, as: 'actor', attributes: ['id', 'name', 'email', 'role'] },
            { model: Project, as: 'project', attributes: ['id', 'name'] }
          ],
          order: [['createdAt', 'DESC']],
          limit: 8
        })
      : [];

    const activeTasks = tasks.filter((task) => task.status !== 'done').length;
    const completedTasks = tasks.filter((task) => task.status === 'done').length;

    res.json({
      metrics: {
        projects: projects.length,
        tasks: tasks.length,
        activeTasks,
        completedTasks,
        overdueTasks: overdueTasks.length,
        dueSoonTasks: dueSoonTasks.length,
        completionRate: tasks.length
          ? Math.round((completedTasks / tasks.length) * 100)
          : 0
      },
      statusCounts,
      projectStatusCounts,
      overdueTasks,
      dueSoonTasks,
      activities: activities.map((activity) => ({
        id: activity.id,
        action: activity.action,
        detail: activity.detail,
        createdAt: activity.createdAt,
        actor: activity.actor ? sanitizeUser(activity.actor) : null,
        project: activity.project
      }))
    });
  })
);

app.get(
  '/api/projects',
  requireAuth,
  asyncHandler(async (req, res) => {
    const projects = await getVisibleProjects(req.user);
    res.json({ projects });
  })
);

app.post(
  '/api/projects',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const name = String(req.body.name || '').trim();
    const type = String(req.body.type || '').trim();
    const description = String(req.body.description || '').trim();
    const status = req.body.status || 'not-started';
    const priority = req.body.priority || 'medium';
    const deadline = req.body.deadline;

    if (name.length < 3) {
      return res.status(400).json({ message: 'Project name needs 3+ characters.' });
    }
    if (type.length < 2) {
      return res.status(400).json({ message: 'Add a project type.' });
    }
    if (!PROJECT_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Select a valid project status.' });
    }
    if (!PRIORITIES.includes(priority)) {
      return res.status(400).json({ message: 'Select a valid priority.' });
    }
    if (!ensureValidDate(deadline)) {
      return res.status(400).json({ message: 'Choose a valid project deadline.' });
    }

    const members = await ensureMembers(req.body.memberIds || []);
    const project = await Project.create({
      name,
      type,
      description,
      status,
      priority,
      deadline,
      createdById: req.user.id
    });
    await project.setMembers(members);
    await createActivity({
      action: 'created-project',
      detail: `${req.user.name} created ${name}`,
      projectId: project.id,
      actorId: req.user.id
    });

    const loaded = await loadProjectById(project.id);
    res.status(201).json({ project: serializeProject(loaded) });
  })
);

app.put(
  '/api/projects/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const updates = {};
    ['name', 'type', 'description', 'status', 'priority', 'deadline'].forEach(
      (field) => {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
      }
    );

    if (updates.name !== undefined && String(updates.name).trim().length < 3) {
      return res.status(400).json({ message: 'Project name needs 3+ characters.' });
    }
    if (updates.type !== undefined && String(updates.type).trim().length < 2) {
      return res.status(400).json({ message: 'Add a project type.' });
    }
    if (updates.status !== undefined && !PROJECT_STATUSES.includes(updates.status)) {
      return res.status(400).json({ message: 'Select a valid project status.' });
    }
    if (updates.priority !== undefined && !PRIORITIES.includes(updates.priority)) {
      return res.status(400).json({ message: 'Select a valid priority.' });
    }
    if (updates.deadline !== undefined && !ensureValidDate(updates.deadline)) {
      return res.status(400).json({ message: 'Choose a valid project deadline.' });
    }

    Object.assign(project, {
      ...updates,
      name: updates.name !== undefined ? String(updates.name).trim() : project.name,
      type: updates.type !== undefined ? String(updates.type).trim() : project.type,
      description:
        updates.description !== undefined
          ? String(updates.description).trim()
          : project.description
    });
    await project.save();

    if (req.body.memberIds !== undefined) {
      const members = await ensureMembers(req.body.memberIds || []);
      await project.setMembers(members);
    }

    await createActivity({
      action: 'updated-project',
      detail: `${req.user.name} updated ${project.name}`,
      projectId: project.id,
      actorId: req.user.id
    });

    const loaded = await loadProjectById(project.id);
    res.json({ project: serializeProject(loaded) });
  })
);

app.delete(
  '/api/projects/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }
    await createActivity({
      action: 'deleted-project',
      detail: `${req.user.name} deleted ${project.name}`,
      projectId: project.id,
      actorId: req.user.id
    });
    await project.destroy();
    res.json({ message: 'Project deleted.' });
  })
);

app.post(
  '/api/projects/:id/tasks',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const title = String(req.body.title || '').trim();
    const description = String(req.body.description || '').trim();
    const status = req.body.status || 'todo';
    const priority = req.body.priority || 'medium';
    const dueDate = req.body.dueDate || project.deadline;
    const assigneeId = Number(req.body.assigneeId);

    if (title.length < 3) {
      return res.status(400).json({ message: 'Task title needs 3+ characters.' });
    }
    if (!TASK_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Select a valid task status.' });
    }
    if (!PRIORITIES.includes(priority)) {
      return res.status(400).json({ message: 'Select a valid task priority.' });
    }
    if (!ensureValidDate(dueDate)) {
      return res.status(400).json({ message: 'Choose a valid task due date.' });
    }

    const assignee = await User.findOne({
      where: { id: assigneeId, role: 'MEMBER' }
    });
    if (!assignee) {
      return res.status(400).json({ message: 'Assign the task to an employee.' });
    }

    const assignedToProject = await isProjectMember(project.id, assignee.id);
    if (!assignedToProject) {
      await project.addMember(assignee);
    }

    const task = await Task.create({
      title,
      description,
      status,
      priority,
      dueDate,
      assigneeId: assignee.id,
      projectId: project.id
    });
    await syncProjectStatusFromTasks(project.id);
    await createActivity({
      action: 'created-task',
      detail: `${req.user.name} assigned "${title}" to ${assignee.name}`,
      projectId: project.id,
      actorId: req.user.id
    });

    const loaded = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email', 'role'] }
      ]
    });
    res.status(201).json({ task: serializeTask(loaded) });
  })
);

app.put(
  '/api/tasks/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const task = await Task.findByPk(req.params.id, {
      include: [{ model: Project, as: 'project' }]
    });
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    if (req.user.role === 'MEMBER') {
      const memberCanUpdate =
        task.assigneeId === req.user.id ||
        (await isProjectMember(task.projectId, req.user.id));
      if (!memberCanUpdate) {
        return res
          .status(403)
          .json({ message: 'You can only update assigned project work.' });
      }

      const nextStatus = req.body.status;
      if (!TASK_STATUSES.includes(nextStatus)) {
        return res.status(400).json({ message: 'Select a valid task status.' });
      }
      task.status = nextStatus;
    } else {
      const updates = {};
      ['title', 'description', 'status', 'priority', 'dueDate'].forEach((field) => {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
      });

      if (updates.title !== undefined && String(updates.title).trim().length < 3) {
        return res.status(400).json({ message: 'Task title needs 3+ characters.' });
      }
      if (updates.status !== undefined && !TASK_STATUSES.includes(updates.status)) {
        return res.status(400).json({ message: 'Select a valid task status.' });
      }
      if (updates.priority !== undefined && !PRIORITIES.includes(updates.priority)) {
        return res.status(400).json({ message: 'Select a valid task priority.' });
      }
      if (updates.dueDate !== undefined && !ensureValidDate(updates.dueDate)) {
        return res.status(400).json({ message: 'Choose a valid task due date.' });
      }

      Object.assign(task, {
        ...updates,
        title: updates.title !== undefined ? String(updates.title).trim() : task.title,
        description:
          updates.description !== undefined
            ? String(updates.description).trim()
            : task.description
      });

      if (req.body.assigneeId !== undefined) {
        const assignee = await User.findOne({
          where: { id: Number(req.body.assigneeId), role: 'MEMBER' }
        });
        if (!assignee) {
          return res.status(400).json({ message: 'Assign the task to an employee.' });
        }
        task.assigneeId = assignee.id;
        const assignedToProject = await isProjectMember(task.projectId, assignee.id);
        if (!assignedToProject) {
          const project = await Project.findByPk(task.projectId);
          await project.addMember(assignee);
        }
      }
    }

    await task.save();
    await syncProjectStatusFromTasks(task.projectId);
    await createActivity({
      action: 'updated-task',
      detail: `${req.user.name} moved "${task.title}" to ${task.status}`,
      projectId: task.projectId,
      actorId: req.user.id
    });

    const loaded = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email', 'role'] }
      ]
    });
    res.json({ task: serializeTask(loaded) });
  })
);

app.delete(
  '/api/tasks/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    const projectId = task.projectId;
    await createActivity({
      action: 'deleted-task',
      detail: `${req.user.name} deleted "${task.title}"`,
      projectId,
      actorId: req.user.id
    });
    await task.destroy();
    await syncProjectStatusFromTasks(projectId);
    res.json({ message: 'Task deleted.' });
  })
);

app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API route not found.' });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) =>
    res.sendFile(path.join(__dirname, '../client/dist/index.html'))
  );
}

app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status >= 500) {
    console.error(err);
  }
  res.status(status).json({
    message: err.message || 'Something went wrong. Please try again.'
  });
});

const seedDemoData = async () => {
  const existingUsers = await User.count();
  if (existingUsers > 0 || process.env.SEED_DEMO === 'false') return;

  const passwordHash = await bcrypt.hash('Taskflow@123', 12);
  await Promise.all([
    User.create({
      name: 'Aarav Admin',
      email: 'admin@taskflow.dev',
      passwordHash,
      role: 'ADMIN'
    }),
    User.create({
      name: 'Maya Employee',
      email: 'maya@taskflow.dev',
      passwordHash,
      role: 'MEMBER'
    })
  ]);
};

await sequelize.sync();
await seedDemoData();

app.listen(PORT, () => {
  console.log(`TaskFlow API running on port ${PORT}`);
});
