const fs = require('fs');
const path = require('path');

// Exports all files in the dir
const schemas = fs.readdirSync(__dirname).reduce((memo, name) => { // eslint-disable-line no-sync
  const filename = path.join(__dirname, name);
  const extname = path.extname(filename);

  if (filename !== __filename) {
    const schema = require(filename); // eslint-disable-line global-require
    memo[path.basename(filename, extname)] = schema;
  }
  return memo;
}, {});


module.exports = schemas;
