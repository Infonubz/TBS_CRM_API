const express = require('express')
const { getEmailConfig } = require('../Controller/emailConfigcontroller')

configRouter = express.Router()

configRouter.get('/config-email-information', getEmailConfig)

module.exports = { configRouter }