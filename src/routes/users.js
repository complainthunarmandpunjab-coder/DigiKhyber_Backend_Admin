const router = require('express').Router()
const { getAllUsers, createUser, updateUser, deleteUser, changePassword } = require('../controllers/userController')
const { verifyToken, checkRole } = require('../middleware/auth')

router.use(verifyToken)

router.get('/',                getAllUsers)
router.post('/',               checkRole('super_admin'), createUser)
router.put('/:id',             checkRole('super_admin'), updateUser)
router.delete('/:id',          checkRole('super_admin'), deleteUser)
router.post('/change-password', changePassword)

module.exports = router
