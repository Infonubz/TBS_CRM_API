const pool = require('../config/db')

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
const putUser_Status = async (req, res) => {
    try {
        const tbs_operator_id = req.params.tbs_operator_id;
        const { user_status, user_status_id, req_status, req_status_id } = req.body;

        const queryResult = await pool.query('SELECT owner_name FROM operators_tbl WHERE tbs_operator_id = $1', [tbs_operator_id]);

        if (queryResult.rows.length === 0) {
            return res.status(201).json({ error: 'Operator not found' });
        }

        let generate_key = null;

        if (user_status_id === 1) {
            const owner_name = queryResult.rows[0].owner_name;
            const owner_initials = owner_name.slice(0, 3).toUpperCase();
            const randomDigits = Math.round(Math.random() * 1E13).toString().padStart(13, '0');
            generate_key = `${owner_initials}${randomDigits}`;
        }

        const updateResult = await pool.query(`
            UPDATE operators_tbl 
            SET 
                user_status = $1,
                user_status_id = $2,
                generate_key = COALESCE($3, generate_key),
                req_status = $4,
                req_status_id = $5
            WHERE tbs_operator_id = $6`,
            [user_status, user_status_id, generate_key, req_status, req_status_id, tbs_operator_id]
        )

        if (user_status_id === 1) {
            res.status(200).json({
                message: 'User Status is Active and Key generated successfully',
                'Generated Key': generate_key
            });
        } else {
            res.status(200).json({
                message: 'User status updated successfully'
            });
        }
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

//user management-PARTNERS GETbyID CONTROLLER
const getAllPartnerDetails = async (req, res) => {
    try {
        const query = `
            SELECT pd.*, pdoc.*
            FROM partner_details AS pd
            LEFT JOIN partner_documents AS pdoc ON pd.tbs_partner_id = pdoc.tbs_partner_id
            WHERE pd.partner_status_id IN (0,1,2,3)
        `;
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
;}


//SEARCH PARTNER DETAILS
const searchPartnerDetails = async (req, res) => {
    try {
        let query;
        let queryParams = [];

        const searchTerm = req.params.searchTerm;

        if (searchTerm && typeof searchTerm === 'string') {
            const searchValue = `%${searchTerm.toLowerCase()}%`;

            query = `
                SELECT *
                FROM partner_details
                WHERE LOWER(partner_first_name) LIKE $1
                   OR CAST(phone AS TEXT) LIKE $1
                   OR LOWER(emailid) LIKE $1
            `;

            queryParams = [searchValue];
        } else {
            query = `
                SELECT *
                FROM partner_details
            `;
        }

        const result = await pool.query(query, queryParams);
        res.json(result.rows);
    } catch (err) {
        console.error('Error executing query', err);
        res.status(500).json({ message: "Error searching records" });
    }
};


//SEARCH CLIENT DETAILS
const searchClientDetails = async (req, res) => {
    try {
        let query;
        let queryParams = [];

        const searchTerm = req.params.searchTerm;

        if (searchTerm && typeof searchTerm === 'string') {
            const searchValue = `%${searchTerm.toLowerCase()}%`;

            query = `
                SELECT *
                FROM client_company_details
                WHERE LOWER(owner_name) LIKE $1
                   OR CAST(phone AS TEXT) LIKE $1
                   OR LOWER(emailid) LIKE $1 `;

            queryParams = [searchValue];
        } else {
            query = ` SELECT *
                        FROM client_company_details `;
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

        if (searchTerm && typeof searchTerm === 'string') {
            const searchValue = `%${searchTerm.toLowerCase()}%`;

            query = `
                SELECT *
                FROM pro_emp_personal_details
                WHERE LOWER(emp_first_name) LIKE $1
                   OR CAST(phone AS TEXT) LIKE $1
                   OR LOWER(email_id) LIKE $1
            `;

            queryParams = [searchValue];
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
};


module.exports = { getAllOperatorDetails, getOperatorByID, putUser_Status, getAllPartnerDetails, getPartnerByID, searchPartnerDetails, searchClientDetails, searchProEmpDetails }