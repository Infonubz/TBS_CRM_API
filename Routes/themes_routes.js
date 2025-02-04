const express = require('express')
const multer = require('multer');
const path = require('path');
const { createTheme, getThemes, updateTheme, deleteTheme, getThemesId, getThemesByStatusId } = require('../Controller/themesController');

const themeRouter = express.Router()

// Multer setup for file uploads
const theme_storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'theme_files/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueSuffix);
    }
})

const themeupload = multer({ 
    storage: theme_storage,
    limits: { fileSize: 5 * 1024 * 1024 }, 
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
            cb(new Error('Only .jpeg, .jpg, .png, .pdf, .xlsx, .mp4, .webm, .avi, and .mkv files are allowed'), false);
        }
    }
})

// Routes
themeRouter.post('/themes', themeupload.fields([{ name: 'background', maxCount: 1 }, { name: 'building', maxCount: 1 }, { name: 'sky', maxCount: 1 }, { name: 'road', maxCount: 1 }]), createTheme)
themeRouter.get('/themes', getThemes)
themeRouter.get('/themes/:theme_id', getThemesId)
themeRouter.put('/themes/:theme_id', themeupload.fields([{ name: 'background', maxCount: 1 }, { name: 'building', maxCount: 1 }, { name: 'sky', maxCount: 1 }, { name: 'road', maxCount: 1 }]), updateTheme)
themeRouter.delete('/themes/:theme_id', deleteTheme)
themeRouter.delete('/themes-statusId/:status_id', getThemesByStatusId)

module.exports = { themeRouter }