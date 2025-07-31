// In-memory storage for tasks (replace with SQL Server in production)
let tasks = [
  {
    id: '1',
    title: 'Design new homepage layout',
    description: 'Create wireframes and mockups for the new homepage design',
    status: 'in_progress',
    priority: 'high',
    projectId: '1',
    projectName: 'Website Redesign',
    assignedTo: '2',
    assigneeName: 'Jane Smith',
    createdBy: '1',
    createdAt: '2024-01-20T00:00:00Z',
    dueDate: '2024-02-05T00:00:00Z'
  },
  {
    id: '2',
    title: 'Implement user authentication',
    description: 'Set up secure login and registration system',
    status: 'pending',
    priority: 'high',
    projectId: '2',
    projectName: 'Mobile App Development',
    assignedTo: '3',
    assigneeName: 'Bob Wilson',
    createdBy: '1',
    createdAt: '2024-01-22T00:00:00Z',
    dueDate: '2024-02-10T00:00:00Z'
  },
  {
    id: '3',
    title: 'Database schema optimization',
    description: 'Optimize existing database queries and indexing',
    status: 'completed',
    priority: 'medium',
    projectId: '1',
    projectName: 'Website Redesign',
    assignedTo: '2',
    assigneeName: 'Jane Smith',
    createdBy: '1',
    createdAt: '2024-01-15T00:00:00Z',
    dueDate: '2024-01-30T00:00:00Z'
  }
];

const handleGetTasks = async (req, res) => {
  try {
    const response = {
      success: true,
      data: tasks
    };
    res.json(response);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tasks'
    });
  }
};

const handleCreateTask = async (req, res) => {
  try {
    const { title, description, priority, projectId, assignedTo, dueDate } = req.body;
    
    const newTask = {
      id: Date.now().toString(),
      title,
      description,
      status: 'pending',
      priority: priority || 'medium',
      projectId,
      projectName: 'Project', // Should be looked up from projects
      assignedTo,
      assigneeName: 'User', // Should be looked up from users
      createdBy: '1', // Should come from auth
      createdAt: new Date().toISOString(),
      dueDate: dueDate || null
    };

    tasks.push(newTask);

    const response = {
      success: true,
      data: newTask
    };
    
    res.json(response);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create task'
    });
  }
};

const handleUpdateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    tasks[taskIndex] = { ...tasks[taskIndex], ...updates };

    const response = {
      success: true,
      data: tasks[taskIndex]
    };
    
    res.json(response);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update task'
    });
  }
};

module.exports = {
  handleGetTasks,
  handleCreateTask,
  handleUpdateTask
};
