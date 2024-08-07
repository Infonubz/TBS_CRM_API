const express = require('express');
const multer = require('multer');
const { OpforgotPassword, OpresetPassword } = require('../Controller/Op_ForgotPassword_controller');

const OpforgotPasswordRouter = express.Router();

OpforgotPasswordRouter.post('/opforgot-password', OpforgotPassword);
OpforgotPasswordRouter.post('/opreset-password', OpresetPassword);


module.exports = { OpforgotPasswordRouter };