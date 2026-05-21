const mongoose = require('mongoose')

const digiTeleChallanSchema = new mongoose.Schema({
  originalChallanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challan' },
  originalUserId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User'    },
  challanData: {
    challanId: { type: String },
    amount:    { type: Number },
    paid:      { type: Boolean, default: false },
    dueDate:   Date,
    createdAt: Date,
  },
  userData: {
    fullName:   { type: String },
    rollNumber: { type: String },
    phone:      { type: String },
    email:      { type: String },
    city:       { type: String },
  },
  status:       { type: String, default: 'pending' },
  adminNote:    { type: String },
  assignedDate: { type: Date },
  notes: [{ text: String, date: Date, admin: String }],
}, { timestamps: true })

module.exports = mongoose.models.TeleChallan || mongoose.model('TeleChallan', digiTeleChallanSchema)
