const sql = require('mssql');
const { dbConfig } = require('./config');

let pool = null;

const connectToDatabase = async () => {
  try {
    if (pool) {
      return pool;
    }

    console.log('Connecting to SQL Server at:', dbConfig.server);
    pool = await sql.connect(dbConfig);
    console.log('Successfully connected to SQL Server');

    // Initialize database schema
    await initializeSchema();
    
    return pool;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    // For offline development, we'll continue with mock data
    console.log('Continuing with mock data for offline development');
    return null;
  }
};

const initializeSchema = async () => {
  try {
    if (!pool) return;

    console.log('Initializing database schema...');

    // Create Users table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
      CREATE TABLE Users (
        ID NVARCHAR(50) PRIMARY KEY,
        Username NVARCHAR(100) UNIQUE NOT NULL,
        Email NVARCHAR(255) UNIQUE NOT NULL,
        PasswordHash NVARCHAR(255) NOT NULL,
        FirstName NVARCHAR(100) NOT NULL,
        LastName NVARCHAR(100) NOT NULL,
        Role NVARCHAR(20) CHECK (Role IN ('manager', 'member')) NOT NULL,
        IsActive BIT DEFAULT 1,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        LastLogin DATETIME2
      )
    `);

    // Create Projects table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Projects' AND xtype='U')
      CREATE TABLE Projects (
        ID int IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(255) NOT NULL,
        Description NVARCHAR(MAX),
        Status NVARCHAR(20) CHECK (Status IN ('active', 'completed', 'on-hold', 'cancelled')) DEFAULT 'active',
        Progress INT DEFAULT 0,
        CreatedBy NVARCHAR(50) NOT NULL,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        DueDate DATETIME2,
        FOREIGN KEY (CreatedBy) REFERENCES Users(ID)
      )
    `);

    // Create ProjectMembers table (many-to-many relationship)
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ProjectMembers' AND xtype='U')
      CREATE TABLE ProjectMembers (
        ProjectID int NOT NULL,
        UserID NVARCHAR(50),
        PRIMARY KEY (ProjectID, UserID),
        FOREIGN KEY (ProjectID) REFERENCES Projects(ID) ON DELETE CASCADE,
        FOREIGN KEY (UserID) REFERENCES Users(ID) ON DELETE CASCADE
      )
    `);

    // Create Tasks table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Tasks' AND xtype='U')
      CREATE TABLE Tasks (
        ID int IDENTITY(1,1) PRIMARY KEY,
        ProjectID int NOT NULL,
        Title NVARCHAR(255) NOT NULL,
        Description NVARCHAR(MAX),
        Status NVARCHAR(20) CHECK (Status IN ('pending', 'in-progress', 'completed', 'cancelled')) DEFAULT 'pending',
        Priority NVARCHAR(10) CHECK (Priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
        AssignedTo NVARCHAR(50),
        CreatedBy NVARCHAR(50) NOT NULL,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        DueDate DATETIME2,
        CompletedAt DATETIME2,
        FOREIGN KEY (ProjectID) REFERENCES Projects(ID) ON DELETE CASCADE,
        FOREIGN KEY (AssignedTo) REFERENCES Users(ID),
        FOREIGN KEY (CreatedBy) REFERENCES Users(ID)
      )
    `);

    // Create GroupMessages table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='GroupMessages' AND xtype='U')
      CREATE TABLE GroupMessages (
        ID NVARCHAR(50) PRIMARY KEY,
        UserID NVARCHAR(50) NOT NULL,
        UserName NVARCHAR(200) NOT NULL,
        Message NVARCHAR(MAX) NOT NULL,
        MessageType NVARCHAR(20) DEFAULT 'text',
        Timestamp DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (UserID) REFERENCES Users(ID)
      )
    `);

    // Create PrivateMessages table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PrivateMessages' AND xtype='U')
      CREATE TABLE PrivateMessages (
        ID NVARCHAR(50) PRIMARY KEY,
        SenderID NVARCHAR(50) NOT NULL,
        ReceiverID NVARCHAR(50) NOT NULL,
        SenderName NVARCHAR(200) NOT NULL,
        Message NVARCHAR(MAX) NOT NULL,
        MessageType NVARCHAR(20) DEFAULT 'text',
        Timestamp DATETIME2 DEFAULT GETDATE(),
        IsRead BIT DEFAULT 0,
        FOREIGN KEY (SenderID) REFERENCES Users(ID),
        FOREIGN KEY (ReceiverID) REFERENCES Users(ID)
      )
    `);
    
    // Create ActivityLog table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ActivityLog' AND xtype='U')
      CREATE TABLE ActivityLog (
        ID NVARCHAR(50) PRIMARY KEY,
        UserID NVARCHAR(50) NOT NULL,
        UserName NVARCHAR(200) NOT NULL,
        Action NVARCHAR(200) NOT NULL,
        Timestamp DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (UserID) REFERENCES Users(ID)
      )
    `);

    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Schema initialization failed:', error.message);
  }
};

const getConnection = () => {
  return pool;
};

const closeConnection = async () => {
  if (pool) {
    await pool.close();
    pool = null;
  }
};

module.exports = {
  connectToDatabase,
  getConnection,
  closeConnection,
  sql
};
