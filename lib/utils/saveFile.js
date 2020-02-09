const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '../../debugImages');

module.exports = function saveFile(fileName, buf) {
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir);
  }

  fs.writeFileSync(path.resolve(baseDir, fileName), buf);
}
