const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  username: String,
  name: String,
  photo: {
    url: String
  },
  faceDescriptor: Array
});

const User = mongoose.model('User', schema);

module.exports = User;
