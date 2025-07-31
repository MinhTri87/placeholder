const sql = require('mssql'); // Make sure you have mssql installed and configured

const handleGetUsers = async (req, res) => {
  try {
    // Query users from your SQL Server database
    const result = await sql.query(`
      SELECT 
        id, 
        username, 
        email, 
        firstName, 
        lastName, 
        role, 
        isActive, 
        createdAt, 
        lastLogin
      FROM Users
    `);

    const users = result.recordset || [];

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
};

const handleCreateUser = async (req, res) => {
  try {
    const { username, email, firstName, lastName, role, password } = req.body;
    
    // Check if username or email already exists
    const existingUser = users.find(u => u.username === username || u.email === email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Username or email already exists'
      });
    }

    const newUser = {
      id: Date.now().toString(),
      username,
      email,
      firstName,
      lastName,
      role: role || 'member',
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLogin: null
    };

    users.push(newUser);

    const response = {
      success: true,
      data: newUser
    };
    
    res.json(response);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user'
    });
  }
};

const handleUpdateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Don't allow updating password through this route
    delete updates.password;

    users[userIndex] = { ...users[userIndex], ...updates };

    const response = {
      success: true,
      data: users[userIndex]
    };
    
    res.json(response);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user'
    });
  }
};

const handleDeleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Don't allow deleting the admin user
    if (users[userIndex].role === 'manager' && users[userIndex].username === 'admin') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete admin user'
      });
    }

    users.splice(userIndex, 1);

    const response = {
      success: true,
      message: 'User deleted successfully'
    };
    
    res.json(response);
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user'
    });
  }
};

module.exports = {
  handleGetUsers,
  handleCreateUser,
  handleUpdateUser,
  handleDeleteUser
};
