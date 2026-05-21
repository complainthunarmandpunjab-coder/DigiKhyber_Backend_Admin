const mongoose = require('mongoose')
require('dotenv').config()

const connectMongo = async () => {
  if (mongoose.connection.readyState === 1) return // already connected

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    })
    console.log('Digikhyber MongoDB connected!')
  } catch (err) {
    console.error('MongoDB connection error:', err.message)
    throw err
  }
}

module.exports = connectMongo
