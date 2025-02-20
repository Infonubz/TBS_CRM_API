const pool = require('../config/db')
const jwt = require('jsonwebtoken')
const xlsx = require('xlsx')
const nodemailer = require('nodemailer');
const moment = require('moment')

//check operator email exist or not
const getEmails = async (req, res) => {
    const { emailid } = req.body;

    try {
        if (!emailid) {
            return res.status(400).json({ success: false, message: "Email ID is required" });
        }

        const emailQuery = `SELECT 1 FROM op_emp_personal_details WHERE email_id = $1 LIMIT 1`;
        const result = await pool.query(emailQuery, [emailid]);

        if (result.rows.length > 0) {
            return res.status(200).json({ exists: true });
        } else {
            return res.status(200).json({ exists: false });
        }
    } catch (error) {
        console.error("Error checking email existence:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

//check operator mobile exist or not
const getPhones = async (req, res) => {
    const { phone } = req.body;

    try {
        if (!phone) {
            return res.status(400).json({ success: false, message: "Phone Number is required" });
        }

        const PhoneQuery = `SELECT 1 FROM op_emp_personal_details WHERE phone = $1 LIMIT 1`;
        const result = await pool.query(PhoneQuery, [phone]);

        if (result.rows.length > 0) {
            return res.status(200).json({ exists: true });
        } else {
            return res.status(200).json({ exists: false });
        }
    } catch (error) {
        console.error("Error checking phone existence:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

//employee-peraonal-details POST CONTROLLER
const createEMP = async (req, res, next) => {
    const { emp_first_name, emp_last_name, phone, email_id, alternate_phone, date_of_birth, gender, blood_group, tbs_operator_id } = req.body;

    const profile_img = req.file ? `/op_employee_documents/${req.file.filename}` : null;
  
    if (!emp_first_name || !emp_last_name || !phone || !email_id || !alternate_phone || !date_of_birth || !gender || !blood_group || !tbs_operator_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
  
    const type_name = 'EMPLOYEE', type_id = 'OPEMP101', emp_status = 'Draft', emp_status_id = 0;
  
    try {
        if (tbs_operator_id.startsWith('tbs-op') && !tbs_operator_id.startsWith('tbs-op_emp')) {
            operatorCheck = await pool.query( `SELECT user_status_id FROM operators_tbl WHERE tbs_operator_id = $1`, [tbs_operator_id]);
        } else if (tbs_operator_id.startsWith('tbs-op_emp')) {
            operatorCheck = await pool.query( `SELECT emp_status_id FROM op_emp_personal_details WHERE tbs_op_emp_id = $1`, [tbs_operator_id]);
        }
  
      if (operatorCheck.rowCount === 0) {
        return res.status(201).json({ message: 'Operator ID does not exist' });
      }
  
      const result = await pool.query(
        `INSERT INTO op_emp_personal_details (emp_first_name, emp_last_name, phone, email_id, alternate_phone, date_of_birth, gender, blood_group, type_name, type_id, emp_status, emp_status_id, tbs_operator_id, profile_img) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
        [emp_first_name, emp_last_name, phone, email_id, alternate_phone, date_of_birth, gender, blood_group, type_name, type_id, emp_status, emp_status_id, tbs_operator_id, profile_img]
      );
  
      const tbs_op_emp_id = result.rows[0].tbs_op_emp_id;
  
      const password = `EMP@${tbs_op_emp_id}`;
      await pool.query(
        `UPDATE op_emp_personal_details SET password = $1 WHERE tbs_op_emp_id = $2`,
        [password, tbs_op_emp_id]
      );
  
      res.status(201).json({
        message: 'Employee Created Successfully',
        id: tbs_op_emp_id,
        password,
        type_name,
        type_id
      });
  
    } catch (err) {
      console.error('Error creating employee:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  }  

  //employee-peraonal-details PUT CONTROLLER
  const updateEMP = async (req, res) => {
    const id = req.params.tbs_op_emp_id;
    const { emp_first_name, emp_last_name, phone, email_id, alternate_phone, date_of_birth, gender, blood_group } = req.body

    const profile_img = req.file ? `/op_employee_documents/${req.file.filename}` : null;

    if (!emp_first_name || !emp_last_name || !phone || !email_id || !alternate_phone || !date_of_birth || !gender || !blood_group) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const result = await pool.query(
            `
            UPDATE op_emp_personal_details 
                SET 
                   emp_first_name = $1, 
                   emp_last_name = $2, 
                   phone = $3, 
                   email_id = $4, 
                   alternate_phone = $5, 
                   date_of_birth = $6, 
                   gender = $7, 
                   blood_group = $8, 
                   profile_img = $9
                WHERE 
                    tbs_op_emp_id = $10
            RETURNING *`,
            [emp_first_name, emp_last_name, phone, email_id, alternate_phone, date_of_birth, gender, blood_group, profile_img, id]
        );

        if (result.rows.length === 0) {
            return res.status(201).json({ error: 'Record not found' });
        }

        res.status(200).json('Employee Personal Details are Updated Successfully');
    } catch (err) {
        console.error('Error updating employee:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
}

//UPDATE PROFILE-IMG
const updateProfile = async (req, res) => {
    const id = req.params.tbs_op_emp_id;
    const profile_img = req.file ? `/op_employee_documents/${req.file.filename}` : null;

    if (!profile_img === null) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const result = await pool.query(
            `
            UPDATE op_emp_personal_details 
                SET 
                   profile_img = $1
                WHERE 
                    tbs_op_emp_id = $2 
            RETURNING *`,
            [profile_img, id]
        );

        if (result.rows.length === 0) {
            return res.status(201).json({ error: 'Record not found' });
        }

        res.status(200).json('Employee Profile image Updated Successfully');
    } catch (err) {
        console.error('Error updating employee profile:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
}

//OPERATOR EMPLOYEE PROFILE-IMG GETbyID API
  const GETProfileById = async (req, res) => {
    const id = req.params.tbs_op_emp_id;
   
    try {
        const result = await pool.query(
            `
            SELECT profile_img FROM op_emp_personal_details 
                WHERE 
                    tbs_op_emp_id = $1 `,[id]
        );

        if (result.rows.length === 0) {
            return res.status(201).json({ error: 'Record not found' });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
  }

//OPERATOR PROFILE-IMG GET all API
const GETAllProfile = async (req, res) => {
  
  try {
      const result = await pool.query(
          `
          SELECT profile_img FROM op_emp_personal_details  `
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
  const deleteEMP = async (req, res) => {
    const client = await pool.connect();
    try {
        const empId = req.params.tbs_op_emp_id;

        const empPersonalQuery = 'SELECT * FROM op_emp_personal_details WHERE tbs_op_emp_id = $1';
        const empPersonalResult = await client.query(empPersonalQuery, [empId]);

        if (empPersonalResult.rows.length === 0) {
            return res.status(201).send(`Employee with ID ${empId} not found`);
        }

        const empPersonal = empPersonalResult.rows[0];

        const empProfessionalQuery = 'SELECT * FROM op_emp_professional_details WHERE tbs_op_emp_id = $1';
        const empProfessionalResult = await client.query(empProfessionalQuery, [empId]);

        const empProfessional = empProfessionalResult.rows[0];

        const deletedData = {
            empPersonal,
            empProfessional
        };

        const recycleInsertQuery = 'INSERT INTO recycle_bin (module_name, module_id, deleted_data, module_get_id) VALUES ($1, $2, $3, $4) RETURNING tbs_recycle_id';
        await client.query(recycleInsertQuery, ['operator employee', empId, JSON.stringify(deletedData), 6]);

        await client.query('DELETE FROM op_emp_personal_details WHERE tbs_op_emp_id = $1', [empId]);

        res.status(200).send(`Employee deleted successfully and stored in recycle_bin.`);
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).send('Error deleting employee');
    } finally {
        client.release();
    }
}

//employee-peraonal-details GET CONTROLLER
const getAllEMPop = async (req, res) => {

    try {
      const result = await pool.query(`
      SELECT e.*, emp.*
      FROM op_emp_personal_details AS e
      LEFT JOIN op_emp_professional_details AS emp ON e.tbs_op_emp_id = emp.tbs_op_emp_id ORDER BY created_date DESC 
  `)
      res.status(200).json(result.rows)
    } catch (err) {
      res.status(200).json({ error: err.message })
    }
  }

  //employee-peraonal-details GET CONTROLLER
const getAllOPEMPbyOPid = async (req, res) => {
 const { tbs_operator_id } = req.params
    try {
      const result = await pool.query(`
      SELECT e.*, emp.*
      FROM op_emp_personal_details AS e
      LEFT JOIN op_emp_professional_details AS emp ON e.tbs_op_emp_id = emp.tbs_op_emp_id WHERE tbs_operator_id = $1 ORDER BY created_date DESC 
  `, [tbs_operator_id])
      res.status(200).json(result.rows)
    } catch (err) {
      res.status(200).json({ error: err.message })
    }
  }

  //employee-peraonal-details GETbyID CONTROLLER
  const getEMP = async (req, res) => {
    try {
      const result = await pool.query(`SELECT tbs_op_emp_id, emp_first_name,emp_last_name,phone,email_id,alternate_phone,date_of_birth,gender,blood_group, temp_add, temp_country, temp_state, temp_city, temp_region, temp_zip_code,
      perm_add, perm_country, perm_state, perm_city, perm_region, perm_zip_code, profile_img FROM op_emp_personal_details `)
      if (result.rows.length === 0) {
        return res.status(201).json({ error: 'Record not found' })
      }
      res.status(200).json(result.rows[0])
    } catch (err) {
      res.status(200).json({ error: err.message })
    }
  }

  //employee-peraonal-details GETbyID CONTROLLER
  const getEMPByID = async (req, res) => {
    const  id = req.params.tbs_op_emp_id
    try {
      const result = await pool.query(`SELECT tbs_op_emp_id, emp_first_name,emp_last_name,phone,email_id,alternate_phone,date_of_birth,gender,blood_group, temp_add, temp_country, temp_state, temp_city, temp_region, temp_zip_code,
      perm_add, perm_country, perm_state, perm_city, perm_region, perm_zip_code, profile_img FROM op_emp_personal_details WHERE tbs_op_emp_id = $1`, [id])
      if (result.rows.length === 0) {
        return res.status(201).json({ error: 'Record not found' })
      }
      res.status(200).json(result.rows[0])
    } catch (err) {
      res.status(200).json({ error: err.message })
    }
  }


//employee-peraonal-details email-validation CONTROLLER
  const emailValidation = async (req, res) => {
    const{ email_id } = req.body
try {
    const emailResult = await pool.query(`SELECT * FROM op_emp_personal_details WHERE email_id = $1`, [email_id])

    emailExists = emailResult.rows.length > 0

    res.json({Email : emailExists})

} catch (error) {
    res.status(200).json({ error: error.message})
}
}

//employee-peraonal-details phone-validation CONTROLLER
const Phonevalidations = async (req, res) => {
    const{ phone } = req.body
try {
    const phoneResult = await pool.query(`SELECT * FROM op_emp_personal_details WHERE phone = $1`, [phone])

    phoneExists = phoneResult.rows.length > 0

    res.json({Phone: phoneExists})

} catch (error) {
    res.status(200).json({ error: error.message})
    }
}

//employee-address-details PUT CONTROLLER
const updateEmployeeDetails = async (req, res) => {
    const employeeId = req.params.tbs_op_emp_id 
    const {
        temp_add, temp_country, temp_state, temp_city, temp_region, temp_zip_code,
        perm_add, perm_country, perm_state, perm_city, perm_region, perm_zip_code
    } = req.body

    try {
        const query = `
            UPDATE op_emp_personal_details
            SET 
                temp_add = $1,
                temp_country = $2,
                temp_state = $3,
                temp_city = $4,
                temp_zip_code = $5,
                perm_add = $6,
                perm_country = $7,
                perm_state = $8,
                perm_city = $9,
                perm_zip_code = $10,
                temp_region = $11, perm_region = $12
            WHERE 
                tbs_op_emp_id = $13
        `

        await pool.query(query, [
            temp_add, temp_country, temp_state, temp_city, temp_zip_code,
            perm_add, perm_country, perm_state, perm_city, perm_zip_code, temp_region, perm_region,
            employeeId
        ])

        res.status(200).json({ message: 'Employee details updated successfully' })

    } catch (error) {
        console.error('Error:', error)
        res.status(200).json({ error: 'Internal server error' })
    }
}

//employee-address-details GET CONTROLLER
const getAllEmployees = async (req, res) => {
    try {
        const query = `SELECT 
                            tbs_op_emp_id,
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
                    FROM op_emp_personal_details`
        const { rows } = await pool.query(query)

        res.status(200).json(rows)

    } catch (error) {
        console.error('Error:', error)
        res.status(200).json({ error: 'Internal server error' })
    }
}

//employee-address-details GETbyID CONTROLLER
const getEmployeeById = async (req, res) => {
    const employeeId = req.params.tbs_op_emp_id
    try {
        const query = `SELECT 
                            tbs_op_emp_id,
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
                    FROM op_emp_personal_details WHERE tbs_op_emp_id = $1`
        const { rows } = await pool.query(query, [employeeId])
        
        if (rows.length === 0) {
          
            return res.status(201).json({ error: 'Employee not found' })
        }

        res.status(200).json(rows[0])
        
    } catch (error) {
        console.error('Error:', error)
        res.status(200).json({ error: 'Internal server error' })
    }
}

//employee-professional-details POST CONTROLLER
const createDetails = async (req, res) => {
    const { tbs_op_emp_id } = req.params
    const { joining_date, role_type, role_type_id, designation, branch, language, qualification, department, reporting_manager } = req.body

    const query = `
        UPDATE op_emp_professional_details
        SET joining_date = $1, role_type= $2, designation = $3, branch = $4, language = $5,
            qualification = $6, department = $7, reporting_manager = $8, role_type_id = $9
        WHERE tbs_op_emp_id = $10
        RETURNING *
    `

    try {
        const result = await pool.query(query, [joining_date, role_type, designation, branch, language, qualification, department, reporting_manager, role_type_id, tbs_op_emp_id])
        if (result.rows.length === 0) {
            return res.status(201).json({ error: 'Employee not found' })
        }
        res.status(200).json(`Employee Professional details are created successfully`)
    } catch (error) {
        console.error('Error:', error)
        res.status(200).json({ error: 'Internal server error' })
    }
}

//employee-professional-details GET CONTROLLER
const fetchdata = async (req, res) => {
  const query = `SELECT tbs_op_emp_id, joining_date, role_type, role_type_id, designation, branch, language, qualification, department, reporting_manager FROM op_emp_professional_details `

              try {
                  const result = await pool.query(query)
                  res.status(200).json(result.rows)
              } catch (error) {
                  console.error('Error:', error)
                  res.status(200).json({ error: 'Internal server error' })
              }
}

//employee-professional-details GETbyID CONTROLLER
const fetchdataById = async (req, res) => {
  const { tbs_op_emp_id } = req.params

  const query = `SELECT tbs_op_emp_id, 
                          joining_date, role_type, role_type_id, designation, branch, language,
          qualification, department, reporting_manager
  
              FROM op_emp_professional_details WHERE tbs_op_emp_id = $1`

  try {
      const result = await pool.query(query, [tbs_op_emp_id])
      if (result.rows.length === 0) {
          return res.status(201).json({ error: 'Employee not found' })
      }
      res.status(200).json(result.rows[0])
  } catch (error) {
      console.error('Error:', error)
      res.status(200).json({ error: 'Internal server error' })
  }
}

//employee-professional-documents POST CONTROLLER
const sendMail = async (emailid, subject, htmlContent) => {
    const transporter = nodemailer.createTransport({
        host: 'smtp.office365.com',
        port: 587,
        secure: false,
        auth: {
            user: 'no-reply@thebusstand.com',
            pass: 'bdqbqlgqgcnnrxrr', 
        },
    });

    const mailOptions = {
        to: emailid,
        from: 'no-reply@thebusstand.com',
        subject: subject,
        html: htmlContent,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${emailid}`);
    } catch (error) {
        console.error(`Failed to send email to ${emailid}:`, error);
    }
};
const AddEmpDoc = async (req, res) => {
    const { tbs_op_emp_id } = req.params;
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
  
    const aadhar_card_front_doc = req.files && req.files['aadhar_card_front_doc'] ? `/op_employee_documents/${req.files['aadhar_card_front_doc'][0].filename}` : null;
    const pan_card_front_doc = req.files && req.files['pan_card_front_doc'] ? `/op_employee_documents/${req.files['pan_card_front_doc'][0].filename}` : null;
    const aadhar_card_back_doc = req.files && req.files['aadhar_card_back_doc'] ? `/op_employee_documents/${req.files['aadhar_card_back_doc'][0].filename}` : null;
    const pan_card_back_doc = req.files && req.files['pan_card_back_doc'] ? `/op_employee_documents/${req.files['pan_card_back_doc'][0].filename}` : null;
    const qualification_doc = req.files && req.files['qualification_doc'] ? `/op_employee_documents/${req.files['qualification_doc'][0].filename}` : null;
    const offer_letter_doc = req.files && req.files['offer_letter_doc'] ? `/op_employee_documents/${req.files['offer_letter_doc'][0].filename}` : null;
  
    const query = `
    UPDATE op_emp_professional_details
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
    WHERE tbs_op_emp_id = $15
    RETURNING *  
    `;
  
    try {
      const result = await pool.query(query, [
        aadhar_card_number, aadhar_card_front_doc,
        pan_card_number, pan_card_front_doc, offer_letter_doc,
        qualification_doc, aadhar_card_front_file, pancard_front_file,
        qualification_doc_file, offer_letter_doc_file, aadhar_card_back_doc,
        pan_card_back_doc, aadhar_card_back_file, pancard_back_file, tbs_op_emp_id
      ]);
  
      if (result.rows.length === 0) {
        return res.status(201).json({ error: 'Employee not found' });
      }
  
      const checkQuery = `
      SELECT 
        pd.email_id,
        pd.password, 
        CASE 
            WHEN EXISTS (
                SELECT 1
                FROM op_emp_personal_details pd
                LEFT JOIN op_emp_professional_details prd ON pd.tbs_op_emp_id = prd.tbs_op_emp_id
                WHERE pd.tbs_op_emp_id = $1
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
        END AS has_null_columns
    FROM op_emp_personal_details pd
    WHERE pd.tbs_op_emp_id = $1; `;
  
      const checkResult = await pool.query(checkQuery, [tbs_op_emp_id]);
  
      if (checkResult.rows[0].has_null_columns) {
        return { success: false, message: "Some columns are NULL. Status not updated." };
      }
      const {email_id, password} = checkResult.rows[0] || {};
      if (!email_id || !password) {
          throw new Error('Missing email or password in database results.');
      }
  
      const updateEmpStatusQuery = `
        UPDATE op_emp_personal_details
        SET emp_status = 'Active', emp_status_id = 1
        WHERE tbs_op_emp_id = $1 `;
  
      await pool.query(updateEmpStatusQuery, [tbs_op_emp_id]);
  
      const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 15px;">
        <!-- Header -->
        <div style="background-color: #1F487C; padding: 10px; border-radius: 10px 10px 0 0; text-align: center; color: #fff;">
            <a href="http://192.168.6.52:3000/opemployee" style="color: #FFFFFF; font-size: 22px; font-weight: 600; margin: 0; text-decoration: none;">
                THEBUSSTAND.COM
            </a>
        </div>
        <!-- Content -->
        <div style="padding: 20px; background-color: #ffffff; text-align: center; border: 3px solid #1F487C; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1F487C; font-size: 22px; margin-bottom: 8px;">Welcome to TheBusStand!</h2>
            <p style="font-size: 16px; color: #1F487C; margin-bottom: 15px;">
                We are thrilled to have you on board. Your account has been successfully <strong>Activated</strong>.
            </p>
            <p style="font-size: 14px; color: #555; margin-bottom: 15px;">
                Here are your login credentials:
            </p>
            <div style="text-align: left; margin: 15px auto; width: fit-content; border: 1px solid #1F487C; padding: 10px; border-radius: 8px;">
                <p style="font-size: 14px; color: #333; margin: 5px 0;">
                    <strong>Email ID:</strong> <span style="color: #1F487C;">${email_id}</span>
                </p>
                <p style="font-size: 14px; color: #333; margin: 5px 0;">
                    <strong>Password:</strong> <span style="color: #1F487C;">${password}</span>
                </p>
                <p style="font-size: 14px; color: #333; margin: 5px 0;">
                    <strong>Login URL:</strong> <a href="http://192.168.6.52:3000/opemployee" style="color: #1F487C; text-decoration: none;">Click here to login</a>
                </p>
            </div>
            <p style="font-size: 14px; color: #555; margin-bottom: 15px;">
                If you have any questions or concerns, feel free to reach out to our support team.
            </p>
            <div style="padding: 10px; text-align: center;">
                <a href="mailto:support@thebusstand.com" style="text-decoration: none; font-size: 16px; color: #fff; background-color: #1F487C; padding: 10px 20px; border-radius: 5px;">
                    Contact Support
                </a>
            </div>
        </div>
        <!-- Footer -->
        <div style="padding: 10px; background-color: #D2DAE5; text-align: center; border-radius: 0 0 10px 10px;">
            <p style="font-size: 12px; color: #999; margin: 0;">
                This email was sent by TheBusStand Support.
            </p>
            <p style="font-size: 12px; color: #999; margin: 5px 0 0 0;">
                © 2024 TheBusStand. All rights reserved.
            </p>
        </div>
    </div>`;

        await sendMail(email_id, 'Account Activation Notification', htmlContent);

        res.status(200).json('Employee professional documents are uploaded successfully, and notification email sent.');
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

//employee-professional-documents GET CONTROLLER
const FetchAllDocs = async (req, res) => {
  const query = `SELECT 
                    opd.tbs_op_emp_id, 
                    opd.aadhar_card_number, 
                    opd.aadhar_card_front_doc,
                    opd.aadhar_card_back_doc,
                    opd.pan_card_number, 
                    opd.pan_card_front_doc, 
                    opd.pan_card_back_doc,
                    opd.offer_letter_doc,
                    opd.qualification_doc, 
                    oppd.emp_first_name, 
                    oppd.emp_last_name
                FROM 
                    op_emp_professional_details opd
                    LEFT JOIN 
                    op_emp_personal_details oppd ON opd.tbs_op_emp_id = oppd.tbs_op_emp_id `
  try {
      const result = await pool.query(query)
      res.status(200).json(result.rows)
  } catch (error) {
      console.error('Error:', error)
      res.status(200).json({ error: 'Internal server error' })
  }
}

//employee-professional-documents GETbyID CONTROLLER
const FetchDoc = async (req, res) => {
  const tbs_op_emp_id  = req.params.tbs_op_emp_id

  const query = `SELECT 
                    opd.tbs_op_emp_id, 
                    opd.aadhar_card_number, 
                    opd.aadhar_card_front_doc,
                    opd.aadhar_card_back_doc,
                    opd.pan_card_number, 
                    opd.pan_card_front_doc, 
                    opd.pan_card_back_doc,
                    opd.offer_letter_doc,
                    opd.qualification_doc, 
                    oppd.emp_first_name, 
                    oppd.emp_last_name
                FROM 
                    op_emp_professional_details opd
                    LEFT JOIN 
                    op_emp_personal_details oppd ON opd.tbs_op_emp_id = oppd.tbs_op_emp_id
                    WHERE 
                    opd.tbs_op_emp_id = $1; `
  try {
      const result = await pool.query(query, [tbs_op_emp_id])
      if (result.rows.length === 0) {
          return res.status(201).json({ error: 'Employee not found' })
      }
      res.status(200).json(result.rows[0])
  } catch (error) {
      console.error('Error:', error)
      res.status(200).json({ error: 'Internal server error' })
  }
}

//employee-professional-documents GET CONTROLLER
const FetchAllDocsOnly = async (req, res) => {
    const query = `SELECT 
                        opd.tbs_op_emp_id, 
                        opd.aadhar_card_number,
                        opd.aadhar_card_front_doc, 
                        opd.aadhar_card_front_file,
                        opd.aadhar_card_back_doc, 
                        opd.aadhar_card_back_file,
                        opd.pan_card_number,
                        opd.pan_card_front_doc, 
                        opd.pancard_front_file,
                        opd.pan_card_back_doc, 
                        opd.pancard_back_file, 
                        opd.offer_letter_doc, 
                        opd.offer_letter_doc_file,
                        opd.qualification_doc, 
                        opd.qualification_doc_file, 
                        oppd.emp_first_name, 
                        oppd.emp_last_name
                    FROM 
                        op_emp_professional_details opd
                    LEFT JOIN 
                        op_emp_personal_details oppd ON opd.tbs_op_emp_id = oppd.tbs_op_emp_id `
  
    try {
        const result = await pool.query(query)
        res.status(200).json(result.rows)
    } catch (error) {
        console.error('Error:', error)
        res.status(200).json({ error: 'Internal server error' })
    }
  }
  
  //employee-professional-documents GETbyID CONTROLLER
  const FetchDoconly = async (req, res) => {
    const tbs_op_emp_id  = req.params.tbs_op_emp_id
  
    const query = `SELECT 
                        opd.tbs_op_emp_id,
                        opd.aadhar_card_number, 
                        opd.aadhar_card_front_doc, 
                        opd.aadhar_card_front_file,
                        opd.aadhar_card_back_doc, 
                        opd.aadhar_card_back_file,
                        opd.pan_card_number,
                        opd.pan_card_front_doc, 
                        opd.pancard_front_file,
                        opd.pan_card_back_doc, 
                        opd.pancard_back_file, 
                        opd.offer_letter_doc, 
                        opd.offer_letter_doc_file,
                        opd.qualification_doc, 
                        opd.qualification_doc_file, 
                        oppd.emp_first_name, 
                        oppd.emp_last_name
                    FROM 
                        op_emp_professional_details opd
                    LEFT JOIN 
                        op_emp_personal_details oppd ON opd.tbs_op_emp_id = oppd.tbs_op_emp_id
                    WHERE 
                        opd.tbs_op_emp_id = $1; `
  
    try {
        const result = await pool.query(query, [tbs_op_emp_id])
        if (result.rows.length === 0) {
            return res.status(201).json({ error: 'Employee not found' })
        }
        res.status(200).json(result.rows[0])
    } catch (error) {
        console.error('Error:', error)
        res.status(200).json({ error: 'Internal server error' })
    }
  }

// employee all details PUT CONTROLLER
const putEmployee = async (req, res) => {
  const tbs_op_emp_id = req.params.tbs_op_emp_id

  const {
      emp_first_name,
      emp_last_name,
      phone,
      email_id,
      alternate_phone,
      date_of_birth,
      gender,
      blood_group,
      temp_add, temp_country, temp_state, temp_city, temp_zip_code,
      perm_add, perm_country, perm_state, perm_city, perm_zip_code
  } = req.body

  if (!emp_first_name || !emp_last_name || !phone || !email_id || !alternate_phone || !date_of_birth || !gender || !blood_group) {
      return res.status(400).json({ error: 'Missing required fields' })
  }

  const {
      joining_date, designation, branch, language, qualification, department, reporting_manager, aadhar_card_number, pan_card_number
  } = req.body


  const profile_img = req.files['profile_img'] ? `/op_employee_documents/${req.files['profile_img'][0].filename}` : null
  const aadhar_card_doc = req.files['aadhar_card_doc'] ? `/op_employee_documents/${req.files['aadhar_card_doc'][0].filename}` : null
  const pan_card_doc = req.files['pan_card_doc'] ? `/op_employee_documents/${req.files['pan_card_doc'][0].filename}` : null
  const offer_letter_doc = req.files['offer_letter_doc'] ? `/op_employee_documents/${req.files['offer_letter_doc'][0].filename}` : null
  const qualification_doc = req.files['qualification_doc'] ? `/op_employee_documents/${req.files['qualification_doc'][0].filename}` : null
  const other_documents = req.files['other_documents'] ? `/op_employee_documents/${req.files['other_documents'][0].filename}` : null

  const aadhar_card_file = req.files && req.files['aadhar_card_doc'] ? {
      type: req.files['aadhar_card_doc'][0].mimetype,
      filename: req.files['aadhar_card_doc'][0].filename,
      path: req.files['aadhar_card_doc'][0].path,
      size: req.files['aadhar_card_doc'][0].size,
      created_date: new Date().toISOString()
  } : null

  const pancard_file = req.files && req.files['pan_card_doc'] ? {
      type: req.files['pan_card_doc'][0].mimetype,
      filename: req.files['pan_card_doc'][0].filename,
      path: req.files['pan_card_doc'][0].path,
      size: req.files['pan_card_doc'][0].size,
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

  const other_certificate_file = req.files && req.files['other_documents'] ? {
      type: req.files['other_documents'][0].mimetype,
      filename: req.files['other_documents'][0].filename,
      path: req.files['other_documents'][0].path,
      size: req.files['other_documents'][0].size,
      created_date: new Date().toISOString()
  } : null

  try {
      await pool.query('BEGIN') 

      // Update employee_tbl
      const updateEmployeeQuery = `
          UPDATE public.op_emp_personal_details 
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
              WHERE tbs_op_emp_id = $20
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
          temp_add, temp_country, temp_state, temp_city, temp_zip_code,
          perm_add, perm_country, perm_state, perm_city, perm_zip_code,
          tbs_op_emp_id
      ]
      const employeeResult = await pool.query(updateEmployeeQuery, employeeValues)

      if (employeeResult.rowCount === 0) {
          await pool.query('ROLLBACK')
          return res.status(201).json({ error: 'Employee not found' })
      }

      const updateProfessionalDetailsQuery = `
      UPDATE op_emp_professional_details
          SET joining_date = $1, designation = $2, branch = $3, language = $4,
              qualification = $5, department = $6, reporting_manager = $7, aadhar_card_number = $8, aadhar_card_doc = $9, pan_card_number = $10,
              pan_card_doc = $11, offer_letter_doc = $12, qualification_doc = $13,
              aadhar_card_file = $14, pancard_file = $15, qualification_doc_file = $16, offer_letter_doc_file = $17, updated_date = now()
          WHERE tbs_op_emp_id = $18
      RETURNING *
      `
      const professionalDetailsValues = [
          joining_date, designation, branch, language, qualification, department, reporting_manager, aadhar_card_number, aadhar_card_doc, pan_card_number, pan_card_doc, offer_letter_doc,
          qualification_doc, aadhar_card_file, pancard_file, qualification_doc_file, offer_letter_doc_file, tbs_op_emp_id
      ]
      await pool.query(updateProfessionalDetailsQuery, professionalDetailsValues)

      await pool.query('COMMIT')

      res.status(200).json({ message: 'Employee and details updated successfully.' })
  } catch (error) {
      await pool.query('ROLLBACK')
      console.error('Error updating employee and details:', error)
      res.status(200).json({ error: 'Error updating employee and details.' })
  }
}


// employee login
const employeeLogin = async (req, res) => {
    const { email_id, phone, password } = req.body;

    try {
        let employees = [];

        if (email_id) {
            const emailResult = await pool.query(
                'SELECT * FROM op_emp_personal_details WHERE email_id = $1',
                [email_id]
            );
            employees = emailResult.rows;
        }

        if ((!employees.length && phone) || (employees.length && phone)) {
            const phoneResult = await pool.query(
                'SELECT * FROM op_emp_personal_details WHERE phone = $1',
                [phone]
            );
            employees = employees.concat(phoneResult.rows);
        }

        if (!employees.length) {
            return res.status(404).json({ error: 'No employees found with the provided email/phone' });
        }

        const employee = employees.find(
            (emp) => emp.password === password && emp.emp_status_id === 1 
        );

        if (!employee) {
            return res.status(203).json({ message: 'Password incorrect or no active employee found' });
        }

        const employeeId = employee.tbs_op_emp_id;
        const employeeFirstName = employee.emp_first_name;
        const employeeLastName = employee.emp_last_name;
        const typeName = employee.type_name;
        const typeId = employee.type_id;
        const tbs_user_id = employee.tbs_operator_id;

        const professionalResult = await pool.query(
            `SELECT role_type_id 
             FROM op_emp_professional_details 
             WHERE tbs_op_emp_id = $1`,
            [employeeId]
        );

        if (professionalResult.rows.length === 0) {
            return res.status(404).json({ error: 'No professional details found for this employee' });
        }

        const role_id = professionalResult.rows[0].role_type_id;

        const permissionsResult = await pool.query(
            `SELECT crud_permissions, module_permissions 
             FROM active_permissions_tbl 
             WHERE tbs_user_id = $1 AND role_id = $2`,
            [tbs_user_id, role_id]
        );

        const permissions = permissionsResult.rows[0];

        // Fetching operator details (company_name and owner_name)
        const operatorResult = await pool.query(
            `SELECT company_name, owner_name
             FROM operators_tbl
             WHERE tbs_operator_id = $1`,
            [tbs_user_id]
        );

        if (operatorResult.rows.length === 0) {
            return res.status(404).json({ error: 'No operator details found' });
        }

        const { company_name, owner_name } = operatorResult.rows[0];

        const token = jwt.sign({ employeeId }, process.env.JWT_SECRET_KEY, { expiresIn: '1w' });

        res.json({
            id: employeeId,
            operatorId: tbs_user_id,
            user_name: `${employeeFirstName} ${employeeLastName}`,
            type_name: typeName,
            type_id: typeId,
            token,
            crud_permissions: permissions ? permissions.crud_permissions : null,
            module_permissions: permissions ? permissions.module_permissions : null,
            company_name: company_name,      
            owner_name: owner_name        
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


//search employees
const searchEmployees = async (req, res) => {
    let searchTerm = req.params.search_term ? req.params.search_term.trim().toLowerCase() : ''
    const  tbs_operator_id  = req.params.tbs_operator_id

    try {
        let query
        let queryParams

        if (searchTerm) {
            query = `
                SELECT * FROM op_emp_personal_details 
                WHERE tbs_operator_id = $1 AND (LOWER(emp_first_name) LIKE $2
                    OR LOWER(email_id) LIKE $2
                    OR phone::TEXT LIKE $2)
            `
            queryParams = [tbs_operator_id, `%${searchTerm}%`]
        } else {
            query = `SELECT * FROM op_emp_personal_details `
            queryParams = []
        }

        const { rows } = await pool.query(query, queryParams)

        if (rows.length === 0) {
            return res.status(200).json(rows)
        }
        res.status(200).json(rows)

    } catch (error) {
        console.error('Error:', error)
        res.status(200).json({ error: 'Internal server error' })
    }
}

//employee excel import
async function insertData(req, res) {
    const client = await pool.connect();
    
    try {
        // Validate `tbs_operator_id`
        const { tbs_operator_id } = req.body
        if (!tbs_operator_id) {
            res.status(400).send('tbs_operator_id is required in the request body.');
            return;
        }

        const workbook = xlsx.readFile(req.file.path);
        const sheet_name_list = workbook.SheetNames;
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);

        const requiredPersonalColumns = [
            'emp_first_name', 'emp_last_name', 'phone', 'email_id', 'alternate_phone',
            'temp_add', 'temp_zip_code', 'perm_add', 'perm_zip_code',
        ];

        function validateColumns(row, requiredColumns) {
            return requiredColumns.every(column => column in row);
        }

        function excelSerialToDate(serial) {
            const excelEpoch = moment('1899-12-30');
            return excelEpoch.add(serial, 'days').format('YYYY-MM-DD');
        }

        await client.query('BEGIN');

        for (const row of data) {
            if (!validateColumns(row, requiredPersonalColumns)) {
                console.error('Missing required personal columns in row:', row);
                res.status(400).send('Missing required columns in Excel data.');
                await client.query('ROLLBACK');
                return;
            }

            const phoneExistsQuery = `
                SELECT 1 FROM op_emp_personal_details WHERE phone = $1 OR email_id = LOWER($2)
            `;
            const phoneExistsResult = await client.query(phoneExistsQuery, [row.phone, row.email_id]);

            if (phoneExistsResult.rows.length > 0) {
                console.warn('Duplicate phone or email detected, inserting NULL for phone and email:', row);
                row.phone = null;
                row.email_id = null;
            }

            if (!isNaN(row.date_of_birth)) {
                row.date_of_birth = excelSerialToDate(row.date_of_birth);
            }
            if (!isNaN(row.joining_date)) {
                row.joining_date = excelSerialToDate(row.joining_date);
            }

            row.type_name = 'EMPLOYEE';
            row.type_id = 'OPEMP101';
            row.emp_status = 'Draft';
            row.emp_status_id = 0;

            const personalQuery = `
                INSERT INTO op_emp_personal_details (
                    emp_first_name, emp_last_name, phone, email_id, alternate_phone,
                    temp_add, temp_zip_code, 
                    perm_add, perm_zip_code, type_name, 
                    type_id, password, emp_status, emp_status_id, tbs_operator_id
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 
                    $14, $15
                ) RETURNING tbs_op_emp_id
            `;
            const personalValues = [
                row.emp_first_name, row.emp_last_name, row.phone, row.email_id, row.alternate_phone, 
                row.temp_add, row.temp_zip_code,
                row.perm_add, row.perm_zip_code, row.type_name,
                row.type_id, ' ', row.emp_status, row.emp_status_id, tbs_operator_id
            ];
            const personalRes = await client.query(personalQuery, personalValues);
            const employeeId = personalRes.rows[0].tbs_op_emp_id;

            const password = `EMP@${employeeId}`;
            await client.query(
                `UPDATE op_emp_personal_details SET password = $1 WHERE tbs_op_emp_id = $2`,
                [password, employeeId]
            );

            const checkQuery = 'SELECT 1 FROM op_emp_professional_details WHERE tbs_op_emp_id = $1';
            const checkRes = await client.query(checkQuery, [employeeId]);

            if (checkRes.rows.length === 0) {
                const professionalQuery = `
                    INSERT INTO op_emp_professional_details (
                        tbs_op_emp_id, designation, branch, language, qualification, 
                        department, reporting_manager, aadhar_card_number, pan_card_number
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9
                    )
                `;
                const professionalValues = [
                    employeeId, row.designation, row.branch, row.language,
                    row.qualification, row.department, row.reporting_manager, row.aadhar_card_number,
                    row.pan_card_number
                ];
                await client.query(professionalQuery, professionalValues);
            } else {
                const updateQuery = `
                    UPDATE op_emp_professional_details SET
                        designation = $2, branch = $3, language = $4, qualification = $5, 
                        department = $6, reporting_manager = $7, aadhar_card_number = $8, 
                        pan_card_number = $9
                    WHERE tbs_op_emp_id = $1
                `;
                const updateValues = [
                    employeeId, row.designation, row.branch, row.language,
                    row.qualification, row.department, row.reporting_manager, row.aadhar_card_number,
                    row.pan_card_number
                ];
                await client.query(updateQuery, updateValues);
            }
        }

        await client.query('COMMIT');
        res.status(200).send('Data inserted/updated successfully');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error inserting data', err.stack);
        res.status(500).send('Error inserting data');
    } finally {
        client.release();
    }
}

// update status and status_id
const updateEMPStatus = async (req, res) => {
    const id = req.params.tbs_op_emp_id;
    const { emp_status, emp_status_id } = req.body;

    if (!emp_status || !emp_status_id ) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const result = await pool.query(
            `
            UPDATE op_emp_personal_details 
                SET 
                   emp_status = $1, 
                   emp_status_id = $2 
                WHERE 
                    tbs_op_emp_id = $3 
            RETURNING *`,
            [emp_status, emp_status_id, id]
        );

        if (result.rows.length === 0) {
            return res.status(200).json({ message: 'Record not found' });
        }

        const email_id = result.rows[0].email_id
        const password = result.rows[0].password

        const transporter = nodemailer.createTransport({
            host: 'smtp.office365.com',
            port: 587,
            secure: false,
            auth: {
                user: 'no-reply@thebusstand.com',
                pass: 'bdqbqlgqgcnnrxrr',
            } 
        });        

        const mailOptions = {
            from: 'no-reply@thebusstand.com',
            to: email_id,
            subject: 'Status Update Notification - TheBusStand',
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 15px;">
                <div style="background-color: #1F487C; padding: 10px; border-radius: 10px 10px 0 0; text-align: center; color: #fff;">
                    <a href="http://192.168.90.43:8082/opemployee" style="color: #FFFFFF; font-size: 22px; font-weight: 600; margin: 0; text-decoration: none;">
                        THEBUSSTAND.COM
                    </a>
                </div>
                <div style="padding: 20px; background-color: #ffffff; text-align: center; border: 3px solid #1F487C; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #1F487C; font-size: 22px; margin-bottom: 8px;">Welcome to TheBusStand.com!</h2>
                    <p style="font-size: 16px; color: #1F487C; margin-bottom: 15px;">
                        We're excited to have you on board. Your account is now <strong>${emp_status}</strong>.
                    </p>
                    <p style="font-size: 14px; color: #555; margin-bottom: 15px;">
                        Below are your account details:
                    </p>
                    <div style="text-align: left; font-size: 16px; color: #1F487C; background-color: #F4F6F8; padding: 15px; margin: 10px auto; border-radius: 8px; border: 1px solid #D2DAE5;">
                        <p><strong>Email ID:</strong> ${email_id}</p>
                        <p><strong>Password:</strong> ${password}</p>
                        <p><strong>Login URL:</strong> <a href="http://192.168.90.43:8082/opemployee" style="color: #1F487C; text-decoration: none;">Click here to login</a></p>
                    </div>
                    <p style="font-size: 12px; color: #777; margin-top: 15px;">
                        If you have any questions, feel free to reach out to our support team.
                    </p>
                </div>
                <div style="padding: 10px; background-color: #D2DAE5; text-align: center; border-radius: 0 0 10px 10px;">
                    <p style="font-size: 12px; color: #999; margin: 0;">
                        This email was sent by TheBusStand no-reply.
                    </p>
                    <p style="font-size: 12px; color: #999; margin: 5px 0 0 0;">
                        © 2024 TheBusStand. All rights reserved.
                    </p>
                </div>
            </div>`
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'Employee Status is Updated Successfully and Email Notification Sent' });
    } catch (err) {
        console.error('Error updating employee status:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
}

  
  module.exports = { createEMP, updateEMP, deleteEMP, getAllEMPop, getEMP, emailValidation, Phonevalidations, updateEmployeeDetails, getAllEmployees, getEmployeeById, createDetails, fetchdata, fetchdataById, AddEmpDoc, FetchAllDocs, FetchDoc, putEmployee, employeeLogin, searchEmployees, insertData, getEMPByID, FetchAllDocsOnly, FetchDoconly, updateEMPStatus, updateProfile, GETProfileById, GETAllProfile, getAllOPEMPbyOPid, getEmails, getPhones }