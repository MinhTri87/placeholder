const express = require('express');
const router = express.Router();
const { authenticateToken } = require('./auth');
const sql = require('mssql');
const { handleActivityCommit } = require('./activity');
const jwt = require('jsonwebtoken');

// In-memory storage for personal vault items (in production, use proper database)
const vaultData = new Map();

const handleCreateItem = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // adjust secret
    const currentUserId = decoded.userId; // Assuming your payload includes `id`
    console.log("Current user ID:", currentUserId);
    console.log("decoded token:", decoded);

    const { title, content, type, category, tags, isPrivate, metadata } = req.body;
    if (!title || !content || !type) {
      return res.status(400).json({
        success: false,
        message: 'Title, content, and type are required'
      });
    }
    const item = {
      title,
      content,
      type,
      category,
      tags,
      isPrivate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: metadata || {},
      userId: currentUserId,
    };
    const userVaultItems = vaultData.get(currentUserId) || [];
    userVaultItems.push(item);
    vaultData.set(currentUserId, userVaultItems);
    res.status(201).json({
      success: true,
      message: 'Vault item created successfully',
      data: item
    });

  } catch (error) {
    console.error('Error creating vault item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create vault item'
    });
  }
};
// Get all vault items for a user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userVaultItems = vaultData.get(userId) || [];
    
    res.json({
      success: true,
      data: userVaultItems
    });
  } catch (error) {
    console.error('Error fetching vault items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vault items'
    });
  }
});

// Create a new vault item
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, content, type, category, tags, isPrivate, metadata } = req.body;
    
    if (!title || !content || !type) {
      return res.status(400).json({
        success: false,
        message: 'Title, content, and type are required'
      });
    }
    
    const newItem = {
      id: Date.now().toString() + Math.random().toString(36),
      title,
      content,
      type,
      category: category || 'Uncategorized',
      tags: tags || [],
      isPrivate: isPrivate !== undefined ? isPrivate : true,
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: metadata || {},
      userId
    };
    
    const userVaultItems = vaultData.get(userId) || [];
    userVaultItems.unshift(newItem);
    vaultData.set(userId, userVaultItems);
    
    res.status(201).json({
      success: true,
      data: newItem,
      message: 'Vault item created successfully'
    });
  } catch (error) {
    console.error('Error creating vault item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create vault item'
    });
  }
});

// Update a vault item
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.id;
    const updates = req.body;
    
    const userVaultItems = vaultData.get(userId) || [];
    const itemIndex = userVaultItems.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Vault item not found'
      });
    }
    
    // Update the item
    userVaultItems[itemIndex] = {
      ...userVaultItems[itemIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    vaultData.set(userId, userVaultItems);
    
    res.json({
      success: true,
      data: userVaultItems[itemIndex],
      message: 'Vault item updated successfully'
    });
  } catch (error) {
    console.error('Error updating vault item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update vault item'
    });
  }
});

// Delete a vault item
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.id;
    
    const userVaultItems = vaultData.get(userId) || [];
    const filteredItems = userVaultItems.filter(item => item.id !== itemId);
    
    if (filteredItems.length === userVaultItems.length) {
      return res.status(404).json({
        success: false,
        message: 'Vault item not found'
      });
    }
    
    vaultData.set(userId, filteredItems);
    
    res.json({
      success: true,
      message: 'Vault item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting vault item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete vault item'
    });
  }
});

// Toggle favorite status
router.patch('/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.id;
    
    const userVaultItems = vaultData.get(userId) || [];
    const itemIndex = userVaultItems.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Vault item not found'
      });
    }
    
    userVaultItems[itemIndex].isFavorite = !userVaultItems[itemIndex].isFavorite;
    userVaultItems[itemIndex].updatedAt = new Date().toISOString();
    
    vaultData.set(userId, userVaultItems);
    
    res.json({
      success: true,
      data: userVaultItems[itemIndex],
      message: 'Favorite status updated successfully'
    });
  } catch (error) {
    console.error('Error updating favorite status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update favorite status'
    });
  }
});

// Get vault statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userVaultItems = vaultData.get(userId) || [];
    
    const stats = {
      total: userVaultItems.length,
      byType: {},
      favorites: userVaultItems.filter(item => item.isFavorite).length,
      private: userVaultItems.filter(item => item.isPrivate).length,
      categories: [...new Set(userVaultItems.map(item => item.category))],
      recentlyAdded: userVaultItems
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
    };
    
    // Count by type
    userVaultItems.forEach(item => {
      stats.byType[item.type] = (stats.byType[item.type] || 0) + 1;
    });
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching vault stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vault statistics'
    });
  }
});

// Search vault items
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { q, type, category, tags } = req.query;
    
    let userVaultItems = vaultData.get(userId) || [];
    
    if (q) {
      const searchTerm = q.toLowerCase();
      userVaultItems = userVaultItems.filter(item =>
        item.title.toLowerCase().includes(searchTerm) ||
        item.content.toLowerCase().includes(searchTerm) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }
    
    if (type) {
      userVaultItems = userVaultItems.filter(item => item.type === type);
    }
    
    if (category) {
      userVaultItems = userVaultItems.filter(item => item.category === category);
    }
    
    if (tags) {
      const searchTags = tags.split(',').map(tag => tag.trim().toLowerCase());
      userVaultItems = userVaultItems.filter(item =>
        searchTags.some(searchTag =>
          item.tags.some(itemTag => itemTag.toLowerCase().includes(searchTag))
        )
      );
    }
    
    res.json({
      success: true,
      data: userVaultItems
    });
  } catch (error) {
    console.error('Error searching vault items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search vault items'
    });
  }
});

// Export vault data (backup)
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userVaultItems = vaultData.get(userId) || [];
    
    const exportData = {
      exportDate: new Date().toISOString(),
      userId: userId,
      itemCount: userVaultItems.length,
      items: userVaultItems
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="vault-backup-${new Date().toISOString().split('T')[0]}.json"`);
    res.json(exportData);
  } catch (error) {
    console.error('Error exporting vault data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export vault data'
    });
  }
});

module.exports = router;
