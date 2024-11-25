const pool = require('../config/db')
const path = require('path')
const xlsx = require('xlsx')


// OFFERS-DEALS POST CONTROLLER
const postOffer = async (req, res) => {
    const { tbs_user_id, offer_name, code, start_date, expiry_date, usage, status, status_id, offer_desc, occupation, req_status, req_status_id, occupation_id } = req.body;

    const offerPicUrl = req.files && req.files['offer_img'] ? `/offer_files/${req.files['offer_img'][0].filename}` : null;
    const themeUrl = req.files && req.files['theme'] ? `/offer_files/${req.files['theme'][0].filename}` : null;

    const image_file = req.files?.['offer_img'] ? {
        fieldname: req.files['offer_img'][0].fieldname,
        originalname: req.files['offer_img'][0].originalname,
        encoding: req.files['offer_img'][0].encoding,
        type: req.files['offer_img'][0].mimetype,
        destination: req.files['offer_img'][0].destination,
        filename: req.files['offer_img'][0].filename,
        path: req.files['offer_img'][0].path,
        size: req.files['offer_img'][0].size
    } : null;

    try {
        if (!tbs_user_id || !offer_name || !code || !start_date || !expiry_date || !usage || !status || !status_id || !offer_desc || !occupation || !req_status || !req_status_id || !occupation_id) {
            return res.status(400).json({ message: 'Missing required fields' })
        }

        if (req.files?.['offer_img']) {
            if (req.files['offer_img'][0].size > 5 * 1024 * 1024) {
                return res.status(400).send('File size exceeded (Max: 5MB)');
            }

            if (!['image/jpeg', 'image/jpg', 'image/png', 'video/mp4', 'image/gif'].includes(req.files['offer_img'][0].mimetype)) {
                return res.status(400).send('Only .jpeg, .jpg, .png, .mp4, and .gif files are allowed');
            }
        }

        let employeeName = '';
        let isActive = false;

        if (tbs_user_id.startsWith('tbs-pro_emp')) {
            const employeeResult = await pool.query(
                `SELECT emp_status, emp_status_id, emp_first_name FROM pro_emp_personal_details WHERE tbs_pro_emp_id = $1`,
                [tbs_user_id]
            );

            if (employeeResult.rows.length === 0) {
                return res.status(201).json({ message: 'Employee not found' });
            }

            const employee = employeeResult.rows[0];
            employeeName = employee.emp_first_name || 'Unknown';

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
            isActive = true;
        } else {
            return res.status(400).json({ message: 'Invalid user ID type' });
        }

        const result = await pool.query(
            `INSERT INTO redeem_offers (
                tbs_user_id, 
                offer_name, 
                code, 
                start_date, 
                expiry_date, 
                usage, 
                status, 
                status_id, 
                offer_desc, 
                offer_img, 
                image_size, 
                image_type, 
                image_file, 
                theme, 
                occupation, 
                req_status, 
                req_status_id, 
                occupation_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) 
            RETURNING tbs_offer_id`,
            [tbs_user_id, offer_name, code, start_date, expiry_date, usage, status, status_id, offer_desc, offerPicUrl, image_file?.size, image_file?.type, image_file, themeUrl, occupation, req_status, req_status_id, occupation_id]
        );

        const newOfferId = result.rows[0].tbs_offer_id;

        if (tbs_user_id.startsWith('tbs-pro_emp')) {
            await pool.query(
                `UPDATE pro_emp_personal_details 
                 SET offers = array_append(offers, $1) 
                 WHERE tbs_pro_emp_id = $2`,
                [newOfferId, tbs_user_id]
            );
        } else if (tbs_user_id.startsWith('tbs-pro')) {
            await pool.query(
                `UPDATE product_owner_tbl 
                 SET offers = array_append(offers, $1) 
                 WHERE owner_id = $2`,
                [newOfferId, tbs_user_id]
            );
        }

        const notificationMessage = `${employeeName} employee requested new ${offer_name} offers`;
        await pool.query(
            `INSERT INTO Product_Owner_Notification (
                tbs_pro_notif_id, 
                tbs_user_id, 
                user_name, 
                user_type, 
                subject_name, 
                module_name, 
                notification_message, 
                read
            ) VALUES (
                CONCAT('tbs-notif', nextval('notif_id_seq')), 
                $1, 
                $2, 
                $3, 
                $4, 
                $5, 
                $6, 
                $7)`,
            [tbs_user_id, employeeName, 'product_owner_employee', offer_name, 'offer', notificationMessage, false]
        );

        res.status(201).json({ message: "Offer and deal created successfully", offerId: newOfferId });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



const updateOffer = async (req, res) => {
    const tbs_offer_id = req.params.tbs_offer_id;
    const { tbs_user_id, offer_name, code, start_date, expiry_date, usage, status, status_id, offer_desc, occupation, occupation_id, req_status, req_status_id } = req.body;

    const offerPicUrl = req.files['offer_img'] ? `/offer_files/${req.files['offer_img'][0].filename}` : null;
    const themeUrl = req.files['theme'] ? `/offer_files/${req.files['theme'][0].filename}` : null;
    const image_size = req.files['offer_img'] ? req.files['offer_img'][0].size : null;
    const image_type = req.files['offer_img'] ? req.files['offer_img'][0].mimetype : null;

    const image_file = req.files['offer_img'] ? {
        fieldname: req.files['offer_img'][0].fieldname,
        originalname: req.files['offer_img'][0].originalname,
        encoding: req.files['offer_img'][0].encoding,
        type: req.files['offer_img'][0].mimetype,
        destination: req.files['offer_img'][0].destination,
        filename: req.files['offer_img'][0].filename,
        path: req.files['offer_img'][0].path,
        size: req.files['offer_img'][0].size
    } : null;

    try {
        if (!tbs_offer_id) return res.status(400).json({ error: 'Offer ID is required' });

        const offerExists = await pool.query('SELECT * FROM redeem_offers WHERE tbs_offer_id = $1', [tbs_offer_id]);
        if (offerExists.rows.length === 0) return res.status(201).json({ error: 'Offer not found' });

        const result = await pool.query(
            `UPDATE redeem_offers SET 
                tbs_user_id = COALESCE($1, tbs_user_id), offer_name = COALESCE($2, offer_name), code = COALESCE($3, code), start_date = COALESCE($4, start_date), expiry_date = COALESCE($5, expiry_date), usage = COALESCE($6, usage), status = COALESCE($7, status), status_id = COALESCE($8, status_id), offer_desc = COALESCE($9, offer_desc), offer_img = COALESCE($10, offer_img), image_size = COALESCE($11, image_size), image_type = COALESCE($12, image_type), image_file = COALESCE($13, image_file), occupation = COALESCE($14, occupation), theme = COALESCE($15, theme), occupation_id = COALESCE($16, occupation_id), req_status = COALESCE($17, req_status), req_status_id = COALESCE($18, req_status_id), updated_date = now() 
            WHERE tbs_offer_id = $19 RETURNING *`,
            [tbs_user_id, offer_name, code, start_date, expiry_date, usage, status, status_id, offer_desc, offerPicUrl, image_size, image_type, image_file, occupation, themeUrl, occupation_id, req_status, req_status_id, tbs_offer_id]
        );

        res.status(200).json({ message: 'Offer updated successfully' });
    } catch (err) {
        console.error('Error updating offer:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}


// OFFERS-DEALS DELETE CONTROLLER
const deleteoffers = async (req, res) => {
    const client = await pool.connect();

    try {
        const tbs_offer_id = req.params.tbs_offer_id;

        await client.query('BEGIN');

        const offerQuery = 'SELECT * FROM redeem_offers WHERE tbs_offer_id = $1';
        const offerResult = await client.query(offerQuery, [tbs_offer_id]);

        const offer = offerResult.rows[0];

        if (!offer) {
            await client.query('ROLLBACK');
            return res.status(201).json({ message: `Offers and deals with tbs_offer_id: ${tbs_offer_id} not found`});
        }

        const deletedData = {
            seq_gen: offer.seq_gen,
            tbs_user_id: offer.tbs_user_id,
            tbs_offer_id: offer.tbs_offer_id,
            offer_name: offer.offer_name,
            code: offer.code,
            start_date: offer.start_date,
            expiry_date: offer.expiry_date,
            usage: offer.usage,
            status: offer.status,
            status_id: offer.status_id,
            offer_desc: offer.offer_desc,
            offer_img: offer.offer_img,
            created_date: offer.created_date,
            updated_date: offer.updated_date,
            image_size: offer.image_size,
            image_type: offer.image_type,
            image_file: offer.image_file,
            theme: offer.theme,
            occupation: offer.occupation,
            req_status: offer.req_status,
            req_status_id: offer.req_status_id,
            occupation_id: offer.occupation_id
        };

        const recycleQuery = `
            INSERT INTO recycle_bin (module_name, module_id, deleted_data, module_get_id)
            VALUES ($1, $2, $3, $4)`;
        await client.query(recycleQuery, ['offers_deals', tbs_offer_id, JSON.stringify(deletedData), 1]);

        const deleteQuery = 'DELETE FROM redeem_offers WHERE tbs_offer_id = $1';
        const deleteResult = await client.query(deleteQuery, [tbs_offer_id]);

        if (deleteResult.rowCount === 1) {
            const tbs_user_id = offer.tbs_user_id;
            if (tbs_user_id.startsWith('tbs-pro_emp')) {
                await client.query(
                    `UPDATE pro_emp_personal_details 
                     SET offers = array_remove(offers, $1) 
                     WHERE tbs_pro_emp_id = $2`,
                    [tbs_offer_id, tbs_user_id]
                );
            } else if (tbs_user_id.startsWith('tbs-pro')) {
                await client.query(
                    `UPDATE product_owner_tbl 
                     SET offers = array_remove(offers, $1) 
                     WHERE owner_id = $2`,
                    [tbs_offer_id, tbs_user_id]
                );
            }

            await client.query('COMMIT');
            res.status(200).json({ message :'Offer and deals deleted successfully and moved to recycle bin'});
        } else {
            await client.query('ROLLBACK');
            res.status(201).json({ message: `Offers and deals with tbs_offer_id : ${tbs_offer_id} not found`});
        }
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting offers:', error);
        res.status(500).send('Error deleting offers');
    } finally {
        client.release();
    }
};

 

// OFFERS-DEALS GET CONTROLLER
const getOffers = async (req,res)=>{
    try {
        const result =await pool.query('SELECT * FROM redeem_offers ORDER BY created_date DESC ')
        res.status(200).json(result.rows)
    } catch (error) {
        console.log('Error',error)
        res.status(201).json({error:'Internal server error'})
    }
}

// OFFERS-DEALS GETBYID CONTROLLER
const getOffersByID = (req, res) => {
    const tbs_offer_id = req.params.tbs_offer_id
    pool.query(`SELECT * FROM redeem_offers WHERE tbs_offer_id = $1`,[tbs_offer_id], (err,result) => {
        if(!err){
            res.send(result.rows)
        } 
    })
}

// OFFERS-DEALS GETBYID CONTROLLER
const getOffersBytbsID = (req, res) => {
    const tbs_user_id = req.params.tbs_user_id
    pool.query(`SELECT * FROM redeem_offers WHERE tbs_user_id = $1`,[tbs_user_id], (err,result) => {
        if(!err){
            res.send(result.rows)
        } 
    })
}

//OFFERS-DEALS SEARCH CONTROLLER
const searchOffers = async (req, res) => {
    const searchTerm = req.params.search_term ? req.params.search_term.toLowerCase() : ''

    try {
        let query
        let queryParams

        if (searchTerm) {
            query = `
                SELECT * FROM redeem_offers 
                WHERE LOWER(offer_name) LIKE $1
                    OR LOWER(code) LIKE $1
                    OR LOWER(TO_CHAR(start_date, 'Mon DD')) LIKE $1
                    OR LOWER(TO_CHAR(expiry_date, 'Mon DD')) LIKE $1
            `
            queryParams = [`%${searchTerm}%`]
        } else {
            query = `SELECT * FROM redeem_offers`
            queryParams = []
        }
        const { rows } = await pool.query(query, queryParams)
        
        if (rows.length === 0) {
            return res.status(200).json('No offers found' )
        }
        res.status(200).json(rows)

    } catch (error) {
        console.error('Error:', error)
        res.status(201).json({ error: 'Internal server error' })
    }
}

//IMPORT EXCEL FILE CONTROLLER
const excelDateToJSDate = (serial) => {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const days = Math.floor(serial) - 1;
    const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
    return date.toISOString().split('T')[0];
};

const ImportExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(201).send('No file uploaded.');
        }

        const workbook = xlsx.readFile(req.file.path);
        const sheet_name_list = workbook.SheetNames;
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);

        for (let i = 0; i < data.length; i++) {
            let { tbs_user_id, offer_name, code, start_date, expiry_date, usage, status, status_id, offer_desc, occupation, occupation_id } = data[i];

            start_date = excelDateToJSDate(start_date);
            expiry_date = excelDateToJSDate(expiry_date);

            const query = {
                text: `INSERT INTO redeem_offers (tbs_user_id,offer_name, code, start_date, expiry_date, usage, status, status_id, offer_desc, occupation, occupation_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
                values: [tbs_user_id, offer_name, code, start_date, expiry_date, usage, status, status_id, offer_desc, occupation, occupation_id],
            };

            await pool.query(query);
        }

        res.status(200).send('File uploaded and data saved successfully.');
    } catch (error) {
        console.error('Error processing file:', error);
        res.status(201).send('Error processing file.');
    }
};

// OFFERS-DEALS GET CONTROLLER
const getOfferImg = async (req,res)=>{
    try {
        const result =await pool.query('SELECT tbs_offer_id, offer_img FROM redeem_offers ORDER BY GREATEST(created_date, updated_date) DESC;')
        res.status(200).json(result.rows)
    } catch (error) {
        console.log('Error',error)
        res.status(201).json({error:'Internal server error'})
    }
}

// OFFERS-DEALS GETBYID CONTROLLER
const getOffer_ImgByID = (req, res) => {
    pool.query(`SELECT tbs_offer_id, offer_img FROM redeem_offers WHERE tbs_offer_id=${req.params.tbs_offer_id}`, (err,result) => {
        if(!err){
            res.send(result.rows);
        } 
    })
}

// ACTIVE OFFERS-DEALS GET CONTROLLER
const getActiveOffers = async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM redeem_offers WHERE status = 'active' AND status_id = 1 ORDER BY GREATEST(created_date, updated_date) DESC;`);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}


// GET RECENTLY ADDED OFFERS & DEALS
const getRecentOffers = async (req, res) => {
    try {
        const getRecentOffersQuery = `
            SELECT * FROM redeem_offers WHERE offer_img != 'null' 
            ORDER BY created_date DESC 
            LIMIT 6`;
        const result = await pool.query(getRecentOffersQuery);
        res.status(200).send(result.rows);
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ message: "Error getting records" });
    }
}

//GET by Occupation ID Controller for Offers and Deals
const getOffersDealsByOccupation = async (req, res) => {
    const occupation = req.params.occupation_id;
  
    try {
      let query;
      let params;
  
      if (occupation == 0) {
        query = `
          SELECT *
          FROM redeem_offers WHERE req_status_id = 3 ORDER BY GREATEST(created_date, updated_date) DESC;
        `;
        params = [];
      } else {
        query = `
          SELECT *
          FROM redeem_offers
          WHERE req_status_id = 3 AND occupation_id = $1 ORDER BY GREATEST(created_date, updated_date) DESC;
        `;
        params = [occupation];
      }
  
      const result = await pool.query(query, params);
  
      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error executing query', err.stack);
      res.status(500).json({ error: 'Internal Server Error' });
    }
}

//GET LIVE OFFERS AND DEALS
const getLiveOffersDeals = async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT *
         FROM redeem_offers
         WHERE NOW() BETWEEN start_date AND expiry_date
         AND status_id = 1 ORDER BY GREATEST(created_date, updated_date) DESC;`
      );
  
      if (result.rows.length > 0) {
        res.status(200).json(result.rows);
      } else {
        res.status(201).json(result.rows);
      }
    } catch (err) {
      console.error('Error executing query:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

module.exports = { postOffer, updateOffer, deleteoffers, getOffers, getOffersByID, searchOffers, ImportExcel, getOfferImg, getOffer_ImgByID, getOffersBytbsID, getActiveOffers, getRecentOffers, getOffersDealsByOccupation, getLiveOffersDeals }