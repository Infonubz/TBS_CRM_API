const express = require('express');
const liveRoute = express.Router();
const {livediscountandpromotion} = require('../Controller/Live_discount_and_promotion')

liveRoute.get('/livediscountandpromotion/:occupation_id', livediscountandpromotion)

module.exports = {liveRoute}