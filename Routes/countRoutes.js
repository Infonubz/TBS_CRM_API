const express = require('express')
const { counts } = require('../Controller/countController')

const countrouter = express.Router()

countrouter.get('/counts', counts)

module.exports = { countrouter }