const express = require('express');
const pool = require('../dbconnection.js');

//GET ALL PERMISSIONS
const getPermission = async (req, res) => {
    try{
        const result = await pool.query('SELECT * FROM active_permissions_tbl');
        res.status(200).send(result.rows);
    } catch(err) {
        console.log(err.message);
        res.status(201).send("Error getting records");
    }
};

//GET PERMISSION BY ID
const getPermissionbyId = async (req, res) => {
    try{
        const id = req.params.role_id;
        const getPerm = `SELECT * FROM active_permissions_tbl WHERE role_id = $1`;
        const result = await pool.query(getPerm, [id]);
        res.status(200).send(result.rows);
    } catch(err) {
        console.log(err.message);
        res.status(201).send("Error getting records");
    }
};

//DELETE PERMISSION BY ID
const deletePermission = async (req,res) => {
    
    try{
    const id = req.params.permission_id;
    const removeRole = 'DELETE FROM active_permissions_tbl WHERE permission_id = $1';
    const result = await pool.query(removeRole, [id]);
    res.status(200).send('Deleted successfully!');
    } catch(err) {
        console.log(err);
        res.status(201).send('Error deleting record');
    }
};

//GET CRUD PERMISSION COUNT
const getCrudPermissionCounts = async (req, res) => {
    try {
  
      const query = `
        SELECT 
          permission, 
          COUNT(*) as count 
        FROM 
          active_permissions_tbl, 
          unnest(crud_permissions) as permission 
        GROUP BY 
          permission;
      `;
  
      console.log('Executing query:', query);

      const result = await pool.query(query);
      console.log('Query result:', result.rows);
  
      const permissionCounts = result.rows.reduce((acc, row) => {
        console.log('Processing row:', row); 
        acc[row.permission] = parseInt(row.count, 10);
        return acc;
      }, {});
  
      res.status(200).json(permissionCounts);
    } catch (err) {
      console.error('Error executing query:', err.message);
      res.status(201).json({ error: 'Internal Server Error' });
    }
  };

//GET USER-ROLES ONLY IF PERMISSIONS IS NULL
const fetchUserRoles = async (req, res) => {
    let { user_id } = req.body;

    if (!user_id) {
        return res.status(400).json({ error: 'User Id is required' });
    }

    user_id = user_id.toLowerCase();

    try {
        const query = `SELECT role_id, role_type FROM active_permissions_tbl WHERE LOWER("user_id") = $1 AND crud_permissions IS NULL AND module_permissions IS NULL`;

        const result = await pool.query(query, [user_id]);

        if (result.rows.length === 0) {
            console.log(`No roles found for user: ${user_id}`);
            return res.status(404).json({ error: `No roles found for user: ${user_id}` });
        }

        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error querying database:', err.message);
        res.status(201).json({ error: 'Internal server error' });
    }
};

//UPDATE PERMISSION BY ID
const putPermission = async (req, res) => {

    const { crud_permissions, module_permissions } = req.body;
    console.log('Request Body:', req.body);

    if ( !crud_permissions || !module_permissions) {
        return res.status(400).send("Invalid request body: Missing required fields");
    }

    try {
        if (!Array.isArray(crud_permissions)) {
            return res.status(400).send("Invalid request body: crud_permission should be an array");
        }

        if (!Array.isArray(module_permissions)) {
            return res.status(400).send("Invalid request body: module_permission should be an array");
        }

        const updatePermission = ` UPDATE active_permissions_tbl 
            SET updated_date = now(),
                crud_permissions = $1, 
                module_permissions = $2::jsonb
            WHERE role_id = $3
             RETURNING *
        `;
        const ID = req.params.role_id;
        const values = [ crud_permissions,  JSON.stringify(module_permissions), ID];

        const result = await pool.query(updatePermission, values);
    
            console.log("Updated Successfully!");
            res.status(200).send("Updated Successfully!");
        
    } catch (err) {
        console.error(err);
        res.status(201).send("Error updating permissions");
    }
};

//ROLE VALIDATION
const roleValidation = async (req, res) => {
    const{ role_type } = req.body
try {
    const roleResult = await pool.query(`SELECT * FROM active_permissions_tbl WHERE role_type = $1`, [role_type])

    roleExists = roleResult.rows.length > 0;

    res.json({Role : roleExists})

} catch (error) {
    res.status(201).json({ error: error.message})
}};


//SEARCH PERMISSIONS BY ROLE-TYPE AND DATE
const searchPermissions = async (req, res) => {
    try {
        let query;
        let queryParams = [];

        const searchTerm = req.params.searchTerm;

        if (searchTerm && typeof searchTerm === 'string') {
            const searchValue = `%${searchTerm.toLowerCase()}%`;

            query = `
                SELECT *
                FROM active_permissions_tbl
                WHERE LOWER(role_type) LIKE $1
                   OR (TO_CHAR(created_date, 'Mon') || ' ' || TO_CHAR(created_date, 'DD')) ILIKE $1
                   OR (TO_CHAR(updated_date, 'Mon') || ' ' || TO_CHAR(updated_date, 'DD')) ILIKE $1
            `;

            queryParams = [searchValue];
        } else {
            query = `
                SELECT *
                FROM active_permissions_tbl
            `;
        }

        const result = await pool.query(query, queryParams);
        res.json(result.rows);
    } catch (err) {
        console.error('Error executing query', err);
        res.status(201).json({ error: 'Error searching records' });
    }
};

module.exports = {getPermission, getPermissionbyId, putPermission, deletePermission, roleValidation, searchPermissions, fetchUserRoles, getCrudPermissionCounts};
