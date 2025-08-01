const jwt = require('jsonwebtoken');
const sql=require('mssql');

const handleActivityCommit = async (userId, action) => {
  try {
    const request = new sql.Request();
    request.input("userId", sql.VarChar, userId);
    request.input("action", sql.NVarChar, action);

    await request.query(`
      INSERT INTO ActivityLog (userId, action)
      VALUES (@userId, @action)
    `);
    console.log("Activity logged:", action);
  } catch (error) {
    console.error("Activity commit error:", error);
    // optional: throw error or just log
  }

  return { success: true, message: "Activity logged successfully" };
};

module.exports = {
  handleActivityCommit,
};