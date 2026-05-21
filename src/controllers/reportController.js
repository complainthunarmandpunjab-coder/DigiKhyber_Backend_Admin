const pool = require('../config/db')

const getDashboardStats = async (req, res) => {
  try {
    const [students, challans, scholarships, users, revenue] = await Promise.all([
      pool.query('SELECT status, COUNT(*) FROM students GROUP BY status'),
      pool.query('SELECT status, COUNT(*), SUM(amount) FROM challans GROUP BY status'),
      pool.query('SELECT COUNT(*) FROM scholarships WHERE status = $1', ['pending']),
      pool.query('SELECT COUNT(*) FROM users WHERE status = $1', ['active']),
      pool.query("SELECT SUM(amount) FROM challans WHERE status = 'paid'"),
    ])

    const studentStats = {}
    students.rows.forEach(r => { studentStats[r.status] = parseInt(r.count) })

    const challanStats = {}
    challans.rows.forEach(r => {
      challanStats[r.status] = { count: parseInt(r.count), amount: parseFloat(r.sum || 0) }
    })

    res.json({
      success: true,
      data: {
        totalEnrollments: Object.values(studentStats).reduce((a, b) => a + b, 0),
        pendingEnrollments: studentStats['pending'] || 0,
        approvedEnrollments: studentStats['approved'] || 0,
        rejectedApplications: studentStats['rejected'] || 0,
        paidChallans: challanStats['paid']?.count || 0,
        unpaidChallans: challanStats['unpaid']?.count || 0,
        totalRevenue: challanStats['paid']?.amount || 0,
        scholarshipApplications: parseInt(scholarships.rows[0].count),
        activeUsers: parseInt(users.rows[0].count),
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const getMonthlyRevenue = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT TO_CHAR(paid_date, 'Mon') as month,
             EXTRACT(MONTH FROM paid_date) as month_num,
             SUM(amount) as revenue,
             COUNT(*) as challans
      FROM challans
      WHERE status = 'paid' AND paid_date IS NOT NULL
      AND EXTRACT(YEAR FROM paid_date) = EXTRACT(YEAR FROM NOW())
      GROUP BY month, month_num
      ORDER BY month_num
    `)
    res.json({ success: true, data: result.rows })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = { getDashboardStats, getMonthlyRevenue }
