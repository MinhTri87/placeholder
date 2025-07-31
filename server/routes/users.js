const sql = require('mssql'); // Make sure you have mssql installed and configured

// Helper function to verify token (same as in auth.js)
const verifyToken = (token) => {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64").toString());
    return decoded.userId;
  } catch {
    return null;
  }
};

// Helper function to check if user is manager
const isUserManager = (userId) => {
  const user = users.find((u) => u.id === userId);
  return user && user.role === "manager";
};

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
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch users",
    });
  }
};

const handleCreateUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const userId = verifyToken(token);
    if (!userId || !isUserManager(userId)) {
      return res.status(403).json({
        success: false,
        error: "Manager access required",
      });
    }

    const { username, email, firstName, lastName, role, password } = req.body;

    if (!username || !email || !firstName || !lastName || !password) {
      return res.status(400).json({
        success: false,
        error: "All fields are required",
      });
    }

    // Check if username or email already exists
    const existingUser = users.find(
      (u) => u.username === username || u.email === email,
    );
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "Username or email already exists",
      });
    }

    const newUser = {
      id: Date.now().toString(),
      username,
      email,
      firstName,
      lastName,
      role: role || "member",
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLogin: null,
    };

    users.push(newUser);

    res.json({
      success: true,
      data: newUser,
      message: "User created successfully",
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create user",
    });
  }
};

const handleUpdateUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const currentUserId = verifyToken(token);
    if (!currentUserId || !isUserManager(currentUserId)) {
      return res.status(403).json({
        success: false,
        error: "Manager access required",
      });
    }

    const { id } = req.params;
    const { firstName, lastName, email, role, isActive } = req.body;

    const userIndex = users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Prevent changing own role
    if (id === currentUserId && role && users[userIndex].role !== role) {
      return res.status(400).json({
        success: false,
        error: "Cannot change your own role",
      });
    }

    // Update user
    users[userIndex] = {
      ...users[userIndex],
      firstName: firstName || users[userIndex].firstName,
      lastName: lastName || users[userIndex].lastName,
      email: email || users[userIndex].email,
      role: role || users[userIndex].role,
      isActive: isActive !== undefined ? isActive : users[userIndex].isActive,
    };

    res.json({
      success: true,
      data: users[userIndex],
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update user",
    });
  }
};

const handleDeleteUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const currentUserId = verifyToken(token);
    if (!currentUserId || !isUserManager(currentUserId)) {
      return res.status(403).json({
        success: false,
        error: "Manager access required",
      });
    }

    const { id } = req.params;

    // Prevent deleting yourself
    if (id === currentUserId) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete your own account",
      });
    }

    const userIndex = users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    users.splice(userIndex, 1);

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete user",
    });
  }
};

module.exports = {
  handleGetUsers,
  handleCreateUser,
  handleUpdateUser,
  handleDeleteUser,
};
