const express = require('express')
const { getAllOperatorDetails, getOperatorByID, putUser_Status, getAllPartnerDetails, getPartnerByID, searchPartnerDetails, searchClientDetails, searchProEmpDetails} = require('../Controller/userManagement_controller')

const userouter = express.Router()

//OPERATOR
userouter.get('/Operators-withAll-data', getAllOperatorDetails);
userouter.get("/all-operators/:tbs_operator_id",getOperatorByID);
userouter.put('/operators-status/:tbs_operator_id', putUser_Status);

//PARTNER
userouter.get('/all-partner_detail/:tbs_partner_id', getPartnerByID);
userouter.get('/all-partner_details', getAllPartnerDetails);
userouter.get('/partner-search/:searchTerm', searchPartnerDetails);

//CLIENTS
userouter.get('/client-search/:searchTerm', searchClientDetails);

//PRO-EMP 
userouter.get('/proemp-search/:searchTerm', searchProEmpDetails);

module.exports = { userouter }