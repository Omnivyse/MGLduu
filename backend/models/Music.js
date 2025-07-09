const mongoose = require('mongoose');

const musicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  artist: {
    type: String,
    required: true
  },
  youtubeUrl: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    enum: ['zohiolyn', 'orchin', 'zaluu', 'gadaad'],
    default: 'zohiolyn'
  },
  bundleId: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Music', musicSchema); 