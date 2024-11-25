const express = require('express')
const multer = require('multer')
const path = require('path')
const { postOffer, updateOffer, deleteoffers, getOffers, getOffersByID, ImportExcel, getOffer_ImgByID, getOfferImg, getOffersBytbsID, searchOffers, getActiveOffers, getRecentOffers, getOffersDealsByOccupation, getLiveOffersDeals } = require('../Controller/redeem_offers_controller')

const redeemoffrouter = express.Router()

const off_storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'offer_files/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueSuffix);
    }
});

const off_upload = multer({ 
    storage: off_storage,
    limits: { fileSize: 10 * 1024 * 1024 }, 
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
            cb(new Error('Only .jpeg, .jpg, .png, .exe files are allowed'), false);
        }
    }
})

const off_excelupload = multer({ 
    storage: off_storage,
    limits: { fileSize: 10 * 1024 * 1024 }, 
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only .exe files are allowed'), false);
        }
    }
})

redeemoffrouter.post('/redeem-offers-deals', off_upload.fields([{name: 'offer_img'}, {name: 'theme'}]), postOffer)
redeemoffrouter.put('/redeem-offers-deals/:tbs_offer_id', off_upload.fields([{name: 'offer_img'}, {name: 'theme'}]), updateOffer)
redeemoffrouter.delete('/redeem-offers-deals/:tbs_offer_id', deleteoffers)
redeemoffrouter.get('/redeem-offers-deals', getOffers)
redeemoffrouter.get('/Active-redeem-offers-deals', getActiveOffers)
redeemoffrouter.get('/redeem-offers-deals/:tbs_offer_id', getOffersByID)
redeemoffrouter.post('/redeem-offers-deals-importExcel', off_excelupload.single('xlsxFile'), ImportExcel)
redeemoffrouter.get('/redeem-offers-deals-Img', getOfferImg)
redeemoffrouter.get('/redeem-offers-deals-Img/:tbs_offer_id', getOffer_ImgByID)
redeemoffrouter.get('/redeem-offers-deal/:tbs_operator_id', getOffersBytbsID)
redeemoffrouter.get('/redeem-offers-deals-search/:search_term', searchOffers);
redeemoffrouter.get('/redeem-recentOffers', getRecentOffers);
redeemoffrouter.get('/redeem-offers-deals-occupation/:occupation_id', getOffersDealsByOccupation)
redeemoffrouter.get('/getLiveRedeemOffersDeals', getLiveOffersDeals)

module.exports = { redeemoffrouter }