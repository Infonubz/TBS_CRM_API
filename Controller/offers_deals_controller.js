const pool = require('../config/db')
const path = require('path')
const xlsx = require('xlsx')


//OFFERS-DEALS POST CONTROLLER
const postOffer = async (req, res) => {
    const { tbs_user_id, offer_name, code, start_date, expiry_date, usage, status, status_id, offer_desc, occupation } = req.body;

    console.log(req.body);
    
    const offerPicUrl = req.files && req.files['offer_img'] ? `/offer_files/${req.files['offer_img'][0].filename}` : null;
    const themeUrl = req.files && req.files['theme'] ? `/offer_files/${req.files['theme'][0].filename}` : null;
    const image_size = req.files?.['offer_img'] ? req.files['offer_img'][0].size : null;
    const image_type = req.files?.['offer_img'] ? req.files['offer_img'][0].mimetype : null;

    const image_file = req.files?.['offer_img'] ? {
        fieldname: req.files['offer_img'][0].fieldname,
        originalname: req.files['offer_img'][0].originalname,
        encoding: req.files['offer_img'][0].encoding,
        type: req.files['offer_img'][0].mimetype,
        destination: req.files['offer_img'][0].destination,
        filename: req.files['offer_img'][0].filename,
        path: req.files['offer_img'][0].path,
        size: req.files['offer_img'][0].size
    } : null;

    try {
        if (!tbs_user_id || !offer_name || !code || !start_date || !expiry_date || !usage || !status || !status_id || !offer_desc || !occupation) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        if (req.files?.['offer_img']) {
            if (req.files['offer_img'][0].size > 5 * 1024 * 1024) {
                return res.status(400).send('File size exceeded (Max: 5MB)');
            }

            if (!['image/jpeg', 'image/jpg', 'image/png', 'video/mp4', 'image/gif'].includes(req.files['offer_img'][0].mimetype)) {
                return res.status(400).send('Only .jpeg, .jpg, .png, .mp4, and .gif files are allowed');
            }
        }

        let employeeName = '';
        let isActive = false;

        // Check the user type based on tbs_user_id
        if (tbs_user_id.startsWith('tbs-pro_emp')) {
            // pro_emp case: Check pro_emp_personal_details table
            const employeeResult = await pool.query(
                `SELECT emp_status, emp_status_id, emp_first_name FROM pro_emp_personal_details WHERE tbs_pro_emp_id = $1`,
                [tbs_user_id]
            );

            if (employeeResult.rows.length === 0) {
                return res.status(404).json({ message: 'Employee not found' });
            }

            const employee = employeeResult.rows[0];
            isActive = employee.emp_status_id === 1 && employee.emp_status.toLowerCase() === 'active';
            employeeName = employee.emp_first_name || 'Unknown';

        } else if (tbs_user_id.startsWith('tbs-pro')) {
            // pro case: Check product_owner_id table
            const ownerResult = await pool.query(
                `SELECT owner_name FROM product_owner_tbl WHERE owner_id = $1`,
                [tbs_user_id]
            );

            if (ownerResult.rows.length === 0) {
                return res.status(404).json({ message: 'Product owner not found' });
            }

            const owner = ownerResult.rows[0];
            employeeName = owner.owner_name || 'Unknown';
            isActive = true; // Assuming all product owners are active
        } else {
            return res.status(400).json({ message: 'Invalid user ID type' });
        }

        if (!isActive) {
            return res.status(400).json({ message: 'Employee status is not active' });
        }

        // Insert offer into the database
        const result = await pool.query(
            `INSERT INTO offers_deals_tbl (
                offer_name, 
                code, 
                start_date, 
                expiry_date, 
                usage, 
                status, 
                status_id, 
                offer_desc, 
                offer_img, 
                image_size, 
                image_type, 
                image_file,
                theme,
                occupation,
                tbs_user_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
            RETURNING *`,
            [offer_name, code, start_date, expiry_date, usage, status, status_id, offer_desc, offerPicUrl, image_size, image_type, image_file, themeUrl, occupation, tbs_user_id]
        );

        if (result.rowCount > 0) {
            const newOffer = result.rows[0];
            console.log('Offer created:', newOffer);

            if (status.toLowerCase() === 'active' && status_id == 1) {
                const notificationMessage = `${employeeName} employee requested new ${offer_name} offers`;

                await pool.query(
                    `INSERT INTO Product_Owner_Notification (
                        tbs_pro_notif_id, 
                        tbs_user_id, 
                        user_name, 
                        user_type, 
                        subject_name, 
                        module_name, 
                        notification_message, 
                        read
                    ) VALUES (
                        CONCAT('tbs-notif', nextval('notif_id_seq')), 
                        $1, 
                        $2, 
                        $3, 
                        $4, 
                        $5, 
                        $6, 
                        $7)`,
                    [
                        tbs_user_id,
                        employeeName,
                        'product_owner_employee',
                        offer_name,
                        'offer',
                        notificationMessage,
                        false
                    ]
                );
                console.log('Notification sent:', notificationMessage);
            }
        }

        res.status(201).json({ message: "Offer and deal created successfully" });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}


// OFFERS-DEALS UPDATE CONTROLLER
const updateOffer = async (req, res) => {
    const tbs_offer_id = req.params.tbs_offer_id
    const { tbs_user_id, offer_name, code, start_date, expiry_date, usage, status, status_id, offer_desc,  occupation } = req.body

    const offerPicUrl = req.files['offer_img'] ? `/offer_files/${req.files['offer_img'][0].filename}` : null
    const themeUrl = req.files['theme'] ? `/offer_files/${req.files['theme'][0].filename}` : null
    const image_size = req.files['offer_img'] ? req.files['offer_img'][0].size : null
    const image_type = req.files['offer_img'] ? req.files['offer_img'][0].mimetype : null

    const image_file = req.files['offer_img'] ? {
        fieldname: req.files['offer_img'][0].fieldname,
        originalname: req.files['offer_img'][0].originalname,
        encoding: req.files['offer_img'][0].encoding,
        type: req.files['offer_img'][0].mimetype,
        destination: req.files['offer_img'][0].destination,
        filename: req.files['offer_img'][0].filename,
        path: req.files['offer_img'][0].path,
        size: req.files['offer_img'][0].size
    } : null

    try {
        if (!tbs_offer_id) {
            return res.status(201).json({ error: 'Offer ID is required' })
        }

        const offerExists = await pool.query('SELECT * FROM offers_deals_tbl WHERE tbs_offer_id = $1', [tbs_offer_id])
        if (offerExists.rows.length === 0) {
            return res.status(201).json({ error: 'Offer not found' })
        }

        const result = await pool.query(
            `UPDATE offers_deals_tbl SET 
                tbs_user_id = $1,
                offer_name = $2, 
                code = $3, 
                start_date = $4, 
                expiry_date = $5, 
                usage = $6, 
                status = $7, 
                status_id = $8, 
                offer_desc = $9, 
                offer_img = $10, 
                image_size = $11, 
                image_type = $12, 
                image_file = $13,
                theme = $14,
                occupation = $15,
                updated_date = now()
            WHERE tbs_offer_id = $16
            RETURNING *`,
            [tbs_user_id, offer_name, code, start_date, expiry_date, usage, status, status_id, offer_desc, offerPicUrl, image_size, image_type, image_file, themeUrl, occupation, tbs_offer_id]
        )

        res.status(200).json({
            message: 'Offer updated successfully'
        })
    } catch (err) {
        console.error(err)
        res.status(201).json({ error: 'Internal Server Error' })
    }
}

// OFFERS-DEALS DELETE CONTROLLER
const deleteoffers = async (req, res) => {
    try {
        const num = req.params.tbs_offer_id
        const query = 'DELETE FROM offers_deals_tbl WHERE tbs_offer_id = $1'
        const result = await pool.query(query, [num])

        if (result.rowCount === 1) {
            res.status(200).send(`Offers and deals Deleted successfully`)
        } else {
            res.status(201).send(`Offers and deals with tbs_offer_id ${num} not found`)
        }
    } catch (error) {
        console.error('Error deleting Offers:', error)
        res.status(201).send('Error deleting offers')
    }
} 

// OFFERS-DEALS GET CONTROLLER
const getOffers = async (req,res)=>{
    try {
        const result =await pool.query('SELECT * FROM offers_deals_tbl')
        console.log(result)
        res.status(200).json(result.rows)
    } catch (error) {
        console.log('Error',error)
        res.status(201).json({error:'Internal server error'})
    }
}

// OFFERS-DEALS GETBYID CONTROLLER
const getOffersByID = (req, res) => {
    const tbs_offer_id = req.params.tbs_offer_id
    pool.query(`SELECT * FROM offers_deals_tbl WHERE tbs_offer_id = $1`,[tbs_offer_id], (err,result) => {
        if(!err){
            res.send(result.rows)
        } 
    })
}

// OFFERS-DEALS GETBYID CONTROLLER
const getOffersBytbsID = (req, res) => {
    const tbs_user_id = req.params.tbs_user_id
    pool.query(`SELECT * FROM offers_deals_tbl WHERE tbs_user_id = $1`,[tbs_user_id], (err,result) => {
        if(!err){
            res.send(result.rows)
        } 
    })
}

//OFFERS-DEALS SEARCH CONTROLLER
const searchOffers = async (req, res) => {
    const searchTerm = req.params.search_term ? req.params.search_term.toLowerCase() : ''

    try {
        let query
        let queryParams

        if (searchTerm) {
            query = `
                SELECT * FROM offers_deals_tbl 
                WHERE LOWER(offer_name) LIKE $1
                    OR LOWER(code) LIKE $1
                    OR LOWER(TO_CHAR(start_date, 'Mon DD')) LIKE $1
                    OR LOWER(TO_CHAR(expiry_date, 'Mon DD')) LIKE $1
            `
            queryParams = [`%${searchTerm}%`]
        } else {
            query = `SELECT * FROM offers_deals_tbl`
            queryParams = []
        }
        const { rows } = await pool.query(query, queryParams)
        
        if (rows.length === 0) {
            return res.status(200).json('No offers found' )
        }
        res.status(200).json(rows)

    } catch (error) {
        console.error('Error:', error)
        res.status(201).json({ error: 'Internal server error' })
    }
}

//IMPORT EXCEL FILE CONTROLLER
const excelDateToJSDate = (serial) => {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const days = Math.floor(serial) - 1;
    const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
};

const ImportExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(201).send('No file uploaded.');
        }

        const workbook = xlsx.readFile(req.file.path);
        const sheet_name_list = workbook.SheetNames;
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);

        for (let i = 0; i < data.length; i++) {
            let { tbs_user_id, offer_name, code, start_date, expiry_date, usage, status, status_id, offer_desc, category, occupation } = data[i];

            // Convert start_date and expiry_date from Excel serial number to date
            start_date = excelDateToJSDate(start_date);
            expiry_date = excelDateToJSDate(expiry_date);

            const query = {
                text: `INSERT INTO offers_deals_tbl (tbs_user_id,offer_name, code, start_date, expiry_date, usage, status, status_id, offer_desc, category, occupation) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
                values: [tbs_user_id, offer_name, code, start_date, expiry_date, usage, status, status_id, offer_desc, category, occupation],
            };

            await pool.query(query);
        }

        res.status(200).send('File uploaded and data saved successfully.');
    } catch (error) {
        console.error('Error processing file:', error);
        res.status(201).send('Error processing file.');
    }
};

// OFFERS-DEALS GET CONTROLLER
const getOfferImg = async (req,res)=>{
    try {
        const result =await pool.query('SELECT tbs_offer_id, offer_img FROM offers_deals_tbl')
        console.log(result)
        res.status(200).json(result.rows)
    } catch (error) {
        console.log('Error',error)
        res.status(201).json({error:'Internal server error'})
    }
}

// OFFERS-DEALS GETBYID CONTROLLER
const getOffer_ImgByID = (req, res) => {
    pool.query(`SELECT tbs_offer_id, offer_img FROM offers_deals_tbl WHERE tbs_offer_id=${req.params.tbs_offer_id}`, (err,result) => {
        if(!err){
            res.send(result.rows);
        } 
    })
}

// OFFERS-DEALS GET CONTROLLER
const getActiveOffers = async (req,res)=>{
    try {
        const result =await pool.query(`SELECT * FROM offers_deals_tbl WHERE status =='Active' && status_id == 1`)
        console.log(result)
        res.status(200).json(result.rows)
    } catch (error) {
        console.log('Error',error)
        res.status(201).json({error:'Internal server error'})
    }
}

module.exports = { postOffer, updateOffer, deleteoffers, getOffers, getOffersByID, searchOffers, ImportExcel, getOfferImg, getOffer_ImgByID, getOffersBytbsID, getActiveOffers  }