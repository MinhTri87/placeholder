const { getConnection, sql } = require('../db/connection');
const { findUserById } = require('./auth');

const getPrivateChatKey = (user1Id, user2Id) => {
  const ids = [user1Id, user2Id].sort();
  return `${ids[0]}_${ids[1]}`;
};

const handleGetMessages = async (req, res) => {
  try {
    const pool = getConnection();
    
    if (pool) {
      try {
        const result = await pool.request()
          .query(`
            SELECT ID as id, UserID as userId, UserName as userName, 
                   Message as message, MessageType as type, Timestamp as timestamp
            FROM GroupMessages 
            ORDER BY Timestamp ASC
          `);
        
        const messages = result.recordset.map(msg => ({
          ...msg,
          timestamp: msg.timestamp.toISOString()
        }));
        
        return res.json({
          success: true,
          data: messages
        });
      } catch (error) {
        console.error('Database query error:', error);
        // Fall back to mock data
      }
    }
    
    // Use mock data when database is not available
    res.json({
      success: true,
      data: groupMessages
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages'
    });
  }
};

const handleSendMessage = async (req, res) => {
  try {
    const { message, userId, userName } = req.body;
    
    if (!message || !userId || !userName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const messageId = Date.now().toString();
    const timestamp = new Date();
    
    const newMessage = {
      id: messageId,
      userId,
      userName,
      message,
      timestamp: timestamp.toISOString(),
      type: 'text'
    };

    const pool = getConnection();
    
    if (pool) {
      try {
        await pool.request()
          .input('id', sql.NVarChar, messageId)
          .input('userId', sql.NVarChar, userId)
          .input('userName', sql.NVarChar, userName)
          .input('message', sql.NVarChar, message)
          .input('timestamp', sql.DateTime2, timestamp)
          .query(`
            INSERT INTO GroupMessages (ID, UserID, UserName, Message, Timestamp)
            VALUES (@id, @userId, @userName, @message, @timestamp)
          `);
      } catch (error) {
        console.error('Database insert error:', error);
        // Continue with mock data storage
        groupMessages.push(newMessage);
      }
    } else {
      // Store in mock data when database is not available
      groupMessages.push(newMessage);
    }

    res.json({
      success: true,
      data: newMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }
};

const handleGetPrivateMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.query.currentUserId;
    
    if (!userId || !currentUserId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }

    const pool = getConnection();
    
    if (pool) {
      try {
        const result = await pool.request()
          .input('user1', sql.NVarChar, currentUserId)
          .input('user2', sql.NVarChar, userId)
          .query(`
            SELECT ID as id, SenderID as senderId, ReceiverID as receiverId,
                   SenderName as senderName, Message as message, 
                   MessageType as type, Timestamp as timestamp, IsRead as isRead
            FROM PrivateMessages 
            WHERE (SenderID = @user1 AND ReceiverID = @user2) 
               OR (SenderID = @user2 AND ReceiverID = @user1)
            ORDER BY Timestamp ASC
          `);
        
        const messages = result.recordset.map(msg => ({
          ...msg,
          timestamp: msg.timestamp.toISOString(),
          isRead: Boolean(msg.isRead)
        }));
        
        // Mark messages as read for the current user
        if (messages.length > 0) {
          await pool.request()
            .input('receiverId', sql.NVarChar, currentUserId)
            .input('senderId', sql.NVarChar, userId)
            .query(`
              UPDATE PrivateMessages 
              SET IsRead = 1 
              WHERE ReceiverID = @receiverId AND SenderID = @senderId AND IsRead = 0
            `);
        }
        
        return res.json({
          success: true,
          data: messages
        });
      } catch (error) {
        console.error('Database query error:', error);
        // Fall back to mock data
      }
    }
    
    // Use mock data when database is not available
    const chatKey = getPrivateChatKey(currentUserId, userId);
    const messages = privateMessages[chatKey] || [];
    
    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Get private messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch private messages'
    });
  }
};

const handleSendPrivateMessage = async (req, res) => {
  try {
    const { userId } = req.params;
    const { message, senderId, senderName } = req.body;
    
    if (!message || !senderId || !senderName || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Verify both users exist
    const sender = await findUserById(senderId);
    const receiver = await findUserById(userId);
    
    if (!sender || !receiver) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const messageId = Date.now().toString();
    const timestamp = new Date();
    
    const newMessage = {
      id: messageId,
      senderId,
      receiverId: userId,
      senderName,
      message,
      timestamp: timestamp.toISOString(),
      type: 'text',
      isRead: false
    };

    const pool = getConnection();
    
    if (pool) {
      try {
        await pool.request()
          .input('id', sql.NVarChar, messageId)
          .input('senderId', sql.NVarChar, senderId)
          .input('receiverId', sql.NVarChar, userId)
          .input('senderName', sql.NVarChar, senderName)
          .input('message', sql.NVarChar, message)
          .input('timestamp', sql.DateTime2, timestamp)
          .query(`
            INSERT INTO PrivateMessages (ID, SenderID, ReceiverID, SenderName, Message, Timestamp)
            VALUES (@id, @senderId, @receiverId, @senderName, @message, @timestamp)
          `);
      } catch (error) {
        console.error('Database insert error:', error);
        // Continue with mock data storage
        const chatKey = getPrivateChatKey(senderId, userId);
        if (!privateMessages[chatKey]) {
          privateMessages[chatKey] = [];
        }
        privateMessages[chatKey].push(newMessage);
      }
    } else {
      // Store in mock data when database is not available
      const chatKey = getPrivateChatKey(senderId, userId);
      if (!privateMessages[chatKey]) {
        privateMessages[chatKey] = [];
      }
      privateMessages[chatKey].push(newMessage);
    }

    res.json({
      success: true,
      data: newMessage
    });
  } catch (error) {
    console.error('Send private message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send private message'
    });
  }
};

const handleGetUserList = async (req, res) => {
  try {
    const currentUserId = req.query.currentUserId;
    
    const pool = getConnection();
    
    if (pool) {
      try {
        const result = await pool.request()
          .input('currentUserId', sql.NVarChar, currentUserId)
          .query(`
            SELECT ID as id, Username as username, FirstName as firstName, 
                   LastName as lastName, Role as role, IsActive as isActive
            FROM Users 
            WHERE ID != @currentUserId AND IsActive = 1
            ORDER BY FirstName, LastName
          `);
        
        const users = result.recordset.map(user => ({
          ...user,
          isActive: Boolean(user.isActive)
        }));
        
        return res.json({
          success: true,
          data: users
        });
      } catch (error) {
        console.error('Database query error:', error);
        // Fall back to mock data
      }
    }
    
    // Use mock data when database is not available
    const mockUsers = [
      {
        id: "1",
        username: "admin",
        firstName: "Admin",
        lastName: "User",
        role: "manager",
        isActive: true
      },
      {
        id: "2",
        username: "user",
        firstName: "Regular",
        lastName: "User",
        role: "member",
        isActive: true
      }
    ].filter(user => user.id !== currentUserId);
    
    res.json({
      success: true,
      data: mockUsers
    });
  } catch (error) {
    console.error('Get user list error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user list'
    });
  }
};

const handleGetUnreadCount = async (req, res) => {
  try {
    const currentUserId = req.query.currentUserId;
    
    if (!currentUserId) {
      return res.status(400).json({
        success: false,
        error: 'Missing currentUserId parameter'
      });
    }

    const pool = getConnection();
    
    if (pool) {
      try {
        const result = await pool.request()
          .input('receiverId', sql.NVarChar, currentUserId)
          .query(`
            SELECT SenderID, COUNT(*) as count
            FROM PrivateMessages 
            WHERE ReceiverID = @receiverId AND IsRead = 0
            GROUP BY SenderID
          `);
        
        const unreadCounts = {};
        result.recordset.forEach(row => {
          unreadCounts[row.SenderID] = row.count;
        });
        
        return res.json({
          success: true,
          data: unreadCounts
        });
      } catch (error) {
        console.error('Database query error:', error);
      }
    }
    
    // For mock data, return empty counts
    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unread count'
    });
  }
};

module.exports = {
  handleGetMessages,
  handleSendMessage,
  handleGetPrivateMessages,
  handleSendPrivateMessage,
  handleGetUserList,
  handleGetUnreadCount
};
