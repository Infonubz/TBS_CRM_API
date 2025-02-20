const express = require('express');
const { getAllCurrency, getCurrencybyId } = require('../Controller/Currency_code_controller');

currencyRouter = express.Router()

currencyRouter.get('/currency-code', getAllCurrency)
currencyRouter.get('/currency-code/:id', getCurrencybyId)

module.exports = { currencyRouter }