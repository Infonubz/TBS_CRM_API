const express = require('express');
const { PartnerforgotPassword, PartnerresetPassword } = require('../Controller/Partner_ForgotPassword_controller');

const PartnerforgotPasswordRouter = express.Router();

PartnerforgotPasswordRouter.post('/partner-forgot-password', PartnerforgotPassword);
PartnerforgotPasswordRouter.post('/partner-reset-password', PartnerresetPassword);


module.exports = { PartnerforgotPasswordRouter };