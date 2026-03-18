const mongoose = require('mongoose')

const resumeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalFileUrl: { type: String, required: true },
  originalFileName: { type: String },
  fileType: { type: String, enum: ['pdf', 'docx'], required: true },
  parsedText: { type: String },           // extracted plain text
  modifiedContent: { type: String },      // AI-modified resume (markdown or JSON)
  version: { type: Number, default: 1 },
}, { timestamps: true })

module.exports = mongoose.model('Resume', resumeSchema)
