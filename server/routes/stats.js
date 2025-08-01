const sql = require("mssql");

const handleGetStats = async (req, res) => {
  try {
    const request = new sql.Request();

    const totalMembersQuery = await request.query(
      "SELECT COUNT(*) AS totalMembers FROM Users"
    );

    const activeMembersQuery = await request.query(
      "SELECT COUNT(*) AS activeMembers FROM Users WHERE lastLogin > DATEADD(day, -1, GETDATE())"
    );

    const managersCountQuery = await request.query(
      "SELECT COUNT(*) AS managersCount FROM Users WHERE role = 'manager'"
    );

    const membersCountQuery = await request.query(
      "SELECT COUNT(*) AS membersCount FROM Users WHERE role = 'member'"
    );

    const data = {
      totalMembers: totalMembersQuery.recordset[0].totalMembers,
      activeMembers: activeMembersQuery.recordset[0].activeMembers,
      managersCount: managersCountQuery.recordset[0].managersCount,
      membersCount: membersCountQuery.recordset[0].membersCount,
    };

    res.json({ success: true, data });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch stats" });
  }
};

const handleGetRecentActivity = async (req, res) => {
  try {
    const request = new sql.Request();
    const result = await request.query(`
      SELECT TOP 5 id, userId, action, timestamp
      FROM ActivityLog
      ORDER BY timestamp DESC
    `);

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Activity error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch activity" });
  }
};

const handleGetFullActivity = async (req, res) => {
  try {
    const request = new sql.Request();
    const result = await request.query(`
      SELECT id, userId, action, timestamp
      FROM ActivityLog
      ORDER BY timestamp DESC
    `);

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Full activity error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch full activity log" });
  }
};

module.exports = {
  handleGetStats,
  handleGetRecentActivity,
  handleGetFullActivity,
};
