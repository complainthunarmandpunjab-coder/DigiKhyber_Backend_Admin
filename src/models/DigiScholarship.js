const mongoose = require('mongoose')

const digiScholarshipSchema = new mongoose.Schema({
  userId:        { type: String },
  fullName:      { type: String },
  cnic:          { type: String },
  rollNumber:    { type: String },
  email:         { type: String },
  mobileNumber:  { type: String },
  challanNumber: { type: String },
  imagePath:     { type: String },
  status:        { type: String, default: 'pending' },
  appliedAt:     { type: Date   },
}, { timestamps: true })

module.exports = mongoose.models.Scholarship || mongoose.model('Scholarship', digiScholarshipSchema)
