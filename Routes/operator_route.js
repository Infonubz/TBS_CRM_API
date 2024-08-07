const express = require('express')
const multer = require('multer');
const path = require('path');
const { postOperator, putOperatorPersonal, Emailvalidation, phoneValidation, deleteOperator, searchOperator, getOperator, Operator_business_details, Operator_detailsByID, getOperator_addressByID, getOperator_address, operator_details, getGST, getGSTByID, getDoc, getDocByID, getOperatorByID, putOperator, operatorLogin, putOperatorProfileImg, excelImport, getOperatorProfileImg, getOperatorProfileImgByid } = require('../Controller/operator_controller');

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

oprouter.post('/operators', postOperator);

const uploadFields = operator_upload.fields([
    { name: 'upload_gst' },
    { name: 'aadar_front_doc' },
    { name: 'aadar_back_doc' },
    { name: 'pancard_front_doc' },
    { name: 'pancard_back_doc' },
    { name: 'msme_doc', maxCount: 1 }
]);

oprouter.put('/operator/:tbs_operator_id', uploadFields, putOperatorPersonal)
oprouter.put('/operators-withAll-data/:tbs_operator_id', uploadFields, putOperator)
oprouter.post('/operator_email-validation', Emailvalidation)
oprouter.post('/operator_validation', phoneValidation)
oprouter.delete('/operators/:tbs_operator_id', deleteOperator)
oprouter.get('/operators-search/:search_term', searchOperator)
oprouter.get('/operators', getOperator)
oprouter.get('/operators/:tbs_operator_id', getOperatorByID)
oprouter.get('/get-business/:tbs_operator_id', Operator_business_details)
oprouter.get('/getall-business', Operator_detailsByID)
oprouter.post('/operator-login', operatorLogin)
oprouter.put('/operator-profileImg/:tbs_operator_id', operator_upload.single('profileimg'), putOperatorProfileImg);
oprouter.get('/operator-profileImg/:tbs_operator_id', getOperatorProfileImgByid)
oprouter.get('/operator-profileImg', getOperatorProfileImg)

oprouter.get('/getall-address/:tbs_operator_id', getOperator_addressByID)
oprouter.get('/getall-address', getOperator_address)

oprouter.post('/operator_details/:tbs_operator_id', operator_upload.fields([
    { name: 'upload_gst', maxCount: 1 },
    { name: 'aadar_front_doc', maxCount: 1 },
    { name: 'aadar_back_doc', maxCount: 1 },
    { name: 'pancard_front_doc', maxCount: 1 },
    { name: 'pancard_back_doc', maxCount: 1 },
    { name: 'msme_doc', maxCount: 1 }]), operator_details)

oprouter.get('/getall-GST', getGST)
oprouter.get('/get-GST/:tbs_operator_id', getGSTByID)
oprouter.get('/getall-Docs', getDoc)
oprouter.get('/get-Docs/:tbs_operator_id', getDocByID)
oprouter.post('/upload', operator_upload.single('xlsxFile'),excelImport);

module.exports = { oprouter }
