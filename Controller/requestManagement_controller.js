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
    
    }

// search CONTROLLER
const searchReqOperators = async (req, res) => {
    const searchTerm = req.params.search_term ? req.params.search_term.toLowerCase() : '';

    try {
        let query;
        let queryParams;

        if (searchTerm) {
            query = `
            SELECT *
            FROM operators_tbl AS o
            LEFT JOIN operator_details AS od ON o.tbs_operator_id = od.tbs_operator_id 
                WHERE LOWER(owner_name) LIKE $1
                    OR phone::text LIKE $1
                    OR LOWER(emailid) LIKE $1
            `;
            queryParams = [`%${searchTerm}%`];
        } else {
            query = `SELECT *
            FROM operators_tbl AS o
            LEFT JOIN operator_details AS od ON o.tbs_operator_id = od.tbs_operator_id;
            `;
            queryParams = [];
        }

        const { rows } = await pool.query(query, queryParams);

        res.status(200).json(rows);

    } catch (error) {
        console.error('Error:', error);
        res.status(201).json({ error: 'Internal server error' });
    }
}

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

//search CONTROLLER
const searchReqPartners = async (req, res) => {
    const searchTerm = req.params.search_term ? req.params.search_term.toLowerCase() : '';

    console.log(searchTerm);

    try {
        let query;
        let queryParams;

        if (searchTerm) {
            query = `
            SELECT *
            FROM partner_details AS pd
            LEFT JOIN partner_documents AS pdoc ON pd.tbs_partner_id = pdoc.tbs_partner_id
            WHERE LOWER(pd.partner_first_name) LIKE $1
                OR LOWER(pd.partner_last_name) LIKE $1
                OR pd.phone::text LIKE $1
                OR LOWER(pd.emailid) LIKE $1
            `;
            queryParams = [`%${searchTerm}%`];
        } else {
            query = `
            SELECT *
            FROM partner_details AS pd
            LEFT JOIN partner_documents AS pdoc ON pd.tbs_partner_id = pdoc.tbs_partner_id;
            `;
            queryParams = [];
        }

        const { rows } = await pool.query(query, queryParams);

        if (rows.length === 0) {
            return res.status(200).json('No partners found');
        }

        res.status(200).json(rows);

    } catch (error) {
        console.error('Error:', error);
        res.status(201).json({ error: 'Internal server error' });
    }
}

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
};



module.exports = { getRequest, getRequestID, getRequestByStatus, putReq_Status, searchReqOperators, getAllRequest, reqFilterByDate, getRequestPartner, getRequestIDPartner, getRequestByStatusPartner, reqFilterByDatePartners, searchReqPartners, putReq_StatusPartner }