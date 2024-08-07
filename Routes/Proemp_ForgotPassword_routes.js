const express = require('express');
const { ProEmpforgotPassword, ProEmpresetPassword } = require('../Controller/Proemp_ForgotPassword_controller');

const ProEmpforgotPasswordRouter = express.Router();

ProEmpforgotPasswordRouter.post('/proemp-forgot-password', ProEmpforgotPassword);
ProEmpforgotPasswordRouter.post('/proemp-reset-password', ProEmpresetPassword);


module.exports = { ProEmpforgotPasswordRouter };