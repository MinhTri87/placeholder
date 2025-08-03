const express = require('express');
const router = express.Router();
const { authenticateToken } = require('./auth');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const sql = require('mssql');
const { handleActivityCommit } = require('./activity');
const jwt = require('jsonwebtoken');
const checkDiskSpace = require('check-disk-space').default;
import mime from 'mime-types';
const archive = require('archiver');

// Configuration for remote file server
const REMOTE_SERVER_CONFIG = {
  // Domain file server configuration
  serverPath: '\\\\10.10.0.1\\Group1', // UNC path to file server
  localMountPath: '/mnt/10.10.0.1/Group1', // Local mount point (Linux)
  windowsMountPath: 'Y:', // Windows mapped drive
  enabled: process.env.NODE_ENV === 'development', // Enable in production
};

let physicalPath = '/'; // Default physical path

// In-memory file metadata storage (in production, use proper database)
const fileMetadata = new Map();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const fullPath = physicalPath || "/";
 console.log("Full upload path:", fullPath);
    // Ensure directory exists
    fs.mkdirSync(fullPath, { recursive: true });

    cb(null, fullPath);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for now
    cb(null, true);
  }
});

// Helper function to get physical file path
function getPhysicalPath(virtualPath) {
  console.log(virtualPath);
  console.log(REMOTE_SERVER_CONFIG.enabled);
    return path.join(REMOTE_SERVER_CONFIG.serverPath, virtualPath.replace(/^\//, ''));
}

// Helper function to ensure directory exists
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

//format file size
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

// Helper function to get file metadata
function getFileStats(filePath, virtualPath, filename) {
  try {
    const stats = fs.statSync(filePath);
    const ext = path.extname(filename);
    
    return {
      id: Buffer.from(virtualPath + '/' + filename).toString('base64'),
      name: filename,
      type: stats.isDirectory() ? 'folder' : 'file',
      size: stats.isDirectory() ? 0 : stats.size,
      path: path.posix.join(virtualPath, filename),
      parentPath: virtualPath,
      extension: stats.isDirectory() ? null : ext,
      mimeType: getMimeType(ext),
      createdAt: stats.birthtime.toISOString(),
      modifiedAt: stats.mtime.toISOString(),
      createdBy: 'system', // Would be actual user in production
      modifiedBy: 'system',
      permissions: ['read', 'write'], // Would be based on actual permissions
      isShared: false,
      isStarred: false,
      tags: [],
      version: 1,
    };
  } catch (error) {
    console.error('Error getting file stats:', error);
    return null;
  }
}

// Helper function to get MIME type based on extension
function getMimeType(ext) {
  const mimeTypes = {
    '.txt': 'text/plain',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg',
    '.zip': 'application/zip',
    '.json': 'application/json',
    '.xml': 'application/xml',
  };
  return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
}

// Get files and folders in a directory
router.get('/', authenticateToken, async (req, res) => {
  try {
    const virtualPath = req.query.path || '/';
    physicalPath = getPhysicalPath(virtualPath);
    
    console.log(`Listing files in: ${physicalPath}`);
    
    if (!fs.existsSync(physicalPath)) {
      ensureDirectoryExists(physicalPath);
    }
    
    const items = fs.readdirSync(physicalPath);
    const files = [];
    
    for (const item of items) {
      const itemPath = path.join(physicalPath, item);
      const fileInfo = getFileStats(itemPath, virtualPath, item);
      if (fileInfo) {
        files.push(fileInfo);
      }
    }
    
    // Sort: folders first, then files
    files.sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name);
      }
      return a.type === 'folder' ? -1 : 1;
    });
    
    res.json({
      success: true,
      files: files,
      path: virtualPath,
      totalItems: files.length
    });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list files',
      error: error.message
    });
  }
});

// Get server status and storage information
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const physicalPath = getPhysicalPath('/');
    let connected = false;
    let totalSpace = 0;
    let usedSpace = 0;
    let serverPath = REMOTE_SERVER_CONFIG.serverPath;
    
    try {
      // Check if the server path is accessible
      if (fs.existsSync(physicalPath)) {
        connected = true;
        
      // Get disk space information (simplified)
      const diskPath = process.platform === 'win32'
      ? REMOTE_SERVER_CONFIG.windowsMountPath || 'C:' // example: 'Y:'
      : '/'; // root mount point on Linux
      const stats = fs.statSync(physicalPath);
      try {
        const { free, size } = await checkDiskSpace(diskPath);
        totalSpace = size;
        freeSpace = free;
        usedSpace = size - free;
      } catch (diskErr) {
        console.error('Disk space check failed:', diskErr);
      }
    }      
    } catch (error) {
      console.error('Error checking server status:', error);
      connected = false;
    }
    console.log('connection status', fs.existsSync(physicalPath));
    console.log('space', totalSpace, usedSpace);
    
    res.json({
      connected,
      totalSpace,
      usedSpace,
      serverPath,
      localPath: physicalPath
    });
    console.log('path', physicalPath);
  } catch (error) {
    console.error('Error getting server status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get server status'
    });
  }
});

// Upload files
router.post('/upload', authenticateToken, upload.array('files', 10), async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // adjust secret
    const currentUserId = decoded.userId; // Assuming your payload includes `id`
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const uploadedFiles = req.files.map(file => {
      const fileMetadataObj = {
        name: file.filename,
        type: 'file',
        size: formatFileSize(file.size),
        path: path.posix.join(req.body.path || '/', file.filename),
        parentPath: req.body.path || '/',
        extension: path.extname(file.filename),
        mimeType: file.mimetype,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        createdBy: currentUserId,
        modifiedBy: currentUserId,
        isShared: false,
        isStarred: false,
        tags: [],
        version: 1,
      };
      console.log('fileMetadataObj', fileMetadataObj);

      // Save .meta.json for each file
      const metaPath = path.join(file.destination, file.filename + '.meta.json');
      const fileaddRequest = new sql.Request();
      fileaddRequest.input('name', sql.NVarChar, fileMetadataObj.name)
        .input('type', sql.NVarChar, fileMetadataObj.type)
        .input('size', sql.NVarChar, fileMetadataObj.size)
        .input('path', sql.NVarChar, fileMetadataObj.path)
        .input('parentPath', sql.NVarChar, fileMetadataObj.parentPath)
        .input('extension', sql.NVarChar, fileMetadataObj.extension)
        .input('mimeType', sql.NVarChar, fileMetadataObj.mimeType)
        .input('createdAt', sql.DateTime, fileMetadataObj.createdAt)
        .input('modifiedAt', sql.DateTime, fileMetadataObj.modifiedAt)
        .input('createdBy', sql.NVarChar, fileMetadataObj.createdBy)
        .input('modifiedBy', sql.NVarChar, fileMetadataObj.modifiedBy)
        //.input('permissions', sql.NVarChar, fileMetadataObj.permissions.split(',').map(tag => tag.trim()))
        .input('isShared', sql.Bit, fileMetadataObj.isShared)
        .input('isStarred', sql.Bit, fileMetadataObj.isStarred)
        //.input('tags', sql.NVarChar, JSON.stringify(fileMetadataObj.tags))
        .input('version', sql.Int, fileMetadataObj.version) 
      fileaddRequest.query(`
        INSERT INTO FileMetadata ( name, type, size, virtualpath, physicalPath, extension, mimeType, createdAt, modifiedAt, createdBy, modifiedBy, isShared, isStarred, version)
        VALUES ( @name, @type, @size, @path, @parentPath, @extension, @mimeType, @createdAt, @modifiedAt, @createdBy, @modifiedBy, @isShared, @isStarred, @version)
      `);
      handleActivityCommit(decoded, `uploaded file ${fileMetadataObj.name}`);
      return fileMetadataObj;
      console.log('fileMetadataObj', fileMetadataObj);
    });

    res.json({
      success: true,
      files: uploadedFiles,
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload files',
      error: error.message
    });
  }
});


// Create a new folder
router.post('/folder', authenticateToken, async (req, res) => {
  try {
    const { name, path: parentPath } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Folder name is required'
      });
    }
    
    const virtualPath = path.posix.join(parentPath || '/', name);
    const physicalPath = getPhysicalPath(virtualPath);
    
    if (fs.existsSync(physicalPath)) {
      return res.status(400).json({
        success: false,
        message: 'Folder already exists'
      });
    }
    
    fs.mkdirSync(physicalPath, { recursive: true });
    
    const folderInfo = {
      id: Buffer.from(virtualPath).toString('base64'),
      name: name,
      type: 'folder',
      size: 0,
      path: virtualPath,
      parentPath: parentPath || '/',
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      createdBy: req.user.id,
      modifiedBy: req.user.id,
      permissions: ['read', 'write'],
      isShared: false,
      isStarred: false,
      tags: [],
      version: 1,
    };
    
    res.json({
      success: true,
      folder: folderInfo,
      message: 'Folder created successfully'
    });
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create folder',
      error: error.message
    });
  }
});

// Download a file
router.get('/download/:fileId', authenticateToken, async (req, res) => {
  try {
    const fileId = req.params.fileId;
    // Decode the file path from the base64 ID
    const filePath = Buffer.from(fileId, 'base64').toString();
    const physicalPath = getPhysicalPath(path.dirname(filePath));
    const fullPath = path.join(physicalPath, path.basename(filePath));
    
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot download a directory'
      });
    }
    console.log("Trying to download file from: full path", fullPath, "physical path", physicalPath, "file path", filePath);
    
    res.download(fullPath, path.basename(filePath));
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download file',
      error: error.message
    });
  }

});

//dowload a folder as zip
router.get('/download/folder/:folderId/:folderName', authenticateToken, async (req, res) => {
  try {
    const folderId = req.params.folderId;
    const folderName = req.params.folderName;
    // Decode the folder path from the base64 ID
    const folderPath = Buffer.from(folderId, 'base64').toString();
    const physicalPath = getPhysicalPath(folderPath);
    if (!fs.existsSync(physicalPath)) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found'
      });
    }
    const output = fs.createWriteStream(`${folderName}.zip`);
    const archiveStream = archive('zip', {
      zlib: { level: 9 } // Set compression level
    });
    archiveStream.pipe(output);
    archiveStream.directory(physicalPath, false);
    archiveStream.finalize();
    output.on('close', () => {
      console.log(`Folder ${folderPath} zipped successfully` + `physicalPath`, physicalPath);
      res.download(`${folderName}.zip`, path.basename(`${folderName}.zip`), (err) => {
        if (err) {
          console.error('Error sending zip file:', err);
          res.status(500).json({
            success: false,
            message: 'Failed to send zip file',
            error: err.message
          });
        } else {
          // Optionally delete the zip file after download
          //check if the file was sent successfully before deleting
        }
      });
    });
  } catch (error) {
    console.error('Error downloading folder as zip:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download folder as zip',
      error: error.message
    });
  }
});

//preview file
router.get('/preview/:fileId', authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // adjust secret
    const fileId = req.params.fileId;
    // Decode the file path from the base64 ID
    const filePath = Buffer.from(fileId, 'base64').toString();
    const physicalPath = getPhysicalPath(path.dirname(filePath));
    const fullPath = path.join(physicalPath, path.basename(filePath));
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot preview a directory'
      });
    }
    console.log("Trying to preview file from: full path", fullPath, "physical path", physicalPath, "file path", filePath);
    res.sendFile(fullPath, { headers: { 'Content-Disposition': 'inline' } });
  } catch (error) {
    console.error('Error previewing file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to preview file',
      error: error.message
    });
  }
});

// Delete a file or folder
router.delete('/:fileId', authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // adjust secret
    const currentUserId = decoded.userId; // Assuming your payload includes `id`
    const fileId = req.params.fileId;
    const filePath = Buffer.from(fileId, 'base64').toString(); // decoded virtual path
    const physicalPath = getPhysicalPath(filePath);

    if (!fs.existsSync(physicalPath)) {
      return res.status(404).json({
        success: false,
        message: 'File or folder not found'
      });
    }

    const stats = fs.statSync(physicalPath);
    if (stats.isDirectory()) {
      fs.rmSync(physicalPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(physicalPath);
    }

    // Delete metadata from SQL Server
    try {
      const deleteMetadataRequest = new sql.Request();
      await deleteMetadataRequest
        .input('path', sql.NVarChar, filePath)
        .query('DELETE FROM FileMetadata WHERE virtualpath = @path');
      handleActivityCommit(decoded, `deleted file ${filePath}`);
    } catch (dbError) {
      console.error('Failed to delete file metadata:', dbError);
      // Don’t fail the whole request if metadata deletion fails
    }

    res.json({
      success: true,
      message: 'File or folder deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file or folder',
      error: error.message
    });
  }
});


//Move a file or folder
router.post('/move', authenticateToken, async (req, res) => {
  try {
    const { sourceId, destinationPath } = req.body;
    const sourcePath = Buffer.from(sourceId, 'base64').toString();
    const physicalSourcePath = getPhysicalPath(sourcePath);
    const physicalDestinationPath = getPhysicalPath(destinationPath);
    
    if (!fs.existsSync(physicalSourcePath)) {
      return res.status(404).json({
        success: false,
        message: 'Source file or folder not found'
      });
    }
    
    if (fs.existsSync(physicalDestinationPath)) {
      return res.status(400).json({
        success: false,
        message: 'Destination path already exists'
      });
    }
    
    fs.renameSync(physicalSourcePath, physicalDestinationPath);
    
    res.json({
      success: true,
      message: 'File or folder moved successfully',
      newPath: destinationPath
    });
  } catch (error) {
    console.error('Error moving file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to move file or folder',
      error: error.message
    });
  }
});

// Rename a file or folder
router.put('/:fileId/rename', authenticateToken, async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const { newName } = req.body;
    
    if (!newName || !newName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'New name is required'
      });
    }
    
    const oldPath = Buffer.from(fileId, 'base64').toString();
    const physicalOldPath = getPhysicalPath(oldPath);
    
    if (!fs.existsSync(physicalOldPath)) {
      return res.status(404).json({
        success: false,
        message: 'File or folder not found'
      });
    }
    
    const newPath = path.join(path.dirname(oldPath), newName);
    const physicalNewPath = getPhysicalPath(newPath);
    
    if (fs.existsSync(physicalNewPath)) {
      return res.status(400).json({
        success: false,
        message: 'A file or folder with that name already exists'
      });
    }
    
    fs.renameSync(physicalOldPath, physicalNewPath);
    
    res.json({
      success: true,
      message: 'File or folder renamed successfully',
      newPath: newPath
    });
  } catch (error) {
    console.error('Error renaming file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to rename file or folder',
      error: error.message
    });
  }
});
router.put('/:fileId/metadata', authenticateToken, async (req, res) => {
  const { tags, isStarred, isShared } = req.body;
  // Locate file metadata (Map, DB, or JSON file) and update it
});


// Search files
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q: query, path: searchPath = '/', type } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const results = [];
    const physicalPath = getPhysicalPath(searchPath);
    
    function searchDirectory(dir, currentPath) {
      try {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
          const itemPath = path.join(dir, item);
          const stats = fs.statSync(itemPath);
          
          // Check if item matches search query
          if (item.toLowerCase().includes(query.toLowerCase())) {
            const fileInfo = getFileStats(itemPath, currentPath, item);
            if (fileInfo && (!type || fileInfo.type === type)) {
              results.push(fileInfo);
            }
          }
          
          // Recursively search subdirectories
          if (stats.isDirectory() && results.length < 100) { // Limit results
            searchDirectory(itemPath, path.posix.join(currentPath, item));
          }
        }
      } catch (error) {
        // Skip directories we can't access
        console.warn(`Cannot access directory: ${dir}`);
      }
    }
    
    searchDirectory(physicalPath, searchPath);
    
    res.json({
      success: true,
      results: results,
      query: query,
      totalResults: results.length
    });
  } catch (error) {
    console.error('Error searching files:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search files',
      error: error.message
    });
  }
});

module.exports = router;
