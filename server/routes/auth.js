const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getConnection, sql } = require("../db/connection");

// JWT Configuration - MUST be set in environment variables for security
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

// Validate JWT_SECRET is configured
if (!JWT_SECRET) {
  console.error(
    "❌ SECURITY ERROR: JWT_SECRET environment variable is not set!",
  );
  console.error(
    "📋 Generate a secure secret using: node scripts/generate-jwt-secret.js",
  );
  console.error("🔧 Set JWT_SECRET in your .env file or environment variables");
  process.exit(1);
}

// Mock users for offline development (will be replaced by SQL Server queries when connected)
const mockUsers = [
  {
    id: "1",
    username: "admin",
    email: "admin@groupmanager.com",
    role: "manager",
    firstName: "Admin",
    lastName: "User",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    lastLogin: new Date().toISOString(),
  },
  {
    id: "2",
    username: "user",
    email: "user@groupmanager.com",
    role: "member",
    firstName: "Regular",
    lastName: "User",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    lastLogin: new Date().toISOString(),
  },
];

// Mock password hashes (already hashed versions of admin123 and user123)
const mockPasswords = {
  admin: "$2a$10$8K1p/a0dClpsuwNP3RBkBOaEVf1.dLz3.zPvK5wUy5rnEHYG5J8au", // admin123
  user: "$2a$10$8K1p/a0dClpsuwNP3RBkBOaEVf1.dLz3.zPvK5wUy5rnEHYG5J8au", // user123
};

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const findUserByUsername = async (username) => {
  const pool = getConnection();

  if (pool) {
    try {
      const result = await pool
        .request()
        .input("username", sql.NVarChar, username)
        .query(
          "SELECT * FROM Users WHERE Username = @username AND IsActive = 1",
        );

      return result.recordset[0] || null;
    } catch (error) {
      console.error("Database query error:", error);
      // Fall back to mock data
    }
  }

  // Use mock data when database is not available
  return mockUsers.find((u) => u.username === username) || null;
};

const findUserById = async (userId) => {
  const pool = getConnection();

  if (pool) {
    try {
      const result = await pool
        .request()
        .input("userId", sql.NVarChar, userId)
        .query("SELECT * FROM Users WHERE ID = @userId AND IsActive = 1");

      return result.recordset[0] || null;
    } catch (error) {
      console.error("Database query error:", error);
      // Fall back to mock data
    }
  }

  // Use mock data when database is not available
  return mockUsers.find((u) => u.id === userId) || null;
};

const updateLastLogin = async (userId) => {
  const pool = getConnection();

  if (pool) {
    try {
      await pool
        .request()
        .input("userId", sql.NVarChar, userId)
        .input("lastLogin", sql.DateTime2, new Date())
        .query("UPDATE Users SET LastLogin = @lastLogin WHERE ID = @userId");
    } catch (error) {
      console.error("Failed to update last login:", error);
    }
  } else {
    // Update mock data
    const user = mockUsers.find((u) => u.id === userId);
    if (user) {
      user.lastLogin = new Date().toISOString();
    }
  }
};

const verifyPassword = async (password, user) => {
  const pool = getConnection();

  if (pool && user.PasswordHash) {
    // Compare with database password hash
    return await bcrypt.compare(password, user.PasswordHash);
  } else {
    // Compare with mock password hash
    const mockHash = mockPasswords[user.username];
    if (mockHash) {
      return await bcrypt.compare(password, mockHash);
    }
    return false;
  }
};

const handleLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    // Find user
    const user = await findUserByUsername(username);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    // Update last login
    await updateLastLogin(user.id || user.ID);

    // Generate JWT token
    const token = generateToken({
      id: user.id || user.ID,
      username: user.username || user.Username,
      role: user.role || user.Role,
    });

    // Return user data (excluding password)
    const userResponse = {
      id: user.id || user.ID,
      username: user.username || user.Username,
      email: user.email || user.Email,
      firstName: user.firstName || user.FirstName,
      lastName: user.lastName || user.LastName,
      role: user.role || user.Role,
      isActive: user.isActive ?? user.IsActive,
      createdAt: user.createdAt || user.CreatedAt,
      lastLogin: new Date().toISOString(),
    };

    res.json({
      success: true,
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const handleRegister = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      role = "member",
    } = req.body;

    if (!username || !email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Check if user already exists
    const existingUser = await findUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Username already exists",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    const userId = Date.now().toString();

    const pool = getConnection();

    if (pool) {
      try {
        // Insert into database
        await pool
          .request()
          .input("id", sql.NVarChar, userId)
          .input("username", sql.NVarChar, username)
          .input("email", sql.NVarChar, email)
          .input("passwordHash", sql.NVarChar, passwordHash)
          .input("firstName", sql.NVarChar, firstName)
          .input("lastName", sql.NVarChar, lastName)
          .input("role", sql.NVarChar, role).query(`
            INSERT INTO Users (ID, Username, Email, PasswordHash, FirstName, LastName, Role)
            VALUES (@id, @username, @email, @passwordHash, @firstName, @lastName, @role)
          `);
      } catch (error) {
        console.error("Database insert error:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to create user",
        });
      }
    } else {
      // Add to mock data (for offline development)
      const newUser = {
        id: userId,
        username,
        email,
        firstName,
        lastName,
        role,
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLogin: null,
      };
      mockUsers.push(newUser);
      mockPasswords[username] = passwordHash;
    }

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: userId,
        username,
        email,
        firstName,
        lastName,
        role,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const handleAuthCheck = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return res.json({ isAuthenticated: false });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.json({ isAuthenticated: false });
    }

    // Find user to ensure they still exist and are active
    const user = await findUserById(decoded.userId);
    if (!user) {
      return res.json({ isAuthenticated: false });
    }

    const userResponse = {
      id: user.id || user.ID,
      username: user.username || user.Username,
      email: user.email || user.Email,
      firstName: user.firstName || user.FirstName,
      lastName: user.lastName || user.LastName,
      role: user.role || user.Role,
      isActive: user.isActive ?? user.IsActive,
      createdAt: user.createdAt || user.CreatedAt,
      lastLogin: user.lastLogin || user.LastLogin,
    };

    res.json({
      isAuthenticated: true,
      user: userResponse,
    });
  } catch (error) {
    console.error("Auth check error:", error);
    res.status(500).json({
      isAuthenticated: false,
    });
  }
};

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // Attach user info to request
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

module.exports = {
  handleLogin,
  handleRegister,
  handleAuthCheck,
  authenticateToken,
  findUserById,
  findUserByUsername,
};
