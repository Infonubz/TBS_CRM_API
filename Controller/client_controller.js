const pool = require('../config/db')
const xlsx = require('xlsx')
const nodemailer = require('nodemailer')

//check client email exist or not
const getEmails = async (req, res) => {
    const { emailid } = req.body;
  
    try {
        if (!emailid) {
            return res.status(400).json({ success: false, message: "Email ID is required" });
        }
  
        const emailQuery = `SELECT 1 FROM client_company_details WHERE emailid = $1 LIMIT 1`;
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
  
  //check client mobile exist or not
  const getPhones = async (req, res) => {
    const { phone } = req.body;
  
    try {
        if (!phone) {
            return res.status(400).json({ success: false, message: "Phone Number is required" });
        }
  
        const PhoneQuery = `SELECT 1 FROM client_company_details WHERE phone = $1 LIMIT 1`;
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

// CLIENT COMPANY details POST CONTROLLER
const postClient = async (req, res) => {
    const { company_name, owner_name, phone, emailid, type_of_constitution, business_background, web_url, req_status, req_status_id, tbs_user_id } = req.body;

    if (!company_name || !owner_name || !phone || !emailid || !type_of_constitution || !business_background || !tbs_user_id) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const type_name = 'CLIENT';
    const type_id = 'CLT101';
    const status = 'draft';
    const status_id = 0;
    const company_logo = req.file ? `/client_files/${req.file.filename}` : null;

    try {
        if (tbs_user_id.startsWith('tbs-pro_emp')) {
            const empResult = await pool.query(
                `SELECT emp_status_id FROM pro_emp_personal_details WHERE tbs_pro_emp_id = $1`,
                [tbs_user_id]
            );

            if (empResult.rows.length === 0) {
                return res.status(400).json({ error: 'Employee ID does not exist.' });
            }

            const empStatusId = empResult.rows[0].emp_status_id;
            if (empStatusId !== 1) {
                return res.status(400).json({ error: 'Employee ID is not active.' });
            }
        } else if (tbs_user_id.startsWith('tbs-pro')) {
            const proResult = await pool.query(
                `SELECT 1 FROM product_owner_tbl WHERE owner_id = $1`,
                [tbs_user_id]
            );

            if (proResult.rows.length === 0) {
                return res.status(400).json({ error: 'Product owner ID does not exist.' });
            }
        } else {
            return res.status(400).json({ error: 'Invalid tbs_user_id format.' });
        }

        const result = await pool.query(
            `INSERT INTO client_company_details 
             (company_name, owner_name, phone, emailid, type_of_constitution, business_background, web_url, type_name, type_id, status, status_id, company_logo, req_status, req_status_id, tbs_user_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING tbs_client_id`,
            [company_name, owner_name, phone, emailid, type_of_constitution, business_background, web_url, type_name, type_id, status, status_id, company_logo, 'Pending', 0, tbs_user_id]
        );

        const tbs_client_id = result.rows[0].tbs_client_id;

        const password = `CLT@${tbs_client_id}`;

        await pool.query(
            `UPDATE client_company_details SET password = $1 WHERE tbs_client_id = $2`,
            [password, tbs_client_id]
        );

        res.status(201).json({
            message: 'Client Created Successfully',
            id: tbs_client_id,
            password: password,
            type_name: type_name,
            type_id: type_id
        });
    } catch (err) {
        console.error('Error inserting into database:', err);
        res.status(500).json({ error: 'Database insertion failed' });
    }
}

// PROFILE IMAGE GETbYID API
const GetClientProfileImgById = async (req, res) => {
    const tbs_client_id = req.params.tbs_client_id;

    try {
        const ClientsQuery = `
            SELECT company_logo FROM public.client_company_details 
            WHERE tbs_client_id = $1;
        `;
        const ClientsValues = [tbs_client_id];
        const ClientsResult = await pool.query(ClientsQuery, ClientsValues);

        if (ClientsResult.rows.length === 0) {
            return res.status(201).json({ message: 'No Clients found' });
        }

        res.status(200).json(ClientsResult.rows[0]);
    } catch (error) {
        console.error('Error retrieving client profile image:', error);
        res.status(500).json({ error: 'Error retrieving client profile image.' });
    }
}

// PROFILE IMAGE GETbYID API
const GetClientProfileImg = async (req, res) => {
    try {
        const ClientsQuery = `
            SELECT company_logo FROM public.client_company_details;
        `;
        const ClientsResult = await pool.query(ClientsQuery);

        if (ClientsResult.rows.length === 0) {
            return res.status(201).json({ message: 'No Clients found' });
        }

        res.status(200).json(ClientsResult.rows);
    } catch (error) {
        console.error('Error retrieving client profile images:', error);
        res.status(500).json({ error: 'Error retrieving client profile images.' });
    }
};

// PUT STATUS ONLY
const putClientCompanyDetails = async (req, res) => {
    const { tbs_client_id } = req.params;
    const { status, status_id } = req.body;

    try {
        const updateQuery = `
            UPDATE client_company_details
            SET 
                status = COALESCE($1, status),
                status_id = COALESCE($2, status_id)
            WHERE 
                tbs_client_id = $3;
        `;
        await pool.query(updateQuery, [status, status_id, tbs_client_id]);

        const fetchEmailQuery = `
            SELECT emailid 
            FROM client_company_details 
            WHERE tbs_client_id = $1;
        `;
        const { rows } = await pool.query(fetchEmailQuery, [tbs_client_id]);

        if (rows.length === 0) {
            return res.status(404).send('Client not found.');
        }

        const email_id = rows[0].emailid;

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
            from: 'no-reply@thebusstand.com',
            to: email_id,
            subject: 'Status Update Notification - TheBusStand',
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 15px;">
            <div style="background-color: #1F487C; padding: 10px; border-radius: 10px 10px 0 0; text-align: center; color: #fff;">
                <a style="color: #FFFFFF; font-size: 22px; font-weight: 600; margin: 0; text-decoration: none;">
                    THEBUSSTAND.COM
                </a>
            </div>
            <div style="padding: 20px; background-color: #ffffff; text-align: center; border: 3px solid #1F487C; border-radius: 0 0 10px 10px;">
                <h2 style="color: #1F487C; font-size: 22px; margin-bottom: 8px;">Status Update Notification</h2>
                <p style="font-size: 16px; color: #1F487C; margin-bottom: 15px;">
                    Your account status has been updated to: <strong>${status || 'Unchanged'}</strong>.
                </p>
                <p style="font-size: 14px; color: #555; margin-bottom: 15px;">
                    If you have any questions, feel free to reach out to our support team.
                </p>
                <a href="mailto:support@thebusstand.com" 
                style="display: inline-block; padding: 10px 20px; font-size: 14px; font-weight: bold; color: #ffffff; text-decoration: none; background-color: #1F487C; border-radius: 5px; margin-top: 15px;">
                Contact Support
                </a>
            </div>
            <div style="padding: 10px; background-color: #D2DAE5; text-align: center; border-radius: 0 0 10px 10px;">
                <p style="font-size: 12px; color: #999; margin: 0;">
                    This email was sent by TheBusStand no-reply.
                </p>
                <p style="font-size: 12px; color: #999; margin: 5px 0 0 0;">
                    © 2024 TheBusStand. All rights reserved.
                </p>
            </div>
        </div> `,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).send('Client Status updated and email notification sent successfully.');
    } catch (error) {
        console.error('Error updating client status or sending email:', error);
        res.status(500).send('Failed to update client details or send email notification.');
    }
}   

// PUT CONTROLLER
    const putClient = async (req, res) => {
        const { company_name, owner_name, phone, emailid, type_of_constitution, business_background, web_url, req_status, req_status_id } = req.body

        const tbs_client_id = req.params.tbs_client_id
        const company_logo = req.file ? `/client_files/${req.file.filename}` : null;
    
        try {
            await pool.query(
                `UPDATE client_company_details
                SET 
                    company_name = COALESCE($1, company_name),
                    owner_name = COALESCE($2, owner_name),
                    phone = COALESCE($3, phone),
                    emailid = COALESCE($4, emailid),
                    type_of_constitution = COALESCE($5, type_of_constitution),
                    business_background = COALESCE($6, business_background),
                    web_url = COALESCE($7, web_url),
                    company_logo = COALESCE($8, company_logo),
                    req_status = COALESCE($9, req_status),
                    req_status_id = COALESCE($10, req_status_id)
                WHERE 
                    tbs_client_id = $11; `,
                [company_name, owner_name, phone, emailid, type_of_constitution, business_background, web_url, company_logo, req_status, req_status_id, tbs_client_id]
            )
            res.status(200).json({
                message: 'Client Updated Successfully',
                id: tbs_client_id
            })
        } catch (err) {
            console.error('Error updating database:', err)
            res.status(201).json({ error: 'Database update failed' })
        }
    }
    

// client_details DELETE CONTROLLER
const deleteClient = async (req, res) => {
    const client = await pool.connect();
    try {
        const tbs_client_id = req.params.tbs_client_id;

        const clientCompanyQuery = 'SELECT * FROM client_company_details WHERE tbs_client_id = $1';
        const clientCompanyResult = await client.query(clientCompanyQuery, [tbs_client_id]);

        if (clientCompanyResult.rows.length === 0) {
            return res.status(201).send(`Client with ID ${tbs_client_id} not found`);
        }

        const clientCompanyDetails = clientCompanyResult.rows[0];

        const clientAddressQuery = 'SELECT * FROM client_address_details WHERE tbs_client_id = $1';
        const clientAddressResult = await client.query(clientAddressQuery, [tbs_client_id]);

        const clientGstQuery = 'SELECT * FROM client_gst_details WHERE tbs_client_id = $1';
        const clientGstResult = await client.query(clientGstQuery, [tbs_client_id]);

        const deletedData = {
            tbs_client_id, 
            clientCompanyDetails,
            clientAddressDetails: clientAddressResult.rows,
            clientGstDetails: clientGstResult.rows
        };

        const recycleInsertQuery = 'INSERT INTO recycle_bin (module_name, module_id, deleted_data, module_get_id) VALUES ($1, $2, $3::jsonb, $4) RETURNING tbs_recycle_id';
        const recycleResult = await client.query(recycleInsertQuery, ['client', tbs_client_id, JSON.stringify(deletedData), 7]);

        const recycleId = recycleResult.rows[0].tbs_recycle_id;

        // await client.query('DELETE FROM client_address_details WHERE tbs_client_id = $1', [tbs_client_id]);
        // await client.query('DELETE FROM client_gst_details WHERE tbs_client_id = $1', [tbs_client_id]);
        await client.query('DELETE FROM client_company_details WHERE tbs_client_id = $1', [tbs_client_id]);

        res.status(200).send(`Client deleted successfully with ID: ${tbs_client_id}. Recycle bin entry created with ID: ${recycleId}`);
    } catch (error) {
        console.error('Error deleting client:', error);
        res.status(500).send('Error deleting client');
    } finally {
        client.release();
    }
};


// client_details GET CONTROLLER
const getClientcompany = async (req, res) => {
    try {
        const query = `
            SELECT *
            FROM client_company_details 
        `
        const result = await pool.query(query)

        if (result.rowCount === 0) {
            return res.status(201).json({ error: 'No client found' })
        }

        res.status(200).json(result.rows)
    } catch (err) {
        console.error(err)
        res.status(201).json({ error: 'Database query failed' })
    }
}

// operator_personal_details GETbyID CONTROLLER
const getclientByID = async (req, res) => {
    try{
        const id = req.params.tbs_client_id
        const getClientByID = `SELECT * FROM client_company_details WHERE tbs_client_id = $1`
        const result = await pool.query(getClientByID,[id])
        res.status(200).send(result.rows)
    } catch(err) {
        console.log(err.message)
        res.status(201).send("Error getting records")
    }
}

const updateClientAddress = async (req, res) => {
    const tbs_client_id = req.params.tbs_client_id
    const {
        address, state, region, city, country, zip_code, state_id, country_id, city_id, region_id 
    } = req.body

    try {
        await pool.query(
            `UPDATE client_address_details
             SET
                 address = COALESCE($2, address),
                 state = COALESCE($3, state),
                 region = COALESCE($4, region),
                 city = COALESCE($5, city),
                 country = COALESCE($6, country),
                 zip_code = COALESCE($7, zip_code),
                 state_id = COALESCE($8, state_id),
                 country_id = COALESCE($9, country_id),
                 city_id = COALESCE($10, city_id),
                 region_id = COALESCE($11, region_id) 
             WHERE tbs_client_id = $1`,
            [tbs_client_id, address, state, region, city, country, zip_code, state_id, country_id, city_id, region_id]
        )
        res.status(200).json({
            message: 'Client address updated successfully'
        })
    } catch (err) {
        console.error('Error updating client address :', err)
        res.status(201).json({ error: 'Failed to update client address' })
    }
}

const getClientAddressById = async (req, res) => {
    const tbs_client_id = req.params.tbs_client_id

    try {
        const result = await pool.query(
            `SELECT * FROM client_address_details WHERE tbs_client_id = $1`,
            [tbs_client_id]
        )

        if (result.rows.length === 0) {
            return res.status(201).json({ message: 'Client address not found' })
        }

        res.status(200).json(result.rows[0])
    } catch (err) {
        console.error('Error retrieving client address:', err)
        res.status(201).json({ error: 'Failed to retrieve client address' })
    }
}

const deleteClientAddress = async (req, res) => {
    const tbs_client_id = req.params.tbs_client_id

    try {
        const result = await pool.query(
            `DELETE FROM client_address_details WHERE tbs_client_id = $1 RETURNING *`,
            [tbs_client_id]
        )

        if (result.rowCount === 0) {
            return res.status(201).json({ message: 'Client address not found' })
        }

        res.status(200).json({ message: 'Client address deleted successfully' })
    } catch (err) {
        console.error('Error deleting client address:', err)
        res.status(201).json({ error: 'Failed to delete client address' })
    }
}
    
const getAllClientAddresses = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM client_address_details`
        )

        res.status(200).json(result.rows)
    } catch (err) {
        console.error('Error retrieving client addresses:', err)
        res.status(201).json({ error: 'Failed to retrieve client addresses' })
    }
}

//CLIENT GST-DETAILS
const putClientGst = async (req, res) => {
    const { tbs_client_id } = req.params
    const { has_gstin, aggregate_turnover_exceeded, state_name, state_code_number, gstin, head_office } = req.body
    const upload_gst = req.file ? req.file.path : null

    try {
        const clientGstQuery = `
        INSERT INTO public.client_gst_details (
            tbs_client_id, has_gstin, aggregate_turnover_exceeded, 
            state_name, state_code_number, gstin, head_office, upload_gst
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (tbs_client_id)
        DO UPDATE SET
            has_gstin = COALESCE(EXCLUDED.has_gstin, client_gst_details.has_gstin),
            aggregate_turnover_exceeded = COALESCE(EXCLUDED.aggregate_turnover_exceeded, client_gst_details.aggregate_turnover_exceeded),
            state_name = COALESCE(EXCLUDED.state_name, client_gst_details.state_name),
            state_code_number = COALESCE(EXCLUDED.state_code_number, client_gst_details.state_code_number),
            gstin = COALESCE(EXCLUDED.gstin, client_gst_details.gstin),
            head_office = COALESCE(EXCLUDED.head_office, client_gst_details.head_office),
            upload_gst = COALESCE(EXCLUDED.upload_gst, client_gst_details.upload_gst);`

        const clientCompanyQuery = `
            UPDATE client_company_details
            SET status = 'Active', status_id = 1
            WHERE tbs_client_id = $1
        `

        await pool.query('BEGIN') 

        await pool.query(clientGstQuery, [tbs_client_id, has_gstin, aggregate_turnover_exceeded, state_name, state_code_number, gstin, head_office, upload_gst])
        await pool.query(clientCompanyQuery, [tbs_client_id])

        await pool.query('COMMIT') 

        res.status(200).send('Client GST details upserted and status updated successfully.')
    } catch (error) {
        await pool.query('ROLLBACK') 
        res.status(500).send(error.message)
    }
}

const deleteClientGst = async (req, res) => {
    const { tbs_client_id } = req.params
    try {
        const query = 'DELETE FROM public.client_gst_details WHERE tbs_client_id = $1'
        await pool.query(query, [tbs_client_id])
        res.status(200).send('Client GST details deleted successfully.')
    } catch (error) {
        res.status(201).send(error.message)
    }
}

const getGstByid = async (req, res) => {
    const { tbs_client_id } = req.params
    try {
        const query = 'SELECT * FROM public.client_gst_details WHERE tbs_client_id = $1'
        const result = await pool.query(query, [tbs_client_id])
        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0])
        } else {
            res.status(201).send('Client GST details not found.')
        }
    } catch (error) {
        res.status(201).send(error.message)
    }
}

const getAllGst = async (req, res) => {
    try {
        const query = 'SELECT * FROM public.client_gst_details'
        const result = await pool.query(query)
        res.status(200).json(result.rows)
    } catch (error) {
        res.status(201).send(error.message)
    }
}

//import excel data
const ExcelUpload = async (req, res) => {
    const file = req.file;
    if (!file) {
        return res.status(400).send('No file uploaded.');
    }

    const { tbs_user_id } = req.body;

    if (!tbs_user_id) {
        return res.status(400).send('tbs_user_id is required.');
    }

    try {
        const workbook = xlsx.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet)

        await pool.query('BEGIN');

        for (const row of data) {
            try {
                const { rows: existing = [] } = await pool.query(
                    `SELECT phone, emailid FROM client_company_details
                     WHERE phone = $1 OR LOWER(emailid) = LOWER($2)`,
                    [row['phone'], row['emailid']]
                );

                let phone = row['phone'];
                let emailid = row['emailid'];

                if (existing.length > 0) {
                    phone = null;
                    emailid = null;
                }

                const clientData = [
                    row['company_name'], row['owner_name'], phone,
                    emailid, row['web_url'], tbs_user_id
                ];

                const result = await pool.query(
                    `INSERT INTO client_company_details (
                        company_name, owner_name, phone, emailid, web_url,
                        type_name, type_id, password, status, status_id, tbs_user_id
                    ) VALUES ($1, $2, $3, $4, $5, 'CLIENT', 'CLT101', '', 'Draft', 0, $6)
                    RETURNING tbs_client_id`,
                    clientData
                );

                const tbs_client_id = result.rows[0].tbs_client_id;

                const password = `CLT@${tbs_client_id}`;

                await pool.query(
                    `UPDATE client_company_details
                     SET password = $1
                     WHERE tbs_client_id = $2`,
                    [password, tbs_client_id]
                );

                const addressData = [
                    tbs_client_id, row['address'], row['zip_code']
                ];

                const gstData = [
                    tbs_client_id, row['gstin'], row['head_office']
                ];

                await pool.query(
                    `UPDATE client_address_details
                     SET address = $2, zip_code = $3
                     WHERE tbs_client_id = $1;`,
                    addressData
                );

                await pool.query(
                    `UPDATE client_gst_details
                     SET gstin = $2, head_office = $3
                     WHERE tbs_client_id = $1;`,
                    gstData
                );

            } catch (innerError) {
                console.error('Error processing row:', row, innerError);
                throw innerError;
            }
        }

        await pool.query('COMMIT');
        res.status(200).send('File uploaded and data inserted/updated successfully.');
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Transaction failed:', error);
        res.status(500).send('Error inserting/updating data.');
    }
}


module.exports = { postClient, deleteClient, getClientcompany, getclientByID, putClient, updateClientAddress, getClientAddressById, deleteClientAddress, getAllClientAddresses, putClientGst, deleteClientGst, getGstByid, getAllGst, putClientCompanyDetails, ExcelUpload, GetClientProfileImg, GetClientProfileImgById, getEmails, getPhones }