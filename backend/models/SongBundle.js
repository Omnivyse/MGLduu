const mongoose = require('mongoose');

const songBundleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    default: ''
  },
  imageBase64: {
    type: String,
    default: ''
  },
  links: [{
    name: { type: String, required: true },
    url: { type: String, required: true }
  }],
  piece: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Force collection name to 'songbundles' regardless of model name
module.exports = mongoose.model('SongBundle', songBundleSchema, 'songbundles'); 