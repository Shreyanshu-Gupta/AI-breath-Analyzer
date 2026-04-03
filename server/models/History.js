const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  user_email: { type: String, required: true },
  features: { type: Array, required: true },
  prediction: { type: String, required: true },
  values: {
    spo2: Number,
    hr: Number
  },
  timestamp: { type: String, required: true }
});

module.exports = mongoose.model('History', historySchema);
