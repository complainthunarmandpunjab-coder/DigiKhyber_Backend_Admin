const pool = require('../config/db')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
require('dotenv').config()

const login = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required.' })
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1 AND status = $2', [email, 'active'])

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' })
    }

    const user = result.rows[0]
    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      // also check plain text for default admin
      if (password !== user.password) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' })
      }
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const getProfile = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, status, created_at FROM users WHERE id = $1', [req.user.id])
    res.json({ success: true, user: result.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = { login, getProfile }
