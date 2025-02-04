const express = require('express')
const { createCompany, updateComapny, delCompany, fetchCompany, fetchCompanyByid, getCompanyByUserId } = require('../Controller/company_setting_controller')

const router = express.Router()

router.post('/company-settings', createCompany)
router.put('/company-settings/:tbs_company_id', updateComapny)
router.delete('/company-settings/:tbs_company_id', delCompany)
router.get('/company-settings', fetchCompany)
router.get('/company-settings/:tbs_company_id', fetchCompanyByid)
router.get('/company-setting/:user_id', getCompanyByUserId)

module.exports = { router }