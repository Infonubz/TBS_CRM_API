const express = require('express')
const { BulkMail, getFromEmail } = require('../Controller/bulkmailController')

const mailrouter = express.Router()


mailrouter.post('/sendBulkMail', BulkMail)

mailrouter.get('/getFromEmail', getFromEmail)

module.exports = { mailrouter }