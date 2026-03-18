const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String },
  provider: { type: String, default: 'credentials' }, // credentials | google | github
}, { timestamps: true })

userSchema.methods.comparePassword = async function (password) {
  if (!this.passwordHash) return false
  return bcrypt.compare(password, this.passwordHash)
}

userSchema.statics.hashPassword = async function (password) {
  return bcrypt.hash(password, 12)
}

module.exports = mongoose.model('User', userSchema)
