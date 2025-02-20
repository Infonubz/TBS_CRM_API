const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx')
const path = require('path');
const { getData, deleteData, sheetUpload, postData, putData, getFields } = require('../Controller/Import_data_controller');

const importDataRouter = express.Router();

const imp_storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'imp_files/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueSuffix);
    }
});

const imp_upload = multer({ 
    storage: imp_storage,
    limits: { fileSize: 5 * 1024 * 1024 }, 
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
            'image/jpeg', 
            'image/jpg',
            'image/png', 
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'video/mp4'
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only .jpeg, .jpg, .png, .pdf, .xlsx, .mp4, .webm, .avi, and .mkv files are allowed'), false);
        }
    }
});


importDataRouter.get('/impdata', getData);
importDataRouter.get('/impdata/:field_id', getFields);
importDataRouter.post('/impdata',imp_upload.single('upload_files'), postData);
importDataRouter.put('/impdata/:imp_id', imp_upload.single('upload_files'), putData);
importDataRouter.delete('/impdata/:imp_id', deleteData);
importDataRouter.post('/impdata/impxlsx', imp_upload.single('xlsxFile'), sheetUpload);

module.exports = { importDataRouter };