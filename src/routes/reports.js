const router = require('express').Router()
const { getDashboardStats, getMonthlyRevenue } = require('../controllers/reportController')
const { verifyToken } = require('../middleware/auth')

router.use(verifyToken)

router.get('/dashboard', getDashboardStats)
router.get('/monthly-revenue', getMonthlyRevenue)

module.exports = router
