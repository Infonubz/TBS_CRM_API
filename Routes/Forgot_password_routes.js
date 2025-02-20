const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx')
const path = require('path');
const { forgotPassword, resetPassword } = require('../Controller/Forgot_password_controller');

const forgotPasswordRouter = express.Router();

forgotPasswordRouter.post('/forgot-password', forgotPassword);
forgotPasswordRouter.post('/reset-password', resetPassword);


module.exports = { forgotPasswordRouter };