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

//GET PROMOTION BY USER ID
const getPromoByUserId = async (req, res) => {
    const { tbs_user_id } = req.params;

    try {
        const queryText = `
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
                op_emp_personal_details emp ON p.tbs_user_id = emp.tbs_op_emp_id 
            WHERE 
                p.tbs_user_id = $1
            ORDER BY 
                p.created_date DESC
        `;
        
        const result = await pool.query(queryText, [tbs_user_id]);
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


//GET PROMOTION BY STATUS PRO
const getPromobyStatus = async (req, res) => {
    try {
        const id = parseInt(req.params.user_status_id);

        let getPromoStatus;
        let values;

        if (id === 5) {
            getPromoStatus = `SELECT * 
            FROM promotions_tbl
            WHERE (
                (tbs_user_id LIKE 'tbs-op%' AND promo_status_id NOT IN (1, 0)) 
                AND 
                (tbs_user_id LIKE 'tbs-op_emp%' AND promo_status_id NOT IN (1, 0, 6))
                OR 
                (tbs_user_id NOT LIKE 'tbs-op%' AND tbs_user_id NOT LIKE 'tbs-op_emp%')
            ) AND user_status_id NOT IN (7)
            ORDER BY created_date DESC; `;
        }else if (id === 1) {
            getPromoStatus = `SELECT * 
            FROM promotions_tbl 
            WHERE (tbs_user_id LIKE 'tbs-op_emp%' AND user_status_id = 6) AND (tbs_user_id LIKE 'tbs-op_emp%' AND promo_status_id = 6)
            OR tbs_user_id NOT LIKE 'tbs-op_emp%'  AND user_status_id = 1 
            ORDER BY created_date DESC;`;
        } else if (id === 3) {
            getPromoStatus = `SELECT * 
            FROM promotions_tbl 
            WHERE user_status_id = 3 AND promo_status_id = 3
            ORDER BY created_date DESC;`;
        } else if (id === 4) {
            getPromoStatus = `SELECT * 
            FROM promotions_tbl 
            WHERE user_status_id = 4 AND promo_status_id = 4
            ORDER BY created_date DESC;`;
        } else if (id === 0) {
            getPromoStatus = `SELECT * 
            FROM promotions_tbl 
            WHERE tbs_user_id = 'tbs-pro1001' AND promo_status_id = 0;`;
        } else {
            getPromoStatus = `SELECT * FROM promotions_tbl WHERE user_status_id = $1 ORDER BY created_date DESC`;
            values = [id];
        }

        const result = await pool.query(getPromoStatus, values || []);
        res.status(200).send(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Error getting records" });
    }
}

//GET PROMOTION BY STATUS OP
const getPromobyStatusUserid = async (req, res) => {
    try {
        const { tbs_user_id, user_status_id } = req.params;

        let getPromoStatus;
        let values;

        if (user_status_id == 5) {
            getPromoStatus = `SELECT * FROM promotions_tbl WHERE tbs_user_id = $1 ORDER BY created_date DESC`;
            values = [tbs_user_id]; 
        } else if(user_status_id == 1) {
            getPromoStatus = `SELECT * FROM promotions_tbl WHERE tbs_user_id = $1 AND user_status_id IN(1, 6) ORDER BY created_date DESC`;
            values = [tbs_user_id];
        } else if(user_status_id == 3) {
            getPromoStatus = `SELECT * FROM promotions_tbl WHERE tbs_user_id = $1 AND user_status_id IN(3, 7) AND promo_status_id IN (3) ORDER BY created_date DESC`;
            values = [tbs_user_id];
        } else if(user_status_id == 4) {
            getPromoStatus = `SELECT * FROM promotions_tbl WHERE tbs_user_id = $1 AND user_status_id IN(4, 7) AND promo_status_id IN (4) ORDER BY created_date DESC`;
            values = [tbs_user_id];
        } else {
            getPromoStatus = `SELECT * FROM promotions_tbl WHERE tbs_user_id = $1 AND user_status_id = $2 ORDER BY created_date DESC`;
            values = [tbs_user_id, user_status_id];
        }

        const result = await pool.query(getPromoStatus, values);
        res.status(200).send(result.rows);
    } catch (err) {
        console.error("Error getting records:", err.message);
        res.status(500).json({ message: "Error getting records" });
    }
}

//GET PROMOTION BY STATUS FOR OP EMP
const getPromosByStatusAndUserId = async (req, res) => {
    try {
        const { tbs_user_id, user_status_id } = req.params;

        if (!tbs_user_id || !user_status_id) {
            return res.status(400).json({ message: "tbs_user_id and user_status_id are required." });
        }

        const operatorQuery = `SELECT tbs_op_emp_id FROM op_emp_personal_details WHERE tbs_operator_id = $1`;
        const operatorResult = await pool.query(operatorQuery, [tbs_user_id]);

        if (operatorResult.rows.length === 0) {
            return res.status(404).json({ message: "No operator employees found for this user." });
        }

        const tbs_op_emp_ids = operatorResult.rows.map(row => row.tbs_op_emp_id);

        let promotionsQuery;
        let values = [tbs_op_emp_ids];

        if (user_status_id == 5) {
            promotionsQuery = `
                SELECT * 
                FROM promotions_tbl 
                WHERE tbs_user_id = ANY($1::text[]) AND promo_status_id != 0 
                ORDER BY created_date DESC;
            `;
        } else if (user_status_id == 3) {
            promotionsQuery = `
                SELECT * 
                FROM promotions_tbl 
                WHERE tbs_user_id = ANY($1::text[]) AND user_status_id IN (3, 7) AND promo_status_id = 3 
                ORDER BY created_date DESC;
            `;
        } else if (user_status_id == 4) {
            promotionsQuery = `
                SELECT * 
                FROM promotions_tbl 
                WHERE tbs_user_id = ANY($1::text[]) AND user_status_id IN (4, 7) AND promo_status_id = 4 
                ORDER BY created_date DESC;
            `;
        } else {
            promotionsQuery = `
                SELECT * 
                FROM promotions_tbl 
                WHERE tbs_user_id = ANY($1::text[]) AND user_status_id = $2 
                ORDER BY created_date DESC;
            `;
            values.push(user_status_id);
        }

        const promotionsResult = await pool.query(promotionsQuery, values);

        res.status(200).json(promotionsResult.rows);
    } catch (err) {
        console.error("Error fetching promotions:", err.message);
        res.status(500).json({ message: "Error fetching promotions" });
    }
}

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

        await client.query('BEGIN');

        const fetchPromoQuery = 'SELECT * FROM promotions_tbl WHERE promo_id = $1';
        const fetchPromoResult = await client.query(fetchPromoQuery, [promo_id]);

        const promo = fetchPromoResult.rows[0];

        if (!promo) {
            await client.query('ROLLBACK');
            return res.status(201).json({message : `Promotion with ID ${promo_id} not found`});
        }

        const deletedData = {
            promo_id: promo.promo_id,
            promo_name: promo.promo_name,
            operator_details: promo.operator_details,
            start_date: promo.start_date,
            expiry_date: promo.expiry_date,
            usage: promo.usage,
            promo_status_id: promo.promo_status_id,
            promo_status: promo.promo_status,
            user_status_id: promo.user_status_id,
            user_status: promo.user_status,
            promo_description: promo.promo_description,
            promo_image: promo.promo_image,
            created_date: promo.created_date,
            background_image: promo.background_image,
            tbs_user_id: promo.tbs_user_id,
            updated_date: promo.updated_date,
            promo_img_details: promo.promo_img_details,
            promo_value: promo.promo_value,
            promo_code: promo.promo_code
        };

        const insertRecycleBinQuery = `
            INSERT INTO recycle_bin (module_name, module_id, deleted_data, module_get_id)
            VALUES ($1, $2, $3, $4)
        `;
        await client.query(insertRecycleBinQuery, ['promotions', promo_id, JSON.stringify(deletedData), 2]);

        const removePromoQuery = 'DELETE FROM promotions_tbl WHERE promo_id = $1';
        const result = await client.query(removePromoQuery, [promo_id]);

        if (result.rowCount === 1) {
            const tbs_user_id = promo.tbs_user_id;

            if (tbs_user_id.startsWith('tbs-pro')) {
                await client.query(
                    `UPDATE product_owner_tbl 
                     SET promotions = array_remove(promotions, $1) 
                     WHERE owner_id = $2`,
                    [promo_id, tbs_user_id]
                );
            } else if (tbs_user_id.startsWith('tbs-op_emp')) {
                await client.query(
                    `UPDATE op_emp_personal_details 
                     SET promotions = array_remove(promotions, $1) 
                     WHERE tbs_op_emp_id = $2`,
                    [promo_id, tbs_user_id]
                );
            } else if (tbs_user_id.startsWith('tbs-op')) {
                await client.query(
                    `UPDATE operators_tbl 
                     SET promotions = array_remove(promotions, $1) 
                     WHERE tbs_operator_id = $2`,
                    [promo_id, tbs_user_id]
                );
            }

            await client.query('COMMIT');
            res.status(200).json({ message : 'Promotion deleted successfully and moved to recycle bin'});
        } else {
            await client.query('ROLLBACK');
            res.status(201).json({message : `Promotion with ID ${promo_id} not found`});
        }

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error deleting promotion:', err);
        res.status(500).json({ message: "Error deleting promotion" });
    } finally {
        client.release();
    }
}
 
//POST PROMOTION
const postPromo = async (req, res) => {
    const { promo_name, operator_details, start_date, expiry_date, usage, promo_status_id, promo_status, user_status_id, user_status, promo_description, tbs_user_id, promo_value, promo_code, value_symbol } = req.body;

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
            return res.status(201).json({ message: 'User not found' });
        }

        const insertPromo = `
            INSERT INTO promotions_tbl (promo_name, operator_details, start_date, expiry_date, usage, promo_status_id, promo_status, user_status_id, user_status, promo_description, promo_image, tbs_user_id, background_image, promo_img_details, promo_value, promo_code, value_symbol)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
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
            user_status_id, 
            user_status, 
            promo_description, 
            promoImgDetails.promo_image.path, 
            tbs_user_id, 
            promoImgDetails.background_image.path,
            promoImgDetails, promo_value, promo_code, value_symbol
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
            const notificationMessage = `Posted ${promo_name} Promotion`;
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
        console.error(err);
        res.status(501).json({ message: "Error inserting promotions or notifications" });
    } finally {
        client.release();
    }
};


//UPDATE PROMOTION BY ID
const putPromo = async (req, res) => {
    const ID = req.params.promo_id
    const { promo_name, operator_details, start_date, expiry_date, usage, promo_status_id, promo_status, promo_description, tbs_user_id, promo_value, promo_code, user_status, user_status_id, value_symbol } = req.body
 
    if (req.file && req.file.size > 5 * 1024 * 1024) {
        return res.status(400).send('File size exceeded (Max: 5MB)')
    }
 
    const uploadPromoUrl = req.files && req.files['promo_image'] ? `/promotion_files/${req.files['promo_image'][0].filename}` : null
    const uploadPromobackImage = req.files && req.files['background_image'] ? `/promotion_files/${req.files['background_image'][0].filename}` : null
 
    const updatePromo = `
                    UPDATE promotions_tbl SET
                    promo_name = COALESCE($1, promo_name),
                    operator_details = COALESCE($2, operator_details),
                    start_date = COALESCE($3, start_date),
                    expiry_date = COALESCE($4, expiry_date),
                    usage = COALESCE($5, usage),
                    promo_status_id = COALESCE($6::INTEGER, promo_status_id),
                    promo_status = COALESCE($7, promo_status),
                    promo_description = COALESCE($8, promo_description),
                    promo_image = COALESCE($9, promo_image),
                    background_image = COALESCE($10, background_image),
                    tbs_user_id = COALESCE($11, tbs_user_id),
                    promo_value = COALESCE($12, promo_value),
                    promo_code = COALESCE($13, promo_code),
                    updated_date = NOW(),
                    value_symbol = COALESCE($14, value_symbol),
                    user_status = COALESCE($15, user_status),
                    user_status_id = COALESCE($16::INTEGER, user_status_id)
                WHERE promo_id = $17
                RETURNING *; `;

    const values = [promo_name, operator_details, start_date, expiry_date, usage, promo_status_id, promo_status, promo_description, uploadPromoUrl, uploadPromobackImage, tbs_user_id, promo_value, promo_code, value_symbol, user_status, user_status_id, ID]
 
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
        const { promo_status_id, promo_status, user_status_id, user_status, comments } = req.body
 
        if (!ID || !promo_status_id || !promo_status || !user_status_id || !user_status) {
            return res.status(400).json("Invalid request body")
        }
 
        const updatePromoStatus = `
        UPDATE promotions_tbl
        SET
            promo_status_id = COALESCE($1, promo_status_id),
            promo_status = COALESCE($2, promo_status),
            user_status_id = COALESCE($3, user_status_id),
            user_status = COALESCE($4, user_status),
            comments = COALESCE($5, comments)
        WHERE promo_id = $6
        RETURNING *; `
        const values = [promo_status_id, promo_status, user_status_id, user_status, comments, ID]
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
                       OR LOWER(promo_code) LIKE $1
                       OR LOWER(value_symbol) LIKE $1
                       OR CAST(promo_value AS TEXT) LIKE $1
                       OR (TO_CHAR(start_date, 'DD') || ' ' || TO_CHAR(start_date, 'Mon')) ILIKE $1
                       OR (TO_CHAR(expiry_date, 'DD') || ' ' || TO_CHAR(expiry_date, 'Mon')) ILIKE $1
                       OR LOWER(promo_status) LIKE $1 `;
    
                queryParams = [searchValue];
            } else {
                query = `
                    SELECT *
                    FROM promotions_tbl`;
            }
    
            const result = await pool.query(query, queryParams);
            res.json(result.rows);
        } catch (err) {
            console.error('Error executing query', err);
            res.status(501).json({message:"Error searcing records"});
        }
 }

 //SEARCH PROMOTION BY NAME, CODE, DATE AND STATUS
 const searchPromoById = async (req, res) => {
    try {
        const id = req.params.user_status_id; 
        const tbsUserId = req.params.tbs_user_id; 
        const { searchTerm } = req.body; 

        let getPromoStatus;
        let values = [];
        let searchCondition = '';

        if (searchTerm && typeof searchTerm === 'string') {
            const searchValue = `%${searchTerm.toLowerCase()}%`;
            searchCondition = `AND (
                    LOWER(promo_name) LIKE $${values.length + 1}
                    OR LOWER(operator_details) LIKE $${values.length + 1}
                    OR LOWER(promo_status) LIKE $${values.length + 1}
                    OR LOWER(promo_code) LIKE $${values.length + 1}
                    OR LOWER(value_symbol) LIKE $${values.length + 1}
                    OR CAST(promo_value AS TEXT) LIKE $${values.length + 1}  
                    OR TO_CHAR(start_date, 'DD Mon') ILIKE $${values.length + 1}
                    OR TO_CHAR(expiry_date, 'DD Mon') ILIKE $${values.length + 1}
                )`;
            values.push(searchValue);
        }

        if (id === 5) {
            getPromoStatus = `
                SELECT * 
                FROM promotions_tbl
                WHERE (
                    (tbs_user_id = $${values.length + 1} AND promo_status_id NOT IN (1, 0)) 
                    OR 
                    (tbs_user_id = $${values.length + 1} AND promo_status_id NOT IN (1, 0, 6))
                    OR 
                    (tbs_user_id != $${values.length + 1})
                ) 
                AND user_status_id NOT IN (7) AND (
                ${searchCondition})
                ORDER BY created_date DESC;
            `;
            values.push(tbsUserId); 
        } else if (id === 1) {
            getPromoStatus = `
                SELECT * 
                FROM promotions_tbl 
                WHERE 
                (
                    (tbs_user_id = $${values.length + 1} AND user_status_id = 6) 
                    AND 
                    (tbs_user_id = $${values.length + 1} AND promo_status_id = 6)
                )
                OR 
                (tbs_user_id != $${values.length + 1} AND user_status_id = 1)
                AND (
                    ${searchCondition})
                ORDER BY created_date DESC;
            `;
            values.push(tbsUserId);
        } else if (id === 3) {
            getPromoStatus = `
                SELECT * 
                FROM promotions_tbl 
                WHERE user_status_id = 3 AND promo_status_id = 3
                ${tbsUserId ? '' : `AND tbs_user_id = $${values.length + 1}`}
                AND (
                    ${searchCondition})
                ORDER BY created_date DESC;
            `;
            if (tbsUserId) values.push(tbsUserId); 
        } else if (id === 4) {
            getPromoStatus = `
                SELECT * 
                FROM promotions_tbl 
                WHERE user_status_id = 4 AND promo_status_id = 4
                ${tbsUserId ? '' : `AND tbs_user_id = $${values.length + 1}`}
                AND (
                    ${searchCondition})
                ORDER BY created_date DESC;
            `;
            if (tbsUserId) values.push(tbsUserId);
        } else if (id === 0) {
            getPromoStatus = `
                SELECT * 
                FROM promotions_tbl 
                WHERE tbs_user_id = 'tbs-pro1001' AND promo_status_id = 0
                ${tbsUserId ? '' : `AND tbs_user_id = $${values.length + 1}`}
                AND (
                    ${searchCondition})
            `;
            if (tbsUserId) values.push(tbsUserId);
        } else {
            getPromoStatus = `
                SELECT * 
                FROM promotions_tbl 
                WHERE user_status_id = $1
                ${tbsUserId ? '' : `AND tbs_user_id = $${values.length + 1}`}
                AND (
                    ${searchCondition})
                ORDER BY created_date DESC;
            `;
            values.push(id);
            if (tbsUserId) values.push(tbsUserId); 
        }

        const result = await pool.query(getPromoStatus, values);

        res.status(200).send(result.rows);
    } catch (err) {
        console.error('Error executing query:', err.message);
        res.status(500).json({ message: "Error getting records" });
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
    }
  
const sheetUpload = async (req, res) => {
    try {
            if (!req.file || !req.file.path) {
                return res.status(400).send('No file uploaded.');
            }
    
            const { tbs_user_id } = req.body;
    
            if (!tbs_user_id) {
                return res.status(400).send('tbs_user_id is required.');
            }
    
            const workbook = xlsx.readFile(req.file.path);
            const sheet_name_list = workbook.SheetNames;
            const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
    
            const requiredColumns = [
                'promo_name', 'start_date', 'expiry_date', 'usage', 'promo_code', 'promo_value', 'value_symbol', 'promo_description'
            ];
    
            const excelDateToJSDate = (serial) => {
                const excelEpoch = new Date(Date.UTC(1899, 11, 30));
                const days = Math.floor(serial) - 1;
                const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
                return date.toISOString().split('T')[0];
            };
    
            const validateRow = (row) => {
                for (const col of requiredColumns) {
                    if (!Object.keys(row).includes(col) || row[col] === undefined || row[col] === null) {
                        return false;
                    }
                }
                return true;
            };
    
            const validateUserId = async (userId) => {
                try {
                    let query = null;
                    let result = null;
            
                    if (userId.startsWith('tbs-op') && !userId.startsWith('tbs-op_emp')) {
                        console.log(`Validating operator user: ${userId}`);
                        query = `SELECT user_status_id FROM operators_tbl WHERE tbs_operator_id = $1`;
                    } else if (userId.startsWith('tbs-op_emp')) {
                        console.log(`Validating operator employee: ${userId}`);
                        query = `SELECT emp_status_id FROM op_emp_personal_details WHERE tbs_op_emp_id = $1`;
                    } else if (userId.startsWith('tbs-pro')) {
                        console.log(`Validating product owner: ${userId}`);
                        query = `SELECT 1 FROM product_owner_tbl WHERE owner_id = $1`;
                    } else {
                        console.log(`Invalid user prefix: ${userId}`);
                        return false;
                    }
            
                    console.log('Executing query:', query, 'with userId:', userId);
                    result = await pool.query(query, [userId]);
                    console.log('Query result:', result.rows);
            
                    if (userId.startsWith('tbs-op') && !userId.startsWith('tbs-op_emp')) {
                        return result.rows.length > 0 && result.rows[0].user_status_id === 2; 
                    } else if (userId.startsWith('tbs-op_emp')) {
                        return result.rows.length > 0 && result.rows[0].emp_status_id === 1; 
                    } else if (userId.startsWith('tbs-pro')) {
                        return result.rows.length > 0; 
                    }
            
                    return false;
                } catch (err) {
                    console.error('Error validating user ID:', err);
                    return false;
                }
            }                                    
    
            const isValidUser = await validateUserId(tbs_user_id);
            console.log('isValidUser:', isValidUser);
            
            if (!isValidUser) {
                return res.status(400).send('Invalid user. Promotion upload is not allowed.');
            }
    
            for (let i = 0; i < data.length; i++) {
                let { promo_name, start_date, expiry_date, usage, promo_code, promo_value, value_symbol, promo_description } = data[i];
    
                if (!validateRow(data[i])) {
                    return res.status(400).send(`Row with missing or invalid data: ${JSON.stringify(data[i])}`);
                }
    
                start_date = excelDateToJSDate(start_date);
                expiry_date = excelDateToJSDate(expiry_date);
    
                const query = {
                    text: `INSERT INTO promotions_tbl (
                        promo_name, start_date, expiry_date, usage, promo_status_id, promo_status, promo_description, promo_value, value_symbol, promo_code, tbs_user_id, user_status, user_status_id ) 
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
                    values: [promo_name, start_date, expiry_date, usage, '0', 'Draft', promo_description, promo_value, value_symbol, promo_code, tbs_user_id, 'Draft', 0],
                }
                await pool.query(query);
            }
    
            res.status(200).send('File uploaded and data saved successfully.');
        } catch (error) {
            console.error('Error processing file:', error);
            res.status(500).send('Error processing file.');
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

//GET LIVE PROMOTIONS
const getLivePromotions = async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT *
         FROM promotions_tbl
         WHERE promo_status_id = 2 AND NOW() >= start_date OR NOW() <= expiry_date
         AND promo_status_id = 2 ORDER BY created_date DESC`
      );
  
      if (result.rows.length > 0) {
        res.status(200).json(result.rows);
      } else {
        res.status(204).json(result.rows);
      }
    } catch (err) {
      console.error('Error executing query:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

    
module.exports =  { getPromo, getPromobyId, deletePromo, postPromo, putPromo, 
    searchPromo, sheetUpload, getPromobyStatus, putPromoStatus, getOperatorRecords, promoFilterByDate, getRecentPromos, getLivePromotions, getPromoByUserId, searchPromoById, getPromobyStatusUserid, getPromosByStatusAndUserId };
