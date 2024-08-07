const express = require('express')
const multer = require('multer')
const path = require('path');
const { createEMPpro, updateEMPpro, deleteEMPpro, getEMPpro, getEMPByIDpro, getAllEMPpro, emailValidationpro, Phonevalidationspro, employeeLoginpro, getAllEmployeespro, getEmployeeByIdpro, updateEmployeeDetailspro, putEmployeepro, createDetailspro, fetchdataByIdpro, fetchdatapro, AddEmpDocpro, FetchDocpro, FetchAllDocspro, FetchDoconlypro, FetchAllDocsOnlypro, searchEmployeespro, insertDatapro, updateEMPStatusPro, updateProfilepro, GETProfilepro, GETAllProfilepro } = require('../Controller/pro_emp_controller');


const proemprouter = express.Router()

const proemp_storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'pro_employee_documents/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueSuffix);
    }
});

const proemp_upload = multer({ 
    storage: proemp_storage,
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

// EMPLOYEE PERSONAL DETAILS 
proemprouter.post('/pro-emp-personal-details', createEMPpro)
proemprouter.put('/pro-emp-personal-details/:tbs_pro_emp_id', updateEMPpro)
proemprouter.put('/pro-emp-profileImg/:tbs_pro_emp_id', proemp_upload.single('profile_img'), updateProfilepro)
proemprouter.delete('/pro-emp-personal-details/:tbs_pro_emp_id', deleteEMPpro)
proemprouter.get('/pro-emp-personal-details', getEMPpro)
proemprouter.get('/pro-emp-personal-details/:tbs_pro_emp_id', getEMPByIDpro)
proemprouter.get('/pro-All-emp-details', getAllEMPpro)
proemprouter.post('/pro-employee_email-validation', emailValidationpro)
proemprouter.post('/pro-employee_Phone-validation', Phonevalidationspro)
proemprouter.post('/pro-employee-login', employeeLoginpro)
    //EMPLOYEE REGISTERED ADDRESS
proemprouter.get('/pro-emp-registered-address', getAllEmployeespro)
proemprouter.get('/pro-emp-registered-address/:tbs_pro_emp_id', getEmployeeByIdpro)
proemprouter.put('/pro-emp-registered-address/:tbs_pro_emp_id', updateEmployeeDetailspro)
    //Update ALL
proemprouter.put('/pro-employee-All-update/:tbs_pro_emp_id', proemp_upload.fields([
    { name: 'aadhar_card_doc', maxCount: 1 },
    { name: 'pan_card_doc', maxCount: 1 },
    { name: 'work_experience_certificate', maxCount: 1 },
    { name: 'educational_certificate', maxCount: 1 },
    { name: 'other_documents', maxCount: 1 }, { name: 'profile_img', maxCount: 1 }]), putEmployeepro)
//EMPLOYEE PROFESSIONAL DETAILS
proemprouter.post('/pro-emp-professional-details/:tbs_pro_emp_id', createDetailspro)
proemprouter.put('/pro-emp-professional-details/:tbs_pro_emp_id', createDetailspro)
proemprouter.get('/pro-emp-professional-details/:tbs_pro_emp_id', fetchdataByIdpro)
proemprouter.get('/pro-emp-professional-details', fetchdatapro)
//EMPLOYEE PROFESSIONAL DOCUMENTS
proemprouter.post('/pro-emp-professional-documents/:tbs_pro_emp_id', proemp_upload.fields([
    { name: 'aadhar_card_doc', maxCount: 1 },
    { name: 'pan_card_doc', maxCount: 1 },
    { name: 'work_experience_certificate', maxCount: 1 },
    { name: 'educational_certificate', maxCount: 1 },
    { name: 'other_documents', maxCount: 1 }]),AddEmpDocpro)
proemprouter.put('/pro-emp-professional-documents/:tbs_pro_emp_id', proemp_upload.fields([
        { name: 'aadhar_card_doc', maxCount: 1 },
        { name: 'pan_card_doc', maxCount: 1 },
        { name: 'work_experience_certificate', maxCount: 1 },
        { name: 'educational_certificate', maxCount: 1 },
        { name: 'other_documents', maxCount: 1 }]),AddEmpDocpro)
proemprouter.get('/pro-emp-professional-documents/:tbs_pro_emp_id', FetchDocpro)
proemprouter.get('/pro-emp-professional-documents', FetchAllDocspro)
proemprouter.get('/pro-emp-documents-only/:tbs_pro_emp_id', FetchDoconlypro)
proemprouter.get('/pro-emp-documents-only', FetchAllDocsOnlypro)
proemprouter.get('/pro-employee-search/:search_term', searchEmployeespro)
proemprouter.post('/pro-employee-importExcel', proemp_upload.single('xlsxFile'), insertDatapro)
proemprouter.put('/pro-emp-status/:tbs_pro_emp_id', updateEMPStatusPro)

proemprouter.get('/pro-emp-profileImg', GETAllProfilepro)
proemprouter.get('/pro-emp-profileImg/:tbs_pro_emp_id', GETProfilepro)

module.exports = { proemprouter }