const pool = require('../config/db');
const xlsx = require('xlsx');

const getPromo = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                p.*,
                COALESCE(op.owner_name, po.owner_name, CONCAT(emp.emp_first_name, ' ', emp.emp_last_name)) as name
            FROM 
                promotions_tbl p 
            LEFT JOIN 
                operators_tbl op ON p.tbs_user_id = op.tbs_operator_id
            LEFT JOIN 
                product_owner_tbl po ON p.tbs_user_id = po.owner_id
            LEFT JOIN 
                op_emp_personal_details emp ON p.tbs_user_id = emp.tbs_op_emp_id  ORDER BY created_date DESC 
        `);
        res.status(200).send(result.rows);
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ message: "Error getting records" });
    }
};


//GET PROMOTION BY ID
const getPromobyId = async (req, res) => {
    try{
        const id = req.params.promo_id;
        const getPromoId = `SELECT * FROM promotions_tbl WHERE promo_id = $1`;
        const result = await pool.query(getPromoId,[id]);
        res.status(200).send(result.rows);
    } catch(err) {
        console.log(err.message);
        res.status(500).json({message:"Error getting records"});
    }
};


//GET PROMOTION BY STATUS
const getPromobyStatus = async (req, res) => {
    try {
        const id = parseInt(req.params.promo_status_id);

        let getPromoStatus;
        let values;

        if (id === 4) {
            getPromoStatus = `SELECT * FROM promotions_tbl WHERE promo_status_id != 0`;
        } else {
            getPromoStatus = `SELECT * FROM promotions_tbl WHERE promo_status_id = $1`;
            values = [id];
        }

        const result = await pool.query(getPromoStatus, values);
        res.status(200).send(result.rows);
    } catch (err) {
        console.log(err.message);
        res.status(500).json({message: "Error getting records"});
    }
};



//GET OPERATOR RECORDS FOR DROPDOWN
const getOperatorRecords = async (req, res) => {
    try{
        const getOperators = `SELECT tbs_operator_id, company_name, owner_name FROM operators_tbl`;
        const result = await pool.query(getOperators);
        res.status(200).send(result.rows);
    } catch(err) {
        console.log(err.message);
        res.status(500).send("Error getting records");
    }
};


//DELETE PROMOTION BY ID
const deletePromo = async (req, res) => {
    const client = await pool.connect();

    try {
        const promo_id = req.params.promo_id;

        // Start a transaction
        await client.query('BEGIN');

        // Fetch the promotion from the database
        const fetchPromoQuery = 'SELECT * FROM promotions_tbl WHERE promo_id = $1';
        const fetchPromoResult = await client.query(fetchPromoQuery, [promo_id]);

        const promo = fetchPromoResult.rows[0];

        if (!promo) {
            await client.query('ROLLBACK');
            return res.status(404).json({message : `Promotion with ID ${promo_id} not found`});
        }

        // Prepare the deleted data object for the recycle bin
        const deletedData = {
            promo_name: promo.promo_name,
            operator_details: promo.operator_details,
            start_date: promo.start_date,
            expiry_date: promo.expiry_date,
            usage: promo.usage,
            promo_status_id: promo.promo_status_id,
            promo_status: promo.promo_status,
            user_id: promo.user_id,
            user_status: promo.user_status,
            promo_description: promo.promo_description,
            promo_image: promo.promo_image,
            created_date: promo.created_date,
            background_image: promo.background_image,
            tbs_user_id: promo.tbs_user_id,
            updated_date: promo.updated_date,
            promo_img_details: promo.promo_img_details
        };

        // Insert the deleted promotion data into the recycle bin
        const insertRecycleBinQuery = `
            INSERT INTO recycle_bin (module_name, module_id, deleted_data, module_get_id)
            VALUES ($1, $2, $3, $4)
        `;
        await client.query(insertRecycleBinQuery, ['promotions', promo_id, JSON.stringify(deletedData), 2]);

        // Delete the promotion from the promotions_tbl
        const removePromoQuery = 'DELETE FROM promotions_tbl WHERE promo_id = $1';
        const result = await client.query(removePromoQuery, [promo_id]);

        if (result.rowCount === 1) {
            const tbs_user_id = promo.tbs_user_id;

            // Update the respective user's table based on the tbs_user_id
            if (tbs_user_id.startsWith('tbs-pro')) {
                // For product_owner
                await client.query(
                    `UPDATE product_owner_tbl 
                     SET promotions = array_remove(promotions, $1) 
                     WHERE owner_id = $2`,
                    [promo_id, tbs_user_id]
                );
            } else if (tbs_user_id.startsWith('tbs-op_emp')) {
                // For operator_employee
                await client.query(
                    `UPDATE op_emp_personal_details 
                     SET promotions = array_remove(promotions, $1) 
                     WHERE tbs_op_emp_id = $2`,
                    [promo_id, tbs_user_id]
                );
            } else if (tbs_user_id.startsWith('tbs-op')) {
                // For operator
                await client.query(
                    `UPDATE operators_tbl 
                     SET promotions = array_remove(promotions, $1) 
                     WHERE tbs_operator_id = $2`,
                    [promo_id, tbs_user_id]
                );
            }

            // Commit the transaction
            await client.query('COMMIT');
            res.status(200).json({ message : 'Promotion deleted successfully and moved to recycle bin'});
        } else {
            await client.query('ROLLBACK');
            res.status(404).json({message : `Promotion with ID ${promo_id} not found`});
        }

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error deleting promotion:', err);
        res.status(500).json({ message: "Error deleting promotion" });
    } finally {
        client.release();
    }
};

 
//POST PROMOTION
const postPromo = async (req, res) => {
    const { promo_name, operator_details, start_date, expiry_date, usage, promo_status_id, promo_status, user_id, user_status, promo_description, tbs_user_id } = req.body;

    if (req.file) {
        if (req.file.size > 5 * 1024 * 1024) {
            return res.status(400).send('File size exceeded (Max: 5MB)');
        }

        if (!['image/jpeg', 'image/jpg', 'image/png'].includes(req.file.mimetype)) {
            return res.status(400).send('Only .jpeg, .jpg and .png files are allowed');
        }
    }

    const promoImage = req.files?.['promo_image'] ? {
        fieldname: req.files['promo_image'][0].fieldname,
        originalname: req.files['promo_image'][0].originalname,
        encoding: req.files['promo_image'][0].encoding,
        type: req.files['promo_image'][0].mimetype,
        destination: req.files['promo_image'][0].destination,
        filename: req.files['promo_image'][0].filename,
        path: `/promotion_files/${req.files['promo_image'][0].filename}`,
        size: req.files['promo_image'][0].size
    } : null;

    const backgroundImage = req.files?.['background_image'] ? {
        fieldname: req.files['background_image'][0].fieldname,
        originalname: req.files['background_image'][0].originalname,
        encoding: req.files['background_image'][0].encoding,
        type: req.files['background_image'][0].mimetype,
        destination: req.files['background_image'][0].destination,
        filename: req.files['background_image'][0].filename,
        path: `/promotion_files/${req.files['background_image'][0].filename}`,
        size: req.files['background_image'][0].size
    } : null;

    if (!promo_name || !operator_details || !promo_description || !tbs_user_id || !promoImage || !backgroundImage) {
        return res.status(400).send("Invalid request body");
    }

    const promoImgDetails = {
        promo_image: promoImage,
        background_image: backgroundImage
    };

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        let userType = '';
        let isUserExists = false;

        if (tbs_user_id.startsWith('tbs-pro')) {
            userType = 'product_owner';
            const ownerResult = await client.query(`SELECT * FROM product_owner_tbl WHERE owner_id = $1`, [tbs_user_id]);
            isUserExists = ownerResult.rows.length > 0;
        } else if (tbs_user_id.startsWith('tbs-op_emp')) {
            userType = 'operator_employee';
            const empResult = await client.query(`SELECT * FROM op_emp_personal_details WHERE tbs_op_emp_id = $1`, [tbs_user_id]);
            isUserExists = empResult.rows.length > 0;
        } else if (tbs_user_id.startsWith('tbs-op')) {
            userType = 'operator';
            const operatorResult = await client.query(`SELECT * FROM operators_tbl WHERE tbs_operator_id = $1`, [tbs_user_id]);
            isUserExists = operatorResult.rows.length > 0;
        }

        if (!isUserExists) {
            return res.status(404).json({ message: 'User not found' });
        }

        const insertPromo = `
            INSERT INTO promotions_tbl (promo_name, operator_details, start_date, expiry_date, usage, promo_status_id, promo_status, user_id, user_status, promo_description, promo_image, tbs_user_id, background_image, promo_img_details)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING promo_id
        `;
        const values = [
            promo_name, 
            operator_details, 
            start_date, 
            expiry_date, 
            usage, 
            promo_status_id, 
            promo_status, 
            user_id, 
            user_status, 
            promo_description, 
            promoImgDetails.promo_image.path, 
            tbs_user_id, 
            promoImgDetails.background_image.path,
            promoImgDetails
        ];

        const promoResult = await client.query(insertPromo, values);
        const promoId = promoResult.rows[0].promo_id;

        let updateQuery = '';
        if (userType === 'product_owner') {
            updateQuery = `UPDATE product_owner_tbl SET promotions = array_append(promotions, $1) WHERE owner_id = $2`;
        } else if (userType === 'operator_employee') {
            updateQuery = `UPDATE op_emp_personal_details SET promotions = array_append(promotions, $1) WHERE tbs_op_emp_id = $2`;
        } else if (userType === 'operator') {
            updateQuery = `UPDATE operators_tbl SET promotions = array_append(promotions, $1) WHERE tbs_operator_id = $2`;
        }

        await client.query(updateQuery, [promoId, tbs_user_id]);

        if (userType !== 'product_owner') {
            const notificationMessage = `${operator_details} ${userType} requested new ${promo_name} Promotion`;
            const insertNotification = `
                INSERT INTO Product_Owner_Notification (tbs_pro_notif_id, tbs_user_id, user_name, user_type, subject_name, module_name, notification_message, read)
                VALUES (
                    CONCAT('tbs-notif', nextval('notif_id_seq')), 
                    $1, 
                    $2, 
                    $3, 
                    $4, 
                    $5, 
                    $6, 
                    $7
                )
            `;
            const notifValues = [
                tbs_user_id,
                operator_details,
                userType,
                promo_name,
                'promotion',
                notificationMessage,
                false
            ];
            await client.query(insertNotification, notifValues);
        }

        await client.query('COMMIT');
        res.status(201).json({ message: "Inserted Successfully!" });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(501).json({ message: "Error inserting promotions or notifications" });
    } finally {
        client.release();
    }
};




//UPDATE PROMOTION BY ID
const putPromo = async (req, res) => {
    const ID = req.params.promo_id
    const { promo_name, operator_details, start_date, expiry_date, usage, promo_status_id, promo_status, promo_description, tbs_user_id } = req.body
 
    if (req.file && req.file.size > 5 * 1024 * 1024) {
        return res.status(400).send('File size exceeded (Max: 5MB)')
    }
 
    const uploadPromoUrl = req.files && req.files['promo_image'] ? `/promotion_files/${req.files['promo_image'][0].filename}` : null
    const uploadPromobackImage = req.files && req.files['background_image'] ? `/promotion_files/${req.files['background_image'][0].filename}` : null
 
    const updatePromo = `
    UPDATE promotions_tbl SET
        promo_name = $1,
        operator_details = $2,
        start_date = $3,
        expiry_date = $4,
        usage = $5,
        promo_status_id = $6,
        promo_status = $7,
        promo_description = $8,
        promo_image = $9,
        background_image = $10,
        tbs_user_id = $11,
        updated_date = NOW()  
    WHERE promo_id = $12
    RETURNING *
`;

    const values = [promo_name, operator_details, start_date, expiry_date, usage, promo_status_id, promo_status, promo_description, uploadPromoUrl, uploadPromobackImage, tbs_user_id, ID]
 
    try {
        const result = await pool.query(updatePromo, values)
 
        if (result.rowCount === 0) {
            return res.status(201).json({ message: 'Promotion not found' })
        }
 
        res.status(200).json({ message: 'Promotion updated successfully!' })
    } catch (err) {
        console.error("Error updating promotions", err.message)
        res.status(201).json({ message: 'Error updating promotions' })
    }
}
 
//UPDATE PROMOTION STATUS WITH ID
const putPromoStatus = async (req, res) => {
    try {
        const ID = req.params.promo_id
        const { promo_status_id, promo_status, user_id, user_status } = req.body
 
        if (!ID || !promo_status_id || !promo_status || !user_id || !user_status) {
            return res.status(400).json("Invalid request body")
        }
 
        const updatePromoStatus = `
            UPDATE promotions_tbl SET
                promo_status_id = $1,
                promo_status = $2,
                user_id = $3,
                user_status = $4
            WHERE promo_id = $5
            RETURNING *
        `
        const values = [promo_status_id, promo_status, user_id, user_status, ID]
        const result = await pool.query(updatePromoStatus, values)
 
        if (result.rowCount === 0) {
            return res.status(201).json("Promotion not found")
        }
 
        res.status(200).json({ message: "Promotion updated successfully" })
    } catch (err) {
        console.error("Error updating promotions", err.message)
        res.status(201).send("Error updating promotions")
    }
}

//SEARCH PROMOTION BY NAME, CODE, DATE AND STATUS
 const searchPromo = async (req, res) => {
        try {
            let query;
            let queryParams = [];
    
            const searchTerm = req.params.searchTerm;
    
            if (searchTerm && typeof searchTerm === 'string') {
                const searchValue = `%${searchTerm.toLowerCase()}%`;
    
                query = `
                    SELECT *
                    FROM promotions_tbl
                    WHERE LOWER(promo_name) LIKE $1
                       OR LOWER(operator_details) LIKE $1
                       OR (TO_CHAR(start_date, 'Mon') || ' ' || TO_CHAR(start_date, 'DD')) ILIKE $1
                       OR (TO_CHAR(expiry_date, 'Mon') || ' ' || TO_CHAR(expiry_date, 'DD')) ILIKE $1
                       OR LOWER(promo_status) LIKE $1
                `;
    
                queryParams = [searchValue];
            } else {
                query = `
                    SELECT *
                    FROM promotions_tbl
                `;
            }
    
            const result = await pool.query(query, queryParams);
            res.json(result.rows);
        } catch (err) {
            console.error('Error executing query', err);
            res.status(501).json({message:"Error searcing records"});
        }
    };

//SEARCH PROMOTION STATUS
const searchPromoReq = async (req, res) => {
    try {
        const { status, search_term } = req.body;
        let query;
        let queryParams = [];
        
        // Construct the base query
        query = `
            SELECT *
            FROM promotions_tbl
            WHERE 1=1
        `;

        // Tracking the parameter position in queryParams array
        let paramIndex = 1;

        // Filter by user_status if it's not "all"
        if (status && status.toLowerCase() !== 'all') {
            query += ` AND LOWER(user_status) = $${paramIndex}`;
            queryParams.push(status.toLowerCase());
            paramIndex++;
        }

        // Filter by search term in promo_name or operator_details
        if (search_term && typeof search_term === 'string') {
            const searchValue = `%${search_term.toLowerCase()}%`;
            query += ` AND (LOWER(promo_name) LIKE $${paramIndex} OR LOWER(operator_details) LIKE $${paramIndex})`;
            queryParams.push(searchValue);
        }

        query += ` ORDER BY user_status`;

        const result = await pool.query(query, queryParams);

        if (result.rows.length === 0) {
            res.status(404).json({ message: "No promotions found matching the criteria." });
        } else {
            res.json(result.rows);
        }
    } catch (err) {
        console.error('Error executing query', err);
        res.status(501).json({ message: "Error searching records" });
    }
};



//PROMO-REQUEST MANAGEMENT FILTER
const promoFilterByDate = async (req, res) => {
        try {
            let query;
            let queryParams = [];
            
            // Extract the date range from the request body
            const { from, to } = req.body;
            
            if (from && to) {
                query = `
                    SELECT *
                    FROM promotions_tbl
                    WHERE created_date BETWEEN $1 AND $2::DATE + INTERVAL '1 day' - INTERVAL '1 second'
                    ORDER BY created_date ASC
                `;
                queryParams = [from, to];
            } else {
                query = `
                    SELECT *
                    FROM promotions_tbl
                    ORDER BY created_date ASC
                `;
            }
            
            const result = await pool.query(query, queryParams);
            res.json(result.rows);
        } catch (err) {
            console.error('Error executing query', err);
            res.status(501).json({ message: "Error searching records" });
        }
    };
    
    const sheetUpload = async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).send('No files were uploaded.');
            }
    
            if (req.file.size > 5 * 1024 * 1024) {
                return res.status(400).send('File size exceeded (Max: 5MB)');
            }
    
            if (req.file.mimetype !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                return res.status(400).send('Only .xlsx files are allowed');
            }
    
            const workbook = xlsx.readFile(req.file.path);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = xlsx.utils.sheet_to_json(worksheet);
    
            // Debugging: Log the first row of data to verify contents
            console.log('Data from Excel:', jsonData[0]);
    
            const query = `
                INSERT INTO promotions_tbl (promo_name, operator_details, start_date, expiry_date, usage, promo_status_id, promo_status, promo_description)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `;
    
            for (const row of jsonData) {
                // Use trim to clean up any potential space issues
                const promo_name = row.promo_name ? row.promo_name.trim() : null;
                const operator_details = row.operator_details ? row.operator_details.trim() : null;
                const usage = row.usage || null;
                const promo_description = row.promo_description ? row.promo_description.trim() : null;
                let start_date = row.start_date;
                let expiry_date = row.expiry_date;
    
                // Log the processed values
                console.log('Processing row:', {
                    promo_name,
                    operator_details,
                    start_date,
                    expiry_date,
                    usage,
                    promo_description
                });
    
                start_date = convertToDate(start_date);
                expiry_date = convertToDate(expiry_date);
    
                // Insert data with fixed promo_status_id and promo_status
                await pool.query(query, [
                    promo_name, 
                    operator_details, 
                    start_date, 
                    expiry_date, 
                    usage, 
                    0, // Fixed promo_status_id
                    'draft', // Fixed promo_status
                    promo_description
                ]);
            }
    
            res.json({ message: 'Data imported successfully!' });
        } catch (error) {
            console.error('Error importing data:', error);
            res.status(501).json({ message: "Error importing data" });
        }
    };
    
    
 function convertToDate(dateString) {
    if (typeof dateString === 'number') {
        const date = new Date(Math.round((dateString - 25569) * 86400 * 1000)); 
        return date.toISOString().split('T')[0]; 
    } else {
        return dateString;
    }
}    


// GET RECENTLY ADDED PROMOTIONS
const getRecentPromos = async (req, res) => {
    try {
        const getRecentPromosQuery = `
            SELECT * FROM promotions_tbl 
            ORDER BY created_date DESC 
            LIMIT 6`;
        const result = await pool.query(getRecentPromosQuery);
        res.status(200).send(result.rows);
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ message: "Error getting records" });
    }
};

    
module.exports =  { getPromo, getPromobyId, deletePromo, postPromo, putPromo, searchPromo, sheetUpload, getPromobyStatus, putPromoStatus, searchPromoReq, getOperatorRecords, promoFilterByDate, getRecentPromos };
