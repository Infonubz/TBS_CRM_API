const pool = require('../config/db')

// request_management-OPERATORS GET CONTROLLER
const getRequest = async (req, res) => {
    try {
        const query = `
        SELECT o.*, od.*
        FROM operators_tbl AS o
        LEFT JOIN operator_details AS od ON o.tbs_operator_id = od.tbs_operator_id
        WHERE o.req_status_id IN (0,1,2,3)
        `;
        const result = await pool.query(query);

        if (result.rowCount === 0) {
            return res.status(201).json({ error: 'No operators with the specified statuses found' });
        }

        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(201).json({ error: 'Database query failed' });
    }
}

//request_management-OPERATORS GETbyID CONTROLLER
const getRequestID = async (req, res) => {
    const tbs_operator_id = req.params.tbs_operator_id;

    try {
        const query = `
            SELECT o.*, od.*
            FROM operators_tbl AS o
            LEFT JOIN operator_details AS od ON o.tbs_operator_id = od.tbs_operator_id
            WHERE o.tbs_operator_id = $1 AND req_status_id IN (0, 1, 2, 3)
        `;

        const result = await pool.query(query, [tbs_operator_id]);
        res.status(200).send(result.rows);
    } catch (err) {
        console.error('Error executing query', err.stack);
        res.status(201).send('Server error');
    }
}

//all-request
const getAllRequest = async (req, res) => {
    try {
        const id = parseInt(req.params.req_status_id);

        let query;
        let values;

        if (id === 4) {
            query = `SELECT o.*, od.*
                     FROM operators_tbl AS o
                     LEFT JOIN operator_details AS od ON o.tbs_operator_id = od.tbs_operator_id`;
        } else {
            query = `SELECT o.*, od.*
                     FROM operators_tbl AS o
                     LEFT JOIN operator_details AS od ON o.tbs_operator_id = od.tbs_operator_id
                     WHERE o.req_status_id = $1`;
            values = [id];
        }

        const result = await pool.query(query, values)
        res.status(200).json(result.rows)
    } catch (err) {
        console.error(err.message);
        res.status(201).json({ error: 'Database query failed' })
    }
};

//request_management-OPERATORS GETbyStatusID CONTROLLER
const getRequestByStatus = async (req, res) => {
    const reqStatus = req.params.req_status_id;
    if (!reqStatus) {
      return res.status(400).json({ error: 'req_status query parameter is required' });
    }
  
    try {
      const result = await pool.query(
        `SELECT o.*, od.*
         FROM operators_tbl AS o
         LEFT JOIN operator_details AS od ON o.tbs_operator_id = od.tbs_operator_id
         WHERE o.req_status_id = $1`, [reqStatus]
      );
      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error executing query', err.stack);
      res.status(201).json({ error: 'Internal Server Error' });
    }
  }

  //request_management-OPERATORS PUT status & status_id CONTROLLER
  const putReq_Status = async (req, res) =>{

    try {
        const tbs_operator_id = req.params.tbs_operator_id
    
        const { req_status, req_status_id } = req.body
    
        const result = await pool.query(`UPDATE operators_tbl 
                        SET 
                            req_status = $1, req_status_id = $2
                        WHERE tbs_operator_id = $3`, [req_status, req_status_id, tbs_operator_id])
    
            res.status(200).json(`User Status updated successfully`)
    } catch (error) {
        console.error('error updating user', error);
    }
};

// SEARCH Controller for Operators
const searchReqOperators = async (req, res) => {
    try {
        const { status, search_term } = req.body;
        const searchTerm = search_term ? search_term.toLowerCase() : '';
        const statusFilter = status ? status.toLowerCase() : '';

        let query = `
            SELECT *
            FROM operators_tbl AS o
            LEFT JOIN operator_details AS od ON o.tbs_operator_id = od.tbs_operator_id
            WHERE 1=1
        `;
        let queryParams = [];
        let paramIndex = 1;

        // Filter by status if provided and not "all"
        if (statusFilter && statusFilter !== 'all') {
            query += ` AND LOWER(o.req_status) = $${paramIndex}`;
            queryParams.push(statusFilter);
            paramIndex++;
        }

        // Filter by search term in owner_name, phone, or emailid
        if (searchTerm) {
            query += ` AND (LOWER(owner_name) LIKE $${paramIndex} OR phone::text LIKE $${paramIndex} OR LOWER(emailid) LIKE $${paramIndex})`;
            queryParams.push(`%${searchTerm}%`);
        }

        const { rows } = await pool.query(query, queryParams);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'No operators found matching the criteria' });
        }

        res.status(200).json(rows);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


//request management-OPERATORS FILTER-BY-DATE CONTROLLER
const reqFilterByDate = async (req, res) => {
    try {
        let query;
        let queryParams = [];
        
        const { from, to } = req.body;
        
        if (from && to) {
            query = `
                SELECT o.*, od.*
                FROM operators_tbl AS o
                LEFT JOIN operator_details AS od ON o.tbs_operator_id = od.tbs_operator_id
                WHERE o.created_date BETWEEN $1 AND $2::DATE + INTERVAL '1 day' - INTERVAL '1 second'
                ORDER BY o.created_date ASC
            `;
            queryParams = [from, to];
        } else {
            query = `
                SELECT o.*, od.*
                FROM operators_tbl AS o
                LEFT JOIN operator_details AS od ON o.tbs_operator_id = od.tbs_operator_id
                ORDER BY o.created_date ASC
            `;
        }
        
        const result = await pool.query(query, queryParams);
        res.json(result.rows);
    } catch (err) {
        console.error('Error executing query', err);
        res.status(501).json({ message: "Error searching records" });
    }
}

// request_management-PARTNERS GET CONTROLLER
const getRequestPartner = async (req, res) => {
    try {
        const query = `
        SELECT pd.*, pdoc.*
        FROM partner_details AS pd
        LEFT JOIN partner_documents AS pdoc ON pd.tbs_partner_id = pdoc.tbs_partner_id
        WHERE pd.req_status_id IN (0, 1, 2, 3)
        `;
        const result = await pool.query(query);

        if (result.rowCount === 0) {
            return res.status(201).json({ error: 'No partners with the specified statuses found' });
        }

        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(201).json({ error: 'Database query failed' });
    }
}

// request_management-PARTNERS GETbyID CONTROLLER
const getRequestIDPartner = async (req, res) => {
    const partner_id = req.params.tbs_partner_id;

    try {
        const query = `
            SELECT pd.*, pdoc.*
            FROM partner_details AS pd
            LEFT JOIN partner_documents AS pdoc ON pd.tbs_partner_id = pdoc.tbs_partner_id
            WHERE pd.tbs_partner_id = $1 AND pd.req_status_id IN (0, 1, 2, 3)
        `;

        const result = await pool.query(query, [partner_id]);
        res.status(200).send(result.rows);
    } catch (err) {
        console.error('Error executing query', err.stack);
        res.status(201).send('Server error');
    }
}

//request_management-PARTNER GETbyStatusID CONTROLLER
const getRequestByStatusPartner = async (req, res) => {
    const reqStatus = req.params.req_status_id;
  
    try {
      let query;
      let params;
  
      if (reqStatus == 4) {
        query = `
          SELECT pd.*, pdoc.*
          FROM partner_details AS pd
          LEFT JOIN partner_documents AS pdoc ON pd.tbs_partner_id = pdoc.tbs_partner_id;
        `;
        params = [];
      } else {
        query = `
          SELECT pd.*, pdoc.*
          FROM partner_details AS pd
          LEFT JOIN partner_documents AS pdoc ON pd.tbs_partner_id = pdoc.tbs_partner_id
          WHERE pd.req_status_id = $1;
        `;
        params = [reqStatus];
      }
  
      const result = await pool.query(query, params);
  
      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error executing query', err.stack);
      res.status(201).json({ error: 'Internal Server Error' });
    }
  }

//request management-PARTNERS FILTER-BY-DATE CONTROLLER
const reqFilterByDatePartners = async (req, res) => {
    try {
        let query;
        let queryParams = [];
        
        const { from, to } = req.body;
        
        if (from && to) {
            query = `
                SELECT pd.*, pdoc.*
                FROM partner_details AS pd
                LEFT JOIN partner_documents AS pdoc ON pd.tbs_partner_id = pdoc.tbs_partner_id
                WHERE pd.joining_date BETWEEN $1 AND $2::DATE + INTERVAL '1 day' - INTERVAL '1 second'
                ORDER BY pd.joining_date ASC
            `;
            queryParams = [from, to];
        } else {
            query = `
                SELECT pd.*, pdoc.*
                FROM partner_details AS pd
                LEFT JOIN partner_documents AS pdoc ON pd.tbs_partner_id = pdoc.tbs_partner_id
                ORDER BY pd.joining_date ASC
            `;
        }

        const result = await pool.query(query, queryParams);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error executing query', err.stack);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

// SEARCH Controller for Partners
const searchReqPartners = async (req, res) => {
    try {
        const { status, search_term } = req.body;
        const searchTerm = search_term ? search_term.toLowerCase() : '';
        const statusFilter = status ? status.toLowerCase() : '';

        let query = `
            SELECT *
            FROM partner_details AS pd
            LEFT JOIN partner_documents AS pdoc ON pd.tbs_partner_id = pdoc.tbs_partner_id
            WHERE 1=1
        `;
        let queryParams = [];
        let paramIndex = 1;

        // Filter by status if provided and not "all"
        if (statusFilter && statusFilter !== 'all') {
            query += ` AND LOWER(pd.req_status) = $${paramIndex}`;
            queryParams.push(statusFilter);
            paramIndex++;
        }

        // Filter by search term in partner_first_name, partner_last_name, phone, or emailid
        if (searchTerm) {
            query += ` AND (LOWER(pd.partner_first_name) LIKE $${paramIndex} 
                        OR LOWER(pd.partner_last_name) LIKE $${paramIndex} 
                        OR pd.phone::text LIKE $${paramIndex} 
                        OR LOWER(pd.emailid) LIKE $${paramIndex})`;
            queryParams.push(`%${searchTerm}%`);
        }

        const { rows } = await pool.query(query, queryParams);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'No partners found matching the criteria' });
        }

        res.status(200).json(rows);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


// request_management-PARTNERS PUT status & status_id CONTROLLER
const putReq_StatusPartner = async (req, res) => {
    try {
        const partnerId = req.params.tbs_partner_id;
        const { req_status, req_status_id } = req.body
        
        const result = await pool.query(
            `UPDATE partner_details 
             SET 
                 req_status = $1, req_status_id = $2
             WHERE tbs_partner_id = $3`, 
            [req_status, req_status_id, partnerId]
        )

        res.status(200).json('Partner Status updated successfully');
    } catch (error) {
        console.error('Error updating partner status', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

//GET Controller for Offers and Deals
const getOffersDeals = async (req, res) => {
    try {
        const query = `
        SELECT *
        FROM offers_deals_tbl
        WHERE req_status_id IN (1, 2, 3, 5)
        `;
        const result = await pool.query(query);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'No offers or deals with the specified statuses found' });
        }

        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error executing query', err.stack);
        res.status(500).json({ error: 'Database query failed' });
    }
}

//GET by ID Controller for Offers and Deals
const getOfferDealById = async (req, res) => {
    const offerId = req.params.tbs_offer_id;

    try {
        const query = `
            SELECT *
            FROM offers_deals_tbl
            WHERE tbs_offer_id = $1 AND req_status_id IN (1, 2, 3, 5)
        `;

        const result = await pool.query(query, [offerId]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Offer or deal not found' });
        }

        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error executing query', err.stack);
        res.status(500).json({ error: 'Server error' });
    }
}

//GET by Status ID Controller for Offers and Deals
const getOffersDealsByStatus = async (req, res) => {
    const reqStatus = req.params.req_status_id;
  
    try {
      let query;
      let params;
  
      if (reqStatus == 6) {
        query = `
          SELECT *
          FROM offers_deals_tbl;
        `;
        params = [];
      } else {
        query = `
          SELECT *
          FROM offers_deals_tbl
          WHERE req_status_id = $1;
        `;
        params = [reqStatus];
      }
  
      const result = await pool.query(query, params);
  
      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error executing query', err.stack);
      res.status(500).json({ error: 'Internal Server Error' });
    }
}

//FILTER by Date Controller for Offers and Deals
const filterOffersDealsByDate = async (req, res) => {
    try {
        let query;
        let queryParams = [];
        
        const { from, to } = req.body;
        
        if (from && to) {
            query = `
                SELECT *
                FROM offers_deals_tbl
                WHERE created_date BETWEEN $1 AND $2::DATE + INTERVAL '1 day' - INTERVAL '1 second'
                ORDER BY created_date DESC
            `;
            queryParams = [from, to];
        } else {
            query = `
                SELECT *
                FROM offers_deals_tbl
                ORDER BY created_date DESC
            `;
        }

        const result = await pool.query(query, queryParams);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error executing query', err.stack);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

//Search Controller for Offers and Deals
const searchOffersDeals = async (req, res) => {
    try {
        const { status, search_term } = req.body;
        const searchTerm = search_term ? search_term.toLowerCase() : '';
        const statusFilter = status ? status.toLowerCase() : '';

        console.log('Search Term:', searchTerm);
        console.log('Status Filter:', statusFilter);

        let query = `
            SELECT *
            FROM offers_deals_tbl
            WHERE 1=1
        `;
        let queryParams = [];
        let paramIndex = 1;

        // Filter by status if provided and not "all"
        if (statusFilter && statusFilter !== 'all') {
            query += ` AND LOWER(req_status) = $${paramIndex}`;
            queryParams.push(statusFilter);
            paramIndex++;
        }

        // Filter by search term if provided
        if (searchTerm) {
            query += ` AND (LOWER(offer_name) LIKE $${paramIndex} OR LOWER(code) LIKE $${paramIndex})`;
            queryParams.push(`%${searchTerm}%`);
        }

        console.log('Executing query:', query);
        console.log('With parameters:', queryParams);

        const { rows } = await pool.query(query, queryParams);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'No offers & deals found matching the criteria' });
        }

        res.status(200).json(rows);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

//PUT Controller for Updating Status
const updateOfferDealStatus = async (req, res) => {
    const offerId = req.params.tbs_offer_id;
    const { req_status, req_status_id } = req.body;

    if (!offerId || req_status_id === undefined || req_status === undefined) {
        return res.status(400).json("All fields are required");
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const updateQuery = `
            UPDATE offers_deals_tbl
            SET 
                req_status = COALESCE(NULLIF($1, ''), req_status),
                req_status_id = COALESCE(NULLIF($2::integer, NULL), req_status_id)
            WHERE tbs_offer_id = $3
        `;
        await client.query(updateQuery, [req_status || null, req_status_id || null, offerId]);

        const offerQuery = `
            SELECT tbs_user_id, offer_name 
            FROM offers_deals_tbl 
            WHERE tbs_offer_id = $1
        `;
        const offerResult = await client.query(offerQuery, [offerId]);

        if (offerResult.rows.length === 0) {
            return res.status(404).json("Offer-Deal not found");
        }

        const tbs_user_id = offerResult.rows[0].tbs_user_id;
        const offer_name = offerResult.rows[0].offer_name;

        if (!tbs_user_id) {
            return res.status(400).json({ message: "Invalid tbs_user_id" });
        }

        if (tbs_user_id.startsWith('tbs-pro_emp')) {
            const user_type = 'product_owner_employee';

            const empQuery = `
                SELECT emp_first_name 
                FROM pro_emp_personal_details 
                WHERE tbs_pro_emp_id = $1
            `;
            const empResult = await client.query(empQuery, [tbs_user_id]);

            if (empResult.rows.length === 0) {
                return res.status(404).json("Product owner employee not found");
            }

            const user_name = empResult.rows[0].emp_first_name;

            const notificationMessage = `Offer-Deal ${offer_name} status created by ${user_name} is now ${req_status}`;

            const insertNotification = `
                INSERT INTO pro_emp_notification (tbs_pro_emp_notif_id, tbs_user_id, user_name, user_type, subject_name, module_name, notification_message, read, tbs_pro_emp_id)
                VALUES (CONCAT('tbs-pro-emp-notif', nextval('pro_emp_notification_seq')), $1, $2, $3, $4, $5, $6, $7, $8)
            `;
            const notifValues = [
                tbs_user_id, user_name, user_type, `${offer_name}`, 'offer-deal', notificationMessage, false, tbs_user_id
            ];
            await client.query(insertNotification, notifValues);
        }

        await client.query('COMMIT');
        res.status(200).json({ message: "Offer-Deal status updated and notification triggered successfully" });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating offer-deal status', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
}

// GET Controller for Advertisements
const getAdvertisements = async (req, res) => {
    try {
        const query = `
        SELECT *
        FROM advertisements_tbl
        WHERE req_status_id IN (1, 2, 3, 5)
        `;
        const result = await pool.query(query);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'No advertisements with the specified statuses found' });
        }

        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error executing query', err.stack);
        res.status(500).json({ error: 'Database query failed' });
    }
}

// GET by ID Controller for Advertisements
const getAdvertisementById = async (req, res) => {
    const adId = req.params.tbs_ad_id;
    console.log(adId);
    try {
        const query = `
            SELECT *
            FROM advertisements_tbl
            WHERE tbs_ad_id = $1 AND req_status_id IN (1, 2, 3, 5)
        `;

        const result = await pool.query(query, [adId]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Advertisement not found' });
        }

        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error executing query', err.stack);
        res.status(500).json({ error: 'Server error' });
    }
}

// GET by Status ID Controller for Advertisements
const getAdvertisementsByStatus = async (req, res) => {
    const reqStatus = req.params.req_status_id;
  
    try {
      let query;
      let params;
  
      if (reqStatus == 6) {
        query = `
          SELECT *
          FROM advertisements_tbl;
        `;
        params = [];
      } else {
        query = `
          SELECT *
          FROM advertisements_tbl
          WHERE req_status_id = $1;
        `;
        params = [reqStatus];
      }
  
      const result = await pool.query(query, params);
  
      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error executing query', err.stack);
      res.status(500).json({ error: 'Internal Server Error' });
    }
}

// FILTER by Date Controller for Advertisements
const filterAdvertisementsByDate = async (req, res) => {
    try {
        let query;
        let queryParams = [];
        
        const { from, to } = req.body;
        
        if (from && to) {
            query = `
                SELECT *
                FROM advertisements_tbl
                WHERE created_date BETWEEN $1 AND $2::DATE + INTERVAL '1 day' - INTERVAL '1 second'
                ORDER BY created_date ASC
            `;
            queryParams = [from, to];
        } else {
            query = `
                SELECT *
                FROM advertisements_tbl
                ORDER BY created_date ASC
            `;
        }

        const result = await pool.query(query, queryParams);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error executing query', err.stack);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

// SEARCH Controller for Advertisements
const searchAdvertisements = async (req, res) => {
    try {
        const { status, search_term } = req.body;
        const searchTerm = search_term ? search_term.toLowerCase() : '';
        const statusFilter = status ? status.toLowerCase() : '';

        console.log('Search Term:', searchTerm);
        console.log('Status Filter:', statusFilter);

        let query = `
            SELECT *
            FROM advertisements_tbl
            WHERE 1=1
        `;
        let queryParams = [];
        let paramIndex = 1;

        // Filter by status if provided and not "all"
        if (statusFilter && statusFilter !== 'all') {
            query += ` AND LOWER(req_status) = $${paramIndex}`;
            queryParams.push(statusFilter);
            paramIndex++;
        }

        // Filter by search term if provided
        if (searchTerm) {
            query += ` AND (LOWER(ad_title) LIKE $${paramIndex} OR LOWER(ad_description) LIKE $${paramIndex} OR LOWER(client_details) LIKE $${paramIndex})`;
            queryParams.push(`%${searchTerm}%`);
        }

        console.log('Executing query:', query);
        console.log('With parameters:', queryParams);

        const { rows } = await pool.query(query, queryParams);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'No advertisements found matching the criteria' });
        }

        res.status(200).json(rows);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


// PUT Controller for Updating Status
const updateAdvertisementStatus = async (req, res) => {
    const adId = req.params.tbs_ad_id;
    const { req_status, req_status_id } = req.body;

    if (!adId || req_status_id === undefined || req_status === undefined) {
        return res.status(400).json("All fields are required");
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const updateQuery = `
            UPDATE advertisements_tbl
            SET 
                req_status = COALESCE(NULLIF($1, ''), req_status),
                req_status_id = COALESCE(NULLIF($2::integer, NULL), req_status_id)
            WHERE tbs_ad_id = $3
        `;
        await client.query(updateQuery, [req_status || null, req_status_id || null, adId]);

        const adQuery = `
            SELECT tbs_user_id, ad_title 
            FROM advertisements_tbl 
            WHERE tbs_ad_id = $1
        `;
        const adResult = await client.query(adQuery, [adId]);

        if (adResult.rows.length === 0) {
            return res.status(404).json("Advertisement not found");
        }

        const tbs_user_id = adResult.rows[0].tbs_user_id;
        const ad_title = adResult.rows[0].ad_title;

        if (!tbs_user_id) {
            return res.status(400).json({ message: "Invalid tbs_user_id" });
        }

        if (tbs_user_id.startsWith('tbs-pro_emp')) {
            const user_type = 'product_owner_employee';

            const empQuery = `
                SELECT emp_first_name 
                FROM pro_emp_personal_details 
                WHERE tbs_pro_emp_id = $1
            `;
            const empResult = await client.query(empQuery, [tbs_user_id]);

            if (empResult.rows.length === 0) {
                return res.status(404).json("Product owner employee not found");
            }

            const user_name = empResult.rows[0].emp_first_name;

            const notificationMessage = `Web advertisement ${ad_title} status created by ${user_name} is now ${req_status}`;

            const insertNotification = `
                INSERT INTO pro_emp_notification (tbs_pro_emp_notif_id, tbs_user_id, user_name, user_type, subject_name, module_name, notification_message, read, tbs_pro_emp_id)
                VALUES (CONCAT('tbs-pro-emp-notif', nextval('pro_emp_notification_seq')), $1, $2, $3, $4, $5, $6, $7, $8)
            `;
            const notifValues = [
                tbs_user_id, user_name, user_type, `${ad_title}`, 'advertisement', notificationMessage, false, tbs_user_id
            ];
            await client.query(insertNotification, notifValues);
        }

        await client.query('COMMIT');
        res.status(200).json({ message: "Web advertisement status updated and notification triggered successfully" });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating web advertisement status', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
}

// GET Controller for Mobile Advertisements
const getMobileAdvertisements = async (req, res) => {
    try {
        const query = `
        SELECT *
        FROM mobile_advertisements_tbl
        WHERE req_status_id IN (1, 2, 3, 5)
        `;
        const result = await pool.query(query);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'No mobile advertisements with the specified statuses found' });
        }

        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error executing query', err.stack);
        res.status(500).json({ error: 'Database query failed' });
    }
}

// GET by ID Controller for Mobile Advertisements
const getMobileAdvertisementById = async (req, res) => {
    const adId = req.params.tbs_mobad_id;
    console.log(adId);
    try {
        const query = `
            SELECT *
            FROM mobile_advertisements_tbl
            WHERE tbs_mobad_id = $1 AND req_status_id IN (1, 2, 3, 5)
        `;

        const result = await pool.query(query, [adId]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Mobile advertisement not found' });
        }

        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error executing query', err.stack);
        res.status(500).json({ error: 'Server error' });
    }
}

// GET by Status ID Controller for Mobile Advertisements
const getMobileAdvertisementsByStatus = async (req, res) => {
    const reqStatus = req.params.req_status_id;
  
    try {
      let query;
      let params;
  
      if (reqStatus == 6) {
        query = `
          SELECT *
          FROM mobile_advertisements_tbl;
        `;
        params = [];
      } else {
        query = `
          SELECT *
          FROM mobile_advertisements_tbl
          WHERE req_status_id = $1;
        `;
        params = [reqStatus];
      }
  
      const result = await pool.query(query, params);
  
      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error executing query', err.stack);
      res.status(500).json({ error: 'Internal Server Error' });
    }
}

// FILTER by Date Controller for Mobile Advertisements
const filterMobileAdvertisementsByDate = async (req, res) => {
    try {
        let query;
        let queryParams = [];
        
        const { from, to } = req.body;
        
        if (from && to) {
            query = `
                SELECT *
                FROM mobile_advertisements_tbl
                WHERE created_date BETWEEN $1 AND $2::DATE + INTERVAL '1 day' - INTERVAL '1 second'
                ORDER BY created_date ASC
            `;
            queryParams = [from, to];
        } else {
            query = `
                SELECT *
                FROM mobile_advertisements_tbl
                ORDER BY created_date ASC
            `;
        }

        const result = await pool.query(query, queryParams);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error executing query', err.stack);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

// SEARCH Controller for Mobile Advertisements
const searchMobileAdvertisements = async (req, res) => {
    try {
        const { status, search_term } = req.body;
        const searchTerm = search_term ? search_term.toLowerCase() : '';
        const statusFilter = status ? status.toLowerCase() : '';

        console.log('Search Term:', searchTerm);
        console.log('Status Filter:', statusFilter);

        let query = `
            SELECT *
            FROM mobile_advertisements_tbl
            WHERE 1=1
        `;
        let queryParams = [];
        let paramIndex = 1;

        // Filter by status if provided and not "all"
        if (statusFilter && statusFilter !== 'all') {
            query += ` AND LOWER(req_status) = $${paramIndex}`;
            queryParams.push(statusFilter);
            paramIndex++;
        }

        // Filter by search term if provided
        if (searchTerm) {
            query += ` AND (LOWER(mobad_title) LIKE $${paramIndex} OR LOWER(mobad_description) LIKE $${paramIndex} OR LOWER(client_details) LIKE $${paramIndex})`;
            queryParams.push(`%${searchTerm}%`);
        }

        console.log('Executing query:', query);
        console.log('With parameters:', queryParams);

        const { rows } = await pool.query(query, queryParams);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'No advertisements found matching the criteria' });
        }

        res.status(200).json(rows);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// PUT Controller for Updating Status of Mobile Advertisements
const updateMobileAdvertisementStatus = async (req, res) => {
    const adId = req.params.tbs_mobad_id;
    const { req_status, req_status_id } = req.body;

    if (!adId || req_status_id === undefined || req_status === undefined) {
        return res.status(400).json("All fields are required");
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const updateQuery = `
            UPDATE mobile_advertisements_tbl
            SET 
                req_status = COALESCE(NULLIF($1, ''), req_status),
                req_status_id = COALESCE(NULLIF($2::integer, NULL), req_status_id)
            WHERE tbs_mobad_id = $3
        `;
        await client.query(updateQuery, [req_status || null, req_status_id || null, adId]);

        const adQuery = `
            SELECT tbs_user_id, mobad_title 
            FROM mobile_advertisements_tbl 
            WHERE tbs_mobad_id = $1
        `;
        const adResult = await client.query(adQuery, [adId]);

        if (adResult.rows.length === 0) {
            return res.status(404).json("Advertisement not found");
        }

        const tbs_user_id = adResult.rows[0].tbs_user_id;
        const mobad_title = adResult.rows[0].mobad_title;

        if (!tbs_user_id) {
            return res.status(400).json({ message: "Invalid tbs_user_id" });
        }

        if (tbs_user_id.startsWith('tbs-pro_emp')) {
            const user_type = 'product_owner_employee';

            const empQuery = `
                SELECT emp_first_name 
                FROM pro_emp_personal_details 
                WHERE tbs_pro_emp_id = $1
            `;
            const empResult = await client.query(empQuery, [tbs_user_id]);

            if (empResult.rows.length === 0) {
                return res.status(404).json("Product owner employee not found");
            }

            const user_name = empResult.rows[0].emp_first_name;

            const notificationMessage = `Mobile advertisement ${mobad_title} status created by ${user_name} is now ${req_status}`;

            const insertNotification = `
                INSERT INTO pro_emp_notification (tbs_pro_emp_notif_id, tbs_user_id, user_name, user_type, subject_name, module_name, notification_message, read, tbs_pro_emp_idf)
                VALUES (CONCAT('tbs-pro-emp-notif', nextval('pro_emp_notification_seq')), $1, $2, $3, $4, $5, $6, $7, $8)
            `;
            const notifValues = [
                tbs_user_id, user_name, user_type, `${mobad_title}`, 'advertisement', notificationMessage, false, tbs_user_id
            ];
            await client.query(insertNotification, notifValues);
        }

        await client.query('COMMIT');
        res.status(200).json({ message: "Mobile advertisement status updated and notification triggered successfully" });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating mobile advertisement status', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
}


module.exports = { getRequest, getRequestID, getRequestByStatus, putReq_Status, searchReqOperators, getAllRequest, reqFilterByDate, getRequestPartner, getRequestIDPartner, getRequestByStatusPartner, reqFilterByDatePartners, searchReqPartners, putReq_StatusPartner, getOffersDeals, getOfferDealById, getOffersDealsByStatus, filterOffersDealsByDate, searchOffersDeals, updateOfferDealStatus, getAdvertisementById, getAdvertisementsByStatus, getAdvertisements, searchAdvertisements, updateAdvertisementStatus, filterAdvertisementsByDate, getMobileAdvertisementById, getMobileAdvertisements, searchMobileAdvertisements, updateMobileAdvertisementStatus, filterMobileAdvertisementsByDate, getMobileAdvertisementsByStatus }