const mongoose = require('mongoose')

const applicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: String, required: true, trim: true },
  position: { type: String, required: true, trim: true },
  jobDescription: { type: String },
  jobUrl: { type: String },
  gapAnalysis: { type: String },          // AI gap analysis result
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
  modifiedResumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
  status: {
    type: String,
    enum: ['analyzing', 'editing', 'applied', 'interview', 'rejected', 'offer'],
    default: 'analyzing',
  },
}, { timestamps: true })

module.exports = mongoose.model('Application', applicationSchema)
