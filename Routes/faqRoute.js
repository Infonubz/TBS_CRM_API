const express = require('express');
const { getFaq, getFaqByid, updateFqs, createfaqs, deleteApi, getAllFaq } = require('../Controller/faqController');

const faqrouter = express.Router();

faqrouter.put('/faq/:tbs_faqs_id', updateFqs)
faqrouter.post('/faq', createfaqs)
faqrouter.get('/faq/:tbs_faqs_id', getFaqByid)
faqrouter.get('/faqs/:category', getFaq)
faqrouter.delete('/faq/:question_id', deleteApi)
faqrouter.get('/faqs', getAllFaq)

module.exports = { faqrouter }