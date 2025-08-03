const jwt = require('jsonwebtoken');
const sql=require('mssql');

const handleActivityCommit = async (user, action) => {
  try {
    const request = new sql.Request();
    request.input("userId", sql.VarChar, user.userId);
    request.input("action", sql.NVarChar, action);
    request.input("username", sql.NVarChar, user.username);

    await request.query(`
      INSERT INTO ActivityLog (userId, action, username)
      VALUES (@userId, @action, @username)
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