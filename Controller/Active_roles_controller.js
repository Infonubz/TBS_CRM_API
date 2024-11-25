
const express = require('express');
const pool = require('../config/db');

//GET ALL ROLES
const getRoles = async (req, res) => {
    const { type } = req.params; 

    try {
        let queryText;

        if (type === '1') {
            queryText = 'SELECT * FROM active_roles_tbl WHERE user_id LIKE \'OP%\' ORDER BY created_date DESC';
        } else if (type === '2') {
            queryText = 'SELECT * FROM active_roles_tbl WHERE user_id LIKE \'EMP%\' ORDER BY created_date DESC';
        } else if (type === '3') {
            queryText = 'SELECT * FROM active_roles_tbl ORDER BY created_date DESC';
        } else {
            return res.status(400).send("Invalid type parameter. Use 1 for OP, 2 for EMP, and 3 for ALL.");
        }

        const result = await pool.query(queryText);
        res.status(200).send(result.rows);

    } catch (err) {
        console.log(err.message);
        res.status(500).send("Error getting records");
    }
};

//GET ROLE BY ID
const getRolebyId = async (req, res) => {
    try{
        const id = req.params.role_id;
        const getRol = `SELECT * FROM active_roles_tbl WHERE role_id = $1`;
        const result = await pool.query(getRol, [id]);
        res.status(200).send(result.rows);
    } catch(err) {
        console.log(err.message);
        res.status(201).send("Error getting records");
    }
};
  
//DELETE ROLE BY ID
const deleteRole = async (req,res) => {
    
    try{
    const id = req.params.role_id;
    const removeRole = 'DELETE FROM active_roles_tbl WHERE role_id = $1';
    const result = await pool.query(removeRole, [id]);
    res.status(200).send('Deleted successfully!');
    } catch(err) {
        console.log(err);
        res.status(201).send('Error deleting record');
    }
};

//POST ROLE
const postRole = async (req, res) => {
    const { user, role_type, description, tbs_user_id } = req.body;

    if (!user || !role_type || !description || !tbs_user_id) {
        return res.status(400).json({ success: false, message: "Invalid request body" });
    }

    const normalizedUser = user.toLowerCase();
    console.log("Normalized User:", normalizedUser);

    let userId;
    if (normalizedUser === 'operator') {
        userId = 'OP101';  
    } else if (normalizedUser === 'employee') {
        userId = 'EMP101'; 
    } else {
        return res.status(400).json({ success: false, message: "Invalid user type" });
    }

    try {
        const checkRoleQuery = `
            SELECT COUNT(*) AS role_exists
            FROM active_roles_tbl
            WHERE user_id = $1 AND role_type = $2
        `;
        const checkResult = await pool.query(checkRoleQuery, [userId, role_type]);
        const roleExists = checkResult.rows[0].role_exists;

        if (roleExists > 0) {
            return res.status(401).json({ exist: true, message: "Role already exists" });
        }

        const insertRoleQuery = `
            INSERT INTO active_roles_tbl (user_id, "user", role_type, description, tbs_user_id)
            VALUES ($1, $2, $3, $4, $5)
        `;
        await pool.query(insertRoleQuery, [userId, normalizedUser, role_type, description, tbs_user_id]);

        return res.status(201).json({ exist: false, message: "Role inserted successfully" });

    } catch (err) {
        console.error("Error inserting record:", err.message);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

//GET ROLE MEMBER COUNT - PERMISSION FROM OP-EMP TABLE
const getRoleMemberCountOpEmp = async (req, res) => {
    const { tbs_user_id } = req.params;

    const query = `
    WITH selected_roles AS (
        SELECT DISTINCT role_type
        FROM public.active_permissions_tbl
        WHERE tbs_user_id = $1
    ),
    employee_roles AS (
        SELECT 
            r.tbs_op_emp_id,
            r.role_type
        FROM 
            public.op_emp_professional_details r
        JOIN 
            public.op_emp_personal_details p 
        ON 
            r.tbs_op_emp_id = p.tbs_op_emp_id
        JOIN 
            selected_roles sr 
        ON 
            r.role_type = sr.role_type
    ),
    permission_counts AS (
        SELECT
            role_type,
            COUNT(DISTINCT perm.permission) AS permission_access_count
        FROM 
            public.active_permissions_tbl ap
        CROSS JOIN LATERAL unnest(ap.crud_permissions) AS perm(permission)
        WHERE
            ap.tbs_user_id = $1
        GROUP BY 
            role_type
    )
    SELECT 
        sr.role_type,
        COALESCE(COUNT(DISTINCT er.tbs_op_emp_id), 0) AS role_count,
        COALESCE(pc.permission_access_count, 0) AS permission_access_count
    FROM 
        selected_roles sr
    LEFT JOIN 
        employee_roles er ON sr.role_type = er.role_type
    LEFT JOIN 
        permission_counts pc ON sr.role_type = pc.role_type
    GROUP BY 
        sr.role_type, pc.permission_access_count
    ORDER BY 
        sr.role_type;`;

    try {
        const params = [tbs_user_id];
        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            res.status(202).json({ message: 'No data found for this user or role' });
        } else {
            res.json(result.rows);
        }
    } catch (err) {
        console.error('Error executing query', err.stack);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

//GET ROLE MEMBER COUNT - PERMISSION FROM PRO-EMP TABLE
const getRoleMemberCountProEmp = async (req, res) => {
    const { role } = req.body; 

    let query;

    if (role === 'PO') {
        query = `
        WITH role_counts AS (
            SELECT 
                role_type AS role,
                COUNT(*) AS role_count
            FROM 
                public.pro_emp_professional_details
            GROUP BY 
                role_type
        ),
        expanded_permissions AS (
            SELECT 
                a.role_id,
                unnest(a.crud_permissions) AS permission
            FROM 
                public.active_permissions_tbl a
        ),
        distinct_permissions AS (
            SELECT 
                role_id,
                COUNT(DISTINCT permission) AS permission_access_count
            FROM 
                expanded_permissions
            GROUP BY 
                role_id
        ),
        permission_counts AS (
            SELECT
                e.role_type AS role,
                COALESCE(d.permission_access_count, 0) AS permission_access_count
            FROM 
                public.pro_emp_professional_details e
            LEFT JOIN 
                distinct_permissions d
            ON 
                e.role_type_id = d.role_id
            GROUP BY
                e.role_type, d.permission_access_count
        )
        SELECT 
            'product owner-employee' AS "user",
            r.role,
            r.role_count,
            COALESCE(p.permission_access_count, 0) AS permission_access_count
        FROM 
            role_counts r
        LEFT JOIN 
            permission_counts p
        ON 
            r.role = p.role
        ORDER BY 
            r.role;`;
    } else if (role === 'OP') {
        query = `
        WITH selected_roles AS (
            SELECT DISTINCT role_type
            FROM public.active_permissions_tbl
        ),
        employee_roles AS (
            SELECT 
                r.tbs_op_emp_id,
                r.role_type
            FROM 
                public.op_emp_professional_details r
            JOIN 
                public.op_emp_personal_details p 
            ON 
                r.tbs_op_emp_id = p.tbs_op_emp_id
            JOIN 
                selected_roles sr 
            ON 
                r.role_type = sr.role_type
        ),
        permission_counts AS (
            SELECT
                role_type,
                COUNT(DISTINCT perm.permission) AS permission_access_count
            FROM 
                public.active_permissions_tbl ap
            CROSS JOIN LATERAL unnest(ap.crud_permissions) AS perm(permission)
            GROUP BY 
                role_type
        )
        SELECT 
            'operator-employee' AS "user",   -- Changed to reflect the operator employee
            sr.role_type AS role,
            COALESCE(COUNT(DISTINCT er.tbs_op_emp_id), 0) AS role_count,
            COALESCE(pc.permission_access_count, 0) AS permission_access_count
        FROM 
            selected_roles sr
        LEFT JOIN 
            employee_roles er ON sr.role_type = er.role_type
        LEFT JOIN 
            permission_counts pc ON sr.role_type = pc.role_type
        GROUP BY 
            sr.role_type, pc.permission_access_count
        ORDER BY 
            sr.role_type;
        `;
    } else {
        return res.status(400).json({ error: 'Invalid role type passed' });
    }

    try {
        const result = await pool.query(query);  

        if (result.rows.length === 0) {
            res.status(202).json({ message: 'No data found for the given role or user' });
        } else {
            res.json(result.rows);
        }
    } catch (err) {
        console.error('Error executing query', err.stack);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

//UPDATE ROLE BY ID
const putRole = async (req, res) => {
    const {user, role_type, description, tbs_user_id} = req.body;

    if (!user || !role_type || !description || !tbs_user_id) {
        return res.status(400).send("Invalid request body");
    }

    try{
        let updateRole = `UPDATE active_roles_tbl SET 
        "user" = $1,
        role_type = $2,
        updated_date = now(),
        description = $3,
        tbs_user_id = $4
        WHERE role_id = $5`;
        const ID = req.params.role_id;
        const values = [user, role_type, description, tbs_user_id, ID];
        await pool.query(updateRole, values);
        res.status(201).send("Updated successfully!");
       
    } catch (err){
        console.log(err.message);
        res.status(201).send("Error updating records");
    }         
};

const searchRoleMemberCountProEmp = async (req, res) => {
    const searchTerm = req.params.searchTerm;
    const { role } = req.body;

    let query;

    if (!role || !['PO', 'OP'].includes(role)) {
        return res.status(400).json({ error: 'Invalid or missing role. Expected "PO" or "OP".' });
    }

    if (role === 'PO') {
        query = `
        WITH role_counts AS (
            SELECT 
                role_type AS role,
                COUNT(*) AS role_count
            FROM 
                public.pro_emp_professional_details
            GROUP BY 
                role_type
        ),
        expanded_permissions AS (
            SELECT 
                a.role_id,
                unnest(a.crud_permissions) AS permission
            FROM 
                public.active_permissions_tbl a
        ),
        distinct_permissions AS (
            SELECT 
                role_id,
                COUNT(DISTINCT permission) AS permission_access_count
            FROM 
                expanded_permissions
            GROUP BY 
                role_id
        ),
        permission_counts AS (
            SELECT
                e.role_type AS role,
                COALESCE(d.permission_access_count, 0) AS permission_access_count
            FROM 
                public.pro_emp_professional_details e
            LEFT JOIN 
                distinct_permissions d
            ON 
                e.role_type_id = d.role_id
            GROUP BY
                e.role_type, d.permission_access_count
        )
        SELECT 
            'product owner-employee' AS "user",
            r.role,
            r.role_count,
            COALESCE(p.permission_access_count, 0) AS permission_access_count
        FROM 
            role_counts r
        LEFT JOIN 
            permission_counts p
        ON 
            r.role = p.role
        WHERE 
            LOWER(r.role) LIKE LOWER($1)  
        ORDER BY 
            r.role; `;
    } else if (role === 'OP') {
        query = `
        WITH selected_roles AS (
            SELECT DISTINCT role_type
            FROM public.active_permissions_tbl
        ),
        employee_roles AS (
            SELECT 
                r.tbs_op_emp_id,
                r.role_type
            FROM 
                public.op_emp_professional_details r
            JOIN 
                public.op_emp_personal_details p 
            ON 
                r.tbs_op_emp_id = p.tbs_op_emp_id
            JOIN 
                selected_roles sr 
            ON 
                r.role_type = sr.role_type
        ),
        permission_counts AS (
            SELECT
                role_type,
                COUNT(DISTINCT perm.permission) AS permission_access_count
            FROM 
                public.active_permissions_tbl ap
            CROSS JOIN LATERAL unnest(ap.crud_permissions) AS perm(permission)
            GROUP BY 
                role_type
        )
        SELECT 
            'operator-employee' AS "user",
            sr.role_type AS role,
            COALESCE(COUNT(DISTINCT er.tbs_op_emp_id), 0) AS role_count,
            COALESCE(pc.permission_access_count, 0) AS permission_access_count
        FROM 
            selected_roles sr
        LEFT JOIN 
            employee_roles er ON sr.role_type = er.role_type
        LEFT JOIN 
            permission_counts pc ON sr.role_type = pc.role_type
        WHERE 
            LOWER(sr.role_type) LIKE LOWER($1)
        GROUP BY 
            sr.role_type, pc.permission_access_count
        ORDER BY 
            sr.role_type; `;
    }

    const searchValue = `%${searchTerm || ''}%`;

    try {
        const result = await pool.query(query, [searchValue]);

        if (result.rows.length === 0) {
            res.status(202).json({ message: 'No data found for the given search criteria' });
        } else {
            res.json(result.rows);
        }
    } catch (err) {
        console.error('Error executing query', err.stack);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

//ROLE TYPE VALIDATION
const roleTypeValidation = async (req, res) => {
    const{ role_type } = req.body
    try {
    const roleResult = await pool.query(`SELECT * FROM active_roles_tbl WHERE role_type = $1`, [role_type])

    roleExists = roleResult.rows.length > 0;

    res.json({Role : roleExists})

    } catch (error) {
    res.status(201).json({ error: error.message})
    }
};

//SEARCH OP EMP ROLE MEMBER COUNTS
const getRoleMemberCountOpEmpSearch = async (req, res) => {
    const { tbs_user_id, searchTerm } = req.params;

    if (!tbs_user_id || !searchTerm) {
        return res.status(400).json({ error: 'Both tbs_user_id and searchTerm are required.' });
    }

    const query = `
    WITH selected_roles AS (
        SELECT DISTINCT role_type
        FROM public.active_permissions_tbl
        WHERE tbs_user_id = $1
    ),
    employee_roles AS (
        SELECT 
            r.tbs_op_emp_id,
            r.role_type
        FROM 
            public.op_emp_professional_details r
        JOIN 
            public.op_emp_personal_details p 
        ON 
            r.tbs_op_emp_id = p.tbs_op_emp_id
        JOIN 
            selected_roles sr 
        ON 
            r.role_type = sr.role_type
        WHERE
            LOWER(r.role_type) LIKE LOWER($2)  
    ),
    permission_counts AS (
        SELECT
            role_type,
            COUNT(DISTINCT perm.permission) AS permission_access_count
        FROM 
            public.active_permissions_tbl ap
        CROSS JOIN LATERAL unnest(ap.crud_permissions) AS perm(permission)
        WHERE
            ap.tbs_user_id = $1
        GROUP BY 
            role_type
    )
    SELECT 
        'operator-employee' AS "user", 
        sr.role_type,
        COALESCE(COUNT(DISTINCT er.tbs_op_emp_id), 0) AS role_count,
        COALESCE(pc.permission_access_count, 0) AS permission_access_count
    FROM 
        selected_roles sr
    LEFT JOIN 
        employee_roles er ON sr.role_type = er.role_type
    LEFT JOIN 
        permission_counts pc ON sr.role_type = pc.role_type
    WHERE
        LOWER(sr.role_type) LIKE LOWER($2)  
    GROUP BY 
        sr.role_type, pc.permission_access_count
    ORDER BY 
        sr.role_type; `;

    try {
        const params = [tbs_user_id, `%${searchTerm}%`];
        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            res.status(202).json({ message: 'No data found for this user or role' });
        } else {
            res.json(result.rows);
        }
    } catch (err) {
        console.error('Error executing query', err.stack);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

//GET CRUD PERMISSION BY ROLE-TYPE-ID
const getCrudPermissions = async (req, res) => {
    const roleTypeId = req.params.role_id
    const query = `SELECT r.description, p.crud_permissions, p.crud_permission_id
    FROM active_roles_tbl r 
    LEFT JOIN active_crud_permissions_tbl p ON r.role_id = p.role_id
    WHERE r.role_id = $1;`;
    try {
      const result = await pool.query(query, [roleTypeId]);
      res.status(200).json(result.rows) ;
    } catch (err) {
      console.error('Error executing query', err.stack);
    }
  }

module.exports = {getRoles, getRolebyId, deleteRole, postRole, putRole, roleTypeValidation, getRoleMemberCountOpEmpSearch, getRoleMemberCountOpEmp, getRoleMemberCountProEmp, searchRoleMemberCountProEmp, getCrudPermissions};