const { validationResult } = require('express-validator')
const JobApplication = require('../models/JobApplication')
const User = require('../models/User')

exports.createJobApplication = async (req, res) => {
 
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    })
  }

  try {

    const { company, position, status, dateApplied, url, notes, salary, location, jobType } = req.body

    const jobApplication = await JobApplication.create({
      user: req.user.id,
      company,
      position,
      status: status || 'Applied',
      dateApplied: dateApplied || Date.now(),
      url: url || '',
      notes: notes || '',
      salary: salary || '',
      location: location || '',
      jobType: jobType || 'Full-time'
    })

    try {

      const user = await User.findById(req.user.id)

      if (user) {

        user.xp += 10
        user.totalXPEarned += 10
        await user.save()
      }

    } catch (error) {
      console.error('XP error:', err)
    }

    res.status(201).json({
      success: true,
      message: 'Job application created successfully',
      data: jobApplication
    })

  } catch (error) {
    console.error('Create job application error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    })
  }
}

exports.getJobApplications = async (req, res) => {
  try {
    const { status, search, sortBy, limit, page } = req.query
    
    let query = { user: req.user.id }

    if (status && status !== 'all') {
      query.status = status
    }

    if (search) {
      query.$or = [
        { company: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } }
      ]
    }

    let sortOption = { dateApplied: -1 } 
    if (sortBy === 'oldest') sortOption = { dateApplied: 1 }
    if (sortBy === 'company') sortOption = { company: 1 }
    if (sortBy === 'status') sortOption = { status: 1 }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50
    const skip = (pageNum - 1) * limitNum

    const jobApplications = await JobApplication.find(query)
      .sort(sortOption)
      .limit(limitNum)
      .skip(skip)

    const total = await JobApplication.countDocuments(query)

    res.status(200).json({
      success: true,
      count: jobApplications.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: jobApplications
    })
  } catch (error) {
    console.error('Get job applications error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    })
  }
}

exports.getJobApplication = async (req, res) => {

  try {

    const jobApplication = await JobApplication.findById(req.params.id)

    if (!jobApplication) {
      return res.status(404).json({
        success: false,
        message: 'Job application not found'
      })
    }

    if (jobApplication.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this job application'
      })
    }

    res.status(200).json({
      success: true,
      data: jobApplication
    })

  } catch (error) {
    console.error('Get job application error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    })
  }
}

exports.updateJobApplication = async (req, res) => {
  
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    })
  }

  try {

    let jobApplication = await JobApplication.findById(req.params.id)

    if (!jobApplication) {
      return res.status(404).json({
        success: false,
        message: 'Job application not found'
      })
    }

    if (jobApplication.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this job application'
      })
    }

    jobApplication = await JobApplication.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )

    res.status(200).json({
      success: true,
      message: 'Job application updated successfully',
      data: jobApplication
    })

  } catch (error) {
    console.error('Update job application error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    })
  }
}

exports.deleteJobApplication = async (req, res) => {
  try {

    const jobApplication = await JobApplication.findById(req.params.id)

    if (!jobApplication) {
      return res.status(404).json({
        success: false,
        message: 'Job application not found'
      })
    }

    if (jobApplication.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this job application'
      })
    }

    await JobApplication.findByIdAndDelete(req.params.id)

    res.status(200).json({
      success: true,
      message: 'Job application deleted successfully',
      data: {}
    })

  } catch (error) {
    console.error('Delete job application error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    })
  }
}

exports.getJobStats = async (req, res) => {

  try {

    const userId = req.user.id
    
    const total = await JobApplication.countDocuments({ user: userId })

    const statusCounts = await JobApplication.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])

    const stats = {
      total,
      applied: 0,
      inReview: 0,
      interview: 0,
      offer: 0,
      rejected: 0
    };

    statusCounts.forEach(item => {
      switch(item._id) {
        case 'Applied':
          stats.applied = item.count
          break;
        case 'In Review':
          stats.inReview = item.count
          break;
        case 'Interview':
          stats.interview = item.count
          break;
        case 'Offer':
          stats.offer = item.count;
          break;
        case 'Rejected':
          stats.rejected = item.count
          break;
      }
    })

    const responded = stats.inReview + stats.interview + stats.offer + stats.rejected
    stats.responseRate = total > 0 ? Math.round((responded / total) * 100) : 0

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const weeklyApps = await JobApplication.countDocuments({
      user: userId,
      dateApplied: { $gte: sevenDaysAgo }
    })

    stats.weeklyApplications = weeklyApps

    res.status(200).json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Get job stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    })
  }
}