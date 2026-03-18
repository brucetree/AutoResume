const mongoose = require('mongoose')
const app = require('./app')

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:password@localhost:27017/autoresume?authSource=admin'

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err))

const PORT = process.env.PORT || 5001
const server = app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})

module.exports = { app, server }
