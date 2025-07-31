const sql = require('mssql');

// Get all tasks
const handleGetTasks = async (req, res) => {
  try {
    const result = await sql.query(`
      SELECT 
        ID as id,
        Title as title,
        Description as description,
        Status as status,
        Priority as priority,
        ProjectID as projectId,
        AssignedTo as assignedTo,
        CreatedBy as createdBy,
        CreatedAt as createdAt,
        DueDate as dueDate,
        CompletedAt as completedAt
      FROM Tasks
    `);

    res.json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tasks'
    });
  }
};

// Create a new task
const handleCreateTask = async (req, res) => {
  try {
    const { title, description, priority, projectId, assignedTo, dueDate, createdBy } = req.body;

    const request = new sql.Request();
    request.input('Title', sql.NVarChar, title);
    request.input('Description', sql.NVarChar, description);
    request.input('Status', sql.NVarChar, 'pending');
    request.input('Priority', sql.NVarChar, priority || 'medium');
    request.input('projectId', sql.Int, projectId);
    request.input('AssignedTo', sql.NVarChar, String(assignedTo)); // Ensure assignedTo is a string
    request.input('createdBy', sql.NVarChar, createdBy);
    request.input('CreatedAt', sql.DateTime2, new Date());
    request.input('DueDate', sql.DateTime2, dueDate ? new Date(dueDate) : null);

    const result = await request.query(`
      INSERT INTO Tasks (Title, Description, Status, Priority, projectId, AssignedTo, createdBy, CreatedAt, DueDate)
      VALUES (@Title, @Description, @Status, @Priority, @projectId, @AssignedTo, @createdBy, @CreatedAt, @DueDate);
      SELECT SCOPE_IDENTITY() AS id;
    `);

    const newTaskId = result.recordset[0].id;

    const fetchRequest = new sql.Request();
    fetchRequest.input('ID', sql.Int, newTaskId);
    const fetchResult = await fetchRequest.query(`
      SELECT 
        ID as id,
        Title as title,
        Description as description,
        Status as status,
        Priority as priority,
        projectId as projectId,
        AssignedTo as assignedTo,
        createdBy as createdBy,
        CreatedAt as createdAt,
        DueDate as dueDate,
        CompletedAt as completedAt
      FROM Tasks
      WHERE ID = @ID
    `);

    res.json({
      success: true,
      data: fetchResult.recordset[0]
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create task'
    });
  }
};

// Update a task
const handleUpdateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Build dynamic SQL for updates
    const fields = [];
    const request = new sql.Request();
    request.input('ID', sql.NVarChar, id);

    if (updates.title !== undefined) {
      fields.push('Title = @Title');
      request.input('Title', sql.NVarChar, updates.title);
    }
    if (updates.description !== undefined) {
      fields.push('Description = @Description');
      request.input('Description', sql.NVarChar, updates.description);
    }
    if (updates.status !== undefined) {
      fields.push('Status = @Status');
      request.input('Status', sql.NVarChar, updates.status);
    }
    if (updates.priority !== undefined) {
      fields.push('Priority = @Priority');
      request.input('Priority', sql.NVarChar, updates.priority);
    }
    if (updates.projectId !== undefined) {
      fields.push('projectID = @projectID');
      request.input('ProjectID', sql.Int, updates.projectId);
    }
    if (updates.assignedTo !== undefined) {
      fields.push('AssignedTo = @AssignedTo');
      request.input('AssignedTo', sql.NVarChar, updates.assignedTo);
    }
    if (updates.dueDate !== undefined) {
      fields.push('DueDate = @DueDate');
      request.input('DueDate', sql.DateTime2, updates.dueDate ? new Date(updates.dueDate) : null);
    }
    if (updates.completedAt !== undefined) {
      fields.push('CompletedAt = @CompletedAt');
      request.input('CompletedAt', sql.DateTime2, updates.completedAt ? new Date(updates.completedAt) : null);
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    await request.query(`
      UPDATE Tasks SET ${fields.join(', ')}
      WHERE ID = @ID
    `);

    // Fetch the updated task
    const fetchRequest = new sql.Request();
    fetchRequest.input('ID', sql.NVarChar, id);
    const result = await fetchRequest.query(`
      SELECT 
        ID as id,
        Title as title,
        Description as description,
        Status as status,
        Priority as priority,
        ProjectID as projectId,
        AssignedTo as assignedTo,
        CreatedBy as createdBy,
        CreatedAt as createdAt,
        DueDate as dueDate,
        CompletedAt as completedAt
      FROM Tasks
      WHERE ID = @ID
    `);

    res.json({
      success: true,
      data: result.recordset[0]
    });
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
