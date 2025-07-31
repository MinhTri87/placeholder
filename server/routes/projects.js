// In-memory storage for projects (replace with SQL Server in production)
let projects = [
  {
    id: '1',
    name: 'Website Redesign',
    description: 'Complete overhaul of the company website with modern design and improved UX',
    status: 'active',
    progress: 65,
    createdBy: 'Admin User',
    createdAt: '2024-01-15T00:00:00Z',
    dueDate: '2024-03-01T00:00:00Z',
    memberIds: ['1', '2', '3'],
    members: [
      { id: '1', name: 'Admin User', avatar: 'AU' },
      { id: '2', name: 'Jane Smith', avatar: 'JS' },
      { id: '3', name: 'Bob Wilson', avatar: 'BW' }
    ],
    tasks: {
      total: 12,
      completed: 8,
      pending: 4
    }
  },
  {
    id: '2',
    name: 'Mobile App Development',
    description: 'Native mobile application for iOS and Android platforms',
    status: 'active',
    progress: 30,
    createdBy: 'Admin User',
    createdAt: '2024-01-20T00:00:00Z',
    dueDate: '2024-04-15T00:00:00Z',
    memberIds: ['1', '4', '5'],
    members: [
      { id: '1', name: 'Admin User', avatar: 'AU' },
      { id: '4', name: 'Sarah Johnson', avatar: 'SJ' },
      { id: '5', name: 'Mike Davis', avatar: 'MD' }
    ],
    tasks: {
      total: 18,
      completed: 5,
      pending: 13
    }
  }
];

const handleGetProjects = async (req, res) => {
  try {
    const response = {
      success: true,
      data: projects
    };
    res.json(response);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch projects'
    });
  }
};

const handleCreateProject = async (req, res) => {
  try {
    const { name, description, dueDate, memberIds } = req.body;
    
    const newProject = {
      id: Date.now().toString(),
      name,
      description,
      status: 'active',
      progress: 0,
      createdBy: 'Admin User', // Should come from auth
      createdAt: new Date().toISOString(),
      dueDate: dueDate || null,
      memberIds: memberIds || [],
      members: [], // Should be populated from memberIds
      tasks: {
        total: 0,
        completed: 0,
        pending: 0
      }
    };

    projects.push(newProject);

    const response = {
      success: true,
      data: newProject
    };
    
    res.json(response);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create project'
    });
  }
};

const handleUpdateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const projectIndex = projects.findIndex(p => p.id === id);
    if (projectIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    projects[projectIndex] = { ...projects[projectIndex], ...updates };

    const response = {
      success: true,
      data: projects[projectIndex]
    };
    
    res.json(response);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update project'
    });
  }
};

module.exports = {
  handleGetProjects,
  handleCreateProject,
  handleUpdateProject
};
