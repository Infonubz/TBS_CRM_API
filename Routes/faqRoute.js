const express = require('express');
const { getFaqByid, getFaq } = require('../Controller/faqController');

const faqrouter = express.Router();

faqrouter.get('/faq/:tbs_faq_id', getFaqByid)
faqrouter.get('/faqs', getFaq)

module.exports = { faqrouter }