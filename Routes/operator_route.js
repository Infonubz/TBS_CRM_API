const express = require('express')
const multer = require('multer');
const path = require('path');
const { postOperator, putOperatorPersonal, Emailvalidation, phoneValidation, deleteOperator, searchOperator, getOperator, Operator_business_details, Operator_detailsByID, getOperator_addressByID, getOperator_address, operator_details, getGST, getGSTByID, getDoc, getDocByID, getOperatorByID, putOperator, operatorLogin, getImg, getImgByID, ImportExcel, getEmail, getEmailByID, getEmails, getPhones } = require('../Controller/operator_controller');

const oprouter = express.Router()

const operator_storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'operator_files/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueSuffix);
    }
});

const operator_upload = multer({ 
    storage: operator_storage,
    limits: { fileSize: 5 * 1024 * 1024 }, 
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
            'image/jpeg', 
            'image/jpg',
            'image/png', 
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only .jpeg, .jpg, .png, .pdf, .xlsx, .mp4, .webm, .avi, and .mkv files are allowed'), false);
        }
    }
})

const operator_excelupload = multer({ 
    storage: operator_storage,
    limits: { fileSize: 5 * 1024 * 1024 }, 
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only.xlsx files are allowed'), false);
        }
    }
})

oprouter.post('/operators', operator_upload.single('profileimg'), postOperator);

const uploadFields = operator_upload.fields([
    { name: 'upload_gst' },
    { name: 'aadar_front_doc' },
    { name: 'aadar_back_doc' },
    { name: 'pancard_front_doc' },
    { name: 'pancard_back_doc' },
    { name: 'msme_doc', maxCount: 1 }
]);

oprouter.put('/operator/:tbs_operator_id', operator_upload.single('profileimg'), putOperatorPersonal)
oprouter.put('/operators-withAll-data/:tbs_operator_id', uploadFields, putOperator)
oprouter.post('/operator_email-validation', Emailvalidation)
oprouter.post('/operator_validation', phoneValidation)
oprouter.post('/emailid', getEmails)
oprouter.post('/phone', getPhones)
oprouter.delete('/operators/:tbs_operator_id', deleteOperator)
oprouter.get('/operators-search/:tbs_user_id/:search_term', searchOperator)
oprouter.get('/operators', getOperator)
oprouter.get('/operators-profileImg', getImg)
oprouter.get('/operators-profileImg/:tbs_operator_id', getImgByID)
oprouter.get('/operators-emailid', getEmail)
oprouter.get('/operators-emailid/:tbs_operator_id', getEmailByID)
oprouter.get('/operators/:tbs_operator_id', getOperatorByID)
oprouter.get('/get-business/:tbs_operator_id', Operator_detailsByID)
oprouter.get('/getall-business', Operator_business_details)
oprouter.post('/operator-login', operatorLogin)
//prouter.put('/operator-profileImg/:tbs_operator_id', , putOperatorProfileImg);

oprouter.get('/getall-address/:tbs_operator_id', getOperator_addressByID)
oprouter.get('/getall-address', getOperator_address)

oprouter.post('/operator_details/:tbs_operator_id', operator_upload.fields([
    { name: 'upload_gst', maxCount: 1 },
    { name: 'aadar_front_doc', maxCount: 1 },
    { name: 'aadar_back_doc', maxCount: 1 },
    { name: 'pancard_front_doc', maxCount: 1 },
    { name: 'pancard_back_doc', maxCount: 1 },
    { name: 'msme_docs', maxCount: 1 }]), operator_details)
    
oprouter.put('/operator_details/:tbs_operator_id', operator_upload.fields([
        { name: 'upload_gst', maxCount: 1 },
        { name: 'aadar_front_doc', maxCount: 1 },
        { name: 'aadar_back_doc', maxCount: 1 },
        { name: 'pancard_front_doc', maxCount: 1 },
        { name: 'pancard_back_doc', maxCount: 1 },
        { name: 'msme_docs', maxCount: 1 }]), operator_details)


oprouter.get('/getall-GST', getGST)
oprouter.get('/get-GST/:tbs_operator_id', getGSTByID)
oprouter.get('/getall-Docs', getDoc)
oprouter.get('/get-Docs/:tbs_operator_id', getDocByID)
oprouter.post('/excelupload', operator_excelupload.single('xlsxFile'), ImportExcel)

module.exports = { oprouter }
