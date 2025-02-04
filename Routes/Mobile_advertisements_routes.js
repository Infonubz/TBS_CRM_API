const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx')
const path = require('path');
const { getMobAd, getMobAdbyId, getClientRecordsMob, getClientDetailsMob, postMobAd, putMobAds, searchMobAdvertisements, deleteMobAd, getCombinedDataMob, getMobAdbyStatus, getRecentMobAds, getLiveMobAdvertisements, getMobAdbyUserId } = require('../Controller/Mobile_advertisements_controller');


const MobadvertisementRouter = express.Router();

const mobad_storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'mobile_advertisement_files/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueSuffix);
    }
});

const mobad_upload = multer({ 
    storage: mobad_storage,
    limits: { fileSize: 5 * 1024 * 1024 }, 
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
            'image/jpeg', 
            'image/jpg',
            'image/png', 
            'image/gif',
            'application/pdf',
            'video/mp4',
            'video/gif'
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only .jpeg, .jpg, .png, .pdf, .mp4, .gif files are allowed'), false);
        }
    }
});


// MOBILE ADVERTISEMENT ROUTES
MobadvertisementRouter.get('/mobads-search/:tbs_user_id/:searchTerm', searchMobAdvertisements);
MobadvertisementRouter.get('/mobads', getMobAd);
MobadvertisementRouter.get('/mobads/:tbs_mobad_id', getMobAdbyId);
MobadvertisementRouter.get('/mobads-userId/:tbs_user_id', getMobAdbyUserId);
MobadvertisementRouter.get('/mobads-clientRecords', getClientRecordsMob);
MobadvertisementRouter.get('/mobads-clientDetails', getClientDetailsMob);
MobadvertisementRouter.post('/mobads', mobad_upload.single('mobad_vdo'), postMobAd);
MobadvertisementRouter.put("/mobads/:tbs_mobad_id", mobad_upload.single('mobad_vdo'), putMobAds);
MobadvertisementRouter.delete('/mobads/:tbs_mobad_id', deleteMobAd);
MobadvertisementRouter.get('/mobads-all', getCombinedDataMob);
MobadvertisementRouter.get('/mobadStatus/:ads_status_id', getMobAdbyStatus);
MobadvertisementRouter.get('/recentMobAds', getRecentMobAds);
MobadvertisementRouter.get('/getLiveMobAdvertisements', getLiveMobAdvertisements);

module.exports = { MobadvertisementRouter };