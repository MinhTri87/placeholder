const fs = require('fs');
const path = require('path');

const rootDir = __dirname; // Change if you want to target a specific folder

const scanDir = (dir) => {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);

    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath);
    } else if (file.endsWith('.js')) {
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        if (content.includes('new Buffer(')) {
          console.log(`[!] Deprecated Buffer found in: ${fullPath}`);
        }
      } catch (err) {
        console.warn(`Could not read: ${fullPath}`);
      }
    }
  });
};

console.log("Scanning entire project for deprecated Buffer() usage...");
scanDir(rootDir);
console.log("Scan complete.");
