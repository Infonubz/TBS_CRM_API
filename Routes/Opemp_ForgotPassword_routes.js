const express = require('express');
const { OpEmpforgotPassword, OpEmpresetPassword } = require('../Controller/Opemp_ForgotPassword_controller');

const OpEmpforgotPasswordRouter = express.Router();

OpEmpforgotPasswordRouter.post('/opemp-forgot-password', OpEmpforgotPassword);
OpEmpforgotPasswordRouter.post('/opemp-reset-password', OpEmpresetPassword);


module.exports = { OpEmpforgotPasswordRouter };