const pool = require('../config/db')
const jwt = require('jsonwebtoken')
const xlsx = require('xlsx')
const moment = require('moment')


//employee-peraonal-details POST CONTROLLER
const createEMPpro = async (req, res, next) => {
    const { emp_first_name, emp_last_name, phone, email_id, alternate_phone, date_of_birth, gender, blood_group, owner_id } = req.body;
  
    if (!emp_first_name || !emp_last_name || !phone || !email_id || !alternate_phone || !date_of_birth || !gender || !blood_group || !owner_id ) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
  
    const type_name = 'EMPLOYEE', type_id = 'PROEMP101', emp_status = 'Draft', emp_status_id = 0;
    const profile_img = req.file ? `/pro_employee_documents/${req.file.filename}` : null;
  
    try {
        await pool.query('BEGIN');
  
        const ownerCheck = await pool.query(`SELECT * FROM product_owner_tbl WHERE owner_id = $1`, [owner_id]);
  
        if (ownerCheck.rowCount === 0) {
            await pool.query('ROLLBACK');
            return res.status(201).json({ message: 'Owner ID does not exist' });
        }
  
        const result = await pool.query(
            `INSERT INTO pro_emp_personal_details (emp_first_name, emp_last_name, phone, email_id, alternate_phone, date_of_birth, gender, blood_group, type_name, type_id, emp_status, emp_status_id, owner_id, profile_img) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
            [emp_first_name, emp_last_name, phone, email_id, alternate_phone, date_of_birth, gender, blood_group, type_name, type_id, emp_status, emp_status_id, owner_id, profile_img]
        );
  
        const tbs_pro_emp_id = result.rows[0].tbs_pro_emp_id;
        console.log(`New Employee created with ID: ${tbs_pro_emp_id}`);
        
        const password = `EMP@${tbs_pro_emp_id}`;
        await pool.query(
            `UPDATE pro_emp_personal_details SET password = $1 WHERE tbs_pro_emp_id = $2`,
            [password, tbs_pro_emp_id]
        );
  
        await pool.query('COMMIT');
  
        res.status(201).json({
            message: 'Employee Created Successfully',
            id: tbs_pro_emp_id,
            password: password,
            type_name: type_name,
            type_id: type_id
        });
  
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Error creating employee:', err.message);
        res.status(500).json({ error: err.message });
    }
  }

  //employee-peraonal-details PUT CONTROLLER
  const updateEMPpro = async (req, res) => {
    const id = req.params.tbs_pro_emp_id;
    const { emp_first_name, emp_last_name, phone, email_id, alternate_phone, date_of_birth, gender, blood_group } = req.body

    if (!emp_first_name || !emp_last_name || !phone || !email_id || !alternate_phone || !date_of_birth || !gender || !blood_group) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    const profile_img = req.file ? `/pro_employee_documents/${req.file.filename}` : null;

    try {
        const result = await pool.query(
            `
                        UPDATE pro_emp_personal_details 
                            SET 
                                emp_first_name = COALESCE($1, emp_first_name), 
                                emp_last_name = COALESCE($2, emp_last_name), 
                                phone = COALESCE($3, phone), 
                                email_id = COALESCE($4, email_id), 
                                alternate_phone = COALESCE($5, alternate_phone), 
                                date_of_birth = COALESCE($6, date_of_birth), 
                                gender = COALESCE($7, gender), 
                                blood_group = COALESCE($8, blood_group), 
                                profile_img = COALESCE($9, profile_img)
                            WHERE 
                                tbs_pro_emp_id = $10
                            RETURNING *; `,
            [emp_first_name, emp_last_name, phone, email_id, alternate_phone, date_of_birth, gender, blood_group, profile_img, id] );

        if (result.rows.length === 0) {
            return res.status(201).json({ error: 'Record not found' });
        }

        res.status(200).json('Employee Personal Details are Updated Successfully');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
  }

   //PRODUCT OWNER EMPLOYEE PROFILE-IMG GETbyID API
   const GETProfilepro = async (req, res) => {
    const id = req.params.tbs_pro_emp_id;
   
    try {
        const result = await pool.query(
            `
            SELECT profile_img FROM pro_emp_personal_details 
                WHERE 
                    tbs_pro_emp_id = $1 `,[id]
        );

        if (result.rows.length === 0) {
            return res.status(201).json({ error: 'Record not found' });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
  }

//PRODUCT OWNER EMPLOYEE PROFILE-IMG GET all API
const GETAllProfilepro = async (req, res) => {
  
  try {
      const result = await pool.query(
          `
          SELECT profile_img FROM pro_emp_personal_details  `
      );

      if (result.rows.length === 0) {
          return res.status(201).json({ error: 'Record not found' });
      }

      res.status(200).json(result.rows);
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
}


//employee-peraonal-details DELETE CONTROLLER
const deleteEMPpro = async (req, res) => {
    const client = await pool.connect();
    try {
        const empId = req.params.tbs_pro_emp_id;

        const empPersonalQuery = 'SELECT * FROM pro_emp_personal_details WHERE tbs_pro_emp_id = $1';
        const empPersonalResult = await client.query(empPersonalQuery, [empId]);

        if (empPersonalResult.rows.length === 0) {
            return res.status(201).send(`Employee with ID ${empId} not found`);
        }

        const empPersonal = empPersonalResult.rows[0];

        const empProfessionalQuery = 'SELECT * FROM pro_emp_professional_details WHERE tbs_pro_emp_id = $1';
        const empProfessionalResult = await client.query(empProfessionalQuery, [empId]);

        const empProfessional = empProfessionalResult.rows[0];

        const deletedData = {
            empPersonal,
            empProfessional
        };

        const recycleInsertQuery = 'INSERT INTO recycle_bin (module_name, module_id, deleted_data, module_get_id) VALUES ($1, $2, $3, $4) RETURNING tbs_recycle_id';
        await client.query(recycleInsertQuery, ['product owner employee', empId, JSON.stringify(deletedData), 8]);

        await client.query('DELETE FROM pro_emp_professional_details WHERE tbs_pro_emp_id = $1', [empId]);
        await client.query('DELETE FROM pro_emp_personal_details WHERE tbs_pro_emp_id = $1', [empId]);

        res.status(200).send(`Employee deleted successfully and stored in recycle_bin.`);
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).send('Error deleting employee');
    } finally {
        client.release();
    }
}

//employee-peraonal-details GET CONTROLLER
const getAllEMPpro = async (req, res) => {

    try {
      const result = await pool.query(`
      SELECT e.*, emp.*
      FROM pro_emp_personal_details AS e
      LEFT JOIN pro_emp_professional_details AS emp ON e.tbs_pro_emp_id = emp.tbs_pro_emp_id ORDER BY created_date DESC
  `)
      res.status(200).json(result.rows)
    } catch (err) {
      res.status(201).json({ error: err.message })
    }
  }

  //employee-peraonal-details GETbyID CONTROLLER
  const getEMPpro = async (req, res) => {
    try {
      const result = await pool.query(`SELECT tbs_pro_emp_id, emp_first_name,emp_last_name,phone,email_id,alternate_phone,date_of_birth,gender,blood_group, temp_add, temp_country, temp_state, temp_city, temp_zip_code,
      perm_add, perm_country, perm_state, perm_city, perm_zip_code, profile_img FROM pro_emp_personal_details `)
      if (result.rows.length === 0) {
        return res.status(201).json({ error: 'Record not found' })
      }
      res.status(200).json(result.rows[0])
    } catch (err) {
      res.status(201).json({ error: err.message })
    }
  }

//employee-peraonal-details GETbyID CONTROLLER
const getEMPByIDpro = async (req, res) => {
    const  id = req.params.tbs_pro_emp_id
    console.log(id)
    try {
      const result = await pool.query(`SELECT tbs_pro_emp_id, emp_first_name,emp_last_name,phone,email_id,alternate_phone,date_of_birth,gender,blood_group, temp_add, temp_country, temp_state, temp_city, temp_zip_code,
      perm_add, perm_country, perm_state, perm_city, perm_zip_code, profile_img FROM pro_emp_personal_details WHERE tbs_pro_emp_id = $1`, [id])
      if (result.rows.length === 0) {
        return res.status(201).json({ error: 'Record not found' })
      }
      res.status(200).json(result.rows[0])
    } catch (err) {
      res.status(201).json({ error: err.message })
    }
  }


  //employee-peraonal-details email-validation CONTROLLER
  const emailValidationpro = async (req, res) => {
    const{ email_id } = req.body
try {
    const emailResult = await pool.query(`SELECT * FROM pro_emp_personal_details WHERE email_id = $1`, [email_id])

    emailExists = emailResult.rows.length > 0

    res.json({Email : emailExists})

} catch (error) {
    res.status(201).json({ error: error.message})
}
}

//employee-peraonal-details phone-validation CONTROLLER
const Phonevalidationspro = async (req, res) => {
    const{ phone } = req.body
try {
    const phoneResult = await pool.query(`SELECT * FROM pro_emp_personal_details WHERE phone = $1`, [phone])

    phoneExists = phoneResult.rows.length > 0

    res.json({Phone: phoneExists})

} catch (error) {
    res.status(201).json({ error: error.message})
}
}

//employee-address-details PUT CONTROLLER
const updateEmployeeDetailspro = async (req, res) => {
    const employeeId = req.params.tbs_pro_emp_id 
    const {
        temp_add, temp_country, temp_state, temp_city, temp_zip_code,
        perm_add, perm_country, perm_state, perm_city, perm_zip_code, temp_region, perm_region
    } = req.body

    try {
        const query = `
        UPDATE pro_emp_personal_details
        SET 
            temp_add = COALESCE($1, temp_add),
            temp_country = COALESCE($2, temp_country),
            temp_state = COALESCE($3, temp_state),
            temp_city = COALESCE($4, temp_city),
            temp_zip_code = COALESCE($5, temp_zip_code),
            perm_add = COALESCE($6, perm_add),
            perm_country = COALESCE($7, perm_country),
            perm_state = COALESCE($8, perm_state),
            perm_city = COALESCE($9, perm_city),
            perm_zip_code = COALESCE($10, perm_zip_code),
            temp_region = COALESCE($11, temp_region),
            perm_region = COALESCE($12, perm_region)
        WHERE 
            tbs_pro_emp_id = $13
        RETURNING *;        
        `

        await pool.query(query, [
            temp_add, temp_country, temp_state, temp_city, temp_zip_code,
            perm_add, perm_country, perm_state, perm_city, perm_zip_code, temp_region, perm_region,
            employeeId
        ])

        res.status(200).json({ message: 'Employee details updated successfully' })

    } catch (error) {
        console.error('Error:', error)
        res.status(201).json({ error: 'Internal server error' })
    }
}

//employee-address-details GET CONTROLLER
const getAllEmployeespro = async (req, res) => {
    try {
        const query = `SELECT 
                            tbs_pro_emp_id,
                            temp_country ,
                            temp_state ,
                            temp_city ,
                            temp_zip_code ,
                            perm_add ,
                            perm_country ,
                            perm_state ,
                            perm_city ,
                            perm_zip_code, temp_region, perm_region 
                    FROM pro_emp_personal_details`
        const { rows } = await pool.query(query)

        res.status(200).json(rows)

    } catch (error) {
        console.error('Error:', error)
        res.status(201).json({ error: 'Internal server error' })
    }
}

//employee-address-details GETbyID CONTROLLER
const getEmployeeByIdpro = async (req, res) => {
    const employeeId = req.params.tbs_pro_emp_id
    console.log(employeeId)
    try {
        const query = `SELECT 
                            tbs_pro_emp_id,
                            temp_add ,
                            temp_country ,
                            temp_state ,
                            temp_city ,
                            temp_zip_code ,
                            perm_add ,
                            perm_country ,
                            perm_state ,
                            perm_city ,
                            perm_zip_code, temp_region, perm_region  
                    FROM pro_emp_personal_details WHERE tbs_pro_emp_id = $1`
        const { rows } = await pool.query(query, [employeeId])
        
        if (rows.length === 0) {
          
            return res.status(201).json({ error: 'Employee not found' })
        }

        res.status(200).json(rows[0])
        
    } catch (error) {
        console.error('Error:', error)
        res.status(201).json({ error: 'Internal server error' })
    }
}

//employee-professional-details POST CONTROLLER
const createDetailspro = async (req, res) => {
    const { tbs_pro_emp_id } = req.params
    const { joining_date, role_type, designation, branch, qualification, department, reporting_manager, language, role_type_id } = req.body

    const query = `
    UPDATE pro_emp_professional_details
    SET 
        joining_date = COALESCE($1, joining_date),
        role_type = COALESCE($2, role_type),
        designation = COALESCE($3, designation),
        branch = COALESCE($4, branch),
        language = COALESCE($5, language),
        qualification = COALESCE($6, qualification),
        department = COALESCE($7, department),
        reporting_manager = COALESCE($8, reporting_manager),
        role_type_id = COALESCE($9, role_type_id)
    WHERE 
        tbs_pro_emp_id = $10
    RETURNING *;    
    `

    try {
        const result = await pool.query(query, [joining_date, role_type, designation, branch, language, qualification, department, reporting_manager, role_type_id, tbs_pro_emp_id])
        if (result.rows.length === 0) {
            return res.status(201).json({ error: 'Employee not found' })
        }
        res.status(200).json(`Employee Professional details are created successfully`)
    } catch (error) {
        console.error('Error:', error)
        res.status(201).json({ error: 'Internal server error' })
    }
}

//employee-professional-details GET CONTROLLER
const fetchdatapro = async (req, res) => {

  const query = `SELECT tbs_pro_emp_id, 
                          joining_date, role_type, role_type_id, designation, branch, language,
          qualification, department, reporting_manager
  
              FROM pro_emp_professional_details `

              try {
                  const result = await pool.query(query)
                  res.status(200).json(result.rows)
              } catch (error) {
                  console.error('Error:', error)
                  res.status(201).json({ error: 'Internal server error' })
              }
}

//employee-professional-details GETbyID CONTROLLER
const fetchdataByIdpro = async (req, res) => {
  const { tbs_pro_emp_id } = req.params

  const query = `SELECT tbs_pro_emp_id, 
                          joining_date, role_type, role_type_id, designation, branch, language,
          qualification, department, reporting_manager
  
              FROM pro_emp_professional_details WHERE tbs_pro_emp_id = $1`

  try {
      const result = await pool.query(query, [tbs_pro_emp_id])
      if (result.rows.length === 0) {
          return res.status(201).json({ error: 'Employee not found' })
      }
      res.status(200).json(result.rows[0])
  } catch (error) {
      console.error('Error:', error)
      res.status(201).json({ error: 'Internal server error' })
  }
}

//employee-professional-documents POST CONTROLLER
const AddEmpDocpro = async (req, res) => {
    const { tbs_pro_emp_id } = req.params;
    const { aadhar_card_number, pan_card_number } = req.body;
  
    if (!aadhar_card_number || !pan_card_number) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
  
    const aadhar_card_front_file = req.files && req.files['aadhar_card_front_doc'] ? {
      type: req.files['aadhar_card_front_doc'][0].mimetype,
      filename: req.files['aadhar_card_front_doc'][0].filename,
      path: req.files['aadhar_card_front_doc'][0].path,
      size: req.files['aadhar_card_front_doc'][0].size,
      created_date: new Date().toISOString()
    } : null;
  
    const pancard_front_file = req.files && req.files['pan_card_front_doc'] ? {
      type: req.files['pan_card_front_doc'][0].mimetype,
      filename: req.files['pan_card_front_doc'][0].filename,
      path: req.files['pan_card_front_doc'][0].path,
      size: req.files['pan_card_front_doc'][0].size,
      created_date: new Date().toISOString()
    } : null;
  
    const aadhar_card_back_file = req.files && req.files['aadhar_card_back_doc'] ? {
      type: req.files['aadhar_card_back_doc'][0].mimetype,
      filename: req.files['aadhar_card_back_doc'][0].filename,
      path: req.files['aadhar_card_back_doc'][0].path,
      size: req.files['aadhar_card_back_doc'][0].size,
      created_date: new Date().toISOString()
    } : null;
  
    const pancard_back_file = req.files && req.files['pan_card_back_doc'] ? {
      type: req.files['pan_card_back_doc'][0].mimetype,
      filename: req.files['pan_card_back_doc'][0].filename,
      path: req.files['pan_card_back_doc'][0].path,
      size: req.files['pan_card_back_doc'][0].size,
      created_date: new Date().toISOString()
    } : null;
  
    const qualification_doc_file = req.files && req.files['qualification_doc'] ? {
      type: req.files['qualification_doc'][0].mimetype,
      filename: req.files['qualification_doc'][0].filename,
      path: req.files['qualification_doc'][0].path,
      size: req.files['qualification_doc'][0].size,
      created_date: new Date().toISOString()
    } : null;
  
    const offer_letter_doc_file = req.files && req.files['offer_letter_doc'] ? {
      type: req.files['offer_letter_doc'][0].mimetype,
      filename: req.files['offer_letter_doc'][0].filename,
      path: req.files['offer_letter_doc'][0].path,
      size: req.files['offer_letter_doc'][0].size,
      created_date: new Date().toISOString()
    } : null;
  
    const aadhar_card_front_doc = req.files && req.files['aadhar_card_front_doc'] ? `/pro_employee_documents/${req.files['aadhar_card_front_doc'][0].filename}` : null;
    const pan_card_front_doc = req.files && req.files['pan_card_front_doc'] ? `/pro_employee_documents/${req.files['pan_card_front_doc'][0].filename}` : null;
    const aadhar_card_back_doc = req.files && req.files['aadhar_card_back_doc'] ? `/pro_employee_documents/${req.files['aadhar_card_back_doc'][0].filename}` : null;
    const pan_card_back_doc = req.files && req.files['pan_card_back_doc'] ? `/pro_employee_documents/${req.files['pan_card_back_doc'][0].filename}` : null;
    const qualification_doc = req.files && req.files['qualification_doc'] ? `/pro_employee_documents/${req.files['qualification_doc'][0].filename}` : null;
    const offer_letter_doc = req.files && req.files['offer_letter_doc'] ? `/pro_employee_documents/${req.files['offer_letter_doc'][0].filename}` : null;
  
    const query = `
    UPDATE pro_emp_professional_details
    SET 
        aadhar_card_number = COALESCE($1, aadhar_card_number),
        aadhar_card_front_doc = COALESCE($2, aadhar_card_front_doc),
        pan_card_number = COALESCE($3, pan_card_number),
        pan_card_front_doc = COALESCE($4, pan_card_front_doc),
        offer_letter_doc = COALESCE($5, offer_letter_doc),
        qualification_doc = COALESCE($6, qualification_doc),
        aadhar_card_front_file = COALESCE($7, aadhar_card_front_file),
        pancard_front_file = COALESCE($8, pancard_front_file),
        qualification_doc_file = COALESCE($9, qualification_doc_file),
        offer_letter_doc_file = COALESCE($10, offer_letter_doc_file),
        updated_date = now(),
        aadhar_card_back_doc = COALESCE($11, aadhar_card_back_doc),
        pan_card_back_doc = COALESCE($12, pan_card_back_doc),
        aadhar_card_back_file = COALESCE($13, aadhar_card_back_file),
        pancard_back_file = COALESCE($14, pancard_back_file)
    WHERE tbs_pro_emp_id = $15
    RETURNING *  
    `;
  
    try {
      const result = await pool.query(query, [
        aadhar_card_number, aadhar_card_front_doc,
        pan_card_number, pan_card_front_doc, offer_letter_doc,
        qualification_doc, aadhar_card_front_file, pancard_front_file,
        qualification_doc_file, offer_letter_doc_file, aadhar_card_back_doc,
        pan_card_back_doc, aadhar_card_back_file, pancard_back_file, tbs_pro_emp_id
      ]);
  
      if (result.rows.length === 0) {
        return res.status(201).json({ error: 'Employee not found' });
      }
  
      const checkQuery = `
      SELECT 
      CASE 
          WHEN EXISTS (
              SELECT 1
              FROM pro_emp_personal_details pd
              LEFT JOIN pro_emp_professional_details prd ON pd.tbs_pro_emp_id = prd.tbs_pro_emp_id
              WHERE pd.tbs_pro_emp_id = $1
                AND (
                  pd.emp_first_name IS NULL OR 
                  pd.emp_last_name IS NULL OR 
                  pd.phone IS NULL OR 
                  pd.email_id IS NULL OR 
                  pd.date_of_birth IS NULL OR 
                  pd.gender IS NULL OR 
                  pd.temp_add IS NULL OR 
                  pd.perm_add IS NULL OR 
                  prd.joining_date IS NULL OR 
                  prd.designation IS NULL OR 
                  prd.branch IS NULL OR 
                  prd.aadhar_card_number IS NULL OR 
                  prd.pan_card_number IS NULL OR 
                  prd.qualification_doc IS NULL OR 
                  prd.offer_letter_doc IS NULL
                )
          ) THEN TRUE
          ELSE FALSE
      END AS has_null_columns;  `;
  
      const checkResult = await pool.query(checkQuery, [tbs_pro_emp_id]);
  
      if (checkResult.rows[0].has_null_columns) {
        console.log("Some columns are NULL. Status cannot be updated.");
        return { success: false, message: "Some columns are NULL. Status not updated." };
      }
  
      const updateEmpStatusQuery = `
        UPDATE pro_emp_personal_details
        SET emp_status = 'Active', emp_status_id = 1
        WHERE tbs_pro_emp_id = $1 `;
  
      await pool.query(updateEmpStatusQuery, [tbs_pro_emp_id]);
  
      console.log("Employee status updated successfully.");  
      res.status(200).json('Employee professional documents are uploaded successfully');
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
} 

//employee-professional-documents GET CONTROLLER
const FetchAllDocspro = async (req, res) => {
  const query = `SELECT 
  prof.tbs_pro_emp_id, 
  prof.aadhar_card_number, 
  prof.aadhar_card_front_doc,
  prof.pan_card_number, 
  prof.pan_card_front_doc,
  prof.qualification_doc, 
  prof.offer_letter_doc,
  prof.aadhar_card_back_doc,
  prof.pan_card_back_doc,
  pers.emp_first_name, 
  pers.emp_last_name
FROM 
  pro_emp_professional_details AS prof
JOIN 
  pro_emp_personal_details AS pers
ON 
  prof.tbs_pro_emp_id = pers.tbs_pro_emp_id;
`

  try {
      const result = await pool.query(query)
      res.status(200).json(result.rows)
  } catch (error) {
      console.error('Error:', error)
      res.status(201).json({ error: 'Internal server error' })
  }
}

//employee-professional-documents GETbyID CONTROLLER
const FetchDocpro = async (req, res) => {
  const tbs_pro_emp_id  = req.params.tbs_pro_emp_id

  const query = `SELECT 
  pd.tbs_pro_emp_id,
  pd.aadhar_card_number,
  pd.aadhar_card_front_doc,
  pd.pan_card_number,
  pd.pan_card_front_doc,
  pd.qualification_doc,
  pd.offer_letter_doc,
  pd.aadhar_card_back_doc,
  pd.pan_card_back_doc,
  p.emp_first_name,
  p.emp_last_name
FROM 
  pro_emp_professional_details AS pd
JOIN 
  pro_emp_personal_details AS p 
ON 
  pd.tbs_pro_emp_id = p.tbs_pro_emp_id
WHERE 
  pd.tbs_pro_emp_id = $1;
`

  try {
      const result = await pool.query(query, [tbs_pro_emp_id])
      if (result.rows.length === 0) {
          return res.status(201).json({ error: 'Employee not found' })
      }
      res.status(200).json(result.rows[0])
  } catch (error) {
      console.error('Error:', error)
      res.status(201).json({ error: 'Internal server error' })
  }
}

//employee-professional-documents GET CONTROLLER
const FetchAllDocsOnlypro = async (req, res) => {
    const query = `SELECT 
    prof.tbs_pro_emp_id, 
    prof.aadhar_card_front_doc, 
    prof.aadhar_card_front_file,
    prof.pan_card_front_doc, 
    prof.pancard_front_file, 
    prof.qualification_doc, 
    prof.qualification_doc_file,
    prof.offer_letter_doc, 
    prof.offer_letter_doc_file,
    prof.aadhar_card_back_doc, 
    prof.aadhar_card_back_file,
    prof.pan_card_back_doc, 
    prof.pancard_back_file, 
    pers.emp_first_name, 
    pers.emp_last_name
FROM 
    pro_emp_professional_details AS prof
JOIN 
    pro_emp_personal_details AS pers
ON 
    prof.tbs_pro_emp_id = pers.tbs_pro_emp_id;
`
  
    try {
        const result = await pool.query(query)
        res.status(200).json(result.rows)
    } catch (error) {
        console.error('Error:', error)
        res.status(201).json({ error: 'Internal server error' })
    }
  }
  
  //employee-professional-documents GETbyID CONTROLLER
  const FetchDoconlypro = async (req, res) => {
    const tbs_pro_emp_id  = req.params.tbs_pro_emp_id
  
    const query = `SELECT tbs_pro_emp_id, aadhar_card_front_doc, aadhar_card_front_file,
    pan_card_front_doc, pancard_front_file, offer_letter_doc, offer_letter_doc_file,
     qualification_doc, qualification_doc_file, aadhar_card_back_doc, 
     aadhar_card_back_file,
     pan_card_back_doc, 
     pancard_back_file FROM pro_emp_professional_details WHERE tbs_pro_emp_id = $1`
  
    try {
        const result = await pool.query(query, [tbs_pro_emp_id])
        if (result.rows.length === 0) {
            return res.status(201).json({ error: 'Employee not found' })
        }
        res.status(200).json(result.rows[0])
    } catch (error) {
        console.error('Error:', error)
        res.status(201).json({ error: 'Internal server error' })
    }
  }

// employee all details PUT CONTROLLER
const putEmployeepro = async (req, res) => {
  const tbs_pro_emp_id = req.params.tbs_pro_emp_id

  const {
    emp_first_name,
    emp_last_name,
    phone,
    email_id,
    alternate_phone,
    date_of_birth,
    gender,
    blood_group,
    temp_add,
    temp_country,
    temp_state,
    temp_city,
    temp_zip_code,
    perm_add,
    perm_country,
    perm_state,
    perm_city,
    perm_zip_code
  } = req.body

  if (!emp_first_name || !emp_last_name || !phone || !email_id || !alternate_phone || !date_of_birth || !gender || !blood_group) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const {
    joining_date,
    designation,
    branch,
    language,
    qualification,
    department,
    reporting_manager,
    aadhar_card_number,
    pan_card_number
  } = req.body

  const profile_img = req.files['profile_img'] ? `/pro_employee_documents/${req.files['profile_img'][0].filename}` : null
  const aadhar_card_front_doc = req.files['aadhar_card_front_doc'] ? `/pro_employee_documents/${req.files['aadhar_card_front_doc'][0].filename}` : null
  const pan_card_front_doc = req.files['pan_card_front_doc'] ? `/pro_employee_documents/${req.files['pan_card_front_doc'][0].filename}` : null
  const offer_letter_doc = req.files['offer_letter_doc'] ? `/pro_employee_documents/${req.files['offer_letter_doc'][0].filename}` : null
  const qualification_doc = req.files['qualification_doc'] ? `/pro_employee_documents/${req.files['qualification_doc'][0].filename}` : null
  

  const aadhar_card_front_file = req.files && req.files['aadhar_card_front_doc'] ? {
    type: req.files['aadhar_card_front_doc'][0].mimetype,
    filename: req.files['aadhar_card_front_doc'][0].filename,
    path: req.files['aadhar_card_front_doc'][0].path,
    size: req.files['aadhar_card_front_doc'][0].size,
    created_date: new Date().toISOString()
  } : null

  const pancard_front_file = req.files && req.files['pan_card_front_doc'] ? {
    type: req.files['pan_card_front_doc'][0].mimetype,
    filename: req.files['pan_card_front_doc'][0].filename,
    path: req.files['pan_card_front_doc'][0].path,
    size: req.files['pan_card_front_doc'][0].size,
    created_date: new Date().toISOString()
  } : null

  const qualification_doc_file = req.files && req.files['qualification_doc'] ? {
    type: req.files['qualification_doc'][0].mimetype,
    filename: req.files['qualification_doc'][0].filename,
    path: req.files['qualification_doc'][0].path,
    size: req.files['qualification_doc'][0].size,
    created_date: new Date().toISOString()
  } : null

  const offer_letter_doc_file = req.files && req.files['offer_letter_doc'] ? {
    type: req.files['offer_letter_doc'][0].mimetype,
    filename: req.files['offer_letter_doc'][0].filename,
    path: req.files['offer_letter_doc'][0].path,
    size: req.files['offer_letter_doc'][0].size,
    created_date: new Date().toISOString()
  } : null


  console.log('profile_img:', profile_img)
  console.log('aadhar_card_front_doc:', aadhar_card_front_doc)
  console.log('pan_card_front_doc:', pan_card_front_doc)
  console.log('offer_letter_doc:', offer_letter_doc)
  console.log('qualification_doc:', qualification_doc)

  try {
    await pool.query('BEGIN')

    const updateEmployeeQuery = `
      UPDATE public.pro_emp_personal_details 
      SET 
        emp_first_name = $1, 
        emp_last_name = $2, 
        phone = $3, 
        email_id = $4, 
        alternate_phone = $5, 
        date_of_birth = $6, 
        gender = $7, 
        blood_group = $8,
        profile_img = $9,
        temp_add = $10,
        temp_country = $11,
        temp_state = $12,
        temp_city = $13,
        temp_zip_code = $14,
        perm_add = $15,
        perm_country = $16,
        perm_state = $17,
        perm_city = $18,
        perm_zip_code = $19 
      WHERE tbs_pro_emp_id = $20
      RETURNING *
    `
    const employeeValues = [
      emp_first_name,
      emp_last_name,
      phone,
      email_id,
      alternate_phone,
      date_of_birth,
      gender,
      blood_group,
      profile_img,
      temp_add,
      temp_country,
      temp_state,
      temp_city,
      temp_zip_code,
      perm_add,
      perm_country,
      perm_state,
      perm_city,
      perm_zip_code,
      tbs_pro_emp_id
    ]
    const employeeResult = await pool.query(updateEmployeeQuery, employeeValues)

    if (employeeResult.rowCount === 0) {
      await pool.query('ROLLBACK')
      return res.status(201).json({ error: 'Employee not found' })
    }

    const updateprofessionalDetailsQuery = `
    UPDATE pro_emp_professional_details
    SET 
        joining_date = COALESCE($1, joining_date),
        designation = COALESCE($2, designation),
        branch = COALESCE($3, branch),
        language = COALESCE($4, language),
        qualification = COALESCE($5, qualification),
        department = COALESCE($6, department),
        reporting_manager = COALESCE($7, reporting_manager),
        aadhar_card_number = COALESCE($8, aadhar_card_number),
        aadhar_card_front_doc = COALESCE($9, aadhar_card_front_doc),
        pan_card_number = COALESCE($10, pan_card_number),
        pan_card_front_doc = COALESCE($11, pan_card_front_doc),
        offer_letter_doc = COALESCE($12, offer_letter_doc),
        qualification_doc = COALESCE($13, qualification_doc),
        aadhar_card_front_file = COALESCE($14, aadhar_card_front_file),
        pancard_front_file = COALESCE($15, pancard_front_file),
        qualification_doc_file = COALESCE($16, qualification_doc_file),
        offer_letter_doc_file = COALESCE($17, offer_letter_doc_file),
        updated_date = now()
    WHERE tbs_pro_emp_id = $18
    RETURNING *    
    `
    const professionalDetailsValues = [
      joining_date,
      designation,
      branch,
      language,
      qualification,
      department,
      reporting_manager,
      aadhar_card_number,
      aadhar_card_front_doc,
      pan_card_number,
      pan_card_front_doc,
      offer_letter_doc,
      qualification_doc,
      aadhar_card_front_file,
      pancard_front_file,
      qualification_doc_file,
      offer_letter_doc_file,
      tbs_pro_emp_id
    ]
    await pool.query(updateprofessionalDetailsQuery, professionalDetailsValues)

    await pool.query('COMMIT')

    res.status(200).json({ message: 'Employee and details updated successfully.' })
  } catch (error) {
    await pool.query('ROLLBACK')
    console.error('Error updating employee and details:', error)
    res.status(201).json({ error: 'Error updating employee and details.' })
  }
}

// employee login
const employeeLoginpro = async (req, res) => {
    const { email_id, phone, password } = req.body;

    try {
        let employee;

        if (email_id) {
            const emailResult = await pool.query(
                'SELECT * FROM pro_emp_personal_details WHERE email_id = $1',
                [email_id]
            );
            employee = emailResult.rows[0];
        }

        if ((!employee || employee.password !== password) && phone) {
            const phoneResult = await pool.query(
                'SELECT * FROM pro_emp_personal_details WHERE phone = $1',
                [phone]
            );
            employee = phoneResult.rows[0];
        }

        if (!employee) {
            return res.status(404).json({ error: 'No employee found with the provided email/phone' });
        }

        if (employee.password !== password) {
            return res.status(401).json({ error: 'Password incorrect' });
        }

        const employeeId = employee.tbs_op_emp_id;
        const employeeFirstName = employee.emp_first_name;
        const employeeLastName = employee.emp_last_name;
        const typeName = employee.type_name;
        const typeId = employee.type_id;
        const tbs_user_id = employee.owner_id

        const permissionsResult = await pool.query(
            `SELECT crud_permissions, module_permissions 
             FROM active_crud_permissions_tbl 
             WHERE tbs_user_id = $1`,
            [tbs_user_id]
        );
        const permissions = permissionsResult.rows[0];

        const token = jwt.sign({ employeeId }, process.env.JWT_SECRET_KEY, { expiresIn: '1w' });

        res.json({
            id: employeeId,
            user_name: `${employeeFirstName} ${employeeLastName}`,
            type_name: typeName,
            type_id: typeId,
            token,
            crud_permissions: permissions ? permissions.crud_permissions : null,
            module_permissions: permissions ? permissions.module_permissions : null
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

//search employees
const searchEmployeespro = async (req, res) => {
    let searchTerm = req.params.search_term ? req.params.search_term.trim().toLowerCase() : ''

    try {
        let query
        let queryParams

        if (searchTerm) {
            query = `
                SELECT * FROM pro_emp_personal_details 
                WHERE LOWER(emp_first_name) LIKE $1
                    OR LOWER(email_id) LIKE $1
                    OR phone::TEXT LIKE $1
            `
            queryParams = [`%${searchTerm}%`]
        } else {
            query = `SELECT * FROM pro_emp_personal_details `
            queryParams = []
        }

        const { rows } = await pool.query(query, queryParams)

        if (rows.length === 0) {
            return res.status(200).json('No employees found')
        }
        res.status(200).json(rows)

    } catch (error) {
        console.error('Error:', error)
        res.status(200).json({ error: 'Internal server error' })
    }
}

//employee excel import
const insertDatapro = async (req, res) => {
    if (!req.file || !req.file.path) {
        return res.status(400).send('No file uploaded.');
    }

    try {
        const workbook = xlsx.readFile(req.file.path);
        const sheet_name_list = workbook.SheetNames;
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);

        // Function to convert Excel serial date to JS date format
        const excelSerialToDate = (serial) => {
            const excelEpoch = moment('1899-12-30');
            return excelEpoch.add(serial, 'days').format('YYYY-MM-DD');
        };

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            for (const row of data) {
                const requiredFields = ['emp_first_name', 'emp_last_name', 'phone', 'email_id', 'date_of_birth', 'gender'];
                const hasRequiredFields = requiredFields.every(field => row[field]);

                if (!hasRequiredFields) {
                    return res.status(400).send(`Missing required fields in row: ${JSON.stringify(row)}`);
                }

                if (!isNaN(row.date_of_birth)) {
                    row.date_of_birth = excelSerialToDate(row.date_of_birth);
                }
                if (!isNaN(row.joining_date)) {
                    row.joining_date = excelSerialToDate(row.joining_date);
                }

                row.type_name = 'EMPLOYEE';
                row.type_id = 'PROEMP101';
                row.emp_status = 'Draft';
                row.emp_status_id = 0;

                const personalResult = await client.query(
                    `INSERT INTO pro_emp_personal_details (
                        emp_first_name, emp_last_name, phone, email_id, alternate_phone, date_of_birth, gender, 
                        blood_group, temp_add, temp_country, temp_state, temp_city, temp_zip_code, 
                        perm_add, perm_country, perm_state, perm_city, perm_zip_code, type_name, 
                        type_id, password, emp_status, emp_status_id, temp_region, perm_region, profile_img
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 
                        $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
                    ) RETURNING tbs_pro_emp_id`,
                    [
                        row.emp_first_name, row.emp_last_name, row.phone, row.email_id, row.alternate_phone, row.date_of_birth, row.gender,
                        row.blood_group, row.temp_add, row.temp_country, row.temp_state, row.temp_city, row.temp_zip_code,
                        row.perm_add, row.perm_country, row.perm_state, row.perm_city, row.perm_zip_code, row.type_name,
                        row.type_id, ' ', row.emp_status, row.emp_status_id, row.temp_region, row.perm_region, row.profile_img
                    ]
                );

                const employeeId = personalResult.rows[0].tbs_pro_emp_id;
                const password = `EMP@${employeeId}`;

                await client.query(
                    `UPDATE pro_emp_personal_details
                    SET password = $1
                    WHERE tbs_pro_emp_id = $2`,
                    [password, employeeId]
                );

                const checkResult = await client.query(
                    'SELECT 1 FROM pro_emp_professional_details WHERE tbs_pro_emp_id = $1',
                    [employeeId]
                );

                if (checkResult.rows.length === 0) {
                    await client.query(
                        `INSERT INTO pro_emp_professional_details (
                            tbs_pro_emp_id, joining_date, designation, branch, language, qualification, 
                            department, reporting_manager, aadhar_card_number, pan_card_number, role_type
                        ) VALUES (
                            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
                        )`,
                        [
                            employeeId, row.joining_date, row.designation, row.branch, row.language,
                            row.qualification, row.department, row.reporting_manager, row.aadhar_card_number,
                            row.pan_card_number, row.role_type
                        ]
                    );
                } else {
                    // Update existing professional details
                    await client.query(
                        `UPDATE pro_emp_professional_details 
                        SET
                            joining_date = COALESCE($2, joining_date),
                            designation = COALESCE($3, designation),
                            branch = COALESCE($4, branch),
                            language = COALESCE($5, language),
                            qualification = COALESCE($6, qualification),
                            department = COALESCE($7, department),
                            reporting_manager = COALESCE($8, reporting_manager),
                            aadhar_card_number = COALESCE($9, aadhar_card_number),
                            pan_card_number = COALESCE($10, pan_card_number),
                            role_type = COALESCE($11, role_type)
                        WHERE tbs_pro_emp_id = $1;`,
                        [
                            employeeId, row.joining_date, row.designation, row.branch, row.language,
                            row.qualification, row.department, row.reporting_manager, row.aadhar_card_number, row.pan_card_number, row.role_type
                        ]
                    );
                }
            }

            await client.query('COMMIT');
            res.send('File processed and data uploaded successfully');
        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Error processing data', err.stack);
            res.status(500).send('Error processing data');
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).send('Error uploading file');
    }
}

  //STATUS UPDATION
  const updateEMPStatusPro = async (req, res) => {
    const id = req.params.tbs_pro_emp_id;
    const { emp_status, emp_status_id } = req.body;

    if (!emp_status || !emp_status_id) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const result = await pool.query(
            `
            UPDATE pro_emp_personal_details 
                SET 
                   emp_status = $1, 
                   emp_status_id = $2 
                WHERE 
                    tbs_pro_emp_id = $3 
            RETURNING *`,
            [emp_status, emp_status_id, id]
        )
        if (result.rows.length === 0) {
          return res.status(200).json({ message: 'Record not found' });
      }

      res.status(200).json({message: 'Employee Status is Updated Successfully'});
    } catch (err) {
        console.error('Error updating employee status:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
}

  
  module.exports = { createEMPpro, updateEMPpro, deleteEMPpro, getAllEMPpro, getEMPpro, emailValidationpro, Phonevalidationspro, updateEmployeeDetailspro, getAllEmployeespro, getEmployeeByIdpro, createDetailspro, fetchdatapro, fetchdataByIdpro, AddEmpDocpro, FetchAllDocspro, FetchDocpro, putEmployeepro, employeeLoginpro, searchEmployeespro, insertDatapro, getEMPByIDpro, FetchAllDocsOnlypro, FetchDoconlypro, updateEMPStatusPro,GETProfilepro, GETAllProfilepro }