const pool = require('../config/db')
const xlsx = require('xlsx')

// CLIENT COMPANY details POST CONTROLLER
const postClient = async (req, res) => {
    const { company_name, owner_name, phone, emailid, type_of_constitution, business_background, web_url } = req.body
    
    const type_name = 'CLIENT'
    const type_id = 'CLT101'
    const status = 'draft'
    const status_id = 0

    try {
        const result = await pool.query(
            `INSERT INTO client_company_details 
             (company_name, owner_name, phone, emailid, type_of_constitution, business_background, web_url, type_name, type_id, status, status_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING tbs_client_id`,
            [company_name, owner_name, phone, emailid, type_of_constitution, business_background, web_url, type_name, type_id, status, status_id]
        )
        
        const tbs_client_id = result.rows[0].tbs_client_id

        console.log(`New client created with ID: ${tbs_client_id}`)

        const password = `CLT@${tbs_client_id}`

        await pool.query(
            `UPDATE client_company_details SET password = $1 WHERE tbs_client_id = $2`,
            [password, tbs_client_id]
        )

        res.status(201).json({
            message: 'Client Created Successfully',
            id: tbs_client_id,
            password: password,
            type_name: type_name,
            type_id: type_id
        })
    } catch (err) {
        console.error('Error inserting into database:', err)
        res.status(500).json({ error: 'Database insertion failed' })
    }
}

// PROFILE IMAGE SETTING
const ClientProfileImg = async (req, res) => {
    const tbs_client_id = req.params.tbs_client_id;
    const profileimg = req.file ? `/client_files/${req.file.filename}` : null;

    try {
        const updateClientsQuery = `
            UPDATE public.client_company_details 
            SET profile_img = $1
            WHERE tbs_client_id = $2
            RETURNING *;
        `;
        const ClientsValues = [profileimg, tbs_client_id];
        const ClientsResult = await pool.query(updateClientsQuery, ClientsValues);

        if (ClientsResult.rows.length === 0) {
            return res.status(404).json({ message: 'No Clients found' });
        }

        res.status(200).json({ message: 'Client profile image updated successfully.' });
    } catch (error) {
        console.error('Error updating client profile image:', error);
        res.status(500).json({ error: 'Error updating client profile image.' });
    }
}

// PROFILE IMAGE GETbYID API
const GetClientProfileImgById = async (req, res) => {
    const tbs_client_id = req.params.tbs_client_id;

    try {
        const ClientsQuery = `
            SELECT profile_img FROM public.client_company_details 
            WHERE tbs_client_id = $1;
        `;
        const ClientsValues = [tbs_client_id];
        const ClientsResult = await pool.query(ClientsQuery, ClientsValues);

        if (ClientsResult.rows.length === 0) {
            return res.status(404).json({ message: 'No Clients found' });
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
            SELECT profile_img FROM public.client_company_details;
        `;
        const ClientsResult = await pool.query(ClientsQuery);

        if (ClientsResult.rows.length === 0) {
            return res.status(404).json({ message: 'No Clients found' });
        }

        res.status(200).json(ClientsResult.rows);
    } catch (error) {
        console.error('Error retrieving client profile images:', error);
        res.status(500).json({ error: 'Error retrieving client profile images.' });
    }
};

// PUT STATUS ONLY
    const putClientCompanyDetails = async (req, res) => {
        const { tbs_client_id } = req.params
        const { status, status_id } = req.body
    
        try {
            const query = `
                UPDATE client_company_details
                SET status = $1, status_id = $2
                WHERE tbs_client_id = $3
            `
            await pool.query(query, [status, status_id, tbs_client_id])
            res.status(200).send('Client company details status updated successfully.')
        } catch (error) {
            console.error('Error updating client company details:', error)
            res.status(500).send('Database update failed')
        }
    }
    

// PUT CONTROLLER
    const putClient = async (req, res) => {
        const { company_name, owner_name, phone, emailid, type_of_constitution, business_background, web_url } = req.body

        const tbs_client_id = req.params.tbs_client_id
    
        try {
            await pool.query(
                `UPDATE client_company_details
                 SET company_name = $1, owner_name = $2, phone = $3, emailid = $4, type_of_constitution = $5, business_background = $6, web_url = $7
                 WHERE tbs_client_id = $8`,
                [company_name, owner_name, phone, emailid, type_of_constitution, business_background, web_url, tbs_client_id]
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
    const id= req.params.tbs_client_id 

    try {
        const query = `
            DELETE FROM client_company_details 
            WHERE tbs_client_id = $1
            RETURNING *
        `
        
        const result = await pool.query(query, [id])

        if (result.rowCount === 0) {
            return res.status(201).json({ error: 'client not found' })
        }

        res.status(200).json({ message: 'client deleted successfully' })
    } catch (err) {
        console.error('Error deleting client:', err)
        res.status(201).json({ error: 'Database deletion failed' })
    }
}

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
        address,
        state,
        region,
        city,
        country,
        zip_code,
        state_id,
        country_id,
        city_id,
        region_id 
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
            INSERT INTO public.client_gst_details (tbs_client_id, has_gstin, aggregate_turnover_exceeded, state_name, state_code_number, gstin, head_office, upload_gst)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (tbs_client_id)
            DO UPDATE SET
                has_gstin = EXCLUDED.has_gstin,
                aggregate_turnover_exceeded = EXCLUDED.aggregate_turnover_exceeded,
                state_name = EXCLUDED.state_name,
                state_code_number = EXCLUDED.state_code_number,
                gstin = EXCLUDED.gstin,
                head_office = EXCLUDED.head_office,
                upload_gst = EXCLUDED.upload_gst
        `

        const clientCompanyQuery = `
            UPDATE client_company_details
            SET status = 'active', status_id = 1
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
                client_gst_details csd ON ccd.tbs_client_id = csd.tbs_client_id
        `
        
        const result = await pool.query(query)

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'No client details found' })
        }

        res.status(200).json(result.rows)
    } catch (err) {
        console.error('Error fetching client details', err)
        res.status(500).json({ error: 'Database query failed' })
    }
}

//import excel data
const ExcelUpload = async (req, res) => {
    const file = req.file;
    if (!file) {
      return res.status(400).send('No file uploaded.');
    }
  
    const workbook = xlsx.readFile(file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
  
    try {
      await pool.query('BEGIN');
  
      for (const row of data) {
        const clientData = [
          row['company_name'],
          row['owner_name'],
          row['phone'],
          row['emailid'],
          row['type_of_constitution'],
          row['business_background'],
          row['web_url'],
          row['status'],
          row['status_id']
        ];
  
        // Insert into client_company_details and retrieve tbs_client_id
        const result = await pool.query(
          `INSERT INTO client_company_details (
            company_name, owner_name, phone, emailid, 
            type_of_constitution, business_background, web_url, type_name, 
            type_id, password, status, status_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'CLIENT', 'CLT101', '', $8, $9)
          RETURNING tbs_client_id`,
          clientData
        );
  
        const tbs_client_id = result.rows[0].tbs_client_id;
            // Auto-generate password
            const password = `CLT@${tbs_client_id}`;

            // Update operators_tbl with the generated password
            await pool.query(
                `UPDATE client_company_details
                SET password = $1
                WHERE tbs_client_id = $2`,
                [password, tbs_client_id]
            )
  
        const addressData = [
          tbs_client_id,
          row['address'],
          row['state'],
          row['state_id'],
          row['region'],
          row['region_id'],
          row['city'],
          row['city_id'],
          row['country'],
          row['country_id'],
          row['zip_code'],
        ];
  
        const gstData = [
          tbs_client_id,
          row['has_gstin'],
          row['aggregate_turnover_exceeded'],
          row['state_name'],
          row['state_code_number'],
          row['gstin'],
          row['head_office'],
          row['upload_gst'],
        ];
  
        // Update client_address_details
        await pool.query(
          `UPDATE client_address_details
          SET
              address = $2,
              state = $3,
              state_id = $4,
              region = $5,
              region_id = $6,
              city = $7,
              city_id = $8,
              country = $9,
              country_id = $10,
              zip_code = $11
          WHERE tbs_client_id = $1;
          `,
          addressData
        );
  
        // Update client_gst_details
        await pool.query(
          `UPDATE client_gst_details
          SET
              has_gstin = $2,
              aggregate_turnover_exceeded = $3,
              state_name = $4,
              state_code_number = $5,
              gstin = $6,
              head_office = $7,
              upload_gst = $8
          WHERE tbs_client_id = $1;
          `,
          gstData
        );
      }
  
      await pool.query('COMMIT');
      res.status(200).send('File uploaded and data inserted/updated successfully.');
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error('Error inserting/updating data:', error);
      res.status(500).send('Error inserting/updating data.');
    }
  }

module.exports = { postClient, ClientProfileImg, deleteClient, getClientcompany, getclientByID, putClient, updateClientAddress, getClientAddressById, deleteClientAddress, getAllClientAddresses, putClientGst, deleteClientGst, getGstByid, getAllGst, getClientDetails, putClientCompanyDetails, ExcelUpload, GetClientProfileImg, GetClientProfileImgById }