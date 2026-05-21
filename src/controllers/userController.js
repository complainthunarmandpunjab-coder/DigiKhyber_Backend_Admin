const pool = require('../config/db')
const bcrypt = require('bcryptjs')

const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC'
    )
    res.json({ success: true, data: result.rows })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const createUser = async (req, res) => {
  const { name, email, password, role } = req.body
  if (!name || !email || !password || !role) {
    return res.status(400).json({ success: false, message: 'All fields required.' })
  }
  try {
    const hashed = await bcrypt.hash(password, 10)
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1,$2,$3,$4) RETURNING id, name, email, role, status',
      [name, email, hashed, role]
    )
    res.status(201).json({ success: true, message: 'User created.', data: result.rows[0] })
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ success: false, message: 'Email already exists.' })
    res.status(500).json({ success: false, message: err.message })
  }
}

const updateUser = async (req, res) => {
  const { name, role, status } = req.body
  try {
    const result = await pool.query(
      'UPDATE users SET name=$1, role=$2, status=$3 WHERE id=$4 RETURNING id, name, email, role, status',
      [name, role, status, req.params.id]
    )
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found.' })
    res.json({ success: true, message: 'User updated.', data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const deleteUser = async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id])
    res.json({ success: true, message: 'User deleted.' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const changePassword = async (req, res) => {
  const { old_password, new_password } = req.body
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id])
    const user = result.rows[0]
    const isMatch = await bcrypt.compare(old_password, user.password)
    if (!isMatch && old_password !== user.password) {
      return res.status(400).json({ success: false, message: 'Old password is incorrect.' })
    }
    const hashed = await bcrypt.hash(new_password, 10)
    await pool.query('UPDATE users SET password=$1 WHERE id=$2', [hashed, req.user.id])
    res.json({ success: true, message: 'Password changed successfully.' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = { getAllUsers, createUser, updateUser, deleteUser, changePassword }
