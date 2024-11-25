const pool = require('../config/db');

//GET ALL ADVERTISEMENTS
const getAd = async (req, res) => {
    pool.query(`SELECT * FROM advertisements_tbl ORDER BY created_date DESC`, (err, result) => {
        if (!err) {
            const ads = result.rows.map(ad => {
                const adVideoDetails = {
                    path: ad.ad_video,
                    size: ad.ad_file_size,
                    type: ad.ad_file_type,
                    duration: ad.duration,
                    hours: ad.hours,
                    fieldname: "ad_video",
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
    });
}

const getCombinedData = async (req, res) => {
    try {
        const query = `
            SELECT 
                a.*, 
                c.owner_name, 
                c.emailid, 
                c.phone,
                c.web_url 
            FROM 
                advertisements_tbl a
            JOIN 
                client_company_details c 
            ON 
                a.tbs_client_id = c.tbs_client_id
        `;

        const result = await pool.query(query);

        const combinedData = result.rows.map(ad => {
            const adVideoDetails = {
                path: ad.ad_video,
                size: ad.ad_file_size,
                type: ad.ad_file_type,
                duration: ad.duration,
                hours: ad.hours,
                fieldname: "ad_video",
            };

            return {
                ...ad,
                ad_video_details: adVideoDetails,
            };
        });

        res.status(200).send(combinedData);
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Error getting records");
    }
}

// GET ADVERTISEMENT BY ID
const getAdbyId = async (req, res) => {
    try {
        const id = req.params.tbs_ad_id;
        const getAdId = `SELECT * FROM advertisements_tbl WHERE tbs_ad_id = $1`;
        const result = await pool.query(getAdId, [id]);

        if (result.rows.length === 0) {
            return res.status(201).send("Advertisement not found");
        }

        const adDetails = result.rows[0];

        const adVideoDetails = {
            path: adDetails.ad_video, 
            size: adDetails.ad_file_size, 
            type: adDetails.ad_file_type,
            duration: adDetails.duration, 
            hours: adDetails.hours,
            fieldname: "ad_video",
        };

        // Including adVideoDetails in the response
        const response = {
            ...adDetails,
            ad_video_details: adVideoDetails,
        };

        res.status(200).json(response);
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Error getting records");
    }
}

//GET ADVERTISEMENT BY STATUS
const getAdbyStatus = async (req, res) => {
    try {
        const id = req.params.status_id;
        const getAdStatus = `SELECT * FROM advertisements_tbl WHERE status_id = $1`;
        const result = await pool.query(getAdStatus, [id]);

        const ads = result.rows.map(ad => {
            const adVideoDetails = {
                path: ad.ad_video,
                size: ad.ad_file_size,
                type: ad.ad_file_type,
                duration: ad.duration,
                hours: ad.hours,
                fieldname: "ad_video",
            };

            return {
                ...ad,
                ad_video_details: adVideoDetails,
            };
        });

        res.status(200).send(ads);
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Error getting records");
    }
}

//GET CLIENT RECORDS FOR DROPDOWN
const getClientRecords = async (req, res) => {
    try{
        const getClients = `SELECT tbs_client_id, company_name, owner_name FROM client_company_details`;
        const result = await pool.query(getClients);
        res.status(200).send(result.rows);
    } catch(err) {
        console.log(err.message);
        res.status(201).send("Error getting records");
    }
};

//GET CLIENT DETAILS FOR 1ST COLUMN IN UI
const getClientDetails = async (req, res) => {
    try{
        const getClientsdetails = `SELECT tbs_client_id, owner_name, emailid, phone FROM client_company_details`;
        const result = await pool.query(getClientsdetails);
        res.status(200).send(result.rows);
    } catch(err) {
        console.log(err.message);
        res.status(201).send("Error getting records");
    }
};

//request_management-PARTNER GETbyStatusID CONTROLLER
const getActiveClients = async (req, res) => {
    const reqStatus = req.params.status_id;
  
    try {
      let query;
      let params;
  
      if (reqStatus == 4) {
        query = `
          SELECT cc.*, ca.*, cg.*
          FROM client_company_details AS cc
          LEFT JOIN client_address_details AS ca
          ON cc.tbs_client_id = ca.tbs_client_id
          LEFT JOIN client_gst_details AS cg
          ON cc.tbs_client_id = cg.tbs_client_id;`;
        params = [];
      } else {
        query = `
          SELECT cc.*, ca.*, cg.*
          FROM client_company_details AS cc
          LEFT JOIN client_address_details AS ca
          ON cc.tbs_client_id = ca.tbs_client_id
          LEFT JOIN client_gst_details AS cg
          ON cc.tbs_client_id = cg.tbs_client_id
          WHERE cc.status_id = $1;`;
        params = [reqStatus];
      }
  
      const result = await pool.query(query, params);
  
      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error executing query', err.stack);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } 


//DELETE ADVERTISEMENT BY ID
const deleteAd = async (req, res) => {
    const client = await pool.connect();
    try {
        const adId = req.params.tbs_ad_id;

        await client.query('BEGIN');

        const adQuery = 'SELECT * FROM advertisements_tbl WHERE tbs_ad_id = $1';
        const adResult = await client.query(adQuery, [adId]);

        if (adResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(201).json({ message :`Advertisement with ID : ${adId} not found`});
        }

        const ad = adResult.rows[0];

        const deletedData = {
            client_details: ad.client_details,
            ad_title: ad.ad_title,
            start_date: ad.start_date,
            end_date: ad.end_date,
            ad_description: ad.ad_description,
            usage_per_day: ad.usage_per_day,
            ads_status: ad.ads_status,
            ad_video: ad.ad_video,
            ad_file_size: ad.ad_file_size,
            ad_file_type: ad.ad_file_type,
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
        };

        const recycleInsertQuery = 'INSERT INTO recycle_bin (module_name, module_id, deleted_data, module_get_id) VALUES ($1, $2, $3, $4) RETURNING tbs_recycle_id';
        await client.query(recycleInsertQuery, ['advertisements', adId, deletedData, 3]);

        const removeAd = 'DELETE FROM advertisements_tbl WHERE tbs_ad_id = $1';
        await client.query(removeAd, [adId]);

        const tbs_user_id = ad.tbs_user_id;
        if (tbs_user_id.startsWith('tbs-pro_emp')) {
            await client.query(
                `UPDATE pro_emp_personal_details 
                 SET advertisements = array_remove(advertisements, $1) 
                 WHERE tbs_pro_emp_id = $2`,
                [adId, tbs_user_id]
            );
        } else if (tbs_user_id.startsWith('tbs-pro')) {
            await client.query(
                `UPDATE product_owner_tbl 
                 SET advertisements = array_remove(advertisements, $1) 
                 WHERE owner_id = $2`,
                [adId, tbs_user_id]
            );
        }

        await client.query('COMMIT');

        res.status(200).json({ message : 'Advertisement deleted successfully and stored in recycle bin.'});
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting advertisement:', error);
        res.status(500).send('Error deleting advertisement');
    } finally {
        client.release();
    }
};

//POST ADVERTISEMENT

const postAd = async (req, res) => {
    const {
        ad_title, start_date, end_date, ad_description, usage_per_day, ads_status, 
        ads_status_id, tbs_client_id, page_id, page_name, tbs_user_id, hours, 
        duration, ads_plan_id, ads_req_status, ads_req_status_id
    } = req.body;

    if (!tbs_user_id) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    if (req.file && req.file.size > 15 * 1024 * 1024) {
        return res.status(400).send('File size exceeded (Max: 15MB)');
    }

    if (req.file && !['image/jpeg', 'image/jpg', 'image/png', 'video/mp4', 'image/gif'].includes(req.file.mimetype)) {
        return res.status(400).send('Only .jpeg, .jpg, .png, .mp4, and .gif files are allowed');
    }

    const uploadAdUrl = req.file ? `/advertisement_files/${req.file.filename}` : null;
    const ad_file_size = req.file ? req.file.size : null;
    const ad_file_type = req.file ? req.file.mimetype : null;

    let employeeName = '';
    let tbs_ad_id;

    try {
        // Fetch company_name from client_company_details based on tbs_client_id
        const clientResult = await pool.query(
            `SELECT company_name FROM client_company_details WHERE tbs_client_id = $1`,
            [tbs_client_id]
        );

        if (clientResult.rows.length === 0) {
            return res.status(201).json({ message: 'Client not found' });
        }

        const client_details = clientResult.rows[0].company_name;

        // Check if the user is an employee or a product owner
        if (tbs_user_id.startsWith('tbs-pro_emp')) {
            const employeeResult = await pool.query(
                `SELECT emp_status, emp_status_id, emp_first_name FROM pro_emp_personal_details WHERE tbs_pro_emp_id = $1`,
                [tbs_user_id]
            );

            if (employeeResult.rows.length === 0) {
                return res.status(201).json({ message: 'Employee not found' });
            }

            const employee = employeeResult.rows[0];
            const isActive = employee.emp_status_id === 1 && employee.emp_status.toLowerCase() === 'active';
            employeeName = employee.emp_first_name || 'Unknown';

            if (!isActive) {
                return res.status(400).json({ message: 'Employee status is not active' });
            }
        } else if (tbs_user_id.startsWith('tbs-pro')) {
            const ownerResult = await pool.query(
                `SELECT owner_name FROM product_owner_tbl WHERE owner_id = $1`,
                [tbs_user_id]
            );

            if (ownerResult.rows.length === 0) {
                return res.status(201).json({ message: 'Product owner not found' });
            }

            const owner = ownerResult.rows[0];
            employeeName = owner.owner_name || 'Unknown';
        } else {
            return res.status(400).json({ message: 'Invalid user ID type' });
        }

        // Insert advertisement into advertisements_tbl and get the generated ID
        const insertAds = `
            INSERT INTO advertisements_tbl (
                client_details, ad_title, start_date, end_date, ad_description, usage_per_day, ads_status, 
                ad_video, ad_file_size, ad_file_type, ads_status_id, tbs_client_id, page_id, page_name, 
                tbs_user_id, hours, duration, ads_plan_id, ads_req_status, ads_req_status_id
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
            ) RETURNING tbs_ad_id
        `;
        const values = [
            client_details, ad_title, start_date, end_date, ad_description, usage_per_day, ads_status, 
            uploadAdUrl, ad_file_size, ad_file_type, ads_status_id, tbs_client_id, page_id, page_name, 
            tbs_user_id, hours, duration, ads_plan_id, ads_req_status, ads_req_status_id
        ];
        const result = await pool.query(insertAds, values);
        tbs_ad_id = result.rows[0].tbs_ad_id;

        // Add the tbs_ad_id to the respective user table
        if (tbs_user_id.startsWith('tbs-pro_emp')) {
            await pool.query(
                `UPDATE pro_emp_personal_details SET advertisements = array_append(advertisements, $1) WHERE tbs_pro_emp_id = $2`,
                [tbs_ad_id, tbs_user_id]
            );
        } else if (tbs_user_id.startsWith('tbs-pro')) {
            await pool.query(
                `UPDATE product_owner_tbl SET advertisements = array_append(advertisements, $1) WHERE owner_id = $2`,
                [tbs_ad_id, tbs_user_id]
            );
        }

        res.status(201).json({ message: "Advertisement inserted successfully!" });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};



//UPDATE ADVERTISEMENT BY ID
const putAds = async (req, res) => {
    const ID = req.params.tbs_ad_id;
    const {
        client_details, ad_title, start_date, end_date, ad_description,
        usage_per_day, ads_status, ads_status_id, tbs_client_id,
        page_id, page_name, tbs_user_id, hours, duration, ads_plan_id, ads_req_status, ads_req_status_id
    } = req.body;

    // Check if file upload exceeded size limit
    if (req.file && req.file.size > 15 * 1024 * 1024) {
        return res.status(400).send('File size exceeded (Max: 15MB)');
    }

    const putAdUrl = req.file ? `/advertisement_files/${req.file.filename}` : null;
    const ad_file_size = req.file ? req.file.size : null;
    const ad_file_type = req.file ? req.file.mimetype : null;

    let updateAds = `
    UPDATE advertisements_tbl 
    SET client_details = COALESCE($1, client_details),
        ad_title = COALESCE($2, ad_title),
        start_date = COALESCE($3, start_date),
        end_date = COALESCE($4, end_date),
        ad_description = COALESCE($5, ad_description),
        usage_per_day = COALESCE($6, usage_per_day),
        ads_status = COALESCE($7, ads_status),
        ad_video = COALESCE($8, ad_video),
        ad_file_size = COALESCE($9, ad_file_size),
        ad_file_type = COALESCE($10, ad_file_type),
        ads_status_id = COALESCE($11, ads_status_id),
        tbs_client_id = COALESCE($12, tbs_client_id),
        page_id = COALESCE($13, page_id),
        page_name = COALESCE($14, page_name),
        tbs_user_id = COALESCE($15, tbs_user_id),
        hours = COALESCE($16, hours), 
        duration = COALESCE($17, duration),
        ads_plan_id = COALESCE($18, ads_plan_id),
        updated_date = now(),
        ads_req_status = COALESCE($19, ads_req_status),
        ads_req_status_id = COALESCE($20, ads_req_status_id)
    WHERE tbs_ad_id = $21;
    `;

    const values = [
        client_details, ad_title, start_date, end_date, ad_description,
        usage_per_day, ads_status, putAdUrl, ad_file_size, ad_file_type,
        ads_status_id, tbs_client_id, page_id, page_name, tbs_user_id,
        hours, duration, ads_plan_id, ads_req_status, ads_req_status_id, ID
    ];

    pool.query(updateAds, values, (err, result) => {
        if (!err) {
            res.status(200).send('Updated successfully!');
        } else {
            console.log(err.message);
            res.status(201).send("Error updating advertisements");
        }
    });
}

//SEARCH ADVERTISEMENT BY CLIENT-NAME, TITLE, DATE AND STATUS
const searchAdvertisements = async (req, res) => {
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
                    advertisements_tbl a
                JOIN 
                    client_company_details c 
                ON 
                    a.tbs_client_id = c.tbs_client_id
                WHERE LOWER(a.client_details) LIKE $1
                   OR LOWER(a.ad_title) LIKE $1
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


// GET RECENTLY ADDED ADVERTISEMENTS
const getRecentAds = async (req, res) => {
    try {
        const getRecentAdsQuery = `
            SELECT * FROM advertisements_tbl WHERE ad_video != 'null' 
            ORDER BY created_date DESC 
            LIMIT 6`;
        const result = await pool.query(getRecentAdsQuery);
        res.status(200).send(result.rows);
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ message: "Error getting records" })
    }
};

// ACTIVE ADVERTISEMENTS GET CONTROLLER
const getActiveAds = async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM advertisements_tbl WHERE ads_status_id = 2`);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

//GET LIVE ADVERTISEMENTS
const getLiveAdvertisements = async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT a.*, ccd.web_url
         FROM advertisements_tbl a
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


module.exports = {getAd, getAdbyId, deleteAd, postAd, putAds, searchAdvertisements, getClientRecords, getClientDetails, getAdbyStatus, getCombinedData, getRecentAds, getActiveAds, getLiveAdvertisements, getActiveClients }

