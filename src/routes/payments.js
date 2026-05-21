const router = require('express').Router()
const { getPaymentLogs, recordPayment, getPaymentStats } = require('../controllers/paymentController')
const { verifyToken } = require('../middleware/auth')

router.use(verifyToken)

router.get('/',        getPaymentLogs)
router.get('/stats',   getPaymentStats)
router.post('/',       recordPayment)

module.exports = router
