const pool = require('../config/db')
const jwt = require('jsonwebtoken')
const path = require('path')
const xlsx = require('xlsx')
const fs = require('fs');
const XLSX = require('xlsx');

// operator_personal_details POST CONTROLLER
const postOperator = async (req, res) => {
    const { company_name, owner_name, phone, alternate_phone, emailid, alternate_emailid, aadharcard_number, pancard_number, user_status, req_status, user_status_id, req_status_id } = req.body
    
        const type_name = 'OPERATOR'
        const type_id = 'OP101'

        
       const profileimg = req.file ? `/operator_files/${req.file.filename}` : null;
    
        try {
            const result = await pool.query(
                `INSERT INTO operators_tbl 
                 (company_name, owner_name, phone, alternate_phone, emailid, alternate_emailid, aadharcard_number, pancard_number, user_status, req_status, user_status_id, req_status_id, type_name, type_id, profileimg)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING tbs_operator_id`,
                [company_name, owner_name, phone, alternate_phone, emailid, alternate_emailid, aadharcard_number, pancard_number, user_status, req_status, user_status_id, req_status_id, type_name, type_id, profileimg]
            );
            
            const tbs_operator_id = result.rows[0].tbs_operator_id;
    
            const password = `OP@${tbs_operator_id}`;
    
            await pool.query(
                `UPDATE operators_tbl SET password = $1 WHERE tbs_operator_id = $2`,
                [password, tbs_operator_id]
            )
    
            res.status(201).json({
                message: 'Operator Created Successfully',
                id: tbs_operator_id,
                password: password,
                type_name: type_name,
                type_id: type_id
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

        const profileimg = req.file ? `/operator_files/${req.file.filename}` : null;

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
            req_status_id = COALESCE($12, req_status_id),
            profileimg = COALESCE($13, profileimg)
        WHERE tbs_operator_id = $14
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
        profileimg,
        tbs_operator_id ];
    const operatorsResult = await pool.query(updateOperatorsQuery, operatorsValues)
    res.status(200).json({ message: 'Operator and details updated successfully.' });
    } catch (error) {
        console.error('Error updating operator and details:', error);
        res.status(500).json({ error: 'Error updating operator and details.' });
    }
}

// operator_personal_details DELETE CONTROLLER
const deleteOperator = async (req, res) => {
    const client = await pool.connect();
    try {
        const operatorId = req.params.tbs_operator_id;

        // Fetch operator details from both tables
        const operatorQuery = 'SELECT * FROM operators_tbl WHERE tbs_operator_id = $1';
        const operatorResult = await client.query(operatorQuery, [operatorId]);

        if (operatorResult.rows.length === 0) {
            return res.status(201).send(`Operator with ID ${operatorId} not found`);
        }

        const operator = operatorResult.rows[0];

        const operatorDetailsQuery = 'SELECT * FROM operator_details WHERE tbs_operator_id = $1';
        const operatorDetailsResult = await client.query(operatorDetailsQuery, [operatorId]);

        const operatorDetails = operatorDetailsResult.rows[0];

        // Combine data from both tables
        const deletedData = {
            operator,
            operatorDetails
        };

        // Insert the combined data into recycle_bin
        const recycleInsertQuery = 'INSERT INTO recycle_bin (module_name, module_id, deleted_data, module_get_id) VALUES ($1, $2, $3, $4) RETURNING tbs_recycle_id';
        await client.query(recycleInsertQuery, ['operator', operatorId, JSON.stringify(deletedData), 5]);

        // Delete from both tables
        await client.query('DELETE FROM operator_details WHERE tbs_operator_id = $1', [operatorId]);
        await client.query('DELETE FROM operators_tbl WHERE tbs_operator_id = $1', [operatorId]);

        res.status(200).send(`Operator deleted successfully and stored in recycle_bin.`);
    } catch (error) {
        console.error('Error deleting operator:', error);
        res.status(500).send('Error deleting operator');
    } finally {
        client.release();
    }
};


// operator_personal_details GET CONTROLLER
const getOperator = async (req, res) => {
    try {
        const query = `SELECT tbs_operator_id, company_name,
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
            return res.status(201).json({ error: 'No operators found' });
        }

        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database query failed' });
    }
}

// operator_personal_details GETbyID CONTROLLER
const getOperatorByID = async (req, res) => {
    try{
        const id = req.params.tbs_operator_id;
        const getOperatorByID = `SELECT * FROM operators_tbl WHERE tbs_operator_id = $1`;
        const result = await pool.query(getOperatorByID,[id]);
        res.status(200).send(result.rows);
    } catch(err) {
        console.log(err.message);
        res.status(500).send("Error getting records");
    }
};


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
    const searchTerm = req.params.search_term ? req.params.search_term.toLowerCase() : ''
    
    console.log(searchTerm)

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

            return res.status(200).json(rows);
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
        type_of_constitution, business_background, msme_type, msme_number, type_of_service, currency_code,
        address, state, region, city, country, zip_code, state_id, country_id, city_id,
        has_gstin, aggregate_turnover_exceeded, state_name, state_code_number, gstin, head_office, user_status, user_status_id, req_status, req_status_id
    } = req.body;

    // File uploads
    const upload_gst = req.files && req.files['upload_gst'] ? `/operator_files/${req.files['upload_gst'][0].filename}` : null;
    const aadar_front_doc = req.files && req.files['aadar_front_doc'] ? `/operator_files/${req.files['aadar_front_doc'][0].filename}` : null;
    const aadar_back_doc = req.files && req.files['aadar_back_doc'] ? `/operator_files/${req.files['aadar_back_doc'][0].filename}` : null;
    const pancard_front_doc = req.files && req.files['pancard_front_doc'] ? `/operator_files/${req.files['pancard_front_doc'][0].filename}` : null;
    const pancard_back_doc = req.files && req.files['pancard_back_doc'] ? `/operator_files/${req.files['pancard_back_doc'][0].filename}` : null;
    const msme_docs = req.files && req.files['msme_docs'] ? `/operator_files/${req.files['msme_docs'][0].filename}` : null;

    const aadarFrontFile = req.files && req.files['aadar_front_doc'] ? {
        type: req.files['aadar_front_doc'][0].mimetype,
        filename: req.files['aadar_front_doc'][0].filename,
        path: req.files['aadar_front_doc'][0].path,
        size: req.files['aadar_front_doc'][0].size,
        created_date: new Date().toISOString()
    } : null;

    const aadarBackFile = req.files && req.files['aadar_back_doc'] ? {
        type: req.files['aadar_back_doc'][0].mimetype,
        filename: req.files['aadar_back_doc'][0].filename,
        path: req.files['aadar_back_doc'][0].path,
        size: req.files['aadar_back_doc'][0].size,
        created_date: new Date().toISOString()
    } : null;

    const pancardFrontFile = req.files && req.files['pancard_front_doc'] ? {
        type: req.files['pancard_front_doc'][0].mimetype,
        filename: req.files['pancard_front_doc'][0].filename,
        path: req.files['pancard_front_doc'][0].path,
        size: req.files['pancard_front_doc'][0].size,
        created_date: new Date().toISOString()
    } : null;

    const pancardBackFile = req.files && req.files['pancard_back_doc'] ? {
        type: req.files['pancard_back_doc'][0].mimetype,
        filename: req.files['pancard_back_doc'][0].filename,
        path: req.files['pancard_back_doc'][0].path,
        size: req.files['pancard_back_doc'][0].size,
        created_date: new Date().toISOString()
    } : null;

    const msmeDocFile = req.files && req.files['msme_docs'] ? {
        type: req.files['msme_docs'][0].mimetype,
        filename: req.files['msme_docs'][0].filename,
        path: req.files['msme_docs'][0].path,
        size: req.files['msme_docs'][0].size,
        created_date: new Date().toISOString()
    } : null;

    try {
        await pool.query('BEGIN');

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

        // Update address details
        if (address || state || region || city || country || zip_code || state_id || country_id || city_id) {
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
                    country_id = COALESCE($9, country_id),
                    city_id = COALESCE($10, city_id)
                WHERE
                    tbs_operator_id = $1
            `;
            await pool.query(addressUpdateQuery, [
                tbs_operator_id, address, state, region, city, country, zip_code, state_id, country_id, city_id
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
        }

        // Update document details
        if (aadar_front_doc || aadar_back_doc || pancard_front_doc || pancard_back_doc || aadarFrontFile || aadarBackFile || pancardFrontFile || pancardBackFile) {
            const documentUpdateQuery = `
                UPDATE operator_details
                SET
                    aadar_front_doc = COALESCE($2, aadar_front_doc),
                    aadar_back_doc = COALESCE($3, aadar_back_doc),
                    pancard_front_doc = COALESCE($4, pancard_front_doc),
                    pancard_back_doc = COALESCE($5, pancard_back_doc),
                    msme_docs = COALESCE($6, msme_docs),
                    aadar_front_file = COALESCE($7, aadar_front_file),
                    aadar_back_file = COALESCE($8, aadar_back_file),
                    pancard_front_file = COALESCE($9, pancard_front_file),
                    pancard_back_file = COALESCE($10, pancard_back_file),
                    msme_docs_file = COALESCE($11, msme_docs_file)
                WHERE
                    tbs_operator_id = $1
            `;
        
            await pool.query(documentUpdateQuery, [
                tbs_operator_id, 
                aadar_front_doc, 
                aadar_back_doc, 
                pancard_front_doc, 
                pancard_back_doc, 
                msme_docs,
                aadarFrontFile, 
                aadarBackFile, 
                pancardFrontFile, 
                pancardBackFile,
                msmeDocFile
            ]);
            console.log(msme_docs);
        }

        if (user_status || user_status_id || req_status || req_status_id) {
            const statusUpdateQuery = `
                UPDATE operators_tbl
                SET
                    user_status = COALESCE($2, user_status),
                    user_status_id = COALESCE($3, user_status_id),
                    req_status = COALESCE($4, req_status),
                    req_status_id = COALESCE($5, req_status_id)
                WHERE
                    tbs_operator_id = $1
            `;
            await pool.query(statusUpdateQuery, [
                tbs_operator_id,
                user_status,
                user_status_id,
                req_status,
                req_status_id
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
            return res.status(201).json({ error: 'Operator details not found' });
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
            return res.status(201).json({ error: 'Operator details not found' });
        }

        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error geting operator-details:', err);
        res.status(500).json({ error: 'Database getion failed' });
    }
}

//OPERATOR_BUSINESS_DETAILS GETbyID CONTROLLER
const Operator_detailsByID = async (req, res) => {
    try {
      const id = req.params.tbs_operator_id
      const { rows } = await pool.query(`SELECT 
      tbs_operator_id,
      business_id,type_of_constitution,
          business_background,
          msme_type,
          msme_number,
          type_of_service,
          currency_code
      FROM operator_details WHERE tbs_operator_id = $1`, [id]);
      res.json(rows);
    } catch (err) {
      console.error('Error executing query', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

//OPERATOR_GST_DETAILS GET CONTROLLER
const getGST = async (req, res) => {

    try {
        const query = `
        SELECT
        ot.user_status,
        ot.user_status_id,
        ot.req_status,
        ot.req_status_id,
        od.business_id,
        od.aggregate_turnover_exceeded, 
        od.state_name, 
        od.state_code_number, 
        od.gstin, 
        od.head_office, 
        od.upload_gst
    FROM 
        operators_tbl AS ot
    LEFT JOIN 
        operator_details AS od
    ON 
        ot.tbs_operator_id = od.tbs_operator_id   `;
        
        const result = await pool.query(query);

        if (result.rowCount === 0) {
            return res.status(201).json({ error: 'Operator details not found' });
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
    ot.user_status,
    ot.user_status_id,
    ot.req_status,
    ot.req_status_id,
    od.business_id,
    od.aggregate_turnover_exceeded, 
    od.state_name, 
    od.state_code_number, 
    od.gstin, 
    od.head_office, 
    od.upload_gst
FROM 
    operators_tbl AS ot
LEFT JOIN 
    operator_details AS od
ON 
    ot.tbs_operator_id = od.tbs_operator_id
   WHERE 
       ot.tbs_operator_id = $1 ; `;
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
                        SELECT 
                        od.tbs_operator_id,
                        od.aadar_front_doc,
                        od.aadar_front_file,
                        od.aadar_back_doc,
                        od.aadar_back_file,
                        od.pancard_front_doc,
                        od.pancard_front_file,
                        od.pancard_back_doc,
                        od.pancard_back_file,
                        od.msme_docs,
                        od.msme_docs_file,
                        ot.owner_name,
                        ot.company_name
                    FROM 
                        operator_details od
                    LEFT JOIN 
                        operators_tbl ot ON od.tbs_operator_id = ot.tbs_operator_id; `;
        
        const result = await pool.query(query);

        if (result.rowCount === 0) {
            return res.status(201).json({ error: 'Operator details not found' });
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
                                aadar_front_file,
                                aadar_back_doc,
                                aadar_back_file,
                                pancard_front_doc,
                                pancard_front_file,
                                pancard_back_doc,
                                pancard_back_file,
                                msme_docs, msme_docs_file
                            FROM 
                                operator_details 
                            WHERE 
                                tbs_operator_id = $1; `;
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
    const msme_docs = req.files['msme_docs'] ? `/operator_files/${req.files['msme_docs'][0].filename}` : null;
  
    try {
      await pool.query('BEGIN');
  
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
        return res.status(201).json({ error: 'Operator not found' });
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
          msme_docs = COALESCE($24, msme_docs)
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
        msme_docs,
        tbs_operator_id
      ];
      await pool.query(updateOperatorDetailsQuery, operatorDetailsValues);
  
      // Insert notification
      await pool.query(
        `INSERT INTO notification_tbl (table_name, action_type, record_id, message, read) VALUES ($1, $2, $3, $4, $5)`,
        [
          'operators_tbl',
          'UPDATE',
          tbs_operator_id,
          `Operator with ID ${tbs_operator_id} was successfully updated.`,
          false
        ]
      );
  
      await pool.query('COMMIT');
  
      res.status(200).json({ message: 'Operator and details updated successfully.' });
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error('Error updating operator and details:', error);
      res.status(500).json({ error: 'Error updating operator and details.' });
    }
  }
  
// operator login
const operatorLogin = async (req, res) => {
    const { emailid, phone, password } = req.body;

    try {
        let operator;

        if (emailid) {
            const emailResult = await pool.query('SELECT * FROM operators_tbl WHERE emailid = $1', 
            
            [emailid])
            
            operator = emailResult.rows[0];
        }

        if (!operator || phone) {

            const phoneResult = await pool.query('SELECT * FROM operators_tbl WHERE phone = $1', 

            [phone])

            operator = phoneResult.rows[0];
        }

        if (!operator) {

            return res.status(201).json({ error: 'No operator found with provided email/phone' });
        }

        if (operator.password !== password) {

            return res.status(401).json({ error: 'Password incorrect' });
        }

        const operatorId = operator.tbs_operator_id;
        const companyName = operator.company_name;
        const ownerName = operator.owner_name;
        const typeName = operator.type_name;
        const typeId = operator.type_id;

        const workbook = XLSX.utils.book_new();
        const worksheetData = [
            ['Email ID', 'Phone Number'],
            [operator.emailid, operator.phone]
        ];
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Operator Details')

        const safeOwnerName = String(ownerName).replace(/[^a-zA-Z0-9]/g, '_')

        const fileName = `${safeOwnerName}_Login_details.xlsx`

        const filePath = path.join(__dirname, '..', 'operatorslogin_excels', fileName);

        XLSX.writeFile(workbook, filePath);

        const token = jwt.sign({ operatorId }, process.env.JWT_SECRET_KEY, { expiresIn: '1w' });

        res.json({
            id: operatorId,
            company_name: companyName,
            owner_name: ownerName,
            type_name: typeName,
            type_id: typeId,
            token: token,
            excelFilePath: filePath 
        })

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

//get only profilr_img CONTROLLER
const getImg = async (req, res) => {

    try {
        const query = `
            SELECT tbs_operator_id,
            profileimg
            FROM operators_tbl ;
        `;
        
        const result = await pool.query(query);

        if (result.rowCount === 0) {
            return res.status(201).json({ error: 'Operator profile_img not found' });
        }

        res.status(200).json(result.rows)

    } catch (err) {
        console.error('Error geting operator-profile_img:', err);
        res.status(500).json({ error: 'Database getion failed' });
    }
}

//only img GETbyID CONTROLLER
const getImgByID = async (req, res) => {

    const id = req.params.tbs_operator_id
    try {
       const query = `
       SELECT 
       tbs_operator_id,
       profileimg
       FROM operators_tbl WHERE tbs_operator_id = $1 ;
       `;
       const result = await pool.query(query, [id]);

       if (result.rowCount === 0) {
           return res.status(200).json({ message: 'Operator profile_img not found' });
       }
       
       res.status(200).send(result.rows);
   } catch (err) {
       console.error('Error executing query', err.stack);
       res.status(500).send('Server error');
        } 
   }

//excel uploading
const ImportExcel = async (req, res) => {
    if (!req.file || !req.file.path) {
        return res.status(400).send('No file uploaded.');
    }

    try {
        const workbook = xlsx.readFile(req.file.path);
        const sheet_name_list = workbook.SheetNames;
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);

        const requiredColumns = [
            'company_name', 'owner_name', 'phone', 'alternate_phone', 'emailid', 'alternate_emailid',
            'aadharcard_number', 'pancard_number', 'created_date', 'user_status', 'req_status',
            'user_status_id', 'req_status_id', 'type_of_constitution', 'business_background', 
            'msme_type', 'msme_number', 'type_of_service', 'currency_code', 'address', 'state', 
            'region', 'city', 'country', 'zip_code', 'has_gstin', 'aggregate_turnover_exceeded', 
            'state_name', 'state_code_number', 'gstin', 'head_office', 'state_id', 'country_id', 'city_id'
        ];

        const validateRow = (row) => {
            for (const col of requiredColumns) {
                if (!Object.keys(row).includes(col) || row[col] === undefined || row[col] === null) {
                    return false;
                }
            }
            return true;
        };

        function excelSerialToDate(serial) {
            const excelEpoch = moment('1899-12-30');
            return excelEpoch.add(serial, 'days').format('YYYY-MM-DD');
        }

        for (const row of data) {
            if (!validateRow(row)) {
                return res.status(400).send(`Row with missing or invalid data: ${JSON.stringify(row)}`);
            }

            if (!isNaN(row.created_date)) {
                row.created_date = excelSerialToDate(row.created_date);
            }

            const {
                company_name, owner_name, phone, alternate_phone, emailid, alternate_emailid,
                aadharcard_number, pancard_number, created_date, user_status, req_status,
                user_status_id, req_status_id, type_of_constitution, business_background, msme_type, msme_number, type_of_service, currency_code, address, state, region, city, country, zip_code, has_gstin, aggregate_turnover_exceeded, state_name, state_code_number, gstin,
                head_office, state_id, country_id, city_id
            } = row;

            const operatorResult = await pool.query(
                `INSERT INTO operators_tbl (
                    company_name, owner_name, phone, alternate_phone, emailid, alternate_emailid,
                    aadharcard_number, pancard_number, created_date, user_status, req_status,
                    user_status_id, req_status_id, type_name, type_id, password
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                RETURNING tbs_operator_id`,
                [company_name, owner_name, phone, alternate_phone, emailid, alternate_emailid,
                aadharcard_number, pancard_number, created_date, user_status, req_status,
                user_status_id, req_status_id, 'OPERATOR', 'OP101', ''] 
            );

            const tbs_operator_id = operatorResult.rows[0].tbs_operator_id;

            const password = `OP@${tbs_operator_id}`;

            await pool.query(
                `UPDATE operators_tbl
                SET password = $1
                WHERE tbs_operator_id = $2`,
                [password, tbs_operator_id]
            );

            await pool.query(
                `UPDATE operator_details
                SET
                    type_of_constitution = $2,
                    business_background = $3,
                    msme_type = $4,
                    msme_number = $5,
                    type_of_service = $6,
                    currency_code = $7,
                    address = $8,
                    state = $9,
                    region = $10,
                    city = $11,
                    country = $12,
                    zip_code = $13,
                    has_gstin = $14,
                    aggregate_turnover_exceeded = $15,
                    state_name = $16,
                    state_code_number = $17,
                    gstin = $18,
                    head_office = $19,
                    state_id = $20,
                    country_id = $21,
                    city_id = $22
                WHERE tbs_operator_id = $1;
                `,
                [tbs_operator_id, type_of_constitution, business_background, msme_type, msme_number,
                type_of_service, currency_code, address, state, region, city, country, zip_code,
                has_gstin, aggregate_turnover_exceeded, state_name, state_code_number, gstin,
                head_office, state_id, country_id, city_id]
            );
        }

        res.send('File processed and data uploaded successfully');
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).send('Error uploading file');
    }
}

//get only profilr_img CONTROLLER
const getEmail = async (req, res) => {

    try {
        const query = `
                    SELECT 
                            tbs_operator_id,
                            emailid, password
                    FROM 
                            operators_tbl
                    WHERE 
                            user_status_id = 1;`;
        
        const result = await pool.query(query);

        if (result.rowCount === 0) {
            return res.status(201).json({ error: 'Operator profile_img not found' });
        }

        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error geting operator-profile_img:', err);
        res.status(500).json({ error: 'Database getion failed' });
    }
}

//only img GETbyID CONTROLLER
const getEmailByID = async (req, res) => {

    const id = req.params.tbs_operator_id
    try {
       const query = `
       SELECT 
       tbs_operator_id,
       emailid, password
       FROM operators_tbl WHERE tbs_operator_id = $1 ;
       `;
       const result = await pool.query(query, [id]);

       if (result.rowCount === 0) {
           return res.status(200).json({ message: 'Operator profile_img not found' });
       }
       
       res.status(200).send(result.rows);
        } catch (err) {
        console.error('Error executing query', err.stack);
        res.status(500).send('Server error')
        } 
   }

module.exports = { postOperator, putOperatorPersonal, deleteOperator, getOperator, Emailvalidation, phoneValidation, searchOperator, operator_details, getOperator_address, getOperator_addressByID, Operator_business_details, Operator_detailsByID, getGST, getGSTByID, getDoc, getDocByID, getOperatorByID, putOperator, operatorLogin, getImg, getImgByID, ImportExcel, getEmail, getEmailByID }