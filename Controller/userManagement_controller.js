const pool = require('../config/db')
const nodemailer = require('nodemailer')

//user management-OPERATORS GET CONTROLLER
const getAllOperatorDetails = async (req, res) => {
    try {
        const query = `
            SELECT o.*, od.*
            FROM operators_tbl AS o
            LEFT JOIN operator_details AS od ON o.tbs_operator_id = od.tbs_operator_id
            WHERE o.user_status_id IN (0,1,2,3) ORDER BY created_date DESC
        `;
        const result = await pool.query(query);

        if (result.rowCount === 0) {
            return res.status(200).json({ message: 'No operators with draft or active and inactive status found' ,
                data: result.rows
            });
        }

        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(201).json({ error: 'Database query failed' });
    }
}

// operator_personal_details GET CONTROLLER by User ID
const getOperatorByUserId = async (req, res) => {
    const { tbs_user_id } = req.params;

    try {
        const query = `SELECT o.*, od.*
        FROM operators_tbl AS o
        LEFT JOIN operator_details AS od ON o.tbs_operator_id = od.tbs_operator_id
        WHERE o.tbs_user_id = $1 AND o.user_status_id IN (0,1,2,3) ORDER BY created_date DESC`;

        const result = await pool.query(query, [tbs_user_id]);

        if (result.rowCount === 0) {
            return res.status(200).json({ message: 'Operator not found for the given user ID' });
        }

        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database query failed' });
    }
};

//user management-OPERATORS GETbyID CONTROLLER
const getOperatorByID = async (req, res) => {
    const operatorid = req.params.tbs_operator_id

    try {
        const query = `
            SELECT o.*, od.*
            FROM operators_tbl AS o
            LEFT JOIN operator_details AS od ON o.tbs_operator_id = od.tbs_operator_id
            WHERE o.tbs_operator_id = $1 AND o.user_status_id IN (0,1,2,3) ORDER BY created_date DESC
        `;

        const result = await pool.query(query, [operatorid]);
        res.status(200).send(result.rows);
    } catch (err) {
        console.error('Error executing query', err.stack);
        res.status(201).send('Server error');
    }
}

//user management-OPERATORS PUT status & status_id CONTROLLER
const transporter = nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    auth: {
        user: 'no-reply@thebusstand.com',
        pass: 'bdqbqlgqgcnnrxrr', 
    },
})
const sendMail = async (emailid, subject, htmlContent) => {
    const mailOptions = {
        to: emailid,
        from: 'no-reply@thebusstand.com',
        subject: subject,
        html: htmlContent,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error(`Failed to send email to ${emailid}:`, error.message);
        throw error; 
    }
};

const putUser_Status = async (req, res) => {
    try {
        const tbs_operator_id = req.params.tbs_operator_id;
        const { user_status, user_status_id, req_status, req_status_id } = req.body;

        const queryResult = await pool.query(
            'SELECT owner_name, emailid, password FROM operators_tbl WHERE tbs_operator_id = $1',
            [tbs_operator_id]
        );

        if (queryResult.rows.length === 0) {
            return res.status(404).json({ error: 'Operator not found' });
        }

        const { owner_name, emailid, password } = queryResult.rows[0];

        if (!emailid || !/\S+@\S+\.\S+/.test(emailid)) {
            console.error("Invalid or missing email ID:", emailid);
            return res.status(400).json({ error: 'Invalid email address' });
        }

        let generate_key = null;

        if (user_status_id === 2) {
            const owner_initials = owner_name.slice(0, 3).toUpperCase();
            const randomDigits = Math.round(Math.random() * 1e13).toString().padStart(13, '0');
            generate_key = `${owner_initials}${randomDigits}`;
        }

        await pool.query(
            `UPDATE operators_tbl 
             SET 
                 user_status = $1,
                 user_status_id = $2,
                 generate_key = COALESCE($3, generate_key),
                 req_status = $4,
                 req_status_id = $5
             WHERE tbs_operator_id = $6`,
            [user_status, user_status_id, generate_key, req_status, req_status_id, tbs_operator_id]
        );

        if (user_status_id === 2) {
            const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 15px;">
            <div style="background-color: #1F487C; padding: 10px; border-radius: 10px 10px 0 0; text-align: center; color: #fff;">
              <a href="http://192.168.90.43:8082/operator" style="color: #FFFFFF; font-size: 22px; font-weight: 600; margin: 0; text-decoration: none;">
                THEBUSSTAND.COM
              </a>
            </div>
            <div style="padding: 20px; background-color: #ffffff; text-align: center; border: 3px solid #1F487C; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1F487C; font-size: 22px; margin-bottom: 8px;">Welcome to TheBusStand.com!</h2>
              <p style="font-size: 16px; color: #1F487C; margin-bottom: 15px;">
                We're excited to have you on board. Your account is now <strong>Active</strong>.
              </p>
              <p style="font-size: 14px; color: #555; margin-bottom: 15px;">
                Below are your account details:
              </p>
              <div style="text-align: left; font-size: 16px; color: #1F487C; background-color: #F4F6F8; padding: 15px; margin: 10px auto; border-radius: 8px; border: 1px solid #D2DAE5;">
                <p><strong>Email ID:</strong> ${emailid}</p>
                <p><strong>Password:</strong> ${password}</p>
                <p><strong>Login URL:</strong> <a href=http://192.168.90.43:8082/operator style="color: #1F487C; text-decoration: none;">Click here to login</a></p>
              </div>
              <p style="font-size: 12px; color: #777; margin-top: 15px;">
                If you have any questions, feel free to reach out to our support team.
              </p>
            </div>
            <div style="padding: 10px; background-color: #D2DAE5; text-align: center; border-radius: 0 0 10px 10px;">
              <p style="font-size: 12px; color: #999; margin: 0;">
                This email was sent by TheBusStand no-replay.
              </p>
              <p style="font-size: 12px; color: #999; margin: 5px 0 0 0;">
                © 2024 TheBusStand. All rights reserved.
              </p>
            </div>
          </div>`;
            await sendMail(emailid, 'Welcome to TheBusStand.com', htmlContent);

            return res.status(200).json({
                message: 'User Status is Active and Key generated successfully',
                'Generated Key': generate_key,
            });
        }

        if (user_status_id === 3) {
            const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 15px;">
            <div style="background-color: #1F487C; padding: 10px; border-radius: 10px 10px 0 0; text-align: center; color: #fff;">
              <a href="http://192.168.90.43:8082/operator" style="color: #FFFFFF; font-size: 22px; font-weight: 600; margin: 0; text-decoration: none;">
                THEBUSSTAND.COM
              </a>
            </div>
            <div style="padding: 20px; background-color: #ffffff; text-align: center; border: 3px solid #1F487C; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1F487C; font-size: 22px; margin-bottom: 8px;">Account Status Update</h2>
              <p style="font-size: 16px; color: #1F487C; margin-bottom: 15px;">
                Your account status has been updated to <strong>inactive</strong>.
              </p>
              <p style="font-size: 14px; color: #555; margin-bottom: 15px;">
                If you believe this is an error or have questions, please contact our support team for assistance.
              </p>
              <div style="padding: 10px; text-align: center;">
                <a href="mailto:support@thebusstand.com" style="text-decoration: none; font-size: 16px; color: #fff; background-color: #1F487C; padding: 10px 20px; border-radius: 5px;">
                  Contact Support
                </a>
              </div>
            </div>
            <div style="padding: 10px; background-color: #D2DAE5; text-align: center; border-radius: 0 0 10px 10px;">
              <p style="font-size: 12px; color: #999; margin: 0;">
                This email was sent by TheBusStand Support.
              </p>
              <p style="font-size: 12px; color: #999; margin: 5px 0 0 0;">
                © 2024 TheBusStand. All rights reserved.
              </p>
            </div>
          </div>`;
            await sendMail(emailid, 'Account Status Update', htmlContent);

            return res.status(200).json({
                message: 'User status updated to inactive successfully',
            });
        }

        res.status(200).json({ message: 'User status updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

//user management-PARTNERS GETbyID CONTROLLER
const getAllPartnerDetails = async (req, res) => {
    try {
        const query = `
            SELECT pd.*, pdoc.*
            FROM partner_details AS pd
            LEFT JOIN partner_documents AS pdoc ON pd.tbs_partner_id = pdoc.tbs_partner_id
            WHERE pd.partner_status_id IN (0,1,2,3) ORDER BY created_date DESC `;
        const result = await pool.query(query);

        if (result.rowCount === 0) {
            return res.status(200).json({ message: 'No partners with draft or active status found', data: result.rows });
        }

        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database query failed' });
    }
}

//user management-PARTNERS GETbyID CONTROLLER
const getPartnerByID = async (req, res) => {
    const partnerId = req.params.tbs_partner_id;

    try {
        const query = `
            SELECT pd.*, pdoc.*
            FROM partner_details AS pd
            LEFT JOIN partner_documents AS pdoc ON pd.tbs_partner_id = pdoc.tbs_partner_id
            WHERE pd.tbs_partner_id = $1 AND pd.partner_status_id IN (0,1,2,3)
        `;
        const result = await pool.query(query, [partnerId]);
        res.status(200).send(result.rows);
    } catch (err) {
        console.error('Error executing query', err.stack);
        res.status(500).send('Server error');
    }
}

const getPartnerByUserID = async (req, res) => {
    const { tbs_user_id } = req.params;

    try {
        const query = `
            SELECT pd.*, pdoc.*
            FROM partner_details AS pd
            LEFT JOIN partner_documents AS pdoc ON pd.tbs_partner_id = pdoc.tbs_partner_id
            WHERE pd.tbs_user_id = $1 AND pd.partner_status_id IN (0,1,2,3) ORDER BY created_date DESC
        `;
        const result = await pool.query(query, [tbs_user_id]);

        if (result.rows.length === 0) {
            return res.status(200).json(result.rows);
        }

        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error executing query', err.stack);
        res.status(500).json({ error: 'Server error' });
    }
}

//SEARCH PARTNER DETAILS
const searchPartnerDetails = async (req, res) => {
    try {
        let query;
        let queryParams = [];
        const { tbs_user_id, searchTerm } = req.params;

        if (searchTerm && typeof searchTerm === 'string') {
            const [firstNameSearch, lastNameSearch] = searchTerm.split(' ').map(term => term.trim());
            let paramIndex = 2;
        
            if (firstNameSearch && lastNameSearch) {
                query = `
                    SELECT *
                    FROM partner_details AS pd
                    LEFT JOIN partner_documents AS pod
                        ON pd.tbs_partner_id = pod.tbs_partner_id
                    WHERE partner_status_id NOT IN (4, 5, 6) AND tbs_user_id = $1
                    AND LOWER(pd.partner_first_name) LIKE $${paramIndex}
                    AND LOWER(pd.partner_last_name) LIKE $${paramIndex + 1} `;
                queryParams = [tbs_user_id, `%${firstNameSearch.toLowerCase()}%`, `%${lastNameSearch.toLowerCase()}%`];
            } else {
                query = `
                    SELECT *
                    FROM partner_details AS pd
                    LEFT JOIN partner_documents AS pod
                        ON pd.tbs_partner_id = pod.tbs_partner_id
                    WHERE partner_status_id NOT IN (4, 5, 6) AND tbs_user_id = $1
                    AND (
                        CAST(pd.phone AS TEXT) LIKE $${paramIndex}
                        OR LOWER(pd.partner_first_name) LIKE $${paramIndex}
                        OR LOWER(pd.tbs_partner_id) LIKE $${paramIndex}
                        OR LOWER(pd.partner_last_name) LIKE $${paramIndex}
                        OR LOWER(pd.emailid) LIKE $${paramIndex}
                        OR LOWER(pd.occupation) LIKE $${paramIndex}
                        OR LOWER(TO_CHAR(created_date, 'DD Mon')) LIKE $${paramIndex}
                    ) `;
                queryParams = [tbs_user_id, `%${searchTerm.toLowerCase()}%`];
            }
        }else {
            query = `
                SELECT *
                FROM partner_details
                WHERE partner_status_id NOT IN (4, 5, 6) `;
        }

        const result = await pool.query(query, queryParams);
        res.json(result.rows);
    } catch (err) {
        console.error('Error executing query', err);
        res.status(500).json({ message: "Error searching records" });
    }
}

//SEARCH CLIENT DETAILS
const searchClientDetails = async (req, res) => {
    try {
        let query;
        let queryParams = [];
        const { tbs_user_id, searchTerm } = req.params;

        if (searchTerm && typeof searchTerm === 'string') {
            const searchValue = `%${searchTerm.toLowerCase()}%`;

            query = `
                SELECT *
                FROM client_company_details
                WHERE tbs_user_id = $1 AND (LOWER(owner_name) LIKE $2
                OR LOWER(company_name) LIKE $2
                OR LOWER(tbs_client_id) LIKE $2
                OR LOWER(business_background) LIKE $2
                OR CAST(phone AS TEXT) LIKE $2
                OR LOWER(emailid) LIKE $2
                OR LOWER(TO_CHAR(created_date, 'DD Mon')) LIKE $2) `;

            queryParams = [tbs_user_id, searchValue];
        } else {
            query = `SELECT * FROM client_company_details WHERE tbs_user_id = $1`;
            queryParams = [tbs_user_id]
        }

        const result = await pool.query(query, queryParams);
        res.json(result.rows);
    } catch (err) {
        console.error('Error executing query', err);
        res.status(500).json({ message: "Error searching records" });
    }
}

//SEARCH PRODUCT OWNER-EMPLOYEE DETAILS
const searchProEmpDetails = async (req, res) => {
    try {
        let query;
        let queryParams = [];

        const searchTerm = req.params.searchTerm;
        const { owner_id } = req.params

        if (searchTerm && typeof searchTerm === 'string') {
            const searchValue = `%${searchTerm.toLowerCase()}%`;

            query = `
                SELECT *
                FROM pro_emp_personal_details AS pop
                LEFT JOIN pro_emp_professional_details AS po ON pop.tbs_pro_emp_id = po.tbs_pro_emp_id
                WHERE owner_id = $1 AND (LOWER(pop.emp_first_name) LIKE $2
                   OR CAST(pop.phone AS TEXT) LIKE $2
                   OR LOWER(pop.email_id) LIKE $2
                   OR LOWER(pop.tbs_pro_emp_id) LIKE $2
                   OR LOWER(po.designation) LIKE $2
                   OR LOWER(po.role_type) LIKE $2
                   OR LOWER(TO_CHAR(po.created_date, 'DD Mon')) LIKE $2)
            `;

            queryParams = [owner_id, searchValue];
        } else {
            query = `
                SELECT *
                FROM pro_emp_personal_details
            `;
        }

        const result = await pool.query(query, queryParams);
        res.json(result.rows);
    } catch (err) {
        console.error('Error executing query', err);
        res.status(500).json({ message: "Error searching records" });
    }
} 

const getClientDetails = async (req, res) => {
    try {
        const query = `
            SELECT 
                ccd.*, 
                cad.*, 
                csd.*
            FROM 
                client_company_details ccd
            LEFT JOIN 
                client_address_details cad ON ccd.tbs_client_id = cad.tbs_client_id
            LEFT JOIN 
                client_gst_details csd ON ccd.tbs_client_id = csd.tbs_client_id ORDER BY created_date DESC
        `
        
        const result = await pool.query(query)

        if (result.rowCount === 0) {
            return res.status(201).json(result.rows)
        }

        res.status(200).json(result.rows)
    } catch (err) {
        console.error('Error fetching client details', err)
        res.status(500).json({ error: 'Database query failed' })
    }
}

const getClientDetailsByUserId = async (req, res) => {
    const { tbs_user_id } = req.params; 

    try {
        const query = `
            SELECT 
                ccd.*, 
                cad.*, 
                csd.*
            FROM 
                client_company_details ccd
            LEFT JOIN 
                client_address_details cad ON ccd.tbs_client_id = cad.tbs_client_id
            LEFT JOIN 
                client_gst_details csd ON ccd.tbs_client_id = csd.tbs_client_id
            WHERE
                ccd.tbs_user_id = $1
            ORDER BY 
                ccd.created_date DESC
        `;

        const result = await pool.query(query, [tbs_user_id]); 

        if (result.rowCount === 0) {
            return res.status(200).json({ message: 'No client details found for the provided user ID' });
        }

        res.status(200).json(result.rows); 
    } catch (err) {
        console.error('Error fetching client details by user ID', err);
        res.status(500).json({ error: 'Database query failed' });
    }
};

module.exports = { getAllOperatorDetails, getOperatorByID, putUser_Status, getAllPartnerDetails, getPartnerByID, searchPartnerDetails, searchClientDetails, searchProEmpDetails, getOperatorByUserId, getPartnerByUserID, getClientDetails, getClientDetailsByUserId }