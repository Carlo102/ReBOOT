const mongoose = require('mongoose')

const jobApplicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: String,
    required: [true, 'Please provide a company name'],
    trim: true
  },
  position: {
    type: String,
    required: [true, 'Please provide a position'],
    trim: true
  },
  status: {
    type: String,
    enum: ['Applied', 'In Review', 'Interview', 'Offer', 'Rejected'],
    default: 'Applied'
  },
  dateApplied: {
    type: Date,
    default: Date.now
  },
  url: {
    type: String,
    default: '',
    trim: true
  },
  notes: {
    type: String,
    default: '',
    trim: true
  },
  salary: {
    type: String,
    default: '',
    trim: true
  },
  location: {
    type: String,
    default: '',
    trim: true
  },
  jobType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'],
    default: 'Full-time'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

jobApplicationSchema.index({ user: 1, dateApplied: -1 })
jobApplicationSchema.index({ user: 1, status: 1 })

jobApplicationSchema.virtual('daysAgo').get(function() {
  const today = new Date()
  const diffTime = Math.abs(today - this.dateApplied)
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
})

jobApplicationSchema.set('toJSON', { virtuals: true })
jobApplicationSchema.set('toObject', { virtuals: true })

module.exports = mongoose.model('JobApplication', jobApplicationSchema)