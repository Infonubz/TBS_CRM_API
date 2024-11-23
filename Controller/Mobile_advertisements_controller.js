const pool = require('../config/db');

//GET ALL ADVERTISEMENTS
const getMobAd = async (req, res) => {
    pool.query(`SELECT * FROM mobile_advertisements_tbl ORDER BY created_date DESC `, (err,result) => {
        if(!err){
            res.send(result.rows);
        } 
        pool.end;
    })
};

const getCombinedDataMob = async (req, res) => {
    try {
        const query = `
            SELECT 
                m.*, 
                c.owner_name, 
                c.emailid, 
                c.phone 
            FROM 
                mobile_advertisements_tbl m
            JOIN 
                client_company_details c 
            ON 
                m.tbs_client_id = c.tbs_client_id
        `;

        const result = await pool.query(query);
        res.status(200).send(result.rows);
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Error getting records");
    }
};

//GET ADVERTISEMENT BY ID
const getMobAdbyId = async (req, res) => {
    try{
        const id = req.params.tbs_mobad_id;
        const getAdId = `SELECT * FROM mobile_advertisements_tbl WHERE tbs_mobad_id = $1`;
        const result = await pool.query(getAdId,[id]);
        res.status(200).send(result.rows);
    } catch(err) {
        console.log(err.message);
        res.status(500).send("Error getting records");
    }
};

//GET CLIENT RECORDS FOR DROPDOWN
const getClientRecordsMob = async (req, res) => {
    try{
        const getClients = `SELECT tbs_client_id, company_name, owner_name FROM client_company_details`;
        const result = await pool.query(getClients);
        res.status(200).send(result.rows);
    } catch(err) {
        console.log(err.message);
        res.status(500).send("Error getting records");
    }
};

//GET CLIENT DETAILS FOR 1ST COLUMN IN UI
const getClientDetailsMob = async (req, res) => {
    try{
        const getClientsdetails = `SELECT tbs_client_id, owner_name, emailid, phone FROM client_company_details`;
        const result = await pool.query(getClientsdetails);
        res.status(200).send(result.rows);
    } catch(err) {
        console.log(err.message);
        res.status(500).send("Error getting records");
    }
};

//GET MOB-AD BY STATUS
const getMobAdbyStatus = async (req, res) => {
    try{
        const id = req.params.status_id;
        const getAdStatus = `SELECT * FROM mobile_advertisements_tbl WHERE status_id = $1`;
        const result = await pool.query(getAdStatus,[id]);
        res.status(200).send(result.rows);
    } catch(err) {
        console.log(err.message);
        res.status(201).send("Error getting records");
    }
};


//DELETE ADVERTISEMENT BY ID
const deleteMobAd = async (req,res) => {
    
    try{
    const id = req.params.tbs_mobad_id;
    const removeAd = 'DELETE FROM mobile_advertisements_tbl WHERE tbs_mobad_id = $1';
    const result = await pool.query(removeAd, [id]);
    res.status(200).send('Deleted successfully!');
    } catch(err) {
        console.log(err);
        res.status(500).send('Error deleting advertisement');
    }
};


//POST ADVERTISEMENT
const postMobAd = async (req, res) => {
    const {
        client_details, mobad_title, start_date, end_date, mobad_description,
        usage_per_day, status, status_id, page_id, page_name, tbs_client_id,
        tbs_user_id, hours, duration, ads_plan_id, req_status, req_status_id
    } = req.body;

    console.log('Request Body:', req.body);

    if (!tbs_user_id) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    if (req.file && req.file.size > 15 * 1024 * 1024) {
        return res.status(400).send('File size exceeded (Max: 15MB)');
    }

    if (req.file && !['image/jpeg', 'image/jpg', 'image/png', 'video/mp4', 'image/gif'].includes(req.file.mimetype)) {
        return res.status(400).send('Only .jpeg, .jpg, .png, .mp4, and .gif files are allowed');
    }

    const uploadMobAdUrl = req.file ? `/mobile_advertisement_files/${req.file.filename}` : null;
    const mobad_file_size = req.file ? req.file.size : null;
    const mobad_file_type = req.file ? req.file.mimetype : null;

    console.log(uploadMobAdUrl);

    let employeeName = '';
    let isActive = false;

    if (tbs_user_id.startsWith('tbs-pro_emp')) {
      
        try {
            const employeeResult = await pool.query(
                `SELECT * FROM pro_emp_personal_details WHERE tbs_pro_emp_id = $1`,
                [tbs_user_id]
            );

            if (employeeResult.rows.length === 0) {
                return res.status(404).json({ message: 'Employee not found' });
            }

            const employee = employeeResult.rows[0];
            isActive = employee.emp_status_id === 1 && employee.emp_status.toLowerCase() === 'active';
            employeeName = employee.emp_first_name || 'Unknown';
        } catch (error) {
            return res.status(500).json({ message: 'Database error', error });
        }

    } else if (tbs_user_id.startsWith('tbs-pro')) {
       
        try {
            const ownerResult = await pool.query(
                `SELECT * FROM product_owner_tbl WHERE owner_id = $1`,
                [tbs_user_id]
            );

            if (ownerResult.rows.length === 0) {
                return res.status(404).json({ message: 'Product owner not found' });
            }

            const owner = ownerResult.rows[0];
            employeeName = owner.owner_name || 'Unknown';
            isActive = true; 
        } catch (error) {
            return res.status(500).json({ message: 'Database error', error });
        }

    } else {
        return res.status(400).json({ message: 'Invalid user or client ID type' });
    }

    if (!isActive) {
        return res.status(400).json({ message: 'Status is not active' });
    }

    if (tbs_client_id) {
        
        try {
            const clientResult = await pool.query(
                `SELECT * FROM client_company_details WHERE tbs_client_id = $1`,
                [tbs_client_id]
            );

            if (clientResult.rows.length === 0) {
                return res.status(404).json({ message: 'Client not found' });
            }

            const client = clientResult.rows[0];
            employeeName = client.owner_name || 'Unknown';
            isActive = true; 
        } catch (error) {
            return res.status(500).json({ message: 'Database error', error });
        }
    }

    try {
        const insertAds = `
            INSERT INTO mobile_advertisements_tbl (
                client_details, mobad_title, start_date, end_date, mobad_description,
                usage_per_day, status, status_id, mobad_vdo, mobad_file_size, mobad_file_type,
                page_id, page_name, tbs_client_id, tbs_user_id, hours, duration, ads_plan_id,
                req_status, req_status_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        `;
        const values = [
            client_details, mobad_title, start_date, end_date, mobad_description, usage_per_day,
            status, status_id, uploadMobAdUrl, mobad_file_size, mobad_file_type, page_id, page_name,
            tbs_client_id, tbs_user_id, hours, duration, ads_plan_id, req_status, req_status_id
        ];

        await pool.query(insertAds, values);
        res.send("Inserted Successfully!");

        if (tbs_user_id.startsWith('tbs-pro_emp')) {
            const notificationMessage = `${employeeName} employee requested new ${mobad_title} mobile advertisement`;
            await pool.query(
                `INSERT INTO Product_Owner_Notification (
                    tbs_pro_notif_id, tbs_user_id, user_name, user_type, subject_name,
                    module_name, notification_message, read
                ) VALUES (CONCAT('tbs-notif', nextval('notif_id_seq')), $1, $2, $3, $4, $5, $6, $7)`,
                [tbs_user_id, employeeName, 'product_owner_employee', mobad_title, 'mobile_advertisement', notificationMessage, false]
            );
            console.log('Notification sent:', notificationMessage);
        }

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};




//UPDATE ADVERTISEMENT BY ID
    const putMobAds = async (req, res) => {
            const ID = req.params.tbs_mobad_id;
            const {client_details, mobad_title, start_date, end_date, mobad_description, usage_per_day, status, status_id, mobad_vdo,  page_id, page_name, hours, duration, ads_plan_id} = req.body;
        
            
            // Check if file upload exceeded size limit
            if (req.file && req.file.size > 15 * 1024 * 1024) {
                return res.status(400).send('File size exceeded (Max: 15MB)');
            }
        
            // Check if uploaded file mimetype is allowed
            if (!['image/jpeg', 'image/jpg', 'image/png', 'video/mp4', 'image/gif'].includes(req.file.mimetype)) {
                return res.status(400).send('Only .jpeg, .jpg, .png, .mp4, and .gif files are allowed');
            }
        
            
        const putAdUrl = req.file ? `/mobile_advertisement_files/${req.file.filename}` : null;
        const mobad_file_size = req.file ? req.file.size : null;
        const mobad_file_type = req.file ? req.file.mimetype : null;
        
            let updateAds = `UPDATE mobile_advertisements_tbl 
            SET client_details = $1,
                        mobad_title = $2,
                        start_date = $3,
                        end_date = $4,
                        mobad_description = $5,
                        usage_per_day = $6,
                        status = $7,
                        status_id = $8,
                        mobad_vdo = $9,
                        mobad_file_size = $10,
                        mobad_file_type = $11,
                        page_id = $12,
                        page_name = $13,
                        hours = $14,
                        duration = $15,
                        ads_plan_id = $16
                        WHERE tbs_mobad_id = $17`;
        
            const values = [client_details, mobad_title, start_date, end_date, mobad_description, usage_per_day, status, status_id, putAdUrl, mobad_file_size, mobad_file_type, page_id, page_name, hours, duration, ads_plan_id, ID];
        
            pool.query(updateAds, values, (err, result) => {
                if (!err) {
                    res.status(200).send('Updated successfully!')
                } else {
                    console.log(err.message);
                    res.status(500).send("Error updating advertisements");
                }
            });
        };


//SEARCH ADVERTISEMENT BY CLIENT-NAME, TITLE, DATE AND STATUS
        const searchMobAdvertisements = async (req, res) => {
            try {
                let query;
                let queryParams = [];
        
                const searchTerm = req.params.searchTerm;
        
                if (searchTerm && typeof searchTerm === 'string') {
                    const searchValue = `%${searchTerm.toLowerCase()}%`;
        
                    query = `
                        SELECT *
                        FROM mobile_advertisements_tbl
                        WHERE LOWER(client_details) LIKE $1
                           OR LOWER(mobad_title) LIKE $1
                           OR (TO_CHAR(start_date, 'Mon') || ' ' || TO_CHAR(start_date, 'DD')) ILIKE $1
                           OR (TO_CHAR(end_date, 'Mon') || ' ' || TO_CHAR(end_date, 'DD')) ILIKE $1
                           OR LOWER(status) LIKE $1
                    `;
        
                    queryParams = [searchValue];
                } else {
                    query = `
                        SELECT *
                        FROM mobile_advertisements_tbl
                    `;
                }
        
                const result = await pool.query(query, queryParams);
                res.json(result.rows);
            } catch (err) {
                console.error('Error executing query', err);
                res.send('Error searching records');
            }
        };

// GET RECENTLY ADDED MOBILE ADVERTISEMENTS
const getRecentMobAds = async (req, res) => {
    try {
        const getRecentMobAdsQuery = `
            SELECT * FROM mobile_advertisements_tbl 
            ORDER BY created_date DESC 
            LIMIT 6`;
        const result = await pool.query(getRecentMobAdsQuery);
        res.status(200).send(result.rows);
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ message: "Error getting records" });
    }
};


module.exports = { getMobAd, getMobAdbyId,deleteMobAd,postMobAd, putMobAds, searchMobAdvertisements, getClientRecordsMob, getClientDetailsMob, getCombinedDataMob, getMobAdbyStatus, getRecentMobAds }


