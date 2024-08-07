const express = require('express')
const { BulkMail } = require('../Controller/bulkmailController')

const mailrouter = express.Router()

mailrouter.post('/sendBulkMail', BulkMail)

module.exports = { mailrouter }