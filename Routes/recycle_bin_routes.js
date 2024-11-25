const express = require('express')
const { restoreOffer, permanentlyDeleteOffer, restorePromo, permanentlyDeletePromo, restoreAd, permanentDeleteAd, restoreMobAd, permanentDeleteMobAd, restoreOperator, permanentDeleteOperator, restoreOPEmployee, permanentDeleteOPEmployee, restorePartner, permanentDeletePartner, restoreClient, permanentDeleteClient, getRecycleBinEntries, SearchRecycleBinEntries, permanentDeleteProEmployee, restoreProEmployee } = require('../Controller/recycle_bin_controller')

const RECrouter = express.Router()

//OFFERS & DEALS
RECrouter.post('/restore-offers/:tbs_recycle_id', restoreOffer)
RECrouter.delete('/permanent-delete-offers/:tbs_recycle_id', permanentlyDeleteOffer)

//PROMOTIONS
RECrouter.post('/restore-promotions/:tbs_recycle_id', restorePromo)
RECrouter.delete('/permanent-delete-promotions/:tbs_recycle_id', permanentlyDeletePromo)

//ADVERTISMENTS
RECrouter.post('/restore-webAds/:tbs_recycle_id', restoreAd)
RECrouter.delete('/permanent-delete-webAds/:tbs_recycle_id', permanentDeleteAd)

//MOBILE ADVERTISMENTS
RECrouter.post('/restore-mobAds/:tbs_recycle_id', restoreMobAd)
RECrouter.delete('/permanent-delete-mobAds/:tbs_recycle_id', permanentDeleteMobAd)

//OPERATORS
RECrouter.post('/restore-operators/:tbs_recycle_id', restoreOperator)
RECrouter.delete('/permanent-delete-operators/:tbs_recycle_id', permanentDeleteOperator)

//OPERATOR EMPLOYEE
RECrouter.post('/restore-op-emp/:tbs_recycle_id', restoreOPEmployee)
RECrouter.delete('/permanent-delete-op-emp/:tbs_recycle_id', permanentDeleteOPEmployee)

//PRODUCT OWNER EMPLOYEE
RECrouter.post('/restore-pro-emp/:tbs_recycle_id', restoreProEmployee)
RECrouter.delete('/permanent-delete-pro-emp/:tbs_recycle_id', permanentDeleteProEmployee)

//PRODUCT OWNER EMPLOYEE
RECrouter.post('/restore-partner/:tbs_recycle_id', restorePartner)
RECrouter.delete('/permanent-delete-partner/:tbs_recycle_id', permanentDeletePartner)

//CLIENTS
RECrouter.post('/restore-clients/:tbs_recycle_id', restoreClient)
RECrouter.delete('/permanent-delete-clients/:tbs_recycle_id', permanentDeleteClient)

RECrouter.get('/recycle-bin/:module_get_id', getRecycleBinEntries)

//SEARCH API
RECrouter.post('/recycle-bin/:module_get_id', SearchRecycleBinEntries)


module.exports = { RECrouter }