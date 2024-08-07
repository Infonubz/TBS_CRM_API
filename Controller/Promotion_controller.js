const pool = require('../dbconnection.js');
const xlsx = require('xlsx');

//GET ALL PROMOTIONS
// const getPromo = async (req, res) => {
//     try{
//         const result = await pool.query('SELECT * FROM promotions_tbl');
//         res.status(200).send(result.rows);
//     } catch(err) {
//         console.log(err.message);
//         res.status(500).json({message:"Error getting records"});
//     }
// };
//p.promo_id, p.promo_name, p.operator_details, p.start_date, p.expiry_date, p.usage, 
// p.promo_status_id, p.promo_status, p.user_id, p.user_status, p.promo_description, 
// p.promo_image, p.created_date, p.tbs_operator_id, p.owner_id, p.tbs_op_emp_id, 
// p.background_image,

const getPromo = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                p.*,
                COALESCE(op.owner_name, po.owner_name, CONCAT(emp.emp_first_name, ' ', emp.emp_last_name)) as name
            FROM 
                promotions_tbl p
            LEFT JOIN 
                operators_tbl op ON p.tbs_operator_id = op.tbs_operator_id
            LEFT JOIN 
                product_owner_tbl po ON p.owner_id = po.owner_id
            LEFT JOIN 
                op_emp_personal_details emp ON p.tbs_op_emp_id = emp.tbs_op_emp_id
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
            getPromoStatus = `SELECT * FROM promotions_tbl WHERE user_id = $1`;
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
const deletePromo = async (req,res) => {
    
    try{
    const id = req.params.promo_id;
    const removePromo = 'DELETE FROM promotions_tbl WHERE promo_id = $1';
    const result = await pool.query(removePromo, [id]);
    res.status(200).send('Deleted successfully!');
    } catch(err) {
        console.log(err);
        res.status(500).json({message:"Error deleting promotions"});
    }
};


// POST PROMOTION
const postPromo = async (req, res) => {
    const { promo_name, operator_details, start_date, expiry_date, usage, promo_status_id, promo_status, user_id, user_status, promo_description, tbs_operator_id, owner_id, tbs_op_emp_id } = req.body;

    if (req.file) {
        if (req.file.size > 5 * 1024 * 1024) {
            return res.status(400).send('File size exceeded (Max: 5MB)');
        }

        if (!['image/jpeg', 'image/jpg', 'image/png'].includes(req.file.mimetype)) {
            return res.status(400).send('Only .jpeg, .jpg and .png files are allowed');
        }
    }

    const uploadPromoUrl = req.files && req.files['promo_image'] ? `/promotion_files/${req.files['promo_image'][0].filename}` : null;
    const uploadPromobackImage = req.files && req.files['background_image'] ? `/promotion_files/${req.files['background_image'][0].filename}` : null;

    if (!promo_name || !operator_details || !promo_description || (!tbs_operator_id && !owner_id && !tbs_op_emp_id) || uploadPromoUrl == null || uploadPromobackImage == null) {
        return res.status(400).send("Invalid request body");
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        let insertPromo = `
            INSERT INTO promotions_tbl (promo_name, operator_details, start_date, expiry_date, usage, promo_status_id, promo_status, user_id, user_status, promo_description, promo_image, tbs_operator_id, owner_id, tbs_op_emp_id, background_image)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        `;
        let values;

        if (tbs_operator_id) {
            values = [promo_name, operator_details, start_date, expiry_date, usage, promo_status_id, promo_status, user_id, user_status, promo_description, uploadPromoUrl, tbs_operator_id, null, null, uploadPromobackImage];
        } else if (owner_id) {
            values = [promo_name, operator_details, start_date, expiry_date, usage, promo_status_id, promo_status, user_id, user_status, promo_description, uploadPromoUrl, null, owner_id, null, uploadPromobackImage];
        } else if (tbs_op_emp_id) {
            values = [promo_name, operator_details, start_date, expiry_date, usage, promo_status_id, promo_status, user_id, user_status, promo_description, uploadPromoUrl, null, null, tbs_op_emp_id, uploadPromobackImage];
        }

        await client.query(insertPromo, values);

        let userType = '';
        if (tbs_operator_id) userType = 'operator';
        else if (owner_id) userType = 'product_owner';
        else if (tbs_op_emp_id) userType = 'operator_employee';

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
            tbs_operator_id || owner_id || tbs_op_emp_id,
            operator_details,
            userType,
            promo_name,
            'promotion',
            notificationMessage,
            false
        ];
        await client.query(insertNotification, notifValues);

        await client.query('COMMIT');
        res.send("Inserted Successfully!");
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(501).json({ message: "Error inserting promotions or notifications" });
    } finally {
        client.release();
    }
}


//UPDATE PROMOTION BY ID
const putPromo = async (req, res) => {
    const ID = req.params.promo_id
    const { promo_name, operator_details, start_date, expiry_date, usage, promo_status_id, promo_status, promo_description, tbs_operator_id } = req.body
 
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
            tbs_operator_id = $11
        WHERE promo_id = $12
        RETURNING *
    `
    const values = [promo_name, operator_details, start_date, expiry_date, usage, promo_status_id, promo_status, promo_description, uploadPromoUrl, uploadPromobackImage, tbs_operator_id, ID]
 
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
            return res.status(400).json("All fields are required")
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
    }

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
    

//IMPORT PROMOTIONS - XLSX
const sheetUpload = async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).send('No files were uploaded.');
            }
    
            const workbook = xlsx.readFile(req.file.path);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = xlsx.utils.sheet_to_json(worksheet);

            if (req.file) {
                if (req.file.size > 5 * 1024 * 1024) {
                    return res.status(400).send('File size exceeded (Max: 5MB)');
                }
        
                if (req.file) {
                    if (req.file.mimetype !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                        return res.status(400).send('Only .xlsx files are allowed');
                    }
                }
            }
    
            const query = `
                INSERT INTO promotions_tbl ( promo_name, operator_details, start_date, expiry_date, usage, promo_status_id, promo_status, promo_description, promo_image, background_image )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `;
    
            for (const row of jsonData) {
                const { promo_name, operator_details, usage, promo_status_id, promo_status,  promo_description, promo_image, background_image } = row;
                let { start_date, expiry_date } = row;
    
                start_date = convertToDate(start_date);
                expiry_date = convertToDate(expiry_date);
    
                await pool.query(query, [promo_name, operator_details, start_date, expiry_date, usage, promo_status_id, promo_status, promo_description, promo_image, background_image]);
            }
    
            res.send('Data imported successfully!');
        } catch (error) {
            console.error('Error importing data:', error);
            res.status(501).json({message:"Error importing data"});
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
    
module.exports =  { getPromo, getPromobyId, deletePromo, postPromo, putPromo, searchPromo, sheetUpload, getPromobyStatus, putPromoStatus, searchPromoReq, getOperatorRecords, promoFilterByDate };
