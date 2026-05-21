const router = require('express').Router()
const {
  getDigiStudents, getDigiStudentById, getDigiStats,
  getDigiScholarships, updateScholarshipStatus,
  getDigiChallans, getDigiChallanStats, challanInquiry,
  updateTestScore, getDashboardStats,
  getTelemarketing, getTeleStats, updateTeleStatus,
  getApplications, getMonthlyStats,
} = require('../controllers/digiController')
const { verifyToken } = require('../middleware/auth')

router.use(verifyToken)

// Dashboard
router.get('/dashboard-stats',           getDashboardStats)

// Students
router.get('/students',                  getDigiStudents)
router.get('/students/:id',              getDigiStudentById)
router.get('/stats',                     getDigiStats)
router.patch('/students/:id/test',       updateTestScore)

// Applications
router.get('/applications',              getApplications)

// Scholarships
router.get('/scholarships',              getDigiScholarships)
router.patch('/scholarships/:id/status', updateScholarshipStatus)

// Challans
router.get('/challans',                  getDigiChallans)
router.get('/challan-stats',             getDigiChallanStats)
router.post('/challan-inquiry',          challanInquiry)

// Telemarketing
router.get('/telemarketing',             getTelemarketing)
router.get('/telemarketing/stats',       getTeleStats)
router.patch('/telemarketing/:id',       updateTeleStatus)

// Reports
router.get('/monthly-stats',             getMonthlyStats)

module.exports = router
