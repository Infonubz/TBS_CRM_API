const express = require('express')
const multer = require('multer')
const path = require('path')
const { postOffer, updateOffer, deleteoffers, getOffers, getOffersByID, ImportExcel, getOffer_ImgByID, getOfferImg, getOffersBytbsID, searchOffers, getActiveOffers, getRecentOffers, getOffersDealsByOccupation, getLiveOffersDeals } = require('../Controller/discount_offers_controller')

const offrouter = express.Router()

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

offrouter.post('/offers-deals', off_upload.fields([{name: 'offer_img'}, {name: 'theme'}]), postOffer)
offrouter.put('/offers-deals/:tbs_offer_id', off_upload.fields([{name: 'offer_img'}, {name: 'theme'}]), updateOffer)
offrouter.delete('/offers-deals/:tbs_offer_id', deleteoffers)
offrouter.get('/offers-deals', getOffers)
offrouter.get('/Active-offers-deals', getActiveOffers)
offrouter.get('/offers-deals/:tbs_offer_id', getOffersByID)
offrouter.post('/offers-deals-importExcel', off_excelupload.single('xlsxFile'), ImportExcel)
offrouter.get('/offers-deals-Img', getOfferImg)
offrouter.get('/offers-deals-Img/:tbs_offer_id', getOffer_ImgByID)
offrouter.get('/offers-deal/:tbs_operator_id', getOffersBytbsID)
offrouter.get('/offers-deals-search/:search_term', searchOffers);
offrouter.get('/recentOffers', getRecentOffers);
offrouter.get('/offers-deals-occupation/:occupation_id', getOffersDealsByOccupation)
offrouter.get('/getLiveOffersDeals', getLiveOffersDeals)

module.exports = { offrouter }