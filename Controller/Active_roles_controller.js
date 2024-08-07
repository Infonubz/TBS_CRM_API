
const express = require('express');
const pool = require('../dbconnection.js');

//GET ALL ROLES
const getRole = async (req, res) => {
    try{
        const result = await pool.query('SELECT * FROM active_roles_tbl');
        res.status(200).send(result.rows);
    } catch(err) {
        console.log(err.message);
        res.status(201).send("Error getting records");
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
    const { user, role_type, description } = req.body;

    if (!user || !role_type || !description) {
        return res.status(400).send("Invalid request body");
    }

    const normalizedUser = user.toLowerCase();
    console.log("Normalized User:", normalizedUser);

    let userId;
    if (normalizedUser === 'operator') {
        userId = 'OP101';
    } else if (normalizedUser === 'employee') {
        userId = 'EMP101';
    } else {
        return res.status(400).send("Invalid user type");
    }

    try {

        const insertRoleQuery = `
            INSERT INTO active_roles_tbl (user_id, "user", role_type, description)
            VALUES ($1, $2, $3, $4)
        `;
        await pool.query(insertRoleQuery, [userId, normalizedUser, role_type, description]);
       
        const countRolesQuery = `
            SELECT COUNT(*) AS role_count
            FROM active_roles_tbl
            WHERE "user" = $1
        `;
        const countResult = await pool.query(countRolesQuery, [normalizedUser]);
        const roleCount = countResult.rows[0].role_count;

        res.status(201).send(`Role inserted successfully! Total roles for ${user}: ${roleCount}`);
    } catch (err) {
        console.error("Error inserting record:", err.message);
        res.status(201).send("Internal server error");
    }
};

//GET COUNT OF ROLE TO BE CREATED
const getRoleCount = async (req, res) => {
    const { user } = req.params;

    if (!user) {
        return res.status(400).send("User type is required");
    }

    const normalizedUser = user.toLowerCase();

    if (normalizedUser !== 'operator' && normalizedUser !== 'employee') {
        return res.status(400).send("Invalid user type. Valid types are: operator, employee");
    }

    try {
        const countRolesQuery = `
            SELECT COUNT(*) AS role_count
            FROM active_roles_tbl
            WHERE "user" = $1
        `;
        const countResult = await pool.query(countRolesQuery, [normalizedUser]);
        const roleCount = countResult.rows[0].role_count;

        res.status(200).json({ user: normalizedUser, role_count: roleCount });
    } catch (err) {
        console.error("Error retrieving role count:", err.message);
        res.status(201).send("Internal server error");
    }
};

//GET ROLE MEMBER COUNT - PERMISSION FROM OP-EMP TABLE
const getRoleMemberCountOpEmp = async (req, res) => {
    const { role } = req.params;

    const query = `
    WITH role_counts AS (
        SELECT 
            role_type AS role,
            COUNT(*) AS role_count
        FROM 
            public.op_emp_personal_details
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
            public.op_emp_personal_details e
        LEFT JOIN 
            distinct_permissions d
        ON 
            e.role_type_id = d.role_id
        GROUP BY
            e.role_type, d.permission_access_count
    )
    SELECT 
        'operator-employee' AS "user",
        r.role,
        r.role_count,
        COALESCE(p.permission_access_count, 0) AS permission_access_count
    FROM 
        role_counts r
    LEFT JOIN 
        permission_counts p
    ON 
        r.role = p.role
    ${role ? `WHERE r.role ILIKE $1` : ''}
    ORDER BY 
        r.role;
`;

    try {
        const result = await pool.query(query, role ? [`%${role}%`] : []);
        res.json(result.rows);
    } catch (err) {
        console.error('Error executing query', err.stack);
        res.status(201).json({ error: 'Internal Server Error' });
    }
};

  

//GET ROLE MEMBER COUNT - PERMISSION FROM PRO-EMP TABLE
const getRoleMemberCountProEmp = async (req, res) => {
    const { role } = req.params;

    const query = `
    WITH role_counts AS (
        SELECT 
            role_type AS role,
            COUNT(*) AS role_count
        FROM 
            public.pro_emp_personal_details
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
            public.pro_emp_personal_details e
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
    ${role ? `WHERE r.role ILIKE $1` : ''}
    ORDER BY 
        r.role;
`;

    try {
      const result = await pool.query(query, role ? [`%${role}%`] : []);
      res.json(result.rows);
    } catch (err) {
      console.error('Error executing query', err.stack);
      res.status(201).json({ error: 'Internal Server Error' });
    }
};

  

//UPDATE ROLE BY ID
const putRole = async (req, res) => {
    const {user, role_type, description} = req.body;

    if (!user || !role_type || !description) {
        return res.status(400).send("Invalid request body");
    }

    try{
        let updateRole = `UPDATE active_roles_tbl SET 
        "user" = $1,
        role_type = $2,
        updated_date = now(),
        description = $3
        WHERE role_id = $4`;
        const ID = req.params.role_id;
        const values = [user, role_type, description, ID];
        await pool.query(updateRole, values);
        res.status(201).send("Updated successfully!");
       
    } catch (err){
        console.log(err.message);
        res.status(201).send("Error updating records");
    }         
};

const searchOpEmpRoles = async (req, res) => {
    try {
        const searchTerm = req.params.searchTerm;
        if (!searchTerm || typeof searchTerm !== 'string') {
            return res.status(400).json({ error: 'Invalid search term' });
        }

        const searchValue = `%${searchTerm.toLowerCase()}%`;

        const query = `
            SELECT role_type, role_type_id            
            FROM op_emp_personal_details
            WHERE LOWER(role_type) LIKE $1
        `;
    
        const queryParams = [searchValue];

        const result = await pool.query(query, queryParams);
        res.json(result.rows);
    } catch (err) {
        console.error('Error executing query', err);
        res.status(201).json({ error: 'Error searching records' });
    }
};

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

//SEARCH ROLES BY ROLE-TYPE AND DATE
const searchRoles = async (req, res) => {
    try {
        const searchTerm = req.params.searchTerm;
        if (!searchTerm || typeof searchTerm !== 'string') {
            return res.status(400).json({ error: 'Invalid search term' });
        }

        const searchValue = `%${searchTerm.toLowerCase()}%`;

        const query = `
            SELECT *
            FROM active_roles_tbl
            WHERE LOWER(role_type) LIKE $1
               OR (TO_CHAR(created_date, 'Mon') || ' ' || TO_CHAR(created_date, 'DD')) ILIKE $1
               OR (TO_CHAR(updated_date, 'Mon') || ' ' || TO_CHAR(updated_date, 'DD')) ILIKE $1
        `;
    
        const queryParams = [searchValue];

        const result = await pool.query(query, queryParams);
        res.json(result.rows);
    } catch (err) {
        console.error('Error executing query', err);
        res.status(201).json({ error: 'Error searching records' });
    }
};


module.exports = {getRole, getRolebyId, deleteRole, postRole, putRole, roleTypeValidation, searchRoles, getRoleCount, getRoleMemberCountOpEmp,getRoleMemberCountProEmp, searchOpEmpRoles};