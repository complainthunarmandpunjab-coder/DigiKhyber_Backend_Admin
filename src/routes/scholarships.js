const router = require('express').Router()
const { getAllScholarships, createScholarship, updateScholarshipStatus } = require('../controllers/scholarshipController')
const { verifyToken } = require('../middleware/auth')

router.use(verifyToken)

router.get('/', getAllScholarships)
router.post('/', createScholarship)
router.patch('/:id/status', updateScholarshipStatus)

module.exports = router
