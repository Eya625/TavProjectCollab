// user.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullname: String,
  dateOfBirth: Date,
  email: String,
  address: String,
  password: String,
  profile: String,
  phone: String,
  profileImage: String
});

module.exports = mongoose.model('User', userSchema);
