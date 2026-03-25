const mongoose = require('mongoose')

const resumeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalFileUrl: { type: String, required: true },
  originalFileName: { type: String },
  fileType: { type: String, enum: ['pdf', 'docx'], required: true },
  fileSize: { type: Number },              // file size in bytes
  parsedText: { type: String },           // extracted plain text
  modifiedContent: { type: String },      // AI-modified resume (markdown or JSON)
  isPrimary: { type: Boolean, default: false },
  version: { type: Number, default: 1 },
}, { timestamps: true })

module.exports = mongoose.model('Resume', resumeSchema)
