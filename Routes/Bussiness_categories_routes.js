const express = require('express');
const { getAllBussiness, getBussinessbyId } = require('../Controller/Bussiness_categories_controller');


BussinessRouter = express.Router()

BussinessRouter.get('/bussiness-categories', getAllBussiness)
BussinessRouter.get('/bussiness-categories/:id', getBussinessbyId)

module.exports = { BussinessRouter }