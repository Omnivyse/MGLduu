const mongoose = require('mongoose');

const gameCardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['friendly', 'easy', 'medium', 'hard', 'extreme', 'xxx', 'killer'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: '#4CAF50'
  },
  challenges: [{
    type: String,
    required: true
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('GameCard', gameCardSchema); 