const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  category: {
    type: String,
    enum: ['General', 'Service', 'Product', 'Experience', 'Support', 'Other'],
    default: 'General'
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  message: {
    type: String,
    required: [true, 'Feedback message is required'],
    trim: true,
    maxlength: [2000, 'Feedback cannot exceed 2000 characters']
  },
  sentiment: {
    label: {
      type: String,
      enum: ['Positive', 'Neutral', 'Negative'],
      default: 'Neutral'
    },
    score: {
      type: Number,
      default: 0
    },
    comparative: {
      type: Number,
      default: 0
    },
    positiveWords: {
      type: [String],
      default: []
    },
    negativeWords: {
      type: [String],
      default: []
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
feedbackSchema.index({ createdAt: -1 });
feedbackSchema.index({ 'sentiment.label': 1 });
feedbackSchema.index({ category: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
