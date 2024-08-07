const express = require('express')
const { getRequest, getRequestID, getRequestByStatus, putReq_Status, searchReqOperators, getAllRequest, reqFilterByDate, getRequestPartner, getRequestIDPartner, getRequestByStatusPartner, reqFilterByDatePartners, searchReqPartners, putReq_StatusPartner } = require('../Controller/requestManagement_controller')

const reqrouter = express.Router()

//OPERATORS
reqrouter.get('/request-management', getRequest)
reqrouter.get('/request-management-status/:req_status_id', getAllRequest)
reqrouter.get('/request-management-id/:tbs_operator_id', getRequestID)
reqrouter.get('/request-management-status/:req_status_id', getRequestByStatus)
reqrouter.put('/request-management/:tbs_operator_id', putReq_Status)
reqrouter.get('/request-management/:search_term', searchReqOperators)

reqrouter.post('/filter-by-date', reqFilterByDate)

//PARTNERS
reqrouter.get('/request-management-partners', getRequestPartner)
reqrouter.get('/request-management-partnerId/:tbs_partner_id', getRequestIDPartner)
reqrouter.get('/request-partnerStatus/:req_status_id', getRequestByStatusPartner)
reqrouter.get('/request-management-partnerSearch/:search_term', searchReqPartners)
reqrouter.put('/request-management-partner/:tbs_partner_id', putReq_StatusPartner)

reqrouter.post('/filter-by-datePartner', reqFilterByDatePartners)

module.exports = { reqrouter }