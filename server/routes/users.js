// Mock users database (replace with SQL Server queries)
let users = [
  {
    id: "1",
    username: "admin",
    email: "admin@groupmanager.com",
    firstName: "Admin",
    lastName: "User",
    role: "manager",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    lastLogin: "2024-01-30T10:30:00Z",
  },
  {
    id: "2",
    username: "jane.smith",
    email: "jane.smith@groupmanager.com",
    firstName: "Jane",
    lastName: "Smith",
    role: "member",
    isActive: true,
    createdAt: "2024-01-05T00:00:00Z",
    lastLogin: "2024-01-30T09:15:00Z",
  },
  {
    id: "3",
    username: "bob.wilson",
    email: "bob.wilson@groupmanager.com",
    firstName: "Bob",
    lastName: "Wilson",
    role: "member",
    isActive: true,
    createdAt: "2024-01-10T00:00:00Z",
    lastLogin: "2024-01-29T16:45:00Z",
  },
  {
    id: "4",
    username: "sarah.johnson",
    email: "sarah.johnson@groupmanager.com",
    firstName: "Sarah",
    lastName: "Johnson",
    role: "member",
    isActive: false,
    createdAt: "2024-01-15T00:00:00Z",
    lastLogin: "2024-01-25T14:20:00Z",
  },
  {
    id: "5",
    username: "mike.davis",
    email: "mike.davis@groupmanager.com",
    firstName: "Mike",
    lastName: "Davis",
    role: "member",
    isActive: true,
    createdAt: "2024-01-20T00:00:00Z",
    lastLogin: "2024-01-30T11:00:00Z",
  },
];

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

// Get all users (managers only)
const handleGetUsers = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const userId = verifyToken(token);
    if (!userId || !isUserManager(userId)) {
      return res.status(403).json({
        success: false,
        message: "Manager access required",
      });
    }

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Create new user
const handleCreateUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const userId = verifyToken(token);
    if (!userId || !isUserManager(userId)) {
      return res.status(403).json({
        success: false,
        message: "Manager access required",
      });
    }

    const { username, email, firstName, lastName, role, password } = req.body;

    // Validate required fields
    if (!username || !email || !firstName || !lastName || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Check if username or email already exists
    const existingUser = users.find(
      (u) => u.username === username || u.email === email
    );
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Username or email already exists",
      });
    }

    // Create new user
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
      message: "Internal server error",
    });
  }
};

// Update user
const handleUpdateUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const currentUserId = verifyToken(token);
    if (!currentUserId || !isUserManager(currentUserId)) {
      return res.status(403).json({
        success: false,
        message: "Manager access required",
      });
    }

    const { id } = req.params;
    const { firstName, lastName, email, role, isActive } = req.body;

    const userIndex = users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent changing own role
    if (id === currentUserId && role && users[userIndex].role !== role) {
      return res.status(400).json({
        success: false,
        message: "Cannot change your own role",
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
      message: "Internal server error",
    });
  }
};

// Delete user
const handleDeleteUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const currentUserId = verifyToken(token);
    if (!currentUserId || !isUserManager(currentUserId)) {
      return res.status(403).json({
        success: false,
        message: "Manager access required",
      });
    }

    const { id } = req.params;

    // Prevent deleting yourself
    if (id === currentUserId) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete your own account",
      });
    }

    const userIndex = users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "User not found",
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
      message: "Internal server error",
    });
  }
};

module.exports = {
  handleGetUsers,
  handleCreateUser,
  handleUpdateUser,
  handleDeleteUser,
};
