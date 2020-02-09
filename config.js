const pkg = require('./package.json');
require('dotenv').config();

const {
  PORT,
  MONGODB_URL
} = process.env;

const config = {
  MONGODB_URL,
  service: {
    port: PORT,
    name: pkg.name
  },
  database: 'photo-wars'
};


module.exports = config;
