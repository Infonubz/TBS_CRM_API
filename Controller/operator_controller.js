const pool = require('../config/db')
const jwt = require('jsonwebtoken')

// operator_personal_details POST CONTROLLER
const postOperator = async (req, res) => {
    const { company_name, owner_name, phone, alternate_phone, emailid, alternate_emailid, aadharcard_number, pancard_number, user_status, req_status, user_status_id, req_status_id } = req.body;
    
        const type_name = 'SUPERADMIN';
        const type_id = 'SPA101';
        const JWT_SECRET_KEY = 'your_secret_key'

        if(!company_name || !owner_name || !phone || !alternate_phone || !emailid || !alternate_emailid || !aadharcard_number || !pancard_number || !user_status || !req_status || !user_status_id || !req_status_id){
            return res.status(400).json({ error: 'Missing required fields' })
        }
    
        try {
            const result = await pool.query(
                `INSERT INTO operators_tbl 
                 (company_name, owner_name, phone, alternate_phone, emailid, alternate_emailid, aadharcard_number, pancard_number, user_status, req_status, user_status_id, req_status_id, type_name, type_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING tbs_operator_id`,
                [company_name, owner_name, phone, alternate_phone, emailid, alternate_emailid, aadharcard_number, pancard_number, user_status, req_status, user_status_id, req_status_id, type_name, type_id]
            );
    
            const tbs_operator_id = result.rows[0].tbs_operator_id;
    
            console.log(`New operator created with ID: ${tbs_operator_id}`);
    
            const password = `SPA@${tbs_operator_id}`;
    
            await pool.query(
                `UPDATE operators_tbl SET password = $1 WHERE tbs_operator_id = $2`,
                [password, tbs_operator_id]
            );
    
          
            const token = jwt.sign({ tbs_operator_id }, JWT_SECRET_KEY, { expiresIn: '1h' })
            await pool.query(
                `UPDATE operators_tbl SET token = $1 WHERE tbs_operator_id = $2`,
                [token, tbs_operator_id]
              )
    
            res.status(201).json({
                message: 'Operator Created Successfully',
                id: tbs_operator_id,
                password: password,
                type_name: type_name,
                type_id: type_id,
                token: token 
            });
        } catch (err) {
            console.error('Error inserting into database:', err);
            res.status(500).json({ error: 'Database insertion failed' });
        }
    }

// operator personal details PUT controller
const putOperatorPersonal = async (req, res) => {
        const tbs_operator_id = req.params.tbs_operator_id;
        const {
            company_name,
            owner_name,
            phone,
            alternate_phone,
            emailid,
            alternate_emailid,
            aadharcard_number,
            pancard_number,
            user_status,
            req_status,
            user_status_id,
            req_status_id
        } = req.body;
try{
        const updateOperatorsQuery = `
        UPDATE public.operators_tbl 
        SET 
            company_name = $1,
            owner_name = $2,
            phone = $3,
            alternate_phone = $4,
            emailid = $5,
            alternate_emailid = $6,
            aadharcard_number = $7,
            pancard_number = $8,
            user_status = COALESCE($9, user_status),
            req_status = COALESCE($10, req_status),
            user_status_id = COALESCE($11, user_status_id),
            req_status_id = COALESCE($12, req_status_id)
        WHERE tbs_operator_id = $13
        RETURNING *;
    `;
const operatorsValues = [
        company_name,
        owner_name,
        phone,
        alternate_phone,
        emailid,
        alternate_emailid,
        aadharcard_number,
        pancard_number,
        user_status,
        req_status,
        user_status_id,
        req_status_id,
        tbs_operator_id ];
    const operatorsResult = await pool.query(updateOperatorsQuery, operatorsValues)
    res.status(200).json({ message: 'Operator and details updated successfully.' });
    } catch (error) {
        console.error('Error updating operator and details:', error);
        res.status(500).json({ error: 'Error updating operator and details.' });
    }
}

const putOperatorProfileImg = async (req, res) => {
    const tbs_operator_id = req.params.tbs_operator_id;

    const profileimg = req.file ? `/operator_files/${req.file.filename}` : null;
    try {
        const updateOperatorsQuery = `
        UPDATE public.operators_tbl 
        SET
            profileimg = $1
        WHERE tbs_operator_id = $2
        RETURNING *;
        `;
        const operatorsValues = [
            profileimg, tbs_operator_id 
        ];
        const operatorsResult = await pool.query(updateOperatorsQuery, operatorsValues)
        res.status(200).json({ message: 'Operator and details updated successfully.' });
    } catch (error) {
        console.error('Error updating operator and details:', error);
        res.status(500).json({ error: 'Error updating operator and details.' });
    }
}

const getOperatorProfileImgByid = async (req, res) => {
    const tbs_operator_id = req.params.tbs_operator_id;

    const profileimg = req.file ? `/operator_files/${req.file.filename}` : null;
    try {
        const updateOperatorsQuery = `
        SELECT
            profileimg FROM operators_tbl
        WHERE tbs_operator_id = $1
        `;
        const operatorsValues = [
            tbs_operator_id 
        ];
        const operatorsResult = await pool.query(updateOperatorsQuery, operatorsValues)
        res.status(200).json(operatorsResult.rows[0]);
    } catch (error) {
        console.error('Error updating operator and details:', error);
        res.status(500).json({ error: 'Error updating operator and details.' });
    }
}


const getOperatorProfileImg = async (req, res) => {

    const profileimg = req.file ? `/operator_files/${req.file.filename}` : null;
    try {
        const updateOperatorsQuery = `
        SELECT
            profileimg FROM operators_tbl;
        `;
        const operatorsResult = await pool.query(updateOperatorsQuery)
        res.status(200).json(operatorsResult.rows);
    } catch (error) {
        console.error('Error updating operator and details:', error);
        res.status(500).json({ error: 'Error updating operator and details.' });
    }
}

// operator_personal_details DELETE CONTROLLER
const deleteOperator = async (req, res) => {
    const id= req.params.tbs_operator_id 

    try {
        const query = `
            DELETE FROM operators_tbl 
            WHERE tbs_operator_id = $1
            RETURNING *;
        `
        
        const result = await pool.query(query, [id])

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Operator not found' })
        }

        res.status(200).json({ message: 'Operator deleted successfully' })
    } catch (err) {
        console.error('Error deleting operator:', err)
        res.status(500).json({ error: 'Database deletion failed' })
    }
}

// operator_personal_details GET CONTROLLER
const getOperator = async (req, res) => {
    try {
        const query = `
            SELECT tbs_operator_id,
            company_name,
            owner_name,
            phone,
            alternate_phone,
            emailid,
            alternate_emailid,
            aadharcard_number,
            pancard_number,
            user_status,
            req_status,
            user_status_id,
            req_status_id
            FROM public.operators_tbl 
        `;
        const result = await pool.query(query);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'No operators found' });
        }

        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database query failed' });
    }
}

// operator_personal_details GETbyID CONTROLLER
const getOperatorByID = async (req, res) => {
    const id = req.params.tbs_operator_id
    try {
        const query = `
            SELECT tbs_operator_id,
            company_name,
            owner_name,
            phone,
            alternate_phone,
            emailid,
            alternate_emailid,
            aadharcard_number,
            pancard_number,
            user_status,
            req_status,
            user_status_id,
            req_status_id
            FROM public.operators_tbl WHERE tbs_operator_id = $1
        `;
        const result = await pool.query(query);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'No operators found' });
        }

        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database query failed' });
    }
}

// email validation CONTROLLER
const Emailvalidation = async (req, res) => {
    const{ emailid } = req.body
try {
    const emailResult = await pool.query(`SELECT * FROM operators_tbl WHERE emailid = $1`, [emailid])

    emailExists = emailResult.rows.length > 0;

    res.json({Email : emailExists})

} catch (error) {
    res.status(500).json({ error: error.message})
}
}

//phone validation CONTROLLER
const phoneValidation = async (req, res) => {
    const{ phone } = req.body
try {
    const phoneResult = await pool.query(`SELECT * FROM operators_tbl WHERE phone = $1`, [phone])

    phoneExists = phoneResult.rows.length > 0;

    res.json({Phone: phoneExists})

} catch (error) {
    res.status(500).json({ error: error.message})
}
}

// search CONTROLLER
const searchOperator = async (req, res) => {
    const searchTerm = req.params.search_term ? req.params.search_term.toLowerCase() : ''; // Check if search_term is provided

    console.log(searchTerm); // Optional: Log the received searchTerm for debugging

    try {
        let query;
        let queryParams;

        if (searchTerm) {
            query = `
            SELECT *
            FROM operators_tbl AS o
            LEFT JOIN operator_details AS od ON o.tbs_operator_id = od.tbs_operator_id 
                WHERE LOWER(company_name) LIKE $1
                    OR LOWER(owner_name) LIKE $1
                    OR phone::text LIKE $1
                    OR LOWER(emailid) LIKE $1
                    OR LOWER(TO_CHAR(created_date, 'Mon DD')) LIKE $1
            `;
            queryParams = [`%${searchTerm}%`];
        } else {
            query = `SELECT *
            FROM operators_tbl AS o
            LEFT JOIN operator_details AS od ON o.tbs_operator_id = od.tbs_operator_id;
            `;
            queryParams = [];
        }

        const { rows } = await pool.query(query, queryParams);
        
        if (rows.length === 0) {

            return res.status(200).json('No operators found' );
        }

        res.status(200).json(rows);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

//operator_details POST CONTROLLERS
const operator_details = async (req, res) => {
    const tbs_operator_id = req.params.tbs_operator_id;

    const {
        has_gstin, aggregate_turnover_exceeded, state_name, state_code_number, gstin, head_office,
        type_of_constitution, business_background, msme_type, msme_number, type_of_service, currency_code,
        address, state, region, city, country, zip_code, state_id, country_id, city_id
    } = req.body;

    // File uploads

    const upload_gst = req.files && req.files['upload_gst'] ? `/operator_files/${req.files['upload_gst'][0].filename}` : null;
    const aadar_front_doc = req.files && req.files['aadar_front_doc'] ? `/operator_files/${req.files['aadar_front_doc'][0].filename}` : null;
    const aadar_back_doc = req.files && req.files['aadar_back_doc'] ? `/operator_files/${req.files['aadar_back_doc'][0].filename}` : null;
    const pancard_front_doc = req.files && req.files['pancard_front_doc'] ? `/operator_files/${req.files['pancard_front_doc'][0].filename}` : null;
    const pancard_back_doc = req.files && req.files['pancard_back_doc'] ? `/operator_files/${req.files['pancard_back_doc'][0].filename}` : null;
    const msme_doc = req.files && req.files ['msme_doc'] ? `/operator_files/${req.files['msme_doc'][0].filename}` : null;


    try {
        await pool.query('BEGIN');

        // Update address details
        if (address || state || region || city || country || state_id || country_id || city_id ) {
            const addressUpdateQuery = `
                UPDATE operator_details
                SET
                    address = COALESCE($2, address),
                    state = COALESCE($3, state),
                    region = COALESCE($4, region),
                    city = COALESCE($5, city),
                    country = COALESCE($6, country),
                    zip_code = COALESCE($7, zip_code),
                    state_id = COALESCE($8, state_id),
                    country_id  = COALESCE($9, country_id),
                    city_id = COALESCE($10, city_id)
                WHERE
                    tbs_operator_id = $1
            `;
            await pool.query(addressUpdateQuery, [
                tbs_operator_id, address, state, region, city, country, zip_code, state_id, country_id, city_id
            ]);
        }

        // Update business details
        if (type_of_constitution || business_background || msme_type || msme_number || type_of_service || currency_code) {
            const operatorUpdateQuery = `
                UPDATE operator_details
                SET
                    type_of_constitution = COALESCE($2, type_of_constitution),
                    business_background = COALESCE($3, business_background),
                    msme_type = COALESCE($4, msme_type),
                    msme_number = COALESCE($5, msme_number),
                    type_of_service = COALESCE($6, type_of_service),
                    currency_code = COALESCE($7, currency_code)
                WHERE
                    tbs_operator_id = $1
            `;
            await pool.query(operatorUpdateQuery, [
                tbs_operator_id, type_of_constitution, business_background, msme_type, msme_number, type_of_service, currency_code
            ]);
        }

        // Update GST details
        if (has_gstin || aggregate_turnover_exceeded || state_name || state_code_number || gstin || head_office || upload_gst) {
            const gstUpdateQuery = `
                UPDATE operator_details
                SET
                    has_gstin = COALESCE($1, has_gstin),
                    aggregate_turnover_exceeded = COALESCE($2, aggregate_turnover_exceeded),
                    state_name = COALESCE($3, state_name),
                    state_code_number = COALESCE($4, state_code_number),
                    gstin = COALESCE($5, gstin),
                    head_office = COALESCE($6, head_office),
                    upload_gst = COALESCE($7, upload_gst)
                WHERE
                    tbs_operator_id = $8
            `;
            
            await pool.query(gstUpdateQuery, [
                has_gstin === 'true' ? true : has_gstin === 'false' ? false : null,
                aggregate_turnover_exceeded === 'true' ? true : aggregate_turnover_exceeded === 'false' ? false : null,
                state_name, state_code_number, gstin, head_office, upload_gst, tbs_operator_id
            ]);
            
            if (gstin) {
                const statusUpdateQuery = `
                    UPDATE operators_tbl
                    SET
                        user_status = 'waiting',
                        user_status_id = 3
                    WHERE
                        tbs_operator_id = $1
                `;
                
                await pool.query(statusUpdateQuery, [tbs_operator_id]);
            }
        }
        

        // Update document details
        if (aadar_front_doc || aadar_back_doc || pancard_front_doc || pancard_back_doc) {
            const documentUpdateQuery = `
                UPDATE operator_details
                SET
                    aadar_front_doc = COALESCE($2, aadar_front_doc),
                    aadar_back_doc = COALESCE($3, aadar_back_doc),
                    pancard_front_doc = COALESCE($4, pancard_front_doc),
                    pancard_back_doc = COALESCE($5, pancard_back_doc),
                    msme_doc = COALESCE($6, msme_doc)
                WHERE
                    tbs_operator_id = $1
            `;
            await pool.query(documentUpdateQuery, [
                tbs_operator_id, aadar_front_doc, aadar_back_doc, pancard_front_doc, pancard_back_doc, msme_doc
            ]);
        }

        await pool.query('COMMIT');

        res.status(200).json({ message: 'Operator details updated successfully.' });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error updating operator details:', error);
        res.status(500).json({ error: 'Error updating operator details.' });
    }
}

//OPERATOR_ADDRESS_DETAILS GET CONTROLLER
const getOperator_address = async (req, res) => {

    try {
        const query = `
            SELECT 
            business_id,
            address,
                state,
                region,
                city,
                country,
                zip_code
            FROM operator_details ;
        `;
        
        const result = await pool.query(query);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Operator details not found' });
        }

        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error geting operator-details:', err);
        res.status(500).json({ error: 'Database getion failed' });
    }
}

//OPERATOR_ADDRESS_DETAILS GETbyID CONTROLLER
const getOperator_addressByID = async (req, res) => {
    
    const tbs_operator_id = req.params.tbs_operator_id;

try {
    const query = `
    SELECT 
    tbs_operator_id,
    business_id,
    address,
        state,
        region,
        city,
        country,
        zip_code
    FROM operator_details WHERE tbs_operator_id = $1 ;
    `;
    const result = await pool.query(query, [tbs_operator_id]);

    if (result.rowCount === 0) {
        return res.status(200).json({ message: 'Operator details not found' });
    }
    
    res.status(200).send(result.rows);
} catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).send('Server error');
    }
}

//OPERATOR_BUSINESS_DETAILS GET CONTROLLER
const Operator_business_details = async (req, res) => {

    try {
        const query = `
            SELECT business_id,type_of_constitution,
            business_background,
            msme_type,
            msme_number,
            type_of_service,
            currency_code  FROM operator_details ;
        `;
        
        const result = await pool.query(query);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Operator details not found' });
        }

        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error geting operator-details:', err);
        res.status(500).json({ error: 'Database getion failed' });
    }
}

//OPERATOR_BUSINESS_DETAILS GETbyID CONTROLLER
const Operator_detailsByID = async (req, res) => {

    const id = req.params.tbs_operator_id;

    try {
        const query = `
        SELECT 
        tbs_operator_id,
        business_id,type_of_constitution,
            business_background,
            msme_type,
            msme_number,
            type_of_service,
            currency_code
        FROM operator_details WHERE tbs_operator_id = $1 ;
        `;
        const result = await pool.query(query, [id]);

        if (result.rowCount === 0) {
            return res.status(200).json({ message: 'Operator details not found' });
        }
        
        res.status(200).send(result.rows);
    } catch (err) {
        console.error('Error executing query', err.stack);
        res.status(500).send('Server error');
    }
}

//OPERATOR_GST_DETAILS GET CONTROLLER
const getGST = async (req, res) => {

    try {
        const query = `
            SELECT business_id,
            aggregate_turnover_exceeded, 
                 state_name, 
                 state_code_number, 
                 gstin, 
                 head_office, 
                 upload_gst
            FROM operator_details ;
        `;
        
        const result = await pool.query(query);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Operator details not found' });
        }

        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error geting operator-details:', err);
        res.status(500).json({ error: 'Database getion failed' });
    }
}

//OPERATOR_GST_DETAILS GETbyID CONTROLLER
const getGSTByID = async (req, res) => {

    const id = req.params.tbs_operator_id
    try {
       const query = `
       SELECT 
       tbs_operator_id,
       business_id,
           aggregate_turnover_exceeded, 
                state_name, 
                state_code_number, 
                gstin, 
                head_office, 
                upload_gst
       FROM operator_details WHERE tbs_operator_id = $1 ;
       `;
       const result = await pool.query(query, [id]);

       if (result.rowCount === 0) {
           return res.status(200).json({ message: 'Operator details not found' });
       }
       
       res.status(200).send(result.rows);
   } catch (err) {
       console.error('Error executing query', err.stack);
       res.status(500).send('Server error');
        } 
   }

//OPERATOR_DOCUMENT_DETAILS GET CONTROLLER
const getDoc = async (req, res) => {

    try {
        const query = `
            SELECT tbs_operator_id,
                    aadar_front_doc,
                    aadar_back_doc,
                    pancard_front_doc,
                    pancard_back_doc,
                    msme_doc
            FROM operator_details ;
        `;
        
        const result = await pool.query(query);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Operator details not found' });
        }

        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error geting operator-details:', err);
        res.status(500).json({ error: 'Database geting failed' });
    }
}

//OPERATOR_DOCUMENT_DETAILS GETbyID CONTROLLER
const getDocByID = async (req, res) => {

    const id = req.params.tbs_operator_id
    try {
       const query = `
       SELECT 
       tbs_operator_id,
       aadar_front_doc,
                   aadar_back_doc,
                   pancard_front_doc,
                   pancard_back_doc,
                   msme_doc
       FROM operator_details WHERE tbs_operator_id = $1 ;
       `;
       const result = await pool.query(query, [id]);

       if (result.rowCount === 0) {
           return res.status(200).json({ message: 'Operator details not found' });
       }
       
       res.status(200).send(result.rows);
   } catch (err) {
       console.error('Error executing query', err.stack);
       res.status(500).send('Server error');
        }  
   }

//update all operators details
const putOperator = async (req, res) => {
    const tbs_operator_id = req.params.tbs_operator_id;
const {
        company_name,
        owner_name,
        phone,
        alternate_phone,
        emailid,
        alternate_emailid,
        aadharcard_number,
        pancard_number,
        user_status,
        req_status,
        user_status_id,
        req_status_id
    } = req.body;

    const {
        has_gstin,
        aggregate_turnover_exceeded,
        state_name,
        state_code_number,
        gstin,
        head_office,
        type_of_constitution,
        business_background,
        msme_type,
        msme_number,
        type_of_service,
        currency_code,
        address,
        state,
        region,
        city,
        country,
        zip_code
    } = req.body;

    const upload_gst = req.files['upload_gst'] ? `/operator_files/${req.files['upload_gst'][0].filename}` : null;
    const aadar_front_doc = req.files['aadar_front_doc'] ? `/operator_files/${req.files['aadar_front_doc'][0].filename}` : null;
    const aadar_back_doc = req.files['aadar_back_doc'] ? `/operator_files/${req.files['aadar_back_doc'][0].filename}` : null;
    const pancard_front_doc = req.files['pancard_front_doc'] ? `/operator_files/${req.files['pancard_front_doc'][0].filename}` : null;
    const pancard_back_doc = req.files['pancard_back_doc'] ? `/operator_files/${req.files['pancard_back_doc'][0].filename}` : null;
    const msme_doc = req.files['msme_doc'] ? `/operator_files/${req.files['msme_doc'][0].filename}` : null;

    try {
        await pool.query('BEGIN')

        const updateOperatorsQuery = `
            UPDATE public.operators_tbl 
            SET 
                company_name = $1,
                owner_name = $2,
                phone = $3,
                alternate_phone = $4,
                emailid = $5,
                alternate_emailid = $6,
                aadharcard_number = $7,
                pancard_number = $8,
                user_status = COALESCE($9, user_status),
                req_status = COALESCE($10, req_status),
                user_status_id = COALESCE($11, user_status_id),
                req_status_id = COALESCE($12, req_status_id)
            WHERE tbs_operator_id = $13
            RETURNING *;
        `;
        const operatorsValues = [
            company_name,
            owner_name,
            phone,
            alternate_phone,
            emailid,
            alternate_emailid,
            aadharcard_number,
            pancard_number,
            user_status,
            req_status,
            user_status_id,
            req_status_id,
            tbs_operator_id
        ];
        const operatorsResult = await pool.query(updateOperatorsQuery, operatorsValues);

        if (operatorsResult.rowCount === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ error: 'Operator not found' });
        }

        const updateOperatorDetailsQuery = `
            UPDATE public.operator_details 
            SET 
                has_gstin = COALESCE($1, has_gstin),
                aggregate_turnover_exceeded = COALESCE($2, aggregate_turnover_exceeded),
                state_name = COALESCE($3, state_name),
                state_code_number = COALESCE($4, state_code_number),
                gstin = COALESCE($5, gstin),
                head_office = COALESCE($6, head_office),
                type_of_constitution = COALESCE($7, type_of_constitution),
                business_background = COALESCE($8, business_background),
                msme_type = COALESCE($9, msme_type),
                msme_number = COALESCE($10, msme_number),
                type_of_service = COALESCE($11, type_of_service),
                currency_code = COALESCE($12, currency_code),
                address = COALESCE($13, address),
                state = COALESCE($14, state),
                region = COALESCE($15, region),
                city = COALESCE($16, city),
                country = COALESCE($17, country),
                zip_code = COALESCE($18, zip_code),
                upload_gst = COALESCE($19, upload_gst),
                aadar_front_doc = COALESCE($20, aadar_front_doc),
                aadar_back_doc = COALESCE($21, aadar_back_doc),
                pancard_front_doc = COALESCE($22, pancard_front_doc),
                pancard_back_doc = COALESCE($23, pancard_back_doc),
                msme_doc = COALESCE($24, msme_doc)
            WHERE tbs_operator_id = $25;
        `;
        const operatorDetailsValues = [
            has_gstin === 'true' ? true : has_gstin === 'false' ? false : null,
            aggregate_turnover_exceeded === 'true' ? true : aggregate_turnover_exceeded === 'false' ? false : null,
            state_name,
            state_code_number,
            gstin,
            head_office,
            type_of_constitution,
            business_background,
            msme_type,
            msme_number,
            type_of_service,
            currency_code,
            address,
            state,
            region,
            city,
            country,
            zip_code,
            upload_gst,
            aadar_front_doc,
            aadar_back_doc,
            pancard_front_doc,
            pancard_back_doc,
            msme_doc,
            tbs_operator_id
        ];
        await pool.query(updateOperatorDetailsQuery, operatorDetailsValues);

        await pool.query('COMMIT')

        res.status(200).json({ message: 'Operator and details updated successfully.' });
    } catch (error) {
        await pool.query('ROLLBACK')
        console.error('Error updating operator and details:', error);
        res.status(500).json({ error: 'Error updating operator and details.' });
    }
}

// operator login
const operatorLogin = async (req, res) => {
    const { emailid, phone, password } = req.body;

    try {
        let operator

        if (emailid) {
            const emailResult = await pool.query('SELECT * FROM operators_tbl WHERE emailid = $1', [emailid]);
            operator = emailResult.rows[0]
        }

        if (!operator || phone) {
            const phoneResult = await pool.query('SELECT * FROM operators_tbl WHERE phone = $1', [phone]);
            operator = phoneResult.rows[0]; 
        }

        if (!operator) {
            return res.status(404).json({ error: 'No operator found with provided email/phone' });
        }

        if (operator.password !== password) {
            return res.status(401).json({ error: 'Password incorrect' });
        }

        const operatorId = operator.tbs_operator_id;
        const token = operator.token;

        res.json({ id: operatorId, token : token})

    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}


// Endpoint to handle Excel file upload
const excelImport = async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).send('No file uploaded.');
        }

        // Read the Excel file
        const workbook = xlsx.read(file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(worksheet);

        // Start a transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            for (const row of jsonData) {
                // Insert into pro_emp_personal_details table
                const personalDetailsQuery = `
                    INSERT INTO pro_emp_personal_details (
                        tbs_pro_emp_id, emp_first_name, emp_last_name, phone, email_id, alternate_phone, date_of_birth,
                        gender, blood_group, temp_add, temp_country, temp_state, temp_city, temp_zip_code, perm_add,
                        perm_country, perm_state, perm_city, perm_zip_code, type_name, type_id, password, emp_status,
                        emp_status_id, profile_img, role_type, role_type_id
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 
                    $21, $22, $23, $24, $25, $26, $27, $28)
                `;
                const personalDetailsValues = [
                    row.tbs_pro_emp_id, row.emp_first_name, row.emp_last_name, row.phone, row.email_id, row.alternate_phone,
                    row.date_of_birth, row.gender, row.blood_group, row.temp_add, row.temp_country, row.temp_state, row.temp_city,
                    row.temp_zip_code, row.perm_add, row.perm_country, row.perm_state, row.perm_city, row.perm_zip_code, row.type_name,
                    row.type_id, row.password, row.emp_status, row.emp_status_id, row.profile_img, row.role_type, row.role_type_id
                ];
                await client.query(personalDetailsQuery, personalDetailsValues);

                // Insert into pro_emp_professional_details table
                const professionalDetailsQuery = `
                    INSERT INTO pro_emp_professional_details (
                        tbs_pro_emp_id, joining_date, designation, branch, official_email_id, years_of_experience,
                        department, reporting_manager, aadhar_card_number, aadhar_card_doc, pan_card_number, pan_card_doc,
                        work_experience_certificate, educational_certificate, other_documents, role_type,
                        aadhar_card_file, pancard_file, work_experience_file, education_certificate_file, other_certificate_file
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
                `;
                const professionalDetailsValues = [
                    row.tbs_pro_emp_id, row.joining_date, row.designation, row.branch, row.official_email_id, row.years_of_experience,
                    row.department, row.reporting_manager, row.aadhar_card_number, row.aadhar_card_doc, row.pan_card_number,
                    row.pan_card_doc, row.work_experience_certificate, row.educational_certificate, row.other_documents,
                    row.role_type, row.aadhar_card_file, row.pancard_file, row.work_experience_file, row.education_certificate_file,
                    row.other_certificate_file
                ];
                await client.query(professionalDetailsQuery, professionalDetailsValues);
            }

            await client.query('COMMIT');
            res.status(200).send('Data imported successfully');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error importing data:', error);
        res.status(500).send('Internal server error');
    }
};




module.exports = { postOperator, putOperatorPersonal, deleteOperator, getOperator, Emailvalidation, phoneValidation, searchOperator, operator_details, getOperatorProfileImg, getOperatorProfileImgByid,
    getOperator_address, getOperator_addressByID, Operator_business_details, Operator_detailsByID, getGST, getGSTByID, getDoc, getDocByID, getOperatorByID, putOperator, operatorLogin, putOperatorProfileImg, excelImport }