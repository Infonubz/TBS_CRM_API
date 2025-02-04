const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');

const postAboutUs = async (req, res) => {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const aboutUsContent = fs.readFileSync(file.path, 'utf8');

        const insertQuery = `
            INSERT INTO tbs_info (about_us)
            VALUES ($1)
            RETURNING * `;

        const result = await pool.query(insertQuery, [aboutUsContent]);

        res.status(201).json({ message: 'About Us content inserted successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const putAboutUs = async (req, res) => {
    try {
        const id = req.params.id
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }


        const aboutUsContent = fs.readFileSync(file.path, 'utf8');

        const insertQuery = `
        UPDATE tbs_info
        SET about_us = $1
        WHERE id = $2
        RETURNING *`;

        const result = await pool.query(insertQuery, [aboutUsContent, id]);

        res.status(201).json({ message: 'About Us content Updated successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const putPrivacyPolicy = async (req, res) => {
    try {
        const id = req.params.id
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const privacyPolicyContent = fs.readFileSync(file.path, 'utf8');

        const updateQuery = `
            UPDATE tbs_info
            SET privacy_policy = $1
            WHERE id = $2
            RETURNING *`;

        const result = await pool.query(updateQuery, [privacyPolicyContent, id]);

        res.status(200).json({ message: 'Privacy Policy updated successfully!'});
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const putUserAgreement = async (req, res) => {
    try {
        const id = req.params.id
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const userAgreementContent = fs.readFileSync(file.path, 'utf8');

        const insertQuery = `
        UPDATE tbs_info
        SET user_agreement = $1
        WHERE id = $2
        RETURNING *`;

        const result = await pool.query(insertQuery, [userAgreementContent, id]);

        res.status(201).json({ message: 'User Agreement content Updated successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const putTermsConditions = async (req, res) => {
    try {
        const id = req.params.id
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const termsConditionsContent = fs.readFileSync(file.path, 'utf8');

        const insertQuery = `
        UPDATE tbs_info
        SET terms_conditions = $1
        WHERE id = $2
        RETURNING *`;

        const result = await pool.query(insertQuery, [termsConditionsContent, id]);

        res.status(201).json({ message: 'User Agreement content Updated successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}


const getTbsInfo = async (req, res) => {
    try {
        const query = 'SELECT * FROM tbs_info';
        
        const result = await pool.query(query)
        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0]);
        } else {
            res.status(404).json({ message: 'No data found' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    postAboutUs, putAboutUs, putPrivacyPolicy, putTermsConditions, putUserAgreement,
    getTbsInfo
};
