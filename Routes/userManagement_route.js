const express = require('express')
const { getAllOperatorDetails, getOperatorByID, putUser_Status, getAllPartnerDetails, getPartnerByID, searchPartnerDetails, searchClientDetails, searchProEmpDetails, getOperatorByUserId, getPartnerByUserID, getClientDetails, getClientDetailsByUserId} = require('../Controller/userManagement_controller')

const userouter = express.Router()

//OPERATOR
userouter.get('/Operators-withAll-data', getAllOperatorDetails);
userouter.get('/get-operators/:tbs_user_id', getOperatorByUserId)
userouter.get("/all-operators/:tbs_operator_id",getOperatorByID);
userouter.put('/operators-status/:tbs_operator_id', putUser_Status);

//PARTNER
userouter.get('/all-partner_detail/:tbs_partner_id', getPartnerByID);
userouter.get('/partner_details_userId/:tbs_user_id', getPartnerByUserID);
userouter.get('/all-partner_details', getAllPartnerDetails);
userouter.get('/partner-search/:tbs_user_id/:searchTerm', searchPartnerDetails);

//CLIENTS
userouter.get('/client-search/:tbs_user_id/:searchTerm', searchClientDetails);
userouter.get('/All-client-details', getClientDetails);
userouter.get('/client-details-userId/:tbs_user_id', getClientDetailsByUserId);

//PRO-EMP 
userouter.get('/proemp-search/:owner_id/:searchTerm', searchProEmpDetails);

module.exports = { userouter }