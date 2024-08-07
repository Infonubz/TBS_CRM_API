const pool = require('../dbconnection.js');

//GET ALL ADVERTISEMENTS
const getMobAd = async (req, res) => {
    pool.query(`SELECT * FROM mobile_advertisements_tbl`, (err,result) => {
        if(!err){
            res.send(result.rows);
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
                c.phone 
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
        const getAdStatus = `SELECT * FROM mobile_advertisements_tbl WHERE status_id = $1`;
        const result = await pool.query(getAdStatus,[id]);
        res.status(200).send(result.rows);
    } catch(err) {
        console.log(err.message);
        res.status(201).send("Error getting records");
    }
};


//DELETE ADVERTISEMENT BY ID
const deleteMobAd = async (req,res) => {
    
    try{
    const id = req.params.tbs_mobad_id;
    const removeAd = 'DELETE FROM mobile_advertisements_tbl WHERE tbs_mobad_id = $1';
    const result = await pool.query(removeAd, [id]);
    res.status(200).send('Deleted successfully!');
    } catch(err) {
        console.log(err);
        res.status(500).send('Error deleting advertisement');
    }
};


//POST ADVERTISEMENT
const postMobAd = async (req, res) => {
    const { client_details, mobad_title, start_date, end_date, mobad_description, usage_per_day, status, status_id, mobad_vdo, page_id, page_name, tbs_client_id} = req.body;
    console.log('Request Body:', req.body);

    // Check if file upload exceeded size limit
    if (req.file && req.file.size > 15 * 1024 * 1024) {
        return res.status(400).send('File size exceeded (Max: 15MB)');
    }

    // Check if uploaded file mimetype is allowed
    if (!['image/jpeg', 'image/jpg', 'image/png', 'video/mp4', 'image/gif'].includes(req.file.mimetype)) {
        return res.status(400).send('Only .jpeg, .jpg, .png, .mp4, and .gif files are allowed');
    }


    const uploadAdUrl = req.file ? `/mobile_advertisement_files/${req.file.filename}` : null;
    const mobad_file_size = req.file ? req.file.size : null;
    const mobad_file_type = req.file ? req.file.mimetype : null;


    console.log(uploadAdUrl);

    try{
        const insertAds = `INSERT INTO mobile_advertisements_tbl (  client_details, mobad_title, start_date, end_date, mobad_description, usage_per_day, status, status_id, mobad_vdo, mobad_file_size, mobad_file_type, page_id, page_name, tbs_client_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`;
        const values = [client_details, mobad_title, start_date, end_date, mobad_description, usage_per_day, status, status_id, uploadAdUrl, mobad_file_size, mobad_file_type, page_id, page_name, tbs_client_id];

        const result = await pool.query(insertAds, values); 
         res.send("Inserted Successfully!");
        } catch (err) {
            console.error(err);
            return res.status(501).send("Error inserting advertisements");
        }
        };


//UPDATE ADVERTISEMENT BY ID
    const putMobAds = async (req, res) => {
            const ID = req.params.tbs_mobad_id;
            const {client_details, mobad_title, start_date, end_date, mobad_description, usage_per_day, status, status_id, mobad_vdo,  page_id, page_name, tbs_client_id} = req.body;
        
            
            // Check if file upload exceeded size limit
            if (req.file && req.file.size > 15 * 1024 * 1024) {
                return res.status(400).send('File size exceeded (Max: 15MB)');
            }
        
            // Check if uploaded file mimetype is allowed
            if (!['image/jpeg', 'image/jpg', 'image/png', 'video/mp4', 'image/gif'].includes(req.file.mimetype)) {
                return res.status(400).send('Only .jpeg, .jpg, .png, .mp4, and .gif files are allowed');
            }
        
            
        const putAdUrl = req.file ? `/mobile_advertisement_files/${req.file.filename}` : null;
        const mobad_file_size = req.file ? req.file.size : null;
        const mobad_file_type = req.file ? req.file.mimetype : null;
        
            let updateAds = `UPDATE mobile_advertisements_tbl 
            SET client_details = $1,
                        mobad_title = $2,
                        start_date = $3,
                        end_date = $4,
                        mobad_description = $5,
                        usage_per_day = $6,
                        status = $7,
                        status_id = $8,
                        mobad_vdo = $9,
                        mobad_file_size = $10,
                        mobad_file_type = $11,
                        page_id = $12,
                        page_name = $13,
                        tbs_client_id = $14
                        WHERE tbs_mobad_id = $15`;
        
            const values = [client_details, mobad_title, start_date, end_date, mobad_description, usage_per_day, status, status_id, putAdUrl, mobad_file_size, mobad_file_type, page_id, page_name, tbs_client_id, ID];
        
            pool.query(updateAds, values, (err, result) => {
                if (!err) {
                    res.status(200).send('Updated successfully!')
                } else {
                    console.log(err.message);
                    res.status(500).send("Error updating advertisements");
                }
            });
        };


//SEARCH ADVERTISEMENT BY CLIENT-NAME, TITLE, DATE AND STATUS
        const searchMobAdvertisements = async (req, res) => {
            try {
                let query;
                let queryParams = [];
        
                const searchTerm = req.params.searchTerm;
        
                if (searchTerm && typeof searchTerm === 'string') {
                    const searchValue = `%${searchTerm.toLowerCase()}%`;
        
                    query = `
                        SELECT *
                        FROM mobile_advertisements_tbl
                        WHERE LOWER(client_details) LIKE $1
                           OR LOWER(mobad_title) LIKE $1
                           OR (TO_CHAR(start_date, 'Mon') || ' ' || TO_CHAR(start_date, 'DD')) ILIKE $1
                           OR (TO_CHAR(end_date, 'Mon') || ' ' || TO_CHAR(end_date, 'DD')) ILIKE $1
                           OR LOWER(status) LIKE $1
                    `;
        
                    queryParams = [searchValue];
                } else {
                    query = `
                        SELECT *
                        FROM mobile_advertisements_tbl
                    `;
                }
        
                const result = await pool.query(query, queryParams);
                res.json(result.rows);
            } catch (err) {
                console.error('Error executing query', err);
                res.send('Error searching records');
            }
        };


        module.exports = { getMobAd, getMobAdbyId,deleteMobAd,postMobAd, putMobAds, searchMobAdvertisements, getClientRecordsMob, getClientDetailsMob, getCombinedDataMob, getMobAdbyStatus }


