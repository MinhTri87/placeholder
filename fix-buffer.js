const fs = require('fs');
const path = require('path');

const directory = process.argv[2] || '.';

function fixBufferUsage(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Fix new Buffer(string or array)
  content = content.replace(/\bnew\s+Buffer\s*\(\s*(['"`\[].*?)\)/g, 'Buffer.from($1)');

  // Fix new Buffer(number)
  content = content.replace(/\bnew\s+Buffer\s*\(\s*(\d+)\s*\)/g, 'Buffer.alloc($1)');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${filePath}`);
  }
}

function walkDirectory(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDirectory(fullPath);
    } else if (/\.(js|ts)$/.test(file)) {
      fixBufferUsage(fullPath);
    }
  });
}

// Start from the given or current directory
walkDirectory(directory);
