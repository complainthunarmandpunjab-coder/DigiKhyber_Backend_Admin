const pool = require('../config/db')

const getPaymentLogs = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, c.challan_id, s.name as student_name
      FROM payments p
      LEFT JOIN challans c ON p.challan_id = c.id
      LEFT JOIN students s ON c.student_id = s.id
      ORDER BY p.created_at DESC
      LIMIT 50
    `)
    res.json({ success: true, data: result.rows })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const recordPayment = async (req, res) => {
  const { challan_id, amount, payment_date, method } = req.body
  if (!challan_id || !amount) {
    return res.status(400).json({ success: false, message: 'Challan ID and amount required.' })
  }
  try {
    const count = await pool.query('SELECT COUNT(*) FROM payments')
    const paymentId = `PAY-${new Date().getFullYear()}-${String(parseInt(count.rows[0].count) + 1).padStart(3, '0')}`

    const payment = await pool.query(
      'INSERT INTO payments (payment_id, challan_id, amount, payment_date, method) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [paymentId, challan_id, amount, payment_date || new Date().toISOString().split('T')[0], method || 'Bank Transfer']
    )

    // Auto update challan status to paid
    await pool.query(
      'UPDATE challans SET status=$1, paid_date=$2 WHERE id=$3',
      ['paid', payment_date || new Date().toISOString().split('T')[0], challan_id]
    )

    res.status(201).json({ success: true, message: 'Payment recorded and challan marked as paid.', data: payment.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const getPaymentStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total_payments,
        SUM(amount) as total_amount,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
        COUNT(*) FILTER (WHERE status = 'unmatched') as unmatched
      FROM payments
    `)
    res.json({ success: true, data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = { getPaymentLogs, recordPayment, getPaymentStats }
