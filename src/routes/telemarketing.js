const router = require('express').Router()
const { getAllTelemarketing, createTelemarketing, updateTelemarketingStatus, getTelemarketingStats } = require('../controllers/telemarketingController')
const { verifyToken } = require('../middleware/auth')

router.use(verifyToken)

router.get('/',          getAllTelemarketing)
router.get('/stats',     getTelemarketingStats)
router.post('/',         createTelemarketing)
router.patch('/:id',     updateTelemarketingStatus)

module.exports = router
