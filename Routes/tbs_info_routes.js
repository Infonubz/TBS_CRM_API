const express = require('express');
const multer = require('multer');
const path = require('path');
const { getTbsInfo, postAboutUs, putAboutUs, putPrivacyPolicy, putUserAgreement, putTermsConditions } = require('../Controller/tbs_info_controller');

const tbsInfoRouter = express.Router()

// Configure multer for file uploads
const infoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'tbsInfo_uploads/'); 
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const infoUpload = multer({ storage: infoStorage });


tbsInfoRouter.post('/tbsInfo', infoUpload.single('about_us_file'), postAboutUs)
tbsInfoRouter.put('/tbsInfo-About/:id', infoUpload.single('about_us_file'), putAboutUs)
tbsInfoRouter.put('/tbsInfo-Privacy/:id', infoUpload.single('privacy_policy_file'), putPrivacyPolicy)
tbsInfoRouter.put('/tbsInfo-User/:id', infoUpload.single('user_agreement_file'), putUserAgreement)
tbsInfoRouter.put('/tbsInfo-Terms/:id', infoUpload.single('terms_conditions_file'), putTermsConditions)
tbsInfoRouter.get('/tbsInfo', getTbsInfo);


module.exports = { tbsInfoRouter }