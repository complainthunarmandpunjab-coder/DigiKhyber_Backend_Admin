const DigiUser         = require('../models/DigiUser')
const DigiScholarship  = require('../models/DigiScholarship')
const DigiChallan      = require('../models/DigiChallan')
const DigiTeleChallan  = require('../models/DigiTeleChallan')
const connectMongo     = require('../config/mongodb')

const getDigiStudents = async (req, res) => {
  try {
    await connectMongo()

    const {
      page      = 1,
      limit     = 10,
      search    = '',
      verified,
      testPassed,
      city,
      course,
      gender,
      qualification,
    } = req.query

    const query = {}

    if (search) {
      query.$or = [
        { fullName:   { $regex: search, $options: 'i' } },
        { cnic:       { $regex: search, $options: 'i' } },
        { email:      { $regex: search, $options: 'i' } },
        { mobile:     { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { city:       { $regex: search, $options: 'i' } },
      ]
    }

    if (verified   !== undefined) query.isVerified = verified   === 'true'
    if (testPassed !== undefined) query.testPassed = testPassed === 'true'
    if (city)          query.city          = { $regex: city,          $options: 'i' }
    if (course)        query.courses       = { $in: [new RegExp(course, 'i')] }
    if (gender)        query.gender        = { $regex: gender,        $options: 'i' }
    if (qualification) query.qualification = { $regex: qualification, $options: 'i' }

    const total = await DigiUser.countDocuments(query)
    const users = await DigiUser.find(query)
      .select('-password -verifyToken -resetPasswordToken -resetPasswordExpire')
      .sort({ createdAt: -1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))

    res.json({
      success: true,
      data:       users,
      total,
      page:       parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const getDigiStudentById = async (req, res) => {
  try {
    await connectMongo()

    const user = await DigiUser.findById(req.params.id)
      .select('-password -verifyToken -resetPasswordToken -resetPasswordExpire')

    if (!user) return res.status(404).json({ success: false, message: 'Student not found.' })

    res.json({ success: true, data: user })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const getDigiStats = async (req, res) => {
  try {
    await connectMongo()

    const [total, verified, testPassed, cities] = await Promise.all([
      DigiUser.countDocuments(),
      DigiUser.countDocuments({ isVerified: true }),
      DigiUser.countDocuments({ testPassed: true }),
      DigiUser.distinct('city'),
    ])

    res.json({
      success: true,
      data: {
        total,
        verified,
        unverified: total - verified,
        testPassed,
        totalCities: cities.length,
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ─── SCHOLARSHIPS ─────────────────────────────────────────────
const getDigiScholarships = async (req, res) => {
  try {
    await connectMongo()
    const { page = 1, limit = 10, search = '', status } = req.query
    const query = {}

    if (search) {
      query.$or = [
        { fullName:   { $regex: search, $options: 'i' } },
        { cnic:       { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { email:      { $regex: search, $options: 'i' } },
      ]
    }
    if (status) query.status = status

    const total = await DigiScholarship.countDocuments(query)
    const data  = await DigiScholarship.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))

    res.json({ success: true, data, total, page: parseInt(page), totalPages: Math.ceil(total / limit) })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ─── CHALLANS ─────────────────────────────────────────────────
const getDigiChallans = async (req, res) => {
  try {
    await connectMongo()
    const { page = 1, limit = 10, search = '', paid, dateFrom, dateTo } = req.query
    const query = {}

    if (paid !== undefined && paid !== '') query.paid = paid === 'true'
    if (dateFrom || dateTo) {
      query.createdAt = {}
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom)
      if (dateTo)   query.createdAt.$lte = new Date(dateTo + 'T23:59:59')
    }

    const total = await DigiChallan.countDocuments(query)
    let challans = await DigiChallan.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))

    // Get student names by joining with User
    const userIds = [...new Set(challans.map(c => c.userId))]
    const users   = await DigiUser.find({ _id: { $in: userIds } })
      .select('fullName cnic email rollNumber courses')

    const userMap = {}
    users.forEach(u => { userMap[u._id.toString()] = u })

    const data = challans.map(c => ({
      ...c.toObject(),
      student: userMap[c.userId] || null,
    }))

    // Search by student name/cnic after join
    const filtered = search
      ? data.filter(c =>
          c.student?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
          c.student?.cnic?.includes(search) ||
          c.challanId?.toLowerCase().includes(search.toLowerCase())
        )
      : data

    res.json({ success: true, data: filtered, total, page: parseInt(page), totalPages: Math.ceil(total / limit) })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const getDigiChallanStats = async (req, res) => {
  try {
    await connectMongo()
    const [total, paid, unpaid, totalAmount, paidAmount] = await Promise.all([
      DigiChallan.countDocuments(),
      DigiChallan.countDocuments({ paid: true }),
      DigiChallan.countDocuments({ paid: false }),
      DigiChallan.aggregate([{ $group: { _id: null, sum: { $sum: '$amount' } } }]),
      DigiChallan.aggregate([{ $match: { paid: true } }, { $group: { _id: null, sum: { $sum: '$amount' } } }]),
    ])
    res.json({
      success: true,
      data: {
        total, paid, unpaid,
        totalAmount:  totalAmount[0]?.sum  || 0,
        paidAmount:   paidAmount[0]?.sum   || 0,
        collectionRate: total > 0 ? Math.round((paid / total) * 100) : 0,
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ─── UPDATE SCHOLARSHIP STATUS (approve/reject) ───────────────
const updateScholarshipStatus = async (req, res) => {
  try {
    await connectMongo()
    const { status } = req.body
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' })
    }
    const doc = await DigiScholarship.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
    if (!doc) return res.status(404).json({ success: false, message: 'Scholarship not found.' })
    res.json({ success: true, message: `Scholarship ${status}.`, data: doc })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ─── UPDATE TEST SCORE ────────────────────────────────────────
const updateTestScore = async (req, res) => {
  try {
    await connectMongo()
    const { testScore, testPassed } = req.body
    const doc = await DigiUser.findByIdAndUpdate(
      req.params.id,
      { testScore, testPassed },
      { new: true }
    ).select('-password')
    if (!doc) return res.status(404).json({ success: false, message: 'Student not found.' })
    res.json({ success: true, message: 'Test score updated.', data: doc })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ─── CHALLAN INQUIRY ──────────────────────────────────────────
const challanInquiry = async (req, res) => {
  try {
    await connectMongo()
    const { challanId } = req.body
    if (!challanId) return res.status(400).json({ success: false, message: 'Challan ID required.' })

    const challan = await DigiChallan.findOne({ challanId })
    if (!challan) return res.status(404).json({ success: false, message: 'Challan not found.' })

    const user = await DigiUser.findById(challan.userId).select('fullName cnic mobile fatherName rollNumber email')

    res.json({
      success: true,
      data: {
        challanId:  challan.challanId,
        amount:     challan.amount,
        paid:       challan.paid,
        psid:       challan.psid,
        txnId:      challan.txnId,
        txnDate:    challan.txnDate,
        branchCode: challan.branchCode,
        student:    user,
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ─── DASHBOARD STATS (combined) ───────────────────────────────
const getDashboardStats = async (req, res) => {
  try {
    await connectMongo()
    const [
      totalStudents, verified, testPassed,
      totalChallans, paidChallans, unpaidChallans, revenueAgg,
      totalScholarships, pendingScholarships, approvedScholarships,
    ] = await Promise.all([
      DigiUser.countDocuments(),
      DigiUser.countDocuments({ isVerified: true }),
      DigiUser.countDocuments({ testPassed: true }),
      DigiChallan.countDocuments(),
      DigiChallan.countDocuments({ paid: true }),
      DigiChallan.countDocuments({ paid: false }),
      DigiChallan.aggregate([{ $match: { paid: true } }, { $group: { _id: null, sum: { $sum: '$amount' } } }]),
      DigiScholarship.countDocuments(),
      DigiScholarship.countDocuments({ status: 'pending' }),
      DigiScholarship.countDocuments({ status: 'approved' }),
    ])

    const totalRevenue     = revenueAgg[0]?.sum || 0
    const collectionRate   = totalChallans > 0 ? Math.round((paidChallans / totalChallans) * 100) : 0

    res.json({
      success: true,
      data: {
        totalStudents, verified, unverified: totalStudents - verified, testPassed,
        totalChallans, paidChallans, unpaidChallans, totalRevenue, collectionRate,
        totalScholarships, pendingScholarships, approvedScholarships,
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ─── TELEMARKETING ────────────────────────────────────────────
const getTelemarketing = async (req, res) => {
  try {
    await connectMongo()
    const { status, page = 1, limit = 10 } = req.query
    const query = {}
    if (status && status !== 'all') query.status = status

    const total = await DigiTeleChallan.countDocuments(query)
    const data  = await DigiTeleChallan.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))

    res.json({ success: true, data, total, page: parseInt(page), totalPages: Math.ceil(total / limit) })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const getTeleStats = async (req, res) => {
  try {
    await connectMongo()
    const [total, pending, called, resolved, unreachable] = await Promise.all([
      DigiTeleChallan.countDocuments(),
      DigiTeleChallan.countDocuments({ status: 'pending'     }),
      DigiTeleChallan.countDocuments({ status: 'called'      }),
      DigiTeleChallan.countDocuments({ status: 'resolved'    }),
      DigiTeleChallan.countDocuments({ status: 'unreachable' }),
    ])
    const conversionRate = total > 0 ? Math.round((resolved / total) * 100) : 0
    res.json({ success: true, data: { total, pending, called, resolved, unreachable, conversionRate } })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const updateTeleStatus = async (req, res) => {
  try {
    await connectMongo()
    const { status, adminNote } = req.body
    const doc = await DigiTeleChallan.findByIdAndUpdate(
      req.params.id,
      { status, ...(adminNote && { adminNote }) },
      { new: true }
    )
    if (!doc) return res.status(404).json({ success: false, message: 'Record not found.' })
    res.json({ success: true, message: 'Status updated.', data: doc })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ─── APPLICATIONS (unverified students) ───────────────────────
const getApplications = async (req, res) => {
  try {
    await connectMongo()
    const { page = 1, limit = 10, search = '', status } = req.query
    const query = {}

    if (search) {
      query.$or = [
        { fullName:   { $regex: search, $options: 'i' } },
        { cnic:       { $regex: search, $options: 'i' } },
        { email:      { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
      ]
    }
    // Filter: unverified = pending, verified = approved
    if (status === 'pending')  query.isVerified = false
    if (status === 'approved') query.isVerified = true

    const total = await DigiUser.countDocuments(query)
    const data  = await DigiUser.find(query)
      .select('-password -verifyToken -resetPasswordToken')
      .sort({ createdAt: -1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))

    res.json({ success: true, data, total, page: parseInt(page), totalPages: Math.ceil(total / limit) })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ─── REPORTS (monthly revenue from challans) ──────────────────
const getMonthlyStats = async (req, res) => {
  try {
    await connectMongo()
    const year = new Date().getFullYear()

    const [monthly, courseStats] = await Promise.all([
      DigiChallan.aggregate([
        { $match: { paid: true, createdAt: { $gte: new Date(`${year}-01-01`) } } },
        { $group: {
          _id:      { $month: '$createdAt' },
          revenue:  { $sum: '$amount' },
          challans: { $sum: 1 },
        }},
        { $sort: { _id: 1 } },
      ]),
      DigiUser.aggregate([
        { $unwind: '$courses' },
        { $group: { _id: '$courses', students: { $sum: 1 } } },
        { $sort: { students: -1 } },
        { $limit: 10 },
      ]),
    ])

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const formattedMonthly = months.map((month, i) => {
      const found = monthly.find(m => m._id === i + 1)
      return { month, revenue: found?.revenue || 0, challans: found?.challans || 0 }
    })

    res.json({
      success: true,
      data: {
        monthly: formattedMonthly,
        courses: courseStats.map(c => ({ course: c._id, students: c.students })),
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = {
  getDigiStudents, getDigiStudentById, getDigiStats,
  getDigiScholarships, updateScholarshipStatus,
  getDigiChallans, getDigiChallanStats, challanInquiry,
  updateTestScore, getDashboardStats,
  getTelemarketing, getTeleStats, updateTeleStatus,
  getApplications, getMonthlyStats,
}
