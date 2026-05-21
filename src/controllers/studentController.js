const pool = require('../config/db')

const getAllStudents = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query
    const offset = (page - 1) * limit
    let query = 'SELECT * FROM students WHERE 1=1'
    const params = []

    if (search) {
      params.push(`%${search}%`)
      query += ` AND (name ILIKE $${params.length} OR cnic ILIKE $${params.length} OR email ILIKE $${params.length} OR phone ILIKE $${params.length} OR application_id ILIKE $${params.length})`
    }
    if (status) {
      params.push(status)
      query += ` AND status = $${params.length}`
    }

    const countResult = await pool.query(query.replace('SELECT *', 'SELECT COUNT(*)'), params)
    const total = parseInt(countResult.rows[0].count)

    params.push(limit)
    params.push(offset)
    query += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`

    const result = await pool.query(query, params)
    res.json({ success: true, data: result.rows, total, page: parseInt(page), totalPages: Math.ceil(total / limit) })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const getStudentById = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM students WHERE id = $1', [req.params.id])
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Student not found.' })
    res.json({ success: true, data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const createStudent = async (req, res) => {
  const { name, cnic, email, phone, address, course } = req.body
  try {
    const year = new Date().getFullYear()

    // Get max number from existing IDs to avoid duplicate
    const maxRes = await pool.query(
      `SELECT MAX(CAST(SPLIT_PART(application_id, '-', 3) AS INTEGER)) as max_num
       FROM students WHERE application_id LIKE $1`,
      [`APP-${year}-%`]
    )
    const nextNum = (maxRes.rows[0].max_num || 0) + 1
    const appId = `APP-${year}-${String(nextNum).padStart(3, '0')}`

    const result = await pool.query(
      'INSERT INTO students (application_id, name, cnic, email, phone, address, course) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [appId, name, cnic, email, phone, address, course]
    )
    res.status(201).json({ success: true, message: 'Student added successfully.', data: result.rows[0] })
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ success: false, message: 'CNIC already registered.' })
    }
    res.status(500).json({ success: false, message: err.message })
  }
}

const updateStudent = async (req, res) => {
  const { name, cnic, email, phone, address, course, status } = req.body
  try {
    const result = await pool.query(
      'UPDATE students SET name=$1, cnic=$2, email=$3, phone=$4, address=$5, course=$6, status=$7 WHERE id=$8 RETURNING *',
      [name, cnic, email, phone, address, course, status, req.params.id]
    )
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Student not found.' })
    res.json({ success: true, message: 'Student updated.', data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const updateStatus = async (req, res) => {
  const { status } = req.body
  try {
    const result = await pool.query('UPDATE students SET status=$1 WHERE id=$2 RETURNING *', [status, req.params.id])
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Student not found.' })
    res.json({ success: true, message: `Application ${status}.`, data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const deleteStudent = async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Delete related records first (foreign key order)
    await client.query('DELETE FROM payments WHERE challan_id IN (SELECT id FROM challans WHERE student_id = $1)', [req.params.id])
    await client.query('DELETE FROM telemarketing WHERE student_id = $1', [req.params.id])
    await client.query('DELETE FROM challans WHERE student_id = $1', [req.params.id])
    await client.query('DELETE FROM scholarships WHERE student_id = $1', [req.params.id])
    await client.query('DELETE FROM students WHERE id = $1', [req.params.id])

    await client.query('COMMIT')
    res.json({ success: true, message: 'Student and all related records deleted.' })
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ success: false, message: err.message })
  } finally {
    client.release()
  }
}

module.exports = { getAllStudents, getStudentById, createStudent, updateStudent, updateStatus, deleteStudent }
