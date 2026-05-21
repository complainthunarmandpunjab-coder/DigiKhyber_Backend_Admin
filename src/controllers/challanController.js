const pool = require('../config/db')

const getAllChallans = async (req, res) => {
  try {
    const { search, status, dateFrom, dateTo, page = 1, limit = 10 } = req.query
    const offset = (page - 1) * limit
    let query = `SELECT c.*, s.name as student_name, s.cnic, s.course
                 FROM challans c LEFT JOIN students s ON c.student_id = s.id WHERE 1=1`
    const params = []

    if (search) {
      params.push(`%${search}%`)
      query += ` AND (c.challan_id ILIKE $${params.length} OR s.name ILIKE $${params.length} OR s.cnic ILIKE $${params.length})`
    }
    if (status) {
      params.push(status)
      query += ` AND c.status = $${params.length}`
    }
    if (dateFrom) {
      params.push(dateFrom)
      query += ` AND c.due_date >= $${params.length}`
    }
    if (dateTo) {
      params.push(dateTo)
      query += ` AND c.due_date <= $${params.length}`
    }

    const countQuery = query.replace(`SELECT c.*, s.name as student_name, s.cnic, s.course`, 'SELECT COUNT(*)')
    const countResult = await pool.query(countQuery, params)
    const total = parseInt(countResult.rows[0].count)

    params.push(limit)
    params.push(offset)
    query += ` ORDER BY c.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`

    const result = await pool.query(query, params)
    res.json({ success: true, data: result.rows, total, page: parseInt(page), totalPages: Math.ceil(total / limit) })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const createChallan = async (req, res) => {
  const { student_id, amount, due_date, type } = req.body
  try {
    const year = new Date().getFullYear()
    const maxRes = await pool.query(
      `SELECT MAX(CAST(SPLIT_PART(challan_id, '-', 3) AS INTEGER)) as max_num FROM challans WHERE challan_id LIKE $1`,
      [`CHN-${year}-%`]
    )
    const challanId = `CHN-${year}-${String((maxRes.rows[0].max_num || 0) + 1).padStart(3, '0')}`

    const result = await pool.query(
      'INSERT INTO challans (challan_id, student_id, amount, due_date, type) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [challanId, student_id, amount, due_date, type || 'admission']
    )
    res.status(201).json({ success: true, message: 'Challan created.', data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const updateChallanStatus = async (req, res) => {
  const { status } = req.body
  try {
    const paid_date = status === 'paid' ? new Date().toISOString().split('T')[0] : null
    const result = await pool.query(
      'UPDATE challans SET status=$1, paid_date=$2 WHERE id=$3 RETURNING *',
      [status, paid_date, req.params.id]
    )
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Challan not found.' })
    res.json({ success: true, message: `Challan marked as ${status}.`, data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const deleteChallan = async (req, res) => {
  try {
    await pool.query('DELETE FROM challans WHERE id = $1', [req.params.id])
    res.json({ success: true, message: 'Challan deleted.' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = { getAllChallans, createChallan, updateChallanStatus, deleteChallan }
