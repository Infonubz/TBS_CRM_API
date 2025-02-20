const express = require('express')
const multer = require('multer')
const path = require('path')
const { createEMP, updateEMP, deleteEMP, getEMP, getAllEMP, emailValidation, Phonevalidations, getAllEmployees, getEmployeeById, updateEmployeeDetails, putEmployee, createDetails, fetchdataById, fetchdata, AddEmpDoc, FetchDoc, FetchAllDocs, employeeLogin, searchEmployees, insertData, getEMPByID, FetchDoconly, FetchAllDocsOnly, updateEMPStatus, getAllEMPop, updateProfile, GETAllProfile, GETProfileById, getAllOPEMPbyOPid, getEmails, getPhones } = require('../Controller/op_emp_controller');

const emprouter = express.Router()

const emp_storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'op_employee_documents/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueSuffix);
    }
});

const emp_upload = multer({ 
    storage: emp_storage,
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

const emp_excelupload = multer({ 
    storage: emp_storage,
    limits: { fileSize: 5 * 1024 * 1024 }, 
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only.xlsx files is allowed'), false);
        }
    }
})

// EMPLOYEE PERSONAL DETAILS 
emprouter.post('/emp-personal-details', emp_upload.single('profile_img'), createEMP)
emprouter.put('/emp-personal-details/:tbs_op_emp_id', emp_upload.single('profile_img'), updateEMP)
emprouter.put('/emp-profileImg/:tbs_op_emp_id', emp_upload.single('profile_img'), updateProfile)
emprouter.delete('/emp-personal-details/:tbs_op_emp_id', deleteEMP)
emprouter.get('/emp-personal-details', getEMP)
emprouter.get('/emp-personal-details/:tbs_op_emp_id', getEMPByID)
emprouter.get('/All-emp-details', getAllEMPop)
emprouter.get('/All-emp-details/:tbs_operator_id', getAllOPEMPbyOPid)
emprouter.post('/employee_email-validation', emailValidation)
emprouter.post('/employee_Phone-validation', Phonevalidations)
emprouter.post('/employee-login', employeeLogin)
emprouter.post('/emailid-opEmp', getEmails)
emprouter.post('/phone-opEmp', getPhones)
    //EMPLOYEE REGISTERED ADDRESS
emprouter.get('/emp-registered-address', getAllEmployees)
emprouter.get('/emp-registered-address/:tbs_op_emp_id', getEmployeeById)
emprouter.put('/emp-registered-address/:tbs_op_emp_id', updateEmployeeDetails)
    //Update ALL
emprouter.put('/employee-All-update/:tbs_op_emp_id', emp_upload.fields([
    { name: 'aadhar_card_front_doc', maxCount: 1 },
    { name: 'pan_card_front_doc', maxCount: 1 },
    { name: 'offer_letter_doc', maxCount: 1 },
    { name: 'qualification_doc', maxCount: 1 }, 
    { name: 'profile_img', maxCount: 1 }, 
    { name: 'aadhar_card_back_doc', maxCount: 1 }, 
    { name: 'pan_card_back_doc', maxCount: 1 }]), putEmployee)
//EMPLOYEE PROFESSIONAL DETAILS
emprouter.post('/emp-professional-details/:tbs_op_emp_id', createDetails)
emprouter.put('/emp-professional-details/:tbs_op_emp_id', createDetails)
emprouter.get('/emp-professional-details/:tbs_op_emp_id', fetchdataById)
emprouter.get('/emp-professional-details', fetchdata)
//EMPLOYEE PROFESSIONAL DOCUMENTS
emprouter.post('/emp-professional-documents/:tbs_op_emp_id', emp_upload.fields([
    { name: 'aadhar_card_front_doc', maxCount: 1 },
    { name: 'pan_card_front_doc', maxCount: 1 },
    { name: 'offer_letter_doc', maxCount: 1 },
    { name: 'qualification_doc', maxCount: 1 },  
    { name: 'aadhar_card_back_doc', maxCount: 1 }, 
    { name: 'pan_card_back_doc', maxCount: 1 }]),AddEmpDoc)
emprouter.put('/emp-professional-documents/:tbs_op_emp_id', emp_upload.fields([
    { name: 'aadhar_card_front_doc', maxCount: 1 },
    { name: 'pan_card_front_doc', maxCount: 1 },
    { name: 'offer_letter_doc', maxCount: 1 },
    { name: 'qualification_doc', maxCount: 1 },  
    { name: 'aadhar_card_back_doc', maxCount: 1 }, 
    { name: 'pan_card_back_doc', maxCount: 1 }]),AddEmpDoc)
emprouter.get('/emp-professional-documents/:tbs_op_emp_id', FetchDoc)
emprouter.get('/emp-professional-documents', FetchAllDocs)
emprouter.get('/emp-documents-only/:tbs_op_emp_id', FetchDoconly)
emprouter.get('/emp-documents-only', FetchAllDocsOnly)
emprouter.get('/employee-search/:tbs_operator_id/:search_term', searchEmployees)
emprouter.post('/opemployee-importExcel', emp_excelupload.single('xlsxFile'), insertData)
emprouter.put('/emp-status/:tbs_op_emp_id', updateEMPStatus)
emprouter.get('/emp-profileImg', GETAllProfile)
emprouter.get('/emp-profileImg/:tbs_op_emp_id', GETProfileById)

module.exports = { emprouter }