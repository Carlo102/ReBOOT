const express = require('express')
const router = express.Router()
const User = require('../models/User')
const {protect} = require('../middleware/auth')

router.use(protect)

router.get('/upskill-progress', protect, async (req, res) => {

  try {

    const user = await User.findById(req.userId).select('coursesCompleted challengesCompleted upskillProgress careerInterests lastChallengeDate')
    
    if (!user) {

      return res.status(404).json({ message: 'User not found' })

    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let dailyChallengeCompleted = false
    if (user.lastChallengeDate) {

      const lastChallenge = new Date(user.lastChallengeDate)
      lastChallenge.setHours(0, 0, 0, 0)
      dailyChallengeCompleted = (lastChallenge.getTime() === today.getTime())
    }

    res.json({
      coursesCompleted: user.coursesCompleted.length,
      challengesCompleted: user.challengesCompleted.length,
      interests: user.careerInterests || [],
      dailyChallengeCompleted: dailyChallengeCompleted,
      upskillProgress: user.upskillProgress || { totalCourses: 0, totalChallenges: 0, resourcesAccessed: 0 }
    })

  } catch (error) {
    console.error('Error fetching upskill progress:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

router.put('/upskill-progress', protect, async (req, res) => {

  try {

    const { coursesCompleted, challengesCompleted, interests } = req.body

    const user = await User.findById(req.userId)
    
    if (!user) {

      return res.status(404).json({ message: 'User not found' })

    }

    if (coursesCompleted !== undefined) {
      user.upskillProgress.totalCourses = coursesCompleted;
    }
    
    if (challengesCompleted !== undefined) {
      user.upskillProgress.totalChallenges = challengesCompleted;
    }
    
    if (interests) {
      user.careerInterests = interests;
    }

    await user.save()

    res.json({
      message: 'Progress updated successfully',
      upskillProgress: user.upskillProgress
    })

  } catch (error) {
    console.error('Error updating upskill progress:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

router.post('/complete-course', protect, async (req, res) => {

  try {

    const { courseName, platform } = req.body

    if (!courseName) {

      return res.status(400).json({ message: 'Course name required' })

    }

    const user = await User.findById(req.userId)
    
    if (!user) {

      return res.status(404).json({ message: 'User not found' })

    }

    user.coursesCompleted.push({
      courseName: courseName,
      platform: platform || 'YouTube',
      completedAt: new Date()
    })

    user.upskillProgress.totalCourses = user.coursesCompleted.length

    await user.save()

    res.json({
      message: 'Course completed successfully',
      courseName: courseName,
      totalCourses: user.coursesCompleted.length
    })

  } catch (error) {
    console.error('Error completing course:', error)
    res.status(500).json({ message: 'Server error' })
  }
});

router.get('/daily-challenge', protect, async (req, res) => {

  try {

    const user = await User.findById(req.userId)
    
    if (!user) {

      return res.status(404).json({ message: 'User not found' })

    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let completed = false
    if (user.lastChallengeDate) {

      const lastChallenge = new Date(user.lastChallengeDate)
      lastChallenge.setHours(0, 0, 0, 0)
      completed = (lastChallenge.getTime() === today.getTime())
    }

    const challenges = [
      { 
        title: 'Watch a Tutorial', 
        description: 'Watch a 10-minute coding tutorial on YouTube',
        type: 'video'
      },
      { 
        title: 'Practice Coding', 
        description: 'Complete one coding exercise on any platform',
        type: 'practice'
      },
      { 
        title: 'Learn Something New', 
        description: 'Read an article about a new technology or framework',
        type: 'reading'
      },
      { 
        title: 'Resume Update', 
        description: 'Add a new skill or update your resume',
        type: 'career'
      },
      { 
        title: 'LinkedIn Activity', 
        description: 'Connect with 3 professionals in your field',
        type: 'networking'
      },
      { 
        title: 'Skill Practice', 
        description: 'Spend 15 minutes practicing a technical skill',
        type: 'practice'
      },
      { 
        title: 'Career Research', 
        description: 'Research a company you want to work for',
        type: 'research'
      }
    ]

    const dayOfWeek = new Date().getDay()
    const todayChallenge = challenges[dayOfWeek]

    res.json({
      challenge: todayChallenge,
      completed: completed
    })

  } catch (error) {
    console.error('Error fetching daily challenge:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

router.post('/complete-challenge', protect, async (req, res) => {

  try {

    const user = await User.findById(req.userId)
    
    if (!user) {

      return res.status(404).json({ message: 'User not found' })

    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (user.lastChallengeDate) {

      const lastChallenge = new Date(user.lastChallengeDate)
      lastChallenge.setHours(0, 0, 0, 0)

      if (lastChallenge.getTime() === today.getTime()) {
        return res.status(400).json({ message: 'Challenge already completed today' })
      }
    }

    user.challengesCompleted.push({
      challengeId: `challenge_${Date.now()}`,
      completedAt: new Date()
    })

    user.lastChallengeDate = new Date()

    user.upskillProgress.totalChallenges = user.challengesCompleted.length

    await user.save()

    res.json({
      message: 'Challenge completed successfully',
      totalChallenges: user.challengesCompleted.length
    })

  } catch (error) {
    console.error('Error completing challenge:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

router.post('/track-resource', protect, async (req, res) => {

  try {

    const { resourceType, resourceName } = req.body

    const user = await User.findById(req.userId)
    
    if (!user) {

      return res.status(404).json({ message: 'User not found' })

    }

    user.upskillProgress.resourcesAccessed += 1

    await user.save()

    res.json({
      message: 'Resource access tracked',
      totalResources: user.upskillProgress.resourcesAccessed
    })

  } catch (error) {
    console.error('Error tracking resource:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

router.put('/career-interests', protect, async (req, res) => {
    
  try {

    const { interests } = req.body

    if (!interests || !Array.isArray(interests)) {

      return res.status(400).json({ message: 'Valid interests array required' })

    }

    const user = await User.findById(req.userId)
    
    if (!user) {

      return res.status(404).json({ message: 'User not found' })

    }

    user.careerInterests = interests;
    await user.save()

    res.json({
      message: 'Career interests updated successfully',
      interests: user.careerInterests
    })

  } catch (error) {
    console.error('Error updating career interests:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

router.get('/learning-history', protect, async (req, res) => {

  try {

    const user = await User.findById(req.userId).select('coursesCompleted challengesCompleted')
    
    if (!user) {

      return res.status(404).json({ message: 'User not found' })

    }

    res.json({
      courses: user.coursesCompleted.sort((a, b) => b.completedAt - a.completedAt),
      challenges: user.challengesCompleted.sort((a, b) => b.completedAt - a.completedAt)
    })

  } catch (error) {
    console.error('Error fetching learning history:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router