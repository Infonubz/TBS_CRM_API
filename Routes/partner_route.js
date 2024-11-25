const express = require('express')
const multer = require('multer')
const path = require('path')
const { createPartner, updatePartner, deletePartner, getPartner, getPartnerByID, FetchAllDocuments, FetchDocumentByID, AddPartnerDoc, getPartnerAddressById, getAllPartners, partnerLogin, FetchAllDocumentDetails, FetchDocumentDetailsByID, updatePartnerDetails, GetPartnerProfileById, GetAllPartnerProfile, updatePartnerStatus, updatePartnerProfile, phoneVal, importPartnerDetails } = require('../Controller/partner_controller');

const patrouter = express.Router()

const partner_storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'partner_files/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueSuffix);
    }
});

const partner_upload = multer({ 
    storage: partner_storage,
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

const partner_excelupload = multer({ 
    storage: partner_storage,
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

// partner-personal-details
patrouter.post('/partner_details', partner_upload.single('profile_img'), createPartner)
patrouter.put('/partner_details_update/:tbs_partner_id', partner_upload.single('profile_img'), updatePartner)
patrouter.delete('/partner_details/:tbs_partner_id', deletePartner)
patrouter.get('/partner_details/:tbs_partner_id', getPartnerByID)
patrouter.get('/partner_details', getPartner)
patrouter.post('/partner_details/:tbs_partner_id', updatePartnerDetails)
patrouter.put('/partner_address_details/:tbs_partner_id', updatePartnerDetails)
patrouter.get('/partner_address_details', getAllPartners)
patrouter.get('/partner_address_details/:tbs_partner_id', getPartnerAddressById)
patrouter.post('/partner_phone-validation', phoneVal)
patrouter.post('/partner-login', partnerLogin)
patrouter.get('/partner_ProfileImg/:tbs_partner_id', GetPartnerProfileById)
patrouter.get('/partner_ProfileImg', GetAllPartnerProfile)
//partner-document-details
patrouter.post('/partner-documents/:tbs_partner_id', partner_upload.fields([
{ name: 'aadhar_card_front', maxCount: 1 },
{ name: 'pan_card_front', maxCount: 1 },
{ name: 'aadhar_card_back', maxCount: 1 },
{ name: 'pan_card_back', maxCount: 1 }]),AddPartnerDoc)
patrouter.put('/partner-documents/:tbs_partner_id', partner_upload.fields([
    { name: 'aadhar_card_front', maxCount: 1 },
{ name: 'pan_card_front', maxCount: 1 },
{ name: 'aadhar_card_back', maxCount: 1 },
{ name: 'pan_card_back', maxCount: 1 }]),AddPartnerDoc)
patrouter.get('/partner-documents/:tbs_partner_id', FetchDocumentByID)
patrouter.get('/partner-documents', FetchAllDocuments)
patrouter.get('/partner-documents-details', FetchAllDocumentDetails)
patrouter.get('/partner-documents-details/:tbs_partner_id', FetchDocumentDetailsByID)
patrouter.put('/partner_status_update/:tbs_partner_id', updatePartnerStatus)

patrouter.post('/import-partner-details', partner_excelupload.single('file'), importPartnerDetails)

module.exports = { patrouter }