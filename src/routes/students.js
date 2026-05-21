const router = require('express').Router()
const { getAllStudents, getStudentById, createStudent, updateStudent, updateStatus, deleteStudent } = require('../controllers/studentController')
const { verifyToken } = require('../middleware/auth')

router.use(verifyToken)

router.get('/', getAllStudents)
router.get('/:id', getStudentById)
router.post('/', createStudent)
router.put('/:id', updateStudent)
router.patch('/:id/status', updateStatus)
router.delete('/:id', deleteStudent)

module.exports = router
