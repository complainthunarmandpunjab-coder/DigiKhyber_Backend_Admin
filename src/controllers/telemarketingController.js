const pool = require('../config/db')

const getAllTelemarketing = async (req, res) => {
  try {
    const { status } = req.query
    let query = `
      SELECT t.*, s.name as student_name, s.phone, s.course,
             c.challan_id, c.amount
      FROM telemarketing t
      LEFT JOIN students s ON t.student_id = s.id
      LEFT JOIN challans c ON t.challan_id = c.id
      WHERE 1=1
    `
    const params = []
    if (status) {
      params.push(status)
      query += ` AND t.status = $${params.length}`
    }
    query += ' ORDER BY t.created_at DESC'
    const result = await pool.query(query, params)
    res.json({ success: true, data: result.rows })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const createTelemarketing = async (req, res) => {
  const { student_id, challan_id, follow_up_date, notes } = req.body
  const staff_name = req.user.name
  try {
    const result = await pool.query(
      'INSERT INTO telemarketing (staff_name, student_id, challan_id, follow_up_date, notes) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [staff_name, student_id, challan_id, follow_up_date, notes]
    )
    res.status(201).json({ success: true, message: 'Follow-up assigned.', data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const updateTelemarketingStatus = async (req, res) => {
  const { status, notes } = req.body
  try {
    const result = await pool.query(
      'UPDATE telemarketing SET status=$1, notes=$2 WHERE id=$3 RETURNING *',
      [status, notes, req.params.id]
    )
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Record not found.' })
    res.json({ success: true, message: 'Status updated.', data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const getTelemarketingStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'converted') as converted,
        COUNT(*) FILTER (WHERE status = 'no_response') as no_response
      FROM telemarketing
    `)
    const stats = result.rows[0]
    const conversionRate = stats.total > 0
      ? Math.round((stats.converted / stats.total) * 100)
      : 0
    res.json({ success: true, data: { ...stats, conversionRate } })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = { getAllTelemarketing, createTelemarketing, updateTelemarketingStatus, getTelemarketingStats }
