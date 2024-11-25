const express = require('express')
const { getRequest, getRequestID, getRequestByStatus, putReq_Status, searchReqOperators, getAllRequest, reqFilterByDate, getRequestPartner, getRequestIDPartner, getRequestByStatusPartner, reqFilterByDatePartners, searchReqPartners, putReq_StatusPartner, getOffersDeals, getOfferDealById, getOffersDealsByStatus, searchOffersDeals, updateOfferDealStatus, filterOffersDealsByDate, getAdvertisements, getAdvertisementById, getAdvertisementsByStatus, searchAdvertisements, updateAdvertisementStatus, filterAdvertisementsByDate, getMobileAdvertisements, getMobileAdvertisementById, getMobileAdvertisementsByStatus, searchMobileAdvertisements, updateMobileAdvertisementStatus, filterMobileAdvertisementsByDate, searchPromoReq, getClientDetails, getClientDetailsById, getClientDetailsByStatus, filterClientsByDate, searchClientDetails, putReq_StatusClient } = require('../Controller/requestManagement_controller')

const reqrouter = express.Router()

//OPERATORS
reqrouter.get('/request-management', getRequest)
reqrouter.get('/request-management-status/:req_status_id', getAllRequest)
reqrouter.get('/request-management-id/:tbs_operator_id', getRequestID)
reqrouter.get('/request-management-status/:req_status_id', getRequestByStatus)
reqrouter.put('/request-management/:tbs_operator_id', putReq_Status)
reqrouter.post('/request-management-op', searchReqOperators)

reqrouter.post('/filter-by-date', reqFilterByDate)

//PARTNERS
reqrouter.get('/request-management-partners', getRequestPartner)
reqrouter.get('/request-management-partnerId/:tbs_partner_id', getRequestIDPartner)
reqrouter.get('/request-partnerStatus/:req_status_id', getRequestByStatusPartner)
reqrouter.post('/request-management-partnerSearch', searchReqPartners)
reqrouter.put('/request-management-partner/:tbs_partner_id', putReq_StatusPartner)

reqrouter.post('/filter-by-datePartner', reqFilterByDatePartners)

//offers and deals
reqrouter.get('/request-management-offers', getOffersDeals);
reqrouter.get('/request-management-offerId/:tbs_offer_id', getOfferDealById);
reqrouter.get('/request-offerStatus/:req_status_id', getOffersDealsByStatus);
reqrouter.post('/request-management-offerSearch', searchOffersDeals);
reqrouter.put('/request-management-offer/:tbs_offer_id', updateOfferDealStatus);

reqrouter.post('/filter-by-dateOffer', filterOffersDealsByDate);

// GET Routes for Advertisements
reqrouter.get('/request-management-ads', getAdvertisements);
reqrouter.get('/request-management-adId/:tbs_ad_id', getAdvertisementById);
reqrouter.get('/request-adStatus/:ads_req_status_id', getAdvertisementsByStatus);
reqrouter.post('/request-management-adSearch', searchAdvertisements);
reqrouter.put('/request-management-ad/:tbs_ad_id', updateAdvertisementStatus);

reqrouter.post('/filter-by-dateAd', filterAdvertisementsByDate);

// GET Routes for Mobile Advertisements
reqrouter.get('/request-management-mobile-ads', getMobileAdvertisements);
reqrouter.get('/request-management-mobile-adId/:tbs_mobad_id', getMobileAdvertisementById);
reqrouter.get('/request-mobile-adStatus/:ads_req_status_id', getMobileAdvertisementsByStatus);
reqrouter.post('/request-management-mobile-adSearch', searchMobileAdvertisements);
reqrouter.put('/request-management-mobile-ad/:tbs_mobad_id', updateMobileAdvertisementStatus);

reqrouter.post('/filter-by-dateMobileAd', filterMobileAdvertisementsByDate);

// Routes For Promotions
reqrouter.post('/promo/searchReq', searchPromoReq);

//Routes for Clients
reqrouter.get('/request-management-clients', getClientDetails)
reqrouter.get('/request-management-clients/:tbs_client_id', getClientDetailsById)
reqrouter.get('/request-clientStatus/:req_status_id', getClientDetailsByStatus )
reqrouter.post('/request-management-clientSearch', searchClientDetails)
reqrouter.put('/request-management-clients/:tbs_client_id', putReq_StatusClient)

reqrouter.post('/filter-by-dateClient', filterClientsByDate);

module.exports = { reqrouter }