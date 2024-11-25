const pool = require('../config/db');

//GET ALL ADVERTISEMENTS
const getMobAd = async (req, res) => {
    pool.query(`SELECT * FROM mobile_advertisements_tbl ORDER BY created_date DESC `, (err,result) => {
        if (!err) {
            const ads = result.rows.map(ad => {
                const adVideoDetails = {
                    path: ad.mobad_vdo,
                    size: ad.mobad_file_size,
                    type: ad.mobad_file_type,
                    duration: ad.duration,
                    hours: ad.hours,
                    fieldname: "mobad_video",
                };

                return {
                    ...ad,
                    ad_video_details: adVideoDetails,
                };
            });

            res.send(ads);
        } else {
            console.error(err.message);
            res.status(500).send("Error fetching advertisements");
        }
        pool.end;
    })
};

const getCombinedDataMob = async (req, res) => {
    try {
        const query = `
            SELECT 
                m.*, 
                c.owner_name, 
                c.emailid, 
                c.phone,
                c.web_url 
            FROM 
                mobile_advertisements_tbl m
            JOIN 
                client_company_details c 
            ON 
                m.tbs_client_id = c.tbs_client_id
        `;

        const result = await pool.query(query);
        res.status(200).send(result.rows);
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Error getting records");
    }
};

//GET ADVERTISEMENT BY ID
const getMobAdbyId = async (req, res) => {
    try{
        const id = req.params.tbs_mobad_id;
        const getAdId = `SELECT * FROM mobile_advertisements_tbl WHERE tbs_mobad_id = $1`;
        const result = await pool.query(getAdId,[id]);
        res.status(200).send(result.rows);
    } catch(err) {
        console.log(err.message);
        res.status(500).send("Error getting records");
    }
};

//GET CLIENT RECORDS FOR DROPDOWN
const getClientRecordsMob = async (req, res) => {
    try{
        const getClients = `SELECT tbs_client_id, company_name, owner_name FROM client_company_details`;
        const result = await pool.query(getClients);
        res.status(200).send(result.rows);
    } catch(err) {
        console.log(err.message);
        res.status(500).send("Error getting records");
    }
};

//GET CLIENT DETAILS FOR 1ST COLUMN IN UI
const getClientDetailsMob = async (req, res) => {
    try{
        const getClientsdetails = `SELECT tbs_client_id, owner_name, emailid, phone FROM client_company_details`;
        const result = await pool.query(getClientsdetails);
        res.status(200).send(result.rows);
    } catch(err) {
        console.log(err.message);
        res.status(500).send("Error getting records");
    }
};

//GET MOB-AD BY STATUS
const getMobAdbyStatus = async (req, res) => {
    try{
        const id = req.params.status_id;
        const getAdStatus = `SELECT * FROM mobile_advertisements_tbl WHERE ads_status_id = $1`;
        const result = await pool.query(getAdStatus,[id]);
        res.status(200).send(result.rows);
    } catch(err) {
        console.log(err.message);
        res.status(201).send("Error getting records");
    }
};


//DELETE ADVERTISEMENT BY ID
const deleteMobAd = async (req, res) => {
    const client = await pool.connect();
    try {
        const adId = req.params.tbs_mobad_id;

        const adQuery = 'SELECT * FROM mobile_advertisements_tbl WHERE tbs_mobad_id = $1';
        const adResult = await client.query(adQuery, [adId]);

        if (adResult.rows.length === 0) {
            return res.status(201).send(`Advertisement with ID ${adId} not found`);
        }

        const ad = adResult.rows[0];

        const deletedData = {
            client_details: ad.client_details,
            ad_title: ad.mobad_title,
            start_date: ad.start_date,
            end_date: ad.end_date,
            ad_description: ad.mobad_description,
            usage_per_day: ad.usage_per_day,
            ads_status: ad.ads_status,
            ad_video: ad.mobad_vdo,
            ad_file_size: ad.mobad_file_size,
            ad_file_type: ad.mobad_file_type,
            created_date: ad.created_date,
            ads_status_id: ad.ads_status_id,
            tbs_client_id: ad.tbs_client_id,
            page_id: ad.page_id,
            page_name: ad.page_name,
            tbs_user_id: ad.tbs_user_id,
            hours: ad.hours,
            duration: ad.duration,
            ads_plan_id: ad.ads_plan_id,
            ads_req_status: ad.ads_req_status,
            ads_req_status_id: ad.ads_req_status_id,
            updated_date: ad.updated_date
        }

        const recycleInsertQuery = 'INSERT INTO recycle_bin (module_name, module_id, deleted_data, module_get_id) VALUES ($1, $2, $3, $4) RETURNING tbs_recycle_id'
        await client.query(recycleInsertQuery, ['mobile advertisements', adId, deletedData, 4])

        const removeAd = 'DELETE FROM mobile_advertisements_tbl WHERE tbs_mobad_id = $1'
        await client.query(removeAd, [adId])

        res.status(200).send(`Advertisement deleted successfully and stored in recycle_bin.`)
    } catch (error) {
        console.error('Error deleting advertisement:', error)
        res.status(500).send('Error deleting advertisement')
    } finally {
        client.release()
    }
}

//POST ADVERTISEMENT
const postMobAd = async (req, res) => {
    const {
        client_details, mobad_title, start_date, end_date, mobad_description,
        usage_per_day, ads_status, ads_status_id, page_id, page_name, tbs_client_id,
        tbs_user_id, hours, duration, ads_plan_id, ads_req_status, ads_req_status_id
    } = req.body;

    console.log('Request Body:', req.body);

    if (!tbs_user_id) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    if (req.file && req.file.size > 15 * 1024 * 1024) {
        return res.status(400).send('File size exceeded (Max: 15MB)');
    }

    // if (req.file && !['image/jpeg', 'image/jpg', 'image/png', 'video/mp4', 'image/gif'].includes(req.file.mimetype)) {
    //     return res.status(400).send('Only .jpeg, .jpg, .png, .mp4, and .gif files are allowed');
    // }

    const uploadMobAdUrl = req.file ? `/mobile_advertisement_files/${req.file.filename}` : null;
    const mobad_file_size = req.file ? req.file.size : null;
    const mobad_file_type = req.file ? req.file.mimetype : null;

    console.log(uploadMobAdUrl);

    let employeeName = '';
    let isActive = false;

    if (tbs_user_id.startsWith('tbs-pro_emp')) {
      
        try {
            const employeeResult = await pool.query(
                `SELECT * FROM pro_emp_personal_details WHERE tbs_pro_emp_id = $1`,
                [tbs_user_id]
            );

            if (employeeResult.rows.length === 0) {
                return res.status(201).json({ message: 'Employee not found' });
            }

            const employee = employeeResult.rows[0];
            isActive = employee.emp_status_id === 1 && employee.emp_status.toLowerCase() === 'active';
            employeeName = employee.emp_first_name || 'Unknown';
        } catch (error) {
            return res.status(500).json({ message: 'Database error', error });
        }

    } else if (tbs_user_id.startsWith('tbs-pro')) {
       
        try {
            const ownerResult = await pool.query(
                `SELECT * FROM product_owner_tbl WHERE owner_id = $1`,
                [tbs_user_id]
            );

            if (ownerResult.rows.length === 0) {
                return res.status(201).json({ message: 'Product owner not found' });
            }

            const owner = ownerResult.rows[0];
            employeeName = owner.owner_name || 'Unknown';
            isActive = true; 
        } catch (error) {
            return res.status(500).json({ message: 'Database error', error });
        }

    } else {
        return res.status(400).json({ message: 'Invalid user or client ID type' });
    }

    if (!isActive) {
        return res.status(400).json({ message: 'Status is not active' });
    }

    if (tbs_client_id) {
        
        try {
            const clientResult = await pool.query(
                `SELECT * FROM client_company_details WHERE tbs_client_id = $1`,
                [tbs_client_id]
            );

            if (clientResult.rows.length === 0) {
                return res.status(201).json({ message: 'Client not found' });
            }

            const client = clientResult.rows[0];
            employeeName = client.owner_name || 'Unknown';
            isActive = true; 
        } catch (error) {
            return res.status(500).json({ message: 'Database error', error });
        }
    }

    try {
        const insertAds = `
            INSERT INTO mobile_advertisements_tbl (
                client_details, mobad_title, start_date, end_date, mobad_description,
                usage_per_day, ads_status, ads_status_id, mobad_vdo, mobad_file_size, mobad_file_type,
                page_id, page_name, tbs_client_id, tbs_user_id, hours, duration, ads_plan_id,
                ads_req_status, ads_req_status_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        `;
        const values = [
            client_details, mobad_title, start_date, end_date, mobad_description, usage_per_day,
            ads_status, ads_status_id, uploadMobAdUrl, mobad_file_size, mobad_file_type, page_id, page_name,
            tbs_client_id, tbs_user_id, hours, duration, ads_plan_id, ads_req_status, ads_req_status_id
        ];

        await pool.query(insertAds, values);
        res.send("Inserted Successfully!");

        if (tbs_user_id.startsWith('tbs-pro_emp')) {
            const notificationMessage = `${employeeName} employee requested new ${mobad_title} mobile advertisement`;
            await pool.query(
                `INSERT INTO Product_Owner_Notification (
                    tbs_pro_notif_id, tbs_user_id, user_name, user_type, subject_name,
                    module_name, notification_message, read
                ) VALUES (CONCAT('tbs-notif', nextval('notif_id_seq')), $1, $2, $3, $4, $5, $6, $7)`,
                [tbs_user_id, employeeName, 'product_owner_employee', mobad_title, 'mobile_advertisement', notificationMessage, false]
            );
            console.log('Notification sent:', notificationMessage);
        }

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

//UPDATE ADVERTISEMENT BY ID
const putMobAds = async (req, res) => {
            const ID = req.params.tbs_mobad_id;
            const {client_details, mobad_title, start_date, end_date, mobad_description, usage_per_day, ads_status, ads_status_id, page_id, page_name, hours, duration, ads_plan_id, ads_req_status, ads_req_status_id} = req.body;
        
            
            // Check if file upload exceeded size limit
            if (req.file && req.file.size > 15 * 1024 * 1024) {
                return res.status(400).send('File size exceeded (Max: 15MB)');
            }
        
            // Check if uploaded file mimetype is allowed
            // if (!['image/jpeg', 'image/jpg', 'image/png', 'video/mp4', 'image/gif'].includes(req.file.mimetype)) {
            //     return res.status(400).send('Only .jpeg, .jpg, .png, .mp4, and .gif files are allowed');
            // }
        
            
        const putAdUrl = req.file ? `/mobile_advertisement_files/${req.file.filename}` : null;
        const mobad_file_size = req.file ? req.file.size : null;
        const mobad_file_type = req.file ? req.file.mimetype : null;
        
            let updateAds = `UPDATE mobile_advertisements_tbl 
            SET client_details = COALESCE($1, client_details),
                mobad_title = COALESCE($2, mobad_title),
                start_date = COALESCE($3, start_date),
                end_date = COALESCE($4, end_date),
                mobad_description = COALESCE($5, mobad_description),
                usage_per_day = COALESCE($6, usage_per_day),
                ads_status = COALESCE($7, ads_status),
                ads_status_id = COALESCE($8, ads_status_id),
                mobad_vdo = COALESCE($9, mobad_vdo),
                mobad_file_size = COALESCE($10, mobad_file_size),
                mobad_file_type = COALESCE($11, mobad_file_type),
                page_id = COALESCE($12, page_id),
                page_name = COALESCE($13, page_name),
                hours = COALESCE($14, hours),
                duration = COALESCE($15, duration),
                ads_plan_id = COALESCE($16, ads_plan_id),
                ads_req_status = COALESCE($17, ads_req_status),
                ads_req_status_id = COALESCE($18, ads_req_status_id)
            WHERE tbs_mobad_id = $19; `
        
            const values = [client_details, mobad_title, start_date, end_date, mobad_description, usage_per_day, ads_status, ads_status_id, putAdUrl, mobad_file_size, mobad_file_type, page_id, page_name, hours, duration, ads_plan_id, ads_req_status, ads_req_status_id, ID]
        
            pool.query(updateAds, values, (err, result) => {
                if (!err) {
                    res.status(200).send('Updated successfully!')
                } else {
                    console.log(err.message);
                    res.status(500).send("Error updating advertisements")
                }
            })
}


//SEARCH ADVERTISEMENT BY CLIENT-NAME, TITLE, DATE AND STATUS
const searchMobAdvertisements = async (req, res) => {
    try {
        let query;
        let queryParams = [];

        const searchTerm = req.params.searchTerm;

        if (searchTerm && typeof searchTerm === 'string') {
            const searchValue = `%${searchTerm.toLowerCase()}%`;

            query = `
                    SELECT 
                    a.*, 
                    c.owner_name, 
                    c.emailid, 
                    c.phone,
                    c.web_url 
                FROM 
                    mobile_advertisements_tbl a
                JOIN 
                    client_company_details c 
                ON 
                    a.tbs_client_id = c.tbs_client_id
                WHERE LOWER(a.client_details) LIKE $1
                   OR LOWER(a.mobad_title) LIKE $1
                   OR (TO_CHAR(a.start_date, 'Mon') || ' ' || TO_CHAR(a.start_date, 'DD')) ILIKE $1
                   OR (TO_CHAR(a.end_date, 'Mon') || ' ' || TO_CHAR(a.end_date, 'DD')) ILIKE $1
                   OR LOWER(a.ads_status) LIKE $1
                   OR LOWER(c.web_url) LIKE $1
                   OR LOWER(c.emailid) LIKE $1
                   OR c.phone::text LIKE $1
            `;

            queryParams = [searchValue];
        } else {
            query = `
                SELECT *
                FROM advertisements_tbl
            `;
        }

        const result = await pool.query(query, queryParams);
        res.json(result.rows);
    } catch (err) {
        console.error('Error executing query', err);
        res.status(500).send('Error searching records');
    }
};

// GET RECENTLY ADDED MOBILE ADVERTISEMENTS
const getRecentMobAds = async (req, res) => {
    try {
        const getRecentMobAdsQuery = `
            SELECT * FROM mobile_advertisements_tbl 
            ORDER BY created_date DESC 
            LIMIT 6`;
        const result = await pool.query(getRecentMobAdsQuery);
        res.status(200).send(result.rows);
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ message: "Error getting records" });
    }
}

//GET LIVE MOBILE ADVERTISEMENTS
const getLiveMobAdvertisements = async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT a.*, ccd.web_url
        FROM mobile_advertisements_tbl a
        LEFT JOIN client_company_details ccd ON a.tbs_client_id = ccd.tbs_client_id
        WHERE NOW() >= a.start_date OR NOW() <= a.end_date
        AND a.ads_status_id = 3`
      );
  
      if (result.rows.length > 0) {
        res.status(200).json(result.rows);
      } else {
        res.status(404).json(result.rows);
      }
    } catch (err) {
      console.error('Error executing query:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

module.exports = { getMobAd, getMobAdbyId,deleteMobAd,postMobAd, putMobAds, searchMobAdvertisements, getClientRecordsMob, getClientDetailsMob, getCombinedDataMob, getMobAdbyStatus, getRecentMobAds, getLiveMobAdvertisements }


