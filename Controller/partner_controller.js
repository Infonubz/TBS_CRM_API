const pool = require('../config/db')
const jwt = require('jsonwebtoken')
const xlsx = require('xlsx');
const moment = require('moment');

// partner details POST CONTROLLER
const createPartner = async (req, res) => {
  const {
    partner_first_name,
    partner_last_name,
    phone,
    emailid,
    alternate_phone,
    date_of_birth,
    gender,
    occupation, occupation_id
  } = req.body

  if (!partner_first_name ||
    !partner_last_name ||
    !phone ||
    !emailid ||
    !alternate_phone ||
    !date_of_birth ||
    !gender || !occupation || !occupation_id) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

    const type_name = 'PARTNER'
    const type_id = 'PART101'
    const partnerStatus = 'Draft';
    const partnerStatusId = 0;
    const reqStatus = null;
    const reqStatusId = null;

    const profile_img = req.file ? `/partner_files/${req.file.filename}` : null;

  try {
    const result = await pool.query(
      `INSERT INTO partner_details (
          partner_first_name, 
          partner_last_name, 
          phone, 
          emailid, 
          alternate_phone, 
          date_of_birth, 
          gender, 
          type_name, 
          type_id, 
          partner_status,
          partner_status_id, 
          req_status,       
          req_status_id,
          profile_img, occupation, occupation_id     
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) 
        RETURNING tbs_partner_id`,
      [
        partner_first_name,
        partner_last_name,
        phone,
        emailid,
        alternate_phone,
        date_of_birth,
        gender,
        type_name,
        type_id,
        partnerStatus, partnerStatusId, reqStatus, reqStatusId, profile_img, occupation, occupation_id
      ]
    )

    const tbs_partner_id = result.rows[0].tbs_partner_id

    console.log(`New Partner created with ID: ${tbs_partner_id}`)

    const password = `PAT@${tbs_partner_id}`
    await pool.query(
      `UPDATE partner_details SET password = $1 WHERE tbs_partner_id = $2`,
      [password, tbs_partner_id]
    )

    res.status(201).json({
      message: 'Partner Created Successfully',
      id: tbs_partner_id,
      password: password,
      type_name: type_name,
      type_id: type_id
    })
  } catch (err) {
    console.error('Error inserting into database:', err)
    res.status(200).json({ error: 'Database insertion failed' })
  }
}

  // partner details PUT CONTROLLER
  const updatePartner = async (req, res) => {
    const id  = req.params.tbs_partner_id
    const profile_img = req.file ? `/partner_files/${req.file.filename}` : null;
    const { partner_first_name, partner_last_name, phone, emailid, alternate_phone, date_of_birth, gender, occupation, occupation_id } = req.body
    try {
      const result = await pool.query(
        `
        UPDATE partner_details 
            SET 
                partner_first_name = COALESCE($1, partner_first_name),
                partner_last_name = COALESCE($2, partner_last_name),
                phone = COALESCE($3, phone),
                emailid = COALESCE($4, emailid),
                alternate_phone = COALESCE($5, alternate_phone),
                date_of_birth = COALESCE($6, date_of_birth),
                gender = COALESCE($7, gender),
                profile_img = COALESCE($8, profile_img),
                occupation = COALESCE($9, occupation),
                occupation_id = COALESCE($10, occupation_id)
            WHERE 
                tbs_partner_id = $11 
            RETURNING *
                        `,
    [partner_first_name, partner_last_name, phone, emailid, alternate_phone, date_of_birth, gender, profile_img, occupation, occupation_id, id]
      )
      if (result.rows.length === 0) {
        return res.status(201).json({ error: 'Record not found' })
      }
      res.status(200).json(`Partner Personal Details are Updated Successfully`)
    } catch (err) {
      res.status(200).json({ error: err.message })
    }
  }

  //UPDATE PROFILE IMAGE
  const updatePartnerStatus = async (req, res) => {
    const id  = req.params.tbs_partner_id
  const { partner_status, partner_status_id } = req.body
    try {
      const result = await pool.query(
        `
        UPDATE partner_details 
            SET 
                partner_status = COALESCE($1, partner_status),
                partner_status_id = COALESCE($2, partner_status_id)
            WHERE 
                tbs_partner_id = $3
        RETURNING *`,
    [partner_status, partner_status_id, id]
      )
      if (result.rows.length === 0) {
        return res.status(201).json({ error: 'Record not found' })
      }
      res.status(200).json(`Partner status Updated Successfully`)
    } catch (err) {
      res.status(200).json({ error: err.message })
    }
  }

//GET PROFILES BY ID
  const GetPartnerProfileById = async (req, res) => {
    const id  = req.params.tbs_partner_id
    try {
      const result = await pool.query(
        `
        SELECT profile_img FROM partner_details 
            WHERE 
                tbs_partner_id = $1`,[id]
      )
      if (result.rows.length === 0) {
        return res.status(201).json({ error: 'Record not found' })
      }
      res.status(200).json(result.rows[0])
    } catch (err) {
      res.status(200).json({ error: err.message })
    }
  }

//GET ALL PROFILES
  const GetAllPartnerProfile = async (req, res) => {
    try {
      const result = await pool.query(
        `
        SELECT profile_img FROM partner_details ;`
      )
      if (result.rows.length === 0) {
        return res.status(201).json({ error: 'Record not found' })
      }
      res.status(200).json(result.rows)
    } catch (err) {
      res.status(200).json({ error: err.message })
    }
  }

  // partner details DELETE CONTROLLER
const deletePartner = async (req, res) => {
    const client = await pool.connect();
    try {
        const tbs_partner_id = req.params.tbs_partner_id;

        const partnerQuery = 'SELECT * FROM partner_details WHERE tbs_partner_id = $1';
        const partnerResult = await client.query(partnerQuery, [tbs_partner_id]);
        
        if (partnerResult.rows.length === 0) {
            return res.status(201).send(`Partner with ID ${tbs_partner_id} not found`);
        }

        const partnerDetails = partnerResult.rows[0];

        const partnerDocumentsQuery = 'SELECT * FROM partner_documents WHERE tbs_partner_id = $1';
        const partnerDocumentsResult = await client.query(partnerDocumentsQuery, [tbs_partner_id]);

        const deletedData = {
            partnerDetails,
            partnerDocuments: partnerDocumentsResult.rows 
        };

        const recycleInsertQuery = 'INSERT INTO recycle_bin (module_name, module_id, deleted_data, module_get_id) VALUES ($1, $2, $3, $4) RETURNING tbs_recycle_id';
        await client.query(recycleInsertQuery, ['partner', tbs_partner_id, JSON.stringify(deletedData), 9]);

        await client.query('DELETE FROM partner_documents WHERE tbs_partner_id = $1', [tbs_partner_id]);
        await client.query('DELETE FROM partner_details WHERE tbs_partner_id = $1', [tbs_partner_id]);

        res.status(200).send(`Partner deleted successfully with ID: ${tbs_partner_id}`);
    } catch (error) {
        console.error('Error deleting partner:', error);
        res.status(500).send('Error deleting partner');
    } finally {
        client.release();
    }
}

// partner details GET CONTROLLER
const getPartner = async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM partner_details')
      if (result.rows.length === 0) {
        return res.status(201).json({ error: 'Record not found' })
      }
      res.status(200).json(result.rows)
    } catch (err) {
      res.status(200).json({ error: err.message })
    }
  }

// partner details GETbyID CONTROLLER
const getPartnerByID = async (req, res) => {
    const  id = req.params.tbs_partner_id
    console.log(id)
    try {
      const result = await pool.query('SELECT * FROM partner_details WHERE tbs_partner_id = $1', [id])
      if (result.rows.length === 0) {
        return res.status(201).json({ error: 'Record not found' })
      }
      res.status(200).json(result.rows[0])
    } catch (err) {
      res.status(200).json({ error: err.message })
    }
  }
  
  // partner details email-validation CONTROLLER
  const Emailval = async (req, res) => {
    const{ emailid } = req.body
try {
    const emailResult = await pool.query(`SELECT * FROM partner_details WHERE emailid = $1`, [emailid])

    emailExists = emailResult.rows.length > 0

    res.json({Email : emailExists})

} catch (error) {
    res.status(200).json({ error: error.message})
}
}

// partner details phone-validation CONTROLLER
  const phoneVal = async (req, res) => {
    const{ phone } = req.body
try {
    const phoneResult = await pool.query(`SELECT * FROM partner_details WHERE phone = $1`, [phone])

    phoneExists = phoneResult.rows.length > 0

    res.json({Phone: phoneExists})

} catch (error) {
    res.status(200).json({ error: error.message})
}
}

// partner documents POST CONTROLLER
const AddPartnerDoc = async (req, res) => {
    const { tbs_partner_id } = req.params
    const { aadhar_card_number, pan_card_number } = req.body

    if( !aadhar_card_number || !pan_card_number){
        return res.status(400).json({ error: 'Missing required fields' })
    }

    const aadhar_front_file = req.files && req.files['aadhar_card_front'] ? {
      type: req.files['aadhar_card_front'][0].mimetype,
      filename: req.files['aadhar_card_front'][0].filename,
      path: req.files['aadhar_card_front'][0].path,
      size: req.files['aadhar_card_front'][0].size,
      created_date: new Date().toISOString()
  } : null
  
  const pancard_front_file = req.files && req.files['pan_card_front'] ? {
      type: req.files['pan_card_front'][0].mimetype,
      filename: req.files['pan_card_front'][0].filename,
      path: req.files['pan_card_front'][0].path,
      size: req.files['pan_card_front'][0].size,
      created_date: new Date().toISOString()
  } : null
  
  const pancard_back_file =req.files && req.files['pan_card_back'] ? {
      type: req.files['pan_card_back'][0].mimetype,
      filename: req.files['pan_card_back'][0].filename,
      path: req.files['pan_card_back'][0].path,
      size: req.files['pan_card_back'][0].size,
      created_date: new Date().toISOString()
  } : null
  
  const aadhar_back_file = req.files && req.files['aadhar_card_back'] ? {
      type: req.files['aadhar_card_back'][0].mimetype,
      filename: req.files['aadhar_card_back'][0].filename,
      path: req.files['aadhar_card_back'][0].path,
      size: req.files['aadhar_card_back'][0].size,
      created_date: new Date().toISOString()
  } : null
  
    
    const aadhar_card_front = req.files && req.files['aadhar_card_front'] ? `/partner_files/${req.files['aadhar_card_front'][0].filename}` : null
    const pan_card_front = req.files && req.files['pan_card_front'] ? `/partner_files/${req.files['pan_card_front'][0].filename}` : null
    const pan_card_back = req.files && req.files['pan_card_back'] ? `/partner_files/${req.files['pan_card_back'][0].filename}` : null
    const aadhar_card_back = req.files && req.files['aadhar_card_back'] ? `/partner_files/${req.files['aadhar_card_back'][0].filename}` : null

    try {
      await pool.query('BEGIN')

      const updateDocumentsQuery = `
      UPDATE partner_documents
      SET 
          aadhar_card_number = COALESCE($1, aadhar_card_number),
          aadhar_card_front = COALESCE($2, aadhar_card_front),
          pan_card_number = COALESCE($3, pan_card_number),
          pan_card_front = COALESCE($4, pan_card_front),
          pan_card_back = COALESCE($5, pan_card_back),
          aadhar_card_back = COALESCE($6, aadhar_card_back),
          aadhar_front_file = COALESCE($7, aadhar_front_file),
          pancard_front_file = COALESCE($8, pancard_front_file),
          pancard_back_file = COALESCE($9, pancard_back_file),
          aadhar_back_file = COALESCE($10, aadhar_back_file),
          updated_date = now()
      WHERE tbs_partner_id = $11
      RETURNING *;      
      `;
      const updateDocumentsValues = [
          aadhar_card_number, aadhar_card_front, pan_card_number, pan_card_front,
          pan_card_back, aadhar_card_back, aadhar_front_file, pancard_front_file,
          pancard_back_file, aadhar_back_file, tbs_partner_id
      ];

      await pool.query(updateDocumentsQuery, updateDocumentsValues);

      const updateDetailsQuery = `
          UPDATE partner_details
          SET
              req_status = 'Pending',
              req_status_id = 1,
              partner_status = 'Posted', partner_status_id = 1
          WHERE tbs_partner_id = $1
      `;
      await pool.query(updateDetailsQuery, [tbs_partner_id]);

      await pool.query('COMMIT');

      res.status(200).json('Partner documents are uploaded successfully');
  } catch (error) {
     
      await pool.query('ROLLBACK');
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
}

// partner documents GET CONTROLLER
const FetchAllDocuments = async (req, res) => {
    const query = `SELECT 
                      pd.tbs_partner_id,
                      pd.aadhar_card_number,
                      pd.aadhar_card_front,
                      pd.aadhar_card_back,
                      pd.pan_card_number,
                      pd.pan_card_front,
                      pd.pan_card_back,
                      pdt.partner_first_name,
                      pdt.partner_last_name
                  FROM 
                      partner_documents pd
                  LEFT JOIN 
                      partner_details pdt ON pd.tbs_partner_id = pdt.tbs_partner_id;`

    try {
        const result = await pool.query(query)
        res.status(200).json(result.rows)
    } catch (error) {
        console.error('Error:', error)
        res.status(200).json({ error: 'Internal server error' })
    }
}

// partner documents GETByID CONTROLLER
const FetchDocumentByID = async (req, res) => {
    const tbs_partner_id  = req.params.tbs_partner_id

    const query = `SELECT 
                      pd.tbs_partner_id, 
                      pd.aadhar_card_number, 
                      pd.aadhar_card_front,
                      pd.aadhar_card_back,
                      pd.pan_card_number, 
                      pd.pan_card_front, 
                      pd.pan_card_back,
                      pdt.partner_first_name,
                      pdt.partner_last_name
                  FROM 
                      partner_documents pd
                  LEFT JOIN 
                      partner_details pdt ON pd.tbs_partner_id = pdt.tbs_partner_id
                  WHERE 
                      pd.tbs_partner_id = $1;`

    try {
        const result = await pool.query(query, [tbs_partner_id])
        if (result.rows.length === 0) {
            return res.status(201).json({ error: 'Partner is not found' })
        }
        res.status(200).json(result.rows[0])
    } catch (error) {
        console.error('Error:', error)
        res.status(200).json({ error: 'Internal server error' })
    }
}

// partner documents GET CONTROLLER
const FetchAllDocumentDetails = async (req, res) => {
  const query = `SELECT 
                    pd.tbs_partner_id,
                    pd.aadhar_card_number,
                    pd.aadhar_card_front,
                    pd.aadhar_front_file,
                    pd.aadhar_card_back,
                    pd.aadhar_back_file,
                    pd.pan_card_number,
                    pd.pan_card_front,
                    pd.pancard_front_file,
                    pd.pan_card_back,
                    pd.pancard_back_file,
                    pdt.partner_first_name,
                    pdt.partner_last_name
                  FROM 
                    partner_documents pd
                  LEFT JOIN 
                    partner_details pdt ON pd.tbs_partner_id = pdt.tbs_partner_id;`

  try {
      const result = await pool.query(query)
      res.status(200).json(result.rows)
  } catch (error) {
      console.error('Error:', error)
      res.status(200).json({ error: 'Internal server error' })
  }
}

// partner documents GETByID CONTROLLER
const FetchDocumentDetailsByID = async (req, res) => {
  const tbs_partner_id  = req.params.tbs_partner_id

  const query = `SELECT 
                    pd.tbs_partner_id, 
                    pd.aadhar_card_number, 
                    pd.aadhar_card_front, 
                    pd.aadhar_front_file,
                    pd.aadhar_card_back, 
                    pd.aadhar_back_file,
                    pd.pan_card_number, 
                    pd.pan_card_front, 
                    pd.pancard_front_file, 
                    pd.pan_card_back, 
                    pd.pancard_back_file,
                    pdt.partner_first_name, 
                    pdt.partner_last_name
                  FROM 
                    partner_documents pd
                  LEFT JOIN 
                    partner_details pdt ON pd.tbs_partner_id = pdt.tbs_partner_id
                  WHERE 
                    pd.tbs_partner_id = $1; `

  try {
      const result = await pool.query(query, [tbs_partner_id])
      if (result.rows.length === 0) {
          return res.status(201).json({ error: 'Partner is not found' })
      }
      res.status(200).json(result.rows[0])
  } catch (error) {
      console.error('Error:', error)
      res.status(200).json({ error: 'Internal server error' })
  }
}

//partner address details POST CONTROLLER
const updatePartnerDetails = async (req, res) => {
  const tbs_partner_id = req.params.tbs_partner_id
  const {
    temp_add, temp_country, temp_state, temp_city, temp_zip_code, temp_region,
    perm_add, perm_country, perm_state, perm_city, perm_zip_code, perm_region
  } = req.body
 console.log(req.body)
  try {
    const query = `
      UPDATE partner_details
      SET 
        temp_add = COALESCE($1, temp_add),
        temp_country = COALESCE($2, temp_country),
        temp_state = COALESCE($3, temp_state),
        temp_city = COALESCE($4, temp_city),
        temp_region = COALESCE($5, temp_region),
        temp_zip_code = COALESCE($6, temp_zip_code),
        perm_add = COALESCE($7, perm_add),
        perm_country = COALESCE($8, perm_country),
        perm_state = COALESCE($9, perm_state),
        perm_city = COALESCE($10, perm_city),
        perm_zip_code = COALESCE($11, perm_zip_code),
        perm_region = COALESCE($12, perm_region)
      WHERE 
        tbs_partner_id = $13`

    await pool.query(query, [
      temp_add, temp_country, temp_state, temp_city, temp_region, temp_zip_code,
      perm_add, perm_country, perm_state, perm_city, perm_zip_code, perm_region,
      tbs_partner_id
    ])

    res.status(200).json({ message: 'Partner details updated successfully' })
  } catch (error) {
    console.error('Error updating partner details:', error)
    res.status(200).json({ error: 'Internal server error' })
  }
}


//partner address details GET CONTROLLER
const getAllPartners = async (req, res) => {
    try {
        const query = `SELECT 
                            tbs_partner_id,
                            temp_country ,
                            temp_state ,
                            temp_city ,
                            temp_zip_code ,
                            perm_add ,
                            perm_country ,
                            perm_state ,
                            perm_city ,
                            perm_zip_code
                    FROM partner_details`
        const { rows } = await pool.query(query)
        res.status(200).json(rows)

    } catch (error) {
        console.error('Error:', error)
        res.status(200).json({ error: 'Internal server error' })
    }
}

//partner address details GETbyID CONTROLLER
const getPartnerAddressById = async (req, res) => {
    const PartnerId = req.params.tbs_partner_id
    console.log(PartnerId)
    try {
        const query = `SELECT 
                            tbs_partner_id,
                            temp_add ,
                            temp_country ,
                            temp_state ,
                            temp_city ,
                            temp_region,
                            temp_zip_code ,
                            perm_add ,
                            perm_country ,
                            perm_state ,
                            perm_city ,
                            perm_region,
                            perm_zip_code  
                    FROM partner_details WHERE tbs_partner_id = $1`
        const { rows } = await pool.query(query, [PartnerId])
        
        if (rows.length === 0) {
          
            return res.status(201).json({ error: 'Partner is not found' })
        }

        res.status(200).json(rows[0])
        
    } catch (error) {
        console.error('Error:', error)
        res.status(200).json({ error: 'Internal server error' })
    }
}

// partner login
const partnerLogin = async (req, res) => {
  const { emailid, phone, password } = req.body

  try {
      let partner

      if (emailid) {
          const emailResult = await pool.query('SELECT * FROM partner_details WHERE emailid = $1', [emailid])
          console.log('Email Result:', emailResult.rows)
          partner = emailResult.rows[0]
      }

      if (!partner || phone) {
          const phoneResult = await pool.query('SELECT * FROM partner_details WHERE phone = $1', [phone])
          console.log('Phone Result:', phoneResult.rows)
          partner = phoneResult.rows[0]
      }

      if (!partner) {
          return res.status(201).json({ error: 'No partner found with provided email/phone' })
      }

      if (partner.password !== password) {
          return res.status(201).json({ error: 'Password incorrect' })
      }

      const partnerId = partner.tbs_partner_id
      const partnerFirstName = partner.partner_first_name
      const partnerLastName = partner.partner_last_name
      const typeName = partner.type_name
      const typeId = partner.type_id
      
      const token = jwt.sign({ partnerId }, process.env.JWT_SECRET_KEY, { expiresIn: '1w' })

      res.json({ id: partnerId,
        user_name: partnerFirstName + ' ' + partnerLastName,
        type_name : typeName,
        type_id : typeId, 
        toke: token })

  } catch (error) {
      res.status(200).json({ error: error.message })
  }
}

//excel import
const importPartnerDetails = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const workbook = xlsx.readFile(req.file.path);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const excelData = xlsx.utils.sheet_to_json(worksheet);

  try {
    await pool.query('BEGIN');

    for (const row of excelData) {
      const {
        partner_first_name, partner_last_name, phone, emailid,
        alternate_phone, date_of_birth, gender,
        temp_add, temp_country, temp_state, temp_city, temp_zip_code,
        perm_add, perm_country, perm_state, perm_city, perm_zip_code,
        type_name = 'PARTNER',
        type_id = 'PART101',
        partner_status = 'Draft',
        partner_status_id = 0,
        req_status = null,
        req_status_id = null,
      } = row;

      if (!partner_first_name || !partner_last_name || !phone || !emailid || !date_of_birth || !gender) {
        return res.status(400).json({ error: 'Missing required fields in Excel data' });
      }

      const formattedDOB = moment(date_of_birth, ['MM-DD-YYYY', 'DD-MM-YYYY', 'YYYY-MM-DD']).format('YYYY-MM-DD');
      if (!formattedDOB || formattedDOB === 'Invalid date') {
        return res.status(400).json({ error: 'Invalid date format in Excel data' });
      }

      const result = await pool.query(
        `INSERT INTO partner_details (
          partner_first_name, partner_last_name, phone, emailid, alternate_phone,
          date_of_birth, gender, type_name, type_id, partner_status,
          partner_status_id, req_status, req_status_id, temp_add, temp_country,
          temp_state, temp_city, temp_zip_code, perm_add, perm_country,
          perm_state, perm_city, perm_zip_code
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
        RETURNING tbs_partner_id;`,
        [
          partner_first_name, partner_last_name, phone, emailid, alternate_phone,
          formattedDOB, gender, type_name, type_id, partner_status, partner_status_id,
          req_status, req_status_id, temp_add, temp_country, temp_state, temp_city, temp_zip_code,
          perm_add, perm_country, perm_state, perm_city, perm_zip_code
        ]
      );

      const tbs_partner_id = result.rows[0].tbs_partner_id;
      const password = `PAT@${tbs_partner_id}`;

      await pool.query(
        `UPDATE partner_details SET password = $1 WHERE tbs_partner_id = $2`,
        [password, tbs_partner_id]
      );

      // Assuming the aadhar_card_number and pan_card_number are part of the Excel row
      const { aadhar_card_number, pan_card_number } = row;

      const documentInsertQuery = `
        UPDATE partner_documents
        SET aadhar_card_number = $2, pan_card_number = $3
        WHERE tbs_partner_id = $1;
      `;
      const documentInsertValues = [tbs_partner_id, aadhar_card_number, pan_card_number];

      await pool.query(documentInsertQuery, documentInsertValues);

      console.log(`Partner with ID ${tbs_partner_id} imported successfully`);
    }

    await pool.query('COMMIT');
    res.status(201).json({ message: 'Partner details imported successfully' });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error inserting into database:', err);
    res.status(500).json({ error: 'Database insertion failed' });
  }
};

  
  module.exports = { createPartner, updatePartner, deletePartner, getPartnerByID, getPartner, Emailval, phoneVal, AddPartnerDoc, FetchAllDocuments, FetchDocumentByID, updatePartnerDetails, getAllPartners, getPartnerAddressById, partnerLogin, FetchAllDocumentDetails, FetchDocumentDetailsByID, GetPartnerProfileById, GetAllPartnerProfile, updatePartnerStatus, importPartnerDetails }