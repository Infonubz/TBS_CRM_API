const pool = require('../config/db');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const postReferEarnContent = async (req, res) => {
    const { referral_amount } = req.body;

    try {
        const values = [];
        let query = 'INSERT INTO refer_earn_content (';

        const procedureFileExists = req.files && req.files['procedureFile'];
        if (procedureFileExists) {
            const procedurePath = req.files['procedureFile'][0].path;
            const procedure = fs.readFileSync(procedurePath, 'utf8');

            if (!procedure || typeof procedure !== 'string') {
                return res.status(400).json({ message: 'Procedure content must be a valid string' });
            }

            values.push(procedure);
            query += 'procedure, ';
        }

        const refererntcFileExists = req.files && req.files['refererntcFile'];
        if (refererntcFileExists) {
            const refererntcPath = req.files['refererntcFile'][0].path;
            const refererntc = fs.readFileSync(refererntcPath, 'utf8');

            if (!refererntc || typeof refererntc !== 'string') {
                return res.status(400).json({ message: 'Refererntc content must be a valid string' });
            }

            values.push(refererntc);
            query += '"referernt&c", ';
        }

        if (referral_amount !== undefined && !isNaN(referral_amount)) {
            values.push(referral_amount);
            query += 'referral_amount, ';
        }

        if (values.length === 0) {
            return res.status(400).json({ message: 'At least one field (procedure, refererntc, or referral_amount) must be provided' });
        }

        query = query.slice(0, -2) + ') VALUES (' + values.map((_, i) => `$${i + 1}`).join(', ') + ')';

        await pool.query(query, values);

        if (procedureFileExists) {
            fs.unlinkSync(req.files['procedureFile'][0].path);
        }
        if (refererntcFileExists) {
            fs.unlinkSync(req.files['refererntcFile'][0].path);
        }

        res.status(201).json({ message: 'Content created successfully' });

    } catch (error) {
        console.error('Error inserting data:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

const updateReferEarnContent = async (req, res) => {
    const { referral_amount } = req.body;
    const id = req.params.id;

    try {
        const values = [];
        let query = `
            UPDATE refer_earn_content
            SET 
        `;

        const procedureFileExists = req.files && req.files['procedureFile'];
        const refererntcFileExists = req.files && req.files['refererntcFile'];

        // Validate if at least one field (file or referral_amount) is provided
        if (!procedureFileExists && !refererntcFileExists && referral_amount === undefined) {
            return res.status(400).json({ message: 'At least one field (procedure, refererntc file, or referral amount) must be provided for update' });
        }

        if (procedureFileExists) {
            const procedurePath = req.files['procedureFile'][0].path;
            const procedure = fs.readFileSync(procedurePath, 'utf8');

            if (!procedure || typeof procedure !== 'string') {
                return res.status(400).json({ message: 'Procedure content must be a valid string' });
            }

            values.push(procedure);
            query += `procedure = $${values.length}, `;
        }

        if (refererntcFileExists) {
            const refererntcPath = req.files['refererntcFile'][0].path;
            const refererntc = fs.readFileSync(refererntcPath, 'utf8');

            if (!refererntc || typeof refererntc !== 'string') {
                return res.status(400).json({ message: 'Refererntc content must be a valid string' });
            }

            values.push(refererntc);
            query += `"referernt&c" = $${values.length}, `;
        }

        if (referral_amount !== undefined && !isNaN(referral_amount)) {
            values.push(referral_amount);
            query += `referral_amount = $${values.length}, `;
        }

        query = query.slice(0, -2); 
        query += ` WHERE id = $${values.length + 1}`;
        values.push(id);

        const result = await pool.query(query, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Content not found' });
        }

        if (procedureFileExists) {
            fs.unlinkSync(req.files['procedureFile'][0].path);
        }
        if (refererntcFileExists) {
            fs.unlinkSync(req.files['refererntcFile'][0].path);
        }

        res.status(200).json({ message: 'Content updated successfully' });

    } catch (error) {
        console.error('Error updating data:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

const getReferEarnContent = async (req, res) => {
    try {
        const query = 'SELECT * FROM refer_earn_content';
        const result = await pool.query(query);

        if (result.rows.length > 0) {
            const processedData = result.rows.map(row => {
                const procedureArray = row.procedure ? row.procedure.split('\r\n\r\n') : [];
                const processedProcedure = procedureArray.map(sentence => {
                    return { "text": sentence };  
                });

                return {
                    ...row,
                    procedure: processedProcedure,    
                };
            });

            res.status(200).json(processedData);
        } else {
            res.status(200).json({ message: 'No data found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const postReferEarn = async (req, res) => {
    const { earned_amount, referral_list, mobile_number } = req.body;

    try {
        if (!Array.isArray(referral_list)) {
            return res.status(400).json({ message: 'referral_list must be an array' });
        }

        const { rows: passengerRows } = await pool.query(
            'SELECT referral_code, user_name FROM passenger_profile WHERE mobile_number = $1',
            [mobile_number]
        );

        if (passengerRows.length === 0) {
            return res.status(404).json({ message: 'Passenger not found' });
        }

        const { referral_code, user_name } = passengerRows[0];

        const referralListJson = JSON.stringify(referral_list);

        const insertReferEarnQuery = `
            INSERT INTO refer_earn (referral_code, mobile_number, passenger_name, referral_list, earned_amount)
            VALUES ($1, $2, $3, $4, $5)
        `;
        await pool.query(insertReferEarnQuery, [referral_code, mobile_number, user_name, referralListJson, earned_amount]);

        res.status(201).json({ message: 'Referral created successfully', referral_code });
    } catch (error) {
        console.error('Error inserting data:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

const getReferEarn = async (req, res) => {
    try {
        const query = 'SELECT * FROM refer_earn';
        
        const result = await pool.query(query);

        if (result.rows.length > 0) {
            res.status(200).json(result.rows); 
        } else {
            res.status(201).json({ message: 'No data found' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const deleteReferEarnContent = async (req, res) => {
    const { id } = req.params; 

    try {
        if (!id) {
            return res.status(400).json({ message: 'ID is required' });
        }
        const query = `
            DELETE FROM refer_earn_content 
            WHERE id = $1
        `;

        const result = await pool.query(query, [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Content not found' });
        }

        res.status(200).json({ message: 'Content deleted successfully' });

    } catch (error) {
        console.error('Error deleting data:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

module.exports = {
    postReferEarnContent,
    postReferEarn,
    getReferEarn,
    getReferEarnContent,
    updateReferEarnContent,
    deleteReferEarnContent
}