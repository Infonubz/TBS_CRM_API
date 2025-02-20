const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx')
const path = require('path');
const { searchAdvertisements, getAd, getAdbyId, postAd, putAds, deleteAd, getClientRecords, getClientDetails, getAdbyStatus, getCombinedData, getRecentAds, getActiveAds, getLiveAdvertisements, getActiveClients, getAdbyUserId } = require('../Controller/Advertisements_controller');

const advertisementRouter = express.Router();

const ad_storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'advertisement_files/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueSuffix);
    }
});

const ad_upload = multer({ 
    storage: ad_storage,
    limits: { fileSize: 15 * 1024 * 1024 }, 
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
            'image/jpeg', 
            'image/jpg',
            'image/png',
            'image/gif', 
            'application/pdf',
            'video/mp4'
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only .jpeg, .jpg, .png, .gif, .pdf, .mp4 files are allowed'), false);
        }
    }
});


//ADVERTISEMENT ROUTES
advertisementRouter.get('/ads-search/:tbs_user_id/:searchTerm', searchAdvertisements);
advertisementRouter.get('/ads', getAd);
advertisementRouter.get('/ads/:tbs_ad_id', getAdbyId);
advertisementRouter.get('/ads-userId/:tbs_user_id', getAdbyUserId);
advertisementRouter.get('/ads-clientRecords', getClientRecords);
advertisementRouter.get('/ads-clientDetails', getClientDetails);
advertisementRouter.post('/ads', ad_upload.single('ad_video'), postAd);
advertisementRouter.put("/ads/:tbs_ad_id", ad_upload.single('ad_video'), putAds);
advertisementRouter.delete('/ads/:tbs_ad_id', deleteAd);
advertisementRouter.get('/adStatus/:ads_status_id', getAdbyStatus);
advertisementRouter.get('/ads-all', getCombinedData);
advertisementRouter.get('/recentAds', getRecentAds);
advertisementRouter.get('/Active-Ads', getActiveAds);
advertisementRouter.get('/getLiveAdvertisements', getLiveAdvertisements)
advertisementRouter.get('/getActiveClients/:status_id', getActiveClients)

module.exports = { advertisementRouter };