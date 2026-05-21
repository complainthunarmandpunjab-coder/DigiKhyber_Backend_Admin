const router = require('express').Router()
const { getAllChallans, createChallan, updateChallanStatus, deleteChallan } = require('../controllers/challanController')
const { verifyToken } = require('../middleware/auth')

router.use(verifyToken)

router.get('/', getAllChallans)
router.post('/', createChallan)
router.patch('/:id/status', updateChallanStatus)
router.delete('/:id', deleteChallan)

module.exports = router
