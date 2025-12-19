const express = require('express')
const router = express.Router()
const { body } = require('express-validator')
const {
  createJobApplication,
  getJobApplications,
  getJobApplication,
  updateJobApplication,
  deleteJobApplication,
  getJobStats
} = require('../controller/jobController')
const { protect } = require('../middleware/auth')

router.use(protect)

router.get('/stats', getJobStats)

router.post('/', [
  body('company').trim().notEmpty().withMessage('Company name is required'),
  body('position').trim().notEmpty().withMessage('Position is required'),
  body('status').optional().isIn(['Applied', 'In Review', 'Interview', 'Offer', 'Rejected'])
], createJobApplication)

router.get('/', getJobApplications)

router.get('/:id', getJobApplication)

router.put('/:id', [
  body('company').optional().trim().notEmpty().withMessage('Company name cannot be empty'),
  body('position').optional().trim().notEmpty().withMessage('Position cannot be empty'),
  body('status').optional().isIn(['Applied', 'In Review', 'Interview', 'Offer', 'Rejected'])
], updateJobApplication)

router.delete('/:id', deleteJobApplication)

module.exports = router