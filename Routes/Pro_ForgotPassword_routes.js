const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx')
const path = require('path');
const { ProforgotPassword, ProresetPassword } = require('../Controller/Pro_ForgotPassword_controller');

const ProforgotPasswordRouter = express.Router();

ProforgotPasswordRouter.post('/proforgot-password', ProforgotPassword);
ProforgotPasswordRouter.post('/proreset-password', ProresetPassword);


module.exports = { ProforgotPasswordRouter };