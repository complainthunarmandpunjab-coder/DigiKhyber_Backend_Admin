const pool = require('../config/db')

const getAllScholarships = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query
    const offset = (page - 1) * limit
    let query = `SELECT sc.*, s.name as student_name, s.cnic, s.course
                 FROM scholarships sc LEFT JOIN students s ON sc.student_id = s.id WHERE 1=1`
    const params = []

    if (status) {
      params.push(status)
      query += ` AND sc.status = $${params.length}`
    }

    params.push(limit)
    params.push(offset)
    query += ` ORDER BY sc.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`

    const result = await pool.query(query, params)
    res.json({ success: true, data: result.rows })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const createScholarship = async (req, res) => {
  const { student_id, category, requested_amount } = req.body
  try {
    const count = await pool.query('SELECT COUNT(*) FROM scholarships')
    const appId = `SCH-${new Date().getFullYear()}-${String(parseInt(count.rows[0].count) + 1).padStart(3, '0')}`

    const result = await pool.query(
      'INSERT INTO scholarships (application_id, student_id, category, requested_amount) VALUES ($1,$2,$3,$4) RETURNING *',
      [appId, student_id, category, requested_amount]
    )
    res.status(201).json({ success: true, message: 'Scholarship application submitted.', data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const updateScholarshipStatus = async (req, res) => {
  const { status } = req.body
  try {
    const review_date = new Date().toISOString().split('T')[0]
    const result = await pool.query(
      'UPDATE scholarships SET status=$1, review_date=$2 WHERE id=$3 RETURNING *',
      [status, review_date, req.params.id]
    )
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Scholarship not found.' })
    res.json({ success: true, message: `Scholarship ${status}.`, data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = { getAllScholarships, createScholarship, updateScholarshipStatus }
