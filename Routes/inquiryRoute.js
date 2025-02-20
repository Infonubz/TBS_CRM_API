const express = require('express')
const { Inquiry } = require('../Controller/inquiryController')

const inquiry = express.Router()

inquiry.post('/submit-inquiry', Inquiry)

module.exports = { inquiry }