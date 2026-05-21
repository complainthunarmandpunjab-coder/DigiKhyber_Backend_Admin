const mongoose = require('mongoose')

const digiUserSchema = new mongoose.Schema({
  rollNumber:            { type: String },
  secondRollNumber:      { type: String },
  email:                 { type: String },
  fullName:              { type: String },
  fatherName:            { type: String },
  cnic:                  { type: String },
  mobile:                { type: String },
  dateOfBirth:           { type: Date   },
  gender:                { type: String },
  qualification:         { type: String },
  courses:               { type: [String], default: [] },
  secondEnrolledCourses: { type: [String], default: [] },
  physicalCourses:       { type: [String], default: [] },
  permanentAddress:      { type: String },
  city:                  { type: String },
  isVerified:            { type: Boolean, default: false },
  testScore:             { type: Number,  default: null  },
  testPassed:            { type: Boolean, default: false },
  admissionType:         { type: [String], default: [] },
  photo:                 { type: String },
  cnicFront:             { type: String },
  cnicBack:              { type: String },
  referralCode:          { type: String },
}, { timestamps: true })

module.exports = mongoose.models.User || mongoose.model('User', digiUserSchema)
