import{handleActivityCommit}from'./activity'; // Import the activity logging function

const sql = require('mssql'); // Make sure you have mssql installed and configured
const jwt=require('jsonwebtoken');
const { handleAuthCheck } = require('./auth');
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // adjust secret
    const currentUserId = decoded.userId; // Assuming your payload includes `id`
    console.log("Current user ID:", currentUserId);
    console.log("decoded token:", decoded);

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
    handleActivityCommit(currentUserId, "create_user");
    console.log(result);
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // adjust secret
    const currentUserId = decoded.userId; // Assuming your payload includes `id`
    console.log("Current user ID:", currentUserId);
    console.log("decoded token:", decoded);
    
    //parsing data
    const { id } = req.params;
    const { firstName, lastName, email, role, isActive, username } = req.body;

    // Update user
    const request= new sql.Request();
      request.input("id", sql.VarChar, id)
      request.input("username", sql.NVarChar, username)
      request.input("firstName", sql.NVarChar, firstName)
      request.input("lastName", sql.NVarChar, lastName)
      request.input("email", sql.NVarChar, email)
      request.input("role", sql.VarChar, role)
      request.input("isActive", sql.Bit, isActive)
      const result=await request.query(`
        UPDATE users
        SET firstName = @firstName,
            username = @username,
            lastName = @lastName,
            email = @email,
            role = @role,
            isActive = @isActive
        WHERE id = @id
      `);

    res.json({
      success: true,
      message: "User updated successfully",
    });
    handleActivityCommit(currentUserId, `update user ${username}`);
    console.log("User updated successfully:", id);
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // adjust secret
    const currentUserId = decoded.userId; // Assuming your payload includes `id`
    console.log("Current user ID:", currentUserId);
    console.log("decoded token:", decoded);

    const { id } = req.params;

    const deleteRequest=new sql.Request();
    deleteRequest.input("id", sql.VarChar, id)
    const result=await deleteRequest.query(`
      DELETE FROM users
      WHERE id = @id
    `);

    res.json({
      success: true,
      message: "User deleted successfully",
    });
    handleActivityCommit(currentUserId, `delete user ${id}`);
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
