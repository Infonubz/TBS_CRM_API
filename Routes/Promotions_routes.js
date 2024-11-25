const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx')
const path = require('path');
const { getPromo, getPromobyId, postPromo, deletePromo, searchPromo, putPromo, sheetUpload, getPromobyStatus, putPromoStatus, getOperatorRecords, promoFilterByDate, getRecentPromos, getLivePromotions, getPromoByUserId, searchPromoById } = require('../Controller/Promotion_controller');

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
            'image/png'
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only .jpeg, .jpg, .png, .xlsx files are allowed'), false);
        }
    }
})

const promo_Excelupload = multer({ 
    storage: promo_storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {

            return cb(new Error('Invalid file format. Only .xlsx files are allowed.'), false); 
        }
        cb(null, true)
    }
})

//PROMOTIONS ROUTES
promotionsRouter.get('/promo', getPromo);
promotionsRouter.get('/promo/:promo_id', getPromobyId);
promotionsRouter.get('/promos/:tbs_user_id', getPromoByUserId);
promotionsRouter.post('/promo', promo_upload.fields([
    { name: 'promo_image', maxCount: 1 },
    { name: 'background_image', maxCount: 1 }]), postPromo);
promotionsRouter.delete('/promo/:promo_id', deletePromo);
promotionsRouter.put('/promo/:promo_id', promo_upload.fields([
    { name: 'promo_image', maxCount: 1 },
    { name: 'background_image', maxCount: 1 }]), putPromo);
promotionsRouter.post('/promo/importxlsx', (req, res, next) => {
        promo_Excelupload.single('xlsxFile')(req, res, (err) => {
            if (err) {
                return res.status(400).json({message: err.message});
            }
            sheetUpload(req, res);
        });
    })

promotionsRouter.get('/promo-status/:user_id', getPromobyStatus);
promotionsRouter.put('/promo-statusId/:promo_id', putPromoStatus);
promotionsRouter.get('/promo/search/:searchTerm', searchPromo);
promotionsRouter.get('/promo-operatorDetails', getOperatorRecords);
promotionsRouter.post('/promo/filter', promoFilterByDate);
promotionsRouter.get('/recentPromos', getRecentPromos);
promotionsRouter.get('/getLivePromotions', getLivePromotions)
promotionsRouter.get('/promo/searchPromoById/:tbs_user_id', searchPromoById)

module.exports = { promotionsRouter };