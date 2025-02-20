const express = require('express')
const multer = require('multer')
const path = require('path');
const { postClient, deleteClient, getclientByID, putClient, updateClientAddress, getClientAddressById, deleteClientAddress, getAllClientAddresses, putClientGst, deleteClientGst, getGstByid, getAllGst, putClientCompanyDetails, ExcelUpload, GetClientProfileImg, GetClientProfileImgById, getClientcompany, getEmails, getPhones } = require('../Controller/client_controller');

const cltrouter = express.Router()

const client_storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'client_files/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueSuffix);
    }
});

const client_upload = multer({ 
    storage: client_storage,
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

const client_excelupload = multer({ 
    storage: client_storage,
    limits: { fileSize: 5 * 1024 * 1024 }, 
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only .xlsx files are allowed'), false);
        }
    }
})

cltrouter.post('/client-details', client_upload.single('company_logo'), postClient)
cltrouter.post('/emailid-client', getEmails)
cltrouter.post('/phone-client', getPhones)
//cltrouter.put('/client-profileImg/:tbs_client_id',  ClientProfileImg)
cltrouter.delete('/client-details/:tbs_client_id',  deleteClient)
cltrouter.get('/client-details',  getClientcompany)
cltrouter.get('/client-details/:tbs_client_id',  getclientByID)
cltrouter.put('/client-details/:tbs_client_id', client_upload.single('company_logo'),  putClient)

cltrouter.put('/client-address/:tbs_client_id',  updateClientAddress)
cltrouter.get('/client-address/:tbs_client_id', getClientAddressById)
cltrouter.delete('/client-address/:tbs_client_id', deleteClientAddress)
cltrouter.get('/client-addresses', getAllClientAddresses)

cltrouter.put('/client-gst/:tbs_client_id', client_upload.single('upload_gst'), putClientGst)
cltrouter.delete('/client-gst/:tbs_client_id', deleteClientGst)
cltrouter.get('/client-gst/:tbs_client_id', getGstByid)
cltrouter.get('/client-gsts', getAllGst)

cltrouter.put('/client-company-details/:tbs_client_id', putClientCompanyDetails)

cltrouter.post('/upload', client_excelupload.single('file'), ExcelUpload)

cltrouter.get('/client-profileImg',  GetClientProfileImg)
cltrouter.get('/client-profileImg/:tbs_client_id',  GetClientProfileImgById)


module.exports = { cltrouter }