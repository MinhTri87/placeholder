const jwt = require('jsonwebtoken');
const sql = require('mssql'); // Ensure mssql is installed and configured
const { handleActivityCommit } = require('./activity');

const handleGetProjects = async (req, res) => {
  try {
    // Query projects from your SQL Server database
    const result = await sql.query(`
      SELECT 
        id,
        name,
        description,
        status,
        progress,
        createdBy,
        createdAt,
        dueDate
      FROM Projects
    `);

    const projects = result.recordset || [];

    res.json({
      success: true,
      data: projects
    });
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
    const { name, description, dueDate, createdBy } = req.body;
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // adjust secret
    const currentUserId = decoded.userId; // Assuming your payload includes `id`
    console.log("Current user ID:", currentUserId);
    console.log("decoded token:", decoded);

    // Create a new SQL request
    const request = new sql.Request();
    request.input('name', sql.NVarChar, name);
    request.input('description', sql.NVarChar, description);
    request.input('dueDate', sql.DateTime, dueDate ? new Date(dueDate) : null);
    request.input('createdBy', sql.NVarChar, createdBy);

    // Insert the new project and get the new ID
    const result = await request.query(`
      INSERT INTO Projects (name, description, status, progress, createdBy, createdAt, dueDate)
      VALUES (@name, @description, 'active', 0, @createdBy, GETDATE(), @dueDate);
      SELECT SCOPE_IDENTITY() AS id;
    `);
    const newProjectId = result.recordset[0].id;

    const selectRequest = new sql.Request();
    selectRequest.input('id', sql.Int, newProjectId);
    const projectResult = await selectRequest.query(`
      SELECT 
        id,
        name,
        description,
        status,
        progress,
        createdBy,
        createdAt,
        dueDate
      FROM Projects
      WHERE id = @id
    `);

    const newProject = projectResult.recordset[0];

    res.json({
      success: true,
      data: newProject
    });
    handleActivityCommit(currentUserId, `create project ${name}`);
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
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // adjust secret
    const currentUserId = decoded.userId; // Assuming your payload includes `id`
    console.log("Current user ID:", currentUserId);
    console.log("decoded token:", decoded);
    const { id } = req.params;
    const updates = req.body;
    
    // Update the project in the database
    await sql.query(`
      UPDATE Projects
      SET 
        name = '${updates.name}',
        description = '${updates.description}',
        status = '${updates.status}',
        progress = ${updates.progress},
        dueDate = '${updates.dueDate}'
      WHERE id = ${id}
    `);

    const response = {
      success: true,
      data: { id, ...updates }
    };
    handleActivityCommit(currentUserId, `update project ${updates.name}`);

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
