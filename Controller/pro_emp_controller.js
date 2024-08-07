const pool = require('../config/db')
const jwt = require('jsonwebtoken')
const xlsx = require('xlsx')
const moment = require('moment')


//employee-peraonal-details POST CONTROLLER
const createEMPpro = async (req, res, next) => {
  const { emp_first_name, emp_last_name, phone, email_id, alternate_phone, date_of_birth, gender, blood_group, role_type, role_type_id } = req.body

  if (!emp_first_name || !emp_last_name || !phone || !email_id || !alternate_phone || !date_of_birth || !gender || !blood_group || !role_type || !role_type_id) {
      return res.status(400).json({ error: 'Missing required fields' })
  }

  const type_name = 'EMPLOYEE'
  const type_id = 'EMP101'
  const emp_status = 'active'
  const emp_status_id = 1

  try {
      await pool.query('BEGIN')

      const result = await pool.query(
          `INSERT INTO pro_emp_personal_details (emp_first_name, emp_last_name, phone, email_id, alternate_phone, date_of_birth, gender, blood_group, type_name, type_id, emp_status, emp_status_id, role_type, role_type_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
          [emp_first_name, emp_last_name, phone, email_id, alternate_phone, date_of_birth, gender, blood_group, type_name, type_id, emp_status, emp_status_id, role_type, role_type_id]
      )

      const tbs_pro_emp_id = result.rows[0].tbs_pro_emp_id
      console.log(`New Employee created with ID: ${tbs_pro_emp_id}`)
      
      const password = `EMP@${tbs_pro_emp_id}`
      await pool.query(
          `UPDATE pro_emp_personal_details SET password = $1 WHERE tbs_pro_emp_id = $2`,
          [password, tbs_pro_emp_id]
      )

      await pool.query('COMMIT')

      res.status(201).json({
          message: 'Employee Created Successfully',
          id: tbs_pro_emp_id,
          password: password,
          type_name: type_name,
          type_id: type_id
      })

  } catch (err) {
      await pool.query('ROLLBACK')
      console.error('Error creating employee:', err.message)
      res.status(500).json({ error: err.message })
  }
}



  //employee-peraonal-details PUT CONTROLLER
  const updateEMPpro = async (req, res) => {
    const id = req.params.tbs_pro_emp_id;
    const { emp_first_name, emp_last_name, phone, email_id, alternate_phone, date_of_birth, gender, blood_group, role_type, role_type_id } = req.body

    if (!emp_first_name || !emp_last_name || !phone || !email_id || !alternate_phone || !date_of_birth || !gender || !blood_group || !role_type || !role_type_id) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const result = await pool.query(
            `
            UPDATE pro_emp_personal_details 
                SET 
                   emp_first_name = $1, 
                   emp_last_name = $2, 
                   phone = $3, 
                   email_id = $4, 
                   alternate_phone = $5, 
                   date_of_birth = $6, 
                   gender = $7, 
                   blood_group = $8, 
                   role_type = $9, 
                   role_type_id = $10 
                WHERE 
                    tbs_pro_emp_id = $11
            RETURNING *`,
            [emp_first_name, emp_last_name, phone, email_id, alternate_phone, date_of_birth, gender, blood_group, role_type, role_type_id, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Record not found' });
        }

        res.status(200).json('Employee Personal Details are Updated Successfully');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
  }

  //PRODUCT OWNER EMPLOYEE PROFILE-IMG
  const updateProfilepro = async (req, res) => {
    const id = req.params.tbs_pro_emp_id;
   
    const profile_img = req.file ? `/pro_employee_documents/${req.file.filename}` : null;
    console.log('profile_img:', profile_img);

    if (!profile_img == null) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const result = await pool.query(
            `
            UPDATE pro_emp_personal_details 
                SET 
                   profile_img = $1
                WHERE 
                    tbs_pro_emp_id = $2 
            RETURNING *`,
            [profile_img, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Record not found' });
        }

        res.status(200).json('Employee Profile image Updated Successfully');
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
            return res.status(404).json({ error: 'Record not found' });
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
          return res.status(404).json({ error: 'Record not found' });
      }

      res.status(200).json(result.rows);
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
}


  //employee-peraonal-details DELETE CONTROLLER
  const deleteEMPpro = async (req, res) => {
    const id  = req.params.tbs_pro_emp_id
    try {
      const result = await pool.query('DELETE FROM pro_emp_personal_details WHERE tbs_pro_emp_id = $1 RETURNING *', [id])
      if (result.rows.length === 0) {
        return res.status(201).json({ error: 'Record not found' })
      }
      res.status(200).json(`Employee Personal Details are Deleted Successfully`)
    } catch (err) {
      res.status(201).json({ error: err.message })
    }
  }

  //employee-peraonal-details GET CONTROLLER
  const getAllEMPpro = async (req, res) => {

    try {
      const result = await pool.query(`
      SELECT e.*, emp.*
      FROM pro_emp_personal_details AS e
      LEFT JOIN pro_emp_professional_details AS emp ON e.tbs_pro_emp_id = emp.tbs_pro_emp_id
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
        perm_add, perm_country, perm_state, perm_city, perm_zip_code
    } = req.body

    try {
        const query = `
            UPDATE pro_emp_personal_details
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
                perm_zip_code = $10
            WHERE 
                tbs_pro_emp_id = $11
        `

        await pool.query(query, [
            temp_add, temp_country, temp_state, temp_city, temp_zip_code,
            perm_add, perm_country, perm_state, perm_city, perm_zip_code,
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
                            perm_zip_code
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
                            perm_zip_code  
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
    const { joining_date, role_type, designation, branch, official_email_id, years_of_experience, department, reporting_manager } = req.body

    const query = `
        UPDATE pro_emp_professional_details
        SET joining_date = $1, role_type= $2, designation = $3, branch = $4, official_email_id = $5,
            years_of_experience = $6, department = $7, reporting_manager = $8
        WHERE tbs_pro_emp_id = $9
        RETURNING *
    `

    try {
        const result = await pool.query(query, [joining_date, role_type, designation, branch, official_email_id, years_of_experience, department, reporting_manager, tbs_pro_emp_id])
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
                          joining_date, role_type, designation, branch, official_email_id,
          years_of_experience, department, reporting_manager
  
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
                          joining_date, designation, branch, official_email_id,
          years_of_experience, department, reporting_manager
  
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
  const { tbs_pro_emp_id } = req.params
  const { aadhar_card_number, pan_card_number } = req.body

  if( !aadhar_card_number || !pan_card_number ){
    return res.status(400).json({ error: 'Missing required fields' })
  }

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

const education_certificate_file =req.files && req.files['educational_certificate'] ? {
    type: req.files['educational_certificate'][0].mimetype,
    filename: req.files['educational_certificate'][0].filename,
    path: req.files['educational_certificate'][0].path,
    size: req.files['educational_certificate'][0].size,
    created_date: new Date().toISOString()
} : null

const work_experience_file =req.files && req.files['educational_certificate'] ? {
    type: req.files['educational_certificate'][0].mimetype,
    filename: req.files['educational_certificate'][0].filename,
    path: req.files['educational_certificate'][0].path,
    size: req.files['educational_certificate'][0].size,
    created_date: new Date().toISOString()
} : null


const other_certificate_file = req.files && req.files['other_documents'] ? {
    type: req.files['other_documents'][0].mimetype,
    filename: req.files['other_documents'][0].filename,
    path: req.files['other_documents'][0].path,
    size: req.files['other_documents'][0].size,
    created_date: new Date().toISOString()
} : null
  
  const aadhar_card_doc = req.files && req.files['aadhar_card_doc'] ? `/pro_employee_documents/${req.files['aadhar_card_doc'][0].filename}` : null
  const pan_card_doc = req.files && req.files['pan_card_doc'] ? `/pro_employee_documents/${req.files['pan_card_doc'][0].filename}` : null
  const educational_certificate = req.files && req.files['educational_certificate'] ? `/pro_employee_documents/${req.files['educational_certificate'][0].filename}` : null
  const other_documents = req.files && req.files['other_documents'] ? `/pro_employee_documents/${req.files['other_documents'][0].filename}` : null
  const work_experience_certificate = req.files && req.files['work_experience_certificate'] ? `/pro_employee_documents/${req.files['work_experience_certificate'][0].filename}` : null

  const query = `
      UPDATE pro_emp_professional_details
      SET 
          aadhar_card_number = $1, aadhar_card_doc = $2, pan_card_number = $3,
          pan_card_doc = $4, work_experience_certificate = $5, educational_certificate = $6,
          other_documents = $7, aadhar_card_file = $8, pancard_file = $9, education_certificate_file = $10, work_experience_file = $11, other_certificate_file = $12, updated_date = now()
      WHERE tbs_pro_emp_id = $13
      RETURNING *
  `

  try {
      const result = await pool.query(query, [aadhar_card_number, aadhar_card_doc,
          pan_card_number, pan_card_doc, work_experience_certificate,
          educational_certificate, other_documents, aadhar_card_file, pancard_file, education_certificate_file, work_experience_file, other_certificate_file, tbs_pro_emp_id
      ])
      if (result.rows.length === 0) {
          return res.status(201).json({ error: 'Employee not found' })
      }
      res.status(200).json(`Employee professional documents are uploaded successfully`)
  } catch (error) {
      console.error('Error:', error)
      res.status(201).json({ error: 'Internal server error' })
  }
}

//employee-professional-documents GET CONTROLLER
const FetchAllDocspro = async (req, res) => {
  const query = `SELECT 
                      tbs_pro_emp_id, aadhar_card_number, aadhar_card_doc,
                      pan_card_number, pan_card_doc, work_experience_certificate,
                      educational_certificate, other_documents 
                FROM pro_emp_professional_details`

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

  const query = `SELECT tbs_pro_emp_id, aadhar_card_number, aadhar_card_doc,
  pan_card_number, pan_card_doc, work_experience_certificate,
  educational_certificate, other_documents FROM pro_emp_professional_details WHERE tbs_pro_emp_id = $1`

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
                        tbs_pro_emp_id, aadhar_card_doc, aadhar_card_file,
                       pan_card_doc, pancard_file, work_experience_certificate, work_experience_file,
                        educational_certificate, education_certificate_file, other_documents, other_certificate_file
                  FROM pro_emp_professional_details`
  
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
  
    const query = `SELECT tbs_pro_emp_id, aadhar_card_doc, aadhar_card_file,
    pan_card_doc, pancard_file, work_experience_certificate, work_experience_file,
     educational_certificate, education_certificate_file, other_documents, other_certificate_file FROM pro_emp_professional_details WHERE tbs_pro_emp_id = $1`
  
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
    official_email_id,
    years_of_experience,
    department,
    reporting_manager,
    aadhar_card_number,
    pan_card_number
  } = req.body

  const profile_img = req.files['profile_img'] ? `/pro_employee_documents/${req.files['profile_img'][0].filename}` : null
  const aadhar_card_doc = req.files['aadhar_card_doc'] ? `/pro_employee_documents/${req.files['aadhar_card_doc'][0].filename}` : null
  const pan_card_doc = req.files['pan_card_doc'] ? `/pro_employee_documents/${req.files['pan_card_doc'][0].filename}` : null
  const work_experience_certificate = req.files['work_experience_certificate'] ? `/pro_employee_documents/${req.files['work_experience_certificate'][0].filename}` : null
  const educational_certificate = req.files['educational_certificate'] ? `/pro_employee_documents/${req.files['educational_certificate'][0].filename}` : null
  const other_documents = req.files['other_documents'] ? `/pro_employee_documents/${req.files['other_documents'][0].filename}` : null

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

  const education_certificate_file = req.files && req.files['educational_certificate'] ? {
    type: req.files['educational_certificate'][0].mimetype,
    filename: req.files['educational_certificate'][0].filename,
    path: req.files['educational_certificate'][0].path,
    size: req.files['educational_certificate'][0].size,
    created_date: new Date().toISOString()
  } : null

  const work_experience_file = req.files && req.files['educational_certificate'] ? {
    type: req.files['educational_certificate'][0].mimetype,
    filename: req.files['educational_certificate'][0].filename,
    path: req.files['educational_certificate'][0].path,
    size: req.files['educational_certificate'][0].size,
    created_date: new Date().toISOString()
  } : null

  const other_certificate_file = req.files && req.files['other_documents'] ? {
    type: req.files['other_documents'][0].mimetype,
    filename: req.files['other_documents'][0].filename,
    path: req.files['other_documents'][0].path,
    size: req.files['other_documents'][0].size,
    created_date: new Date().toISOString()
  } : null

  console.log('profile_img:', profile_img)
  console.log('aadhar_card_doc:', aadhar_card_doc)
  console.log('pan_card_doc:', pan_card_doc)
  console.log('work_experience_certificate:', work_experience_certificate)
  console.log('educational_certificate:', educational_certificate)
  console.log('other_documents:', other_documents)

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
        joining_date = $1, 
        designation = $2, 
        branch = $3, 
        official_email_id = $4,
        years_of_experience = $5, 
        department = $6, 
        reporting_manager = $7,
        aadhar_card_number = $8, 
        aadhar_card_doc = $9, 
        pan_card_number = $10,
        pan_card_doc = $11, 
        work_experience_certificate = $12, 
        educational_certificate = $13,
        other_documents = $14, 
        aadhar_card_file = $15, 
        pancard_file = $16, 
        education_certificate_file = $17, 
        work_experience_file = $18, 
        other_certificate_file = $19, 
        updated_date = now()
      WHERE tbs_pro_emp_id = $20
      RETURNING *
    `
    const professionalDetailsValues = [
      joining_date,
      designation,
      branch,
      official_email_id,
      years_of_experience,
      department,
      reporting_manager,
      aadhar_card_number,
      aadhar_card_doc,
      pan_card_number,
      pan_card_doc,
      work_experience_certificate,
      educational_certificate,
      other_documents,
      aadhar_card_file,
      pancard_file,
      education_certificate_file,
      work_experience_file,
      other_certificate_file,
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
  const { email_id, phone, password } = req.body

  try {
      let employee

      if (email_id) {
          const emailResult = await pool.query('SELECT * FROM pro_emp_personal_details WHERE email_id = $1', [email_id])
          employee = emailResult.rows[0]
      }

      if (!employee || phone) {
          const phoneResult = await pool.query('SELECT * FROM pro_emp_personal_details WHERE phone = $1', [phone])
          employee = phoneResult.rows[0]
      }

      if (!employee) {
          return res.status(201).json({ error: 'No employee found with provided email/phone' })
      }

      if (employee.password !== password) {
          return res.status(201).json({ error: 'Password incorrect' })
      }

      const employeeId = employee.tbs_pro_emp_id
      const employeeFirstName = employee.emp_first_name
      const employeeLastName = employee.emp_last_name
      const typeName = employee.type_name
      const typeId = employee.type_id

      const permissionsResult = await pool.query(`SELECT crud_permissions, module_permissions FROM active_permissions_tbl WHERE user_id = 'EMP101'`)
      const permissions = permissionsResult.rows[0]

      const token = jwt.sign({ employeeId }, process.env.JWT_SECRET_KEY, { expiresIn: '1w' })

      res.json({ 
          id: employeeId, 
          user_name: employeeFirstName + ' ' + employeeLastName,
          type_name : typeName,
          type_id : typeId,
          token: token,
          crud_permissions: permissions ? permissions.crud_permissions : null,
          module_permissions: permissions ? permissions.module_permissions : null
      })

  } catch (error) {
      res.status(200).json({ error: error.message })
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
async function insertDatapro(req, res) {
    const client = await pool.connect()
    try {
      const workbook = xlsx.readFile(req.file.path)
      const sheet_name_list = workbook.SheetNames
      const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]])
  
      // Convert Excel serial number to date
      function excelSerialToDate(serial) {
        const excelEpoch = moment('1899-12-30')
        return excelEpoch.add(serial, 'days').format('YYYY-MM-DD')
      }
  
      // Begin transaction
      await client.query('BEGIN')
  
      for (const row of data) {
        // Convert date_of_birth and joining_date if they are in Excel serial number format
        if (!isNaN(row.date_of_birth)) {
          row.date_of_birth = excelSerialToDate(row.date_of_birth)
        }
        if (!isNaN(row.joining_date)) {
          row.joining_date = excelSerialToDate(row.joining_date)
        }
  
        // Insert data into pro_emp_personal_details
        const personalQuery = `
          INSERT INTO pro_emp_personal_details (
            emp_first_name, emp_last_name, phone, email_id, alternate_phone, date_of_birth, gender, 
            blood_group, temp_add, temp_country, temp_state, temp_city, temp_zip_code, 
            perm_add, perm_country, perm_state, perm_city, perm_zip_code, type_name, 
            type_id, password, emp_status, emp_status_id, token, profile_img
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 
            $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25
          ) RETURNING tbs_pro_emp_id
        `
        const personalValues = [
          row.emp_first_name, row.emp_last_name, row.phone, row.email_id, row.alternate_phone, row.date_of_birth, row.gender,
          row.blood_group, row.temp_add, row.temp_country, row.temp_state, row.temp_city, row.temp_zip_code,
          row.perm_add, row.perm_country, row.perm_state, row.perm_city, row.perm_zip_code, row.type_name,
          row.type_id, row.password, row.emp_status, row.emp_status_id, row.token, row.profile_img
        ]
        const personalRes = await client.query(personalQuery, personalValues)
        const employeeId = personalRes.rows[0].tbs_pro_emp_id
  
        // Check if employeeId already exists in pro_emp_professional_details
        const checkQuery = 'SELECT 1 FROM pro_emp_professional_details WHERE tbs_pro_emp_id = $1'
        const checkRes = await client.query(checkQuery, [employeeId])
  
        if (checkRes.rows.length === 0) {
          // Insert data into pro_emp_professional_details if not exists
          const professionalQuery = `
            INSERT INTO pro_emp_professional_details (
              tbs_pro_emp_id, joining_date, designation, branch, official_email_id, years_of_experience, 
              department, reporting_manager, aadhar_card_number, aadhar_card_doc, pan_card_number, 
              pan_card_doc, work_experience_certificate, educational_certificate, other_documents, 
              role_type
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
            )
          `
          const professionalValues = [
            employeeId, row.joining_date, row.designation, row.branch, row.official_email_id,
            row.years_of_experience, row.department, row.reporting_manager, row.aadhar_card_number,
            row.aadhar_card_doc, row.pan_card_number, row.pan_card_doc, row.work_experience_certificate,
            row.educational_certificate, row.other_documents, row.role_type
          ]
          await client.query(professionalQuery, professionalValues)
        } else {
          // Update existing data in pro_emp_professional_details
          const updateQuery = `
            UPDATE pro_emp_professional_details SET
              joining_date = $2, designation = $3, branch = $4, official_email_id = $5, years_of_experience = $6, 
              department = $7, reporting_manager = $8, aadhar_card_number = $9, aadhar_card_doc = $10, 
              pan_card_number = $11, pan_card_doc = $12, work_experience_certificate = $13, 
              educational_certificate = $14, other_documents = $15, role_type = $16
            WHERE tbs_pro_emp_id = $1
          `
          const updateValues = [
            employeeId, row.joining_date, row.designation, row.branch, row.official_email_id,
            row.years_of_experience, row.department, row.reporting_manager, row.aadhar_card_number,
            row.aadhar_card_doc, row.pan_card_number, row.pan_card_doc, row.work_experience_certificate,
            row.educational_certificate, row.other_documents, row.role_type
          ]
          await client.query(updateQuery, updateValues)
        }
      }
  
      // Commit transaction
      await client.query('COMMIT')
      res.status(200).send('Data inserted/updated successfully')
    } catch (err) {
      // Rollback transaction in case of error
      await client.query('ROLLBACK')
      console.error('Error inserting data', err.stack)
      res.status(201).send('Error inserting data')
    } finally {
      // Release the client back to the pool
      client.release()
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
};
  
  module.exports = { createEMPpro, updateEMPpro, deleteEMPpro, getAllEMPpro, getEMPpro, emailValidationpro, Phonevalidationspro, updateEmployeeDetailspro, getAllEmployeespro, getEmployeeByIdpro, createDetailspro, fetchdatapro, fetchdataByIdpro, AddEmpDocpro, FetchAllDocspro, FetchDocpro, putEmployeepro, employeeLoginpro, searchEmployeespro, insertDatapro, getEMPByIDpro, FetchAllDocsOnlypro, FetchDoconlypro, updateEMPStatusPro, updateProfilepro,GETProfilepro, GETAllProfilepro }