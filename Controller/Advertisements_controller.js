const pool = require('../dbconnection.js');

//GET ALL ADVERTISEMENTS
const getAd = async (req, res) => {
    pool.query(`SELECT * FROM advertisements_tbl`, (err,result) => {
        if(!err){
            res.send(result.rows);
        } 
        pool.end;
    })
};

const getCombinedData = async (req, res) => {
    try {
        const query = `
            SELECT 
                a.*, 
                c.owner_name, 
                c.emailid, 
                c.phone 
            FROM 
                advertisements_tbl a
            JOIN 
                client_company_details c 
            ON 
                a.tbs_client_id = c.tbs_client_id
        `;

        const result = await pool.query(query);
        res.status(200).send(result.rows);
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Error getting records");
    }
};


//GET ADVERTISEMENT BY ID
const getAdbyId = async (req, res) => {
    try{
        const id = req.params.tbs_ad_id;
        const getAdId = `SELECT * FROM advertisements_tbl WHERE tbs_ad_id = $1`;
        const result = await pool.query(getAdId,[id]);
        res.status(200).send(result.rows);
    } catch(err) {
        console.log(err.message);
        res.status(201).send("Error getting records");
    }
};

//GET ADVERTISEMENT BY STATUS
const getAdbyStatus = async (req, res) => {
    try{
        const id = req.params.status_id;
        const getAdStatus = `SELECT * FROM advertisements_tbl WHERE status_id = $1`;
        const result = await pool.query(getAdStatus,[id]);
        res.status(200).send(result.rows);
    } catch(err) {
        console.log(err.message);
        res.status(201).send("Error getting records");
    }
};


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


//DELETE ADVERTISEMENT BY ID
const deleteAd = async (req,res) => {
    
    try{
    const id = req.params.tbs_ad_id;
    const removeAd = 'DELETE FROM advertisements_tbl WHERE tbs_ad_id = $1';
    const result = await pool.query(removeAd, [id]);
    res.status(200).send('Deleted successfully!');
    } catch(err) {
        console.log(err);
        res.status(201).send('Error deleting advertisement');
    }
};


//POST ADVERTISEMENT
const postAd = async (req, res) => {
    const { client_details, ad_title, start_date, end_date, ad_description, usage_per_day, status, ad_video, status_id, tbs_client_id, page_id, page_name, tbs_user_id, hours, duration, ads_plan_id } = req.body;
    console.log('Request Body:', req.body);

    // Check if file upload exceeded size limit
    if (req.file && req.file.size > 15 * 1024 * 1024) {
        return res.status(400).send('File size exceeded (Max: 15MB)');
    }

    // Check if uploaded file mimetype is allowed
    if (!['image/jpeg', 'image/jpg', 'image/png', 'video/mp4', 'image/gif'].includes(req.file.mimetype)) {
        return res.status(400).send('Only .jpeg, .jpg, .png, .mp4, and .gif files are allowed');
    }


    const uploadAdUrl = req.file ? `/advertisement_files/${req.file.filename}` : null;
    const ad_file_size = req.file ? req.file.size : null;
    const ad_file_type = req.file ? req.file.mimetype : null;

    console.log(uploadAdUrl);

    
    let employeeName = '';
    let isActive = false;

    // Check the user type based on tbs_user_id
    if (tbs_user_id.startsWith('tbs-pro_emp')) {
        // pro_emp case: Check pro_emp_personal_details table
        const employeeResult = await pool.query(
            `SELECT * FROM pro_emp_personal_details WHERE tbs_pro_emp_id = $1`,
            [tbs_user_id]
        );

        if (employeeResult.rows.length === 0) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const employee = employeeResult.rows[0];
        isActive = employee.emp_status_id === 1 && employee.emp_status.toLowerCase() === 'active';
        employeeName = employee.emp_first_name || 'Unknown';

    } else if (tbs_user_id.startsWith('tbs-pro')) {
        // pro case: Check product_owner_id table
        const ownerResult = await pool.query(
            `SELECT * FROM product_owner_tbl WHERE owner_id = $1`,
            [tbs_user_id]
        );

        if (ownerResult.rows.length === 0) {
            return res.status(404).json({ message: 'Product owner not found' });
        }

        const owner = ownerResult.rows[0];
        employeeName = owner.owner_name || 'Unknown';
        isActive = true; 
    } else {
        return res.status(400).json({ message: 'Invalid user ID type' });
    }

    if (!isActive) {
        return res.status(400).json({ message: 'Employee status is not active' });
    }


    try{
        const insertAds = `INSERT INTO advertisements_tbl (  client_details, ad_title, start_date, end_date, ad_description, usage_per_day, status, ad_video, ad_file_size, ad_file_type, status_id, tbs_client_id, page_id, page_name, tbs_user_id, hours, duration, ads_plan_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`;
        const values = [ client_details, ad_title, start_date, end_date, ad_description, usage_per_day, status, uploadAdUrl, ad_file_size, ad_file_type, status_id, tbs_client_id, page_id, page_name, tbs_user_id, hours, duration, ads_plan_id];

        const result = await pool.query(insertAds, values); 
         res.send("Inserted Successfully!");
        } catch (err) {
            console.error(err);
            return res.status(501).send("Error inserting advertisements");
        }
        };


//UPDATE ADVERTISEMENT BY ID
    const putAds = async (req, res) => {
            const ID = req.params.tbs_ad_id;
            const { client_details, ad_title, start_date, end_date, ad_description, usage_per_day, status, ad_video, status_id, tbs_client_id, page_id, page_name, tbs_user_id, hours, duration, ads_plan_id} = req.body;
        
            
            // Check if file upload exceeded size limit
            if (req.file && req.file.size > 15 * 1024 * 1024) {
                return res.status(400).send('File size exceeded (Max: 15MB)');
            }
        
            // Check if uploaded file mimetype is allowed
            if (!['image/jpeg', 'image/jpg', 'image/png', 'video/mp4', 'image/gif'].includes(req.file.mimetype)) {
                return res.status(400).send('Only .jpeg, .jpg, .png, .mp4, and .gif files are allowed');
            }
        
            
            const putAdUrl = req.file ? `/advertisement_files/${req.file.filename}` : null;
            const ad_file_size = req.file ? req.file.size : null;
            const ad_file_type = req.file ? req.file.mimetype : null;
        
            let updateAds = `UPDATE advertisements_tbl 
            SET client_details = $1,
                        ad_title = $2,
                        start_date = $3,
                        end_date = $4,
                        ad_description = $5,
                        usage_per_day = $6,
                        status = $7,
                        ad_video = $8,
                        ad_file_size = $9,
                        ad_file_type = $10,
                        status_id = $11,
                        tbs_client_id = $12,
                        page_id = $13,
                        page_name = $14,
                        tbs_user_id = $15,
                        hours = $16, 
                        duration = &17,
                        ads_plan_id = $18
                        WHERE tbs_ad_id = $19`;
        
            const values = [client_details, ad_title, start_date, end_date, ad_description, usage_per_day, status, putAdUrl,  ad_file_size, ad_file_type, status_id, tbs_client_id, page_id, page_name, tbs_user_id, hours, duration, ads_plan_id, ID];
        
            pool.query(updateAds, values, (err, result) => {
                if (!err) {
                    res.status(200).send('Updated successfully!')
                } else {
                    console.log(err.message);
                    res.status(201).send("Error updating advertisements");
                }
            });
        };


//SEARCH ADVERTISEMENT BY CLIENT-NAME, TITLE, DATE AND STATUS
        const searchAdvertisements = async (req, res) => {
            try {
                let query;
                let queryParams = [];
        
                const searchTerm = req.params.searchTerm;
        
                if (searchTerm && typeof searchTerm === 'string') {
                    const searchValue = `%${searchTerm.toLowerCase()}%`;
        
                    query = `
                        SELECT *
                        FROM advertisements_tbl
                        WHERE LOWER(client_details) LIKE $1
                           OR LOWER(ad_title) LIKE $1
                           OR (TO_CHAR(start_date, 'Mon') || ' ' || TO_CHAR(start_date, 'DD')) ILIKE $1
                           OR (TO_CHAR(end_date, 'Mon') || ' ' || TO_CHAR(end_date, 'DD')) ILIKE $1
                           OR LOWER(status) LIKE $1
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
                res.send('Error searching records');
            }
        };

module.exports = {getAd, getAdbyId, deleteAd, postAd, putAds, searchAdvertisements, getClientRecords, getClientDetails, getAdbyStatus, getCombinedData};

