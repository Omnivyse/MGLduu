const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  color: { type: String, default: '#27ae60' }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema); 