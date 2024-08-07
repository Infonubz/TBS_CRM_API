const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx')
const path = require('path');
const { getPromo, getPromobyId, postPromo, deletePromo, searchPromo, putPromo, sheetUpload, getPromobyStatus, putPromoStatus, searchPromoReq, getOperatorRecords, promoFilterByDate } = require('../Controller/Promotion_controller');

const promotionsRouter = express.Router();

const promo_storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'promotion_files/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueSuffix);
    }
});

const promo_upload = multer({ 
    storage: promo_storage,
    limits: { fileSize: 5 * 1024 * 1024 }, 
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
            'image/jpeg', 
            'image/jpg',
            'image/png',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only .jpeg, .jpg, .png, .xlsx files are allowed'), false);
        }
    }
})


//PROMOTIONS ROUTES
promotionsRouter.get('/promo', getPromo);
promotionsRouter.get('/promo/:promo_id', getPromobyId);
promotionsRouter.post('/promo', promo_upload.fields([
    { name: 'promo_image', maxCount: 1 },
    { name: 'background_image', maxCount: 1 }]), postPromo);
promotionsRouter.delete('/promo/:promo_id', deletePromo);
promotionsRouter.put('/promo/:promo_id', promo_upload.fields([
    { name: 'promo_image', maxCount: 1 },
    { name: 'background_image', maxCount: 1 }]), putPromo);
promotionsRouter.post('/promo/importxlsx', promo_upload.single('xlsxFile'), sheetUpload);
promotionsRouter.get('/promo-status/:promo_status_id', getPromobyStatus);
promotionsRouter.put('/promo-statusId/:promo_id', putPromoStatus);
promotionsRouter.get('/promo/search/:searchTerm', searchPromo);
promotionsRouter.get('/promo/searchReq/:searchTerm', searchPromoReq);
promotionsRouter.get('/promo-operatorDetails', getOperatorRecords);
promotionsRouter.post('/promo/filter', promoFilterByDate);

module.exports = { promotionsRouter };