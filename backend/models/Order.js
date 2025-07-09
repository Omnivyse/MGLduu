const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  accountName: { type: String, required: true },
  packageName: { type: String, required: true },
  packagePrice: { type: Number, required: true },
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  status: { type: String, default: 'pending', enum: ['pending', 'completed', 'cancelled'] }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema); 