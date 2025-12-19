const jwt = require('jsonwebtoken')
const { validationResult } = require('express-validator')
const User = require('../models/User')

const generateToken = (id) => {

  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  })
}


exports.register = async (req, res) => {
  
  const errors = validationResult(req)
  if (!errors.isEmpty()) {

    return res.status(400).json({
      success: false,
      errors: errors.array()
    })
  }

  try {

    const { name, email, password, role, location } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) {

      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      })
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'Frontend Developer',
      location: location || ''
    })

    const token = generateToken(user._id)

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
        profileComplete: user.profileComplete
      }
    })

  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    })
  }
}

exports.login = async (req, res) => {
 
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    })
  }

  try {

    const { email, password } = req.body

    const user = await User.findOne({ email }).select('+password')
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      })
    }

    const isMatch = await user.comparePassword(password)
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
        profileComplete: user.profileComplete,
        skillsCount: user.skillsCount,
        yearsExperience: user.yearsExperience
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    })
  }
}

exports.getMe = async (req, res) => {

  try {

    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
        phone: user.phone,
        profileComplete: user.profileComplete,
        skillsCount: user.skillsCount,
        yearsExperience: user.yearsExperience,
        createdAt: user.createdAt
      }
    })

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    })
  }
}

exports.updateProfile = async (req, res) => {

  try {
    
    const { name, role, location, phone, skillsCount, yearsExperience } = req.body

    const updateFields = {}
    if (name) updateFields.name = name
    if (role) updateFields.role = role
    if (location) updateFields.location = location
    if (phone) updateFields.phone = phone
    if (skillsCount !== undefined) updateFields.skillsCount = skillsCount
    if (yearsExperience !== undefined) updateFields.yearsExperience = yearsExperience

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateFields,
      { new: true, runValidators: true }
    )

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
        phone: user.phone,
        profileComplete: user.profileComplete,
        skillsCount: user.skillsCount,
        yearsExperience: user.yearsExperience
      }
    })

  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    })
  }
}