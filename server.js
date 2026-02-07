const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config()

const authRoutes = require('./routes/auth')
const jobRoutes = require('./routes/jobs')
const upskillRoutes = require('./routes/upskill')
const app = express()
app.use(express.static('public'));

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:8888',
  credentials: true
  }
))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Atlas Connected Successfully'))
  .catch((err) => {
    console.error('MongoDB Connection Error:', err.message)
    process.exit(1)
  })

app.use('/api/auth', authRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/user', upskillRoutes)

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'JobSeeker API is running',
    timestamp: new Date().toISOString()
  })
})


app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  })
})


app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

const PORT = process.env.PORT || 8888

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})