const pool = require('../config/db');

//GET ALL CRUD PERMISSIONS 
const getCrudpermissionsbyPro = async (req, res) => {
    const query = `
      SELECT * FROM public.active_crud_permissions_tbl; `;
  
    try {
      const result = await pool.query(query);
  
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'No crud_permissions found' });
      }
  
      res.status(200).json(result.rows);
    } catch (error) {
      console.error('Error fetching crud_permissions:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

//POST CRUD PERMISSIONS
const postCrudPermissions = async (req, res) => {
    const { crud_permission_id } = req.params;
    const { crud_permissions, module_permissions } = req.body;

    if (!crud_permissions || !Array.isArray(crud_permissions)) {
        return res.status(400).json({ error: 'crud_permissions must be an array' });
    }

    let parsedModulePermissions;
    try {
        parsedModulePermissions = module_permissions
            ? JSON.stringify(module_permissions)
            : null;
    } catch (err) {
        return res.status(400).json({ error: 'Invalid module_permissions format' });
    }

    const updateCrudPermissionsQuery = `
        UPDATE public.active_crud_permissions_tbl
        SET crud_permissions = COALESCE($1::text[], crud_permissions), 
            module_permissions = COALESCE($2::JSONB, module_permissions),
            updated_date = NOW()
        WHERE crud_permission_id = $3
        RETURNING role_id, crud_permissions;
    `;

    try {
        const result = await pool.query(updateCrudPermissionsQuery, [
            crud_permissions,
            parsedModulePermissions,
            crud_permission_id,
        ]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'crud_permission_id not found' });
        }

        const { role_id } = result.rows[0];

        if (role_id) {
            const updateActivePermissionsQuery = `
                UPDATE public.active_permissions_tbl
                SET updated_date = NOW(), crud_permissions = COALESCE($2::text[], crud_permissions)
                WHERE role_id = $1
                RETURNING *;
            `;

            const activePermissionsResult = await pool.query(updateActivePermissionsQuery, [role_id, crud_permissions]);

            if (activePermissionsResult.rowCount === 0) {
                console.warn(`role_id ${role_id} not found in active_permissions_tbl`);
            }
        }

        res.status(200).json({
            message: 'crud_permissions updated successfully, and active_permissions_tbl updated if applicable',
            data: result.rows[0],
        });
    } catch (error) {
        console.error('Error updating crud_permissions:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

//POST PERMISSIONS
const postPermission = async (req, res) => {
    const { role_id, role_type, user_id, crud_permissions, module_permissions, tbs_user_id, user } = req.body;
    
    if (!role_id || !role_type || !user_id || !crud_permissions || !module_permissions || !tbs_user_id || !user) {
        return res.status(400).send("Invalid request body: Missing required fields");
    }

    try {
        if (!Array.isArray(crud_permissions)) {
            return res.status(400).send("Invalid request body: crud_permissions should be an array");
        }

        if (!Array.isArray(module_permissions)) {
            return res.status(400).send("Invalid request body: module_permissions should be an array");
        }

        const createPermission = `
        INSERT INTO active_permissions_tbl (role_id, role_type, user_id, crud_permissions, module_permissions, tbs_user_id, "user")
        VALUES ($1, $2, $3, $4, $5, $6, $7);`

        const values = [role_id, role_type, user_id,crud_permissions, JSON.stringify(module_permissions), tbs_user_id, user];

        const result = await pool.query(createPermission, values);

        res.status(200).send("Created Successfully!");

    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating permissions");
    }
}

// GET PERMISSIONS BY TYPE (1 for OP, 2 for EMP, 3 for ALL)
const getPermission = async (req, res) => {
    const { type, tbs_user_id } = req.params;
    const { term } = req.body || {}; 
    
    if (!tbs_user_id) {
        return res.status(400).json({ message: "tbs_user_id is required" });
    }

    try {
        let queryText;
        let values = [];

        const isProUser = tbs_user_id.startsWith('tbs-pro');

        if (type === '1') {
            if (isProUser && term) {
                queryText = `
                    SELECT * FROM active_permissions_tbl 
                    WHERE "user" = $1
                    ORDER BY created_date DESC
                `;
                values = [term === 'OP' ? 'Operator' : term === 'PO' ? 'Employee' : null];
                if (!values[0]) {
                    return res.status(400).json({ message: "Invalid term. Use OP or PO." });
                }
            } else if (isProUser) {
                queryText = `
                    SELECT * FROM active_permissions_tbl 
                    WHERE user_id LIKE 'OP%' 
                    ORDER BY created_date DESC
                `;
            } else {
                queryText = `
                    SELECT * FROM active_permissions_tbl 
                    WHERE user_id LIKE 'OP%' 
                      AND tbs_user_id = $1 
                    ORDER BY created_date DESC
                `;
                values = [tbs_user_id];
            }
        } else if (type === '2') {
            if (isProUser && term) {
                queryText = `
                    SELECT * FROM active_permissions_tbl 
                    WHERE "user" = $1
                    ORDER BY created_date DESC
                `;
                values = [term === 'OP' ? 'Operator' : term === 'PO' ? 'Employee' : null];
                if (!values[0]) {
                    return res.status(400).json({ message: "Invalid term. Use OP or PO." });
                }
            } else if (isProUser) {
                queryText = `
                    SELECT * FROM active_permissions_tbl 
                    WHERE user_id LIKE 'EMP%' 
                    ORDER BY created_date DESC
                `;
            } else {
                queryText = `
                    SELECT * FROM active_permissions_tbl 
                    WHERE user_id LIKE 'EMP%' 
                      AND tbs_user_id = $1 
                    ORDER BY created_date DESC
                `;
                values = [tbs_user_id];
            }
        } else if (type === '3') {
            if (isProUser && term) {
                if (term === 'OP') {
                    queryText = `
                    SELECT * FROM 
                    public.active_crud_permissions_tbl                
                        WHERE 
                            "user" = $1 AND crud_permissions IS NOT NULL
                        ORDER BY 
                            created_date DESC
                    `;
                } else if (term === 'PO') {
                    queryText = `
                        SELECT * FROM active_crud_permissions_tbl 
                        WHERE "user" = $1 AND crud_permissions IS NOT NULL
                        ORDER BY created_date DESC
                    `;
                } else {
                    return res.status(400).json({ message: "Invalid term. Use OP or PO." });
                }
                values = [term === 'OP' ? 'operator' : term === 'PO' ? 'employee' : null];
            } else if (isProUser) {
                queryText = `
                    SELECT * FROM active_crud_permissions_tbl  
                    ORDER BY created_date DESC
                `;
            } else {
                queryText = `
                    SELECT * FROM active_permissions_tbl 
                    WHERE tbs_user_id = $1 
                    ORDER BY created_date DESC
                `;
                values = [tbs_user_id];
            }
        } else {
            return res.status(400).json({ message: "Invalid type parameter. Use 1 for OP, 2 for EMP, and 3 for ALL." });
        }

        const result = await pool.query(queryText, values);
        res.status(200).send(result.rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Error getting records");
    }
}

//GET PERMISSION BY ID
const getPermissionbyId = async (req, res) => {
    try {
        const { tbs_user_id } = req.params;
        const { permission_id, crud_permission_id } = req.body;

        if (tbs_user_id.startsWith('tbs-pro')) {
            if (!crud_permission_id) {
                return res.status(400).send("crud_permission_id is required for tbs-pro");
            }
            const getPerm = `SELECT * FROM active_crud_permissions_tbl WHERE tbs_user_id = $1 AND crud_permission_id = $2`;
            const result = await pool.query(getPerm, [tbs_user_id, crud_permission_id]);
            res.status(200).send(result.rows);
        } else if (tbs_user_id.startsWith('tbs-op')) {
            if (!permission_id) {
                return res.status(400).send("permission_id is required for tbs-op");
            }
            const getPerm = `SELECT * FROM active_permissions_tbl WHERE tbs_user_id = $1 AND permission_id = $2`;
            const result = await pool.query(getPerm, [tbs_user_id, permission_id]);
            res.status(200).send(result.rows);
        } else {
            res.status(400).send("Invalid tbs_user_id prefix");
        }
    } catch (err) {
        console.log(err.message);
        res.status(404).send("Error getting records");
    }
}

//DELETE PERMISSION BY ID
const deletePermission = async (req, res) => {
    try {
        const { tbs_user_id } = req.params;
        let { crud_permission_id, permission_id } = req.params;

        if (tbs_user_id.startsWith('tbs-op')) {
            [permission_id, crud_permission_id] = [crud_permission_id, permission_id];
        }

        if (tbs_user_id.startsWith('tbs-pro')) {
            if (!crud_permission_id) {
                return res.status(400).send("crud_permission_id is required for tbs-pro");
            }

            const deleteQuery = `
            UPDATE active_crud_permissions_tbl
            SET crud_permissions = NULL, module_permissions = NULL,
                updated_date = NOW()
            WHERE tbs_user_id = $1 AND crud_permission_id = $2
            RETURNING crud_permission_id;`;
            const result = await pool.query(deleteQuery, [tbs_user_id, crud_permission_id]);
            if (result.rowCount === 0) {
                return res.status(404).send("No matching record found for tbs-pro.");
            }

            return res.status(200).send('Deleted successfully from active_crud_permissions_tbl!');
        } else if (tbs_user_id.startsWith('tbs-op')) {
            if (!permission_id) {
                return res.status(400).send("permission_id is required for tbs-op");
            }

            const deleteQuery = `
                DELETE FROM active_permissions_tbl
                WHERE tbs_user_id = $1 AND permission_id = $2
            RETURNING *;`;
            const result = await pool.query(deleteQuery, [tbs_user_id, permission_id]);

            if (result.rowCount === 0) {
                return res.status(404).send("No matching record found for tbs-op.");
            }

            return res.status(200).send('Deleted successfully from active_permissions_tbl!');
        } else {
            return res.status(400).send("Invalid tbs_user_id prefix");
        }
    } catch (err) {
        console.error('Error deleting record:', err);
        return res.status(500).send('Error deleting record');
    }
}

//GET CRUD PERMISSION COUNT
const getCrudPermissionCounts = async (req, res) => {
    const { tbs_user_id } = req.params;
    const { term } = req.body || {};

    try {
        let whereClause = [];
        let params = [];
        let index = 1;

        if (tbs_user_id.startsWith('tbs-pro')) {
            const tableName = 'active_crud_permissions_tbl';
            if (term === 'PO') {
                whereClause.push(`user_id = 'EMP101'`);
            } else {
                whereClause.push(`user_id = 'OP101'`);
            }

            const query = `
                SELECT 
                    permission, 
                    COUNT(*) as count 
                FROM 
                    ${tableName}, 
                    unnest(crud_permissions) as permission
                ${whereClause.length ? `WHERE ${whereClause.join(' AND ')}` : ''}
                GROUP BY permission;
            `;

            const result = await pool.query(query);

            if (result.rows.length === 0) {
                return res.status(200).json({ message: 'No data available' });
            }

            const permissionCounts = result.rows.reduce((acc, row) => {
                acc[row.permission] = parseInt(row.count, 10);
                return acc;
            }, {});

            return res.status(200).json(permissionCounts);
        } else if (tbs_user_id.startsWith('tbs-op')) {
            whereClause.push(`tbs_user_id = $${index++}`);
            params.push(tbs_user_id);

            const query = `
                SELECT 
                    permission, 
                    COUNT(*) as count 
                FROM 
                    active_permissions_tbl, 
                    unnest(crud_permissions) as permission
                ${whereClause.length ? `WHERE ${whereClause.join(' AND ')}` : ''}
                GROUP BY permission;
            `;

            const result = await pool.query(query, params);

            if (result.rows.length === 0) {
                return res.status(200).json({ message: 'No data available' });
            }

            const permissionCounts = result.rows.reduce((acc, row) => {
                acc[row.permission] = parseInt(row.count, 10);
                return acc;
            }, {});

            return res.status(200).json(permissionCounts);
        } else {
            return res.status(400).json({ error: 'Invalid tbs_user_id format' });
        }
    } catch (err) {
        console.error('Error executing query:', err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

//GET USER-ROLES ONLY IF PERMISSIONS IS NULL
const fetchUserRoles = async (req, res) => {
    const { user_id } = req.body;
    const { tbs_user_id } = req.params;

    if (!user_id || !tbs_user_id) {
        return res.status(400).json({ error: 'Both user_id and tbs_user_id are required' });
    }

    try {
        let query;
        let values;

        if (tbs_user_id.startsWith('tbs-op')) {
            query = `
            SELECT 
                role_id, 
                role_type
            FROM 
                active_crud_permissions_tbl 
            WHERE 
                user_id = $1
                AND crud_permissions IS NOT NULL
                AND NOT EXISTS (
                    SELECT 1 
                    FROM active_permissions_tbl 
                    WHERE active_permissions_tbl.role_id = active_crud_permissions_tbl.role_id 
                      AND active_permissions_tbl.tbs_user_id = $2)`;
            values = [user_id, tbs_user_id];
        } else if (tbs_user_id.startsWith('tbs-pro')) {
            query = `
            SELECT 
                role_id, 
                role_type
            FROM 
                active_crud_permissions_tbl 
            WHERE 
                user_id = $1
                AND crud_permissions IS NULL
                AND NOT EXISTS (
                    SELECT 1 
                    FROM active_permissions_tbl 
                    WHERE active_permissions_tbl.role_id = active_crud_permissions_tbl.role_id 
                      AND active_permissions_tbl.tbs_user_id = $2 )`;
            values = [user_id, tbs_user_id];
        } else {
            return res.status(400).json({ error: 'Invalid tbs_user_id prefix' });
        }

        const result = await pool.query(query, values);

        res.json(result.rows);
    } catch (err) {
        console.error('Error executing query:', err);
        res.status(500).json({ error: 'Database query failed' });
    }
}

//UPDATE PERMISSION BY ID
const putPermission = async (req, res) => {
    const {
        role_id,
        role_type,
        user,
        user_id,
        crud_permissions,
        module_permissions,
        tbs_user_id,
    } = req.body;

    const { permission_id } = req.params;

    if (
        !role_id ||
        !role_type ||
        !user ||
        !user_id ||
        !crud_permissions ||
        !module_permissions ||
        !tbs_user_id
    ) {
        return res
            .status(400)
            .send("Invalid request body: Missing required fields");
    }

    try {
        if (!Array.isArray(crud_permissions)) {
            return res
                .status(400)
                .send("Invalid request body: crud_permissions should be an array");
        }

        if (!Array.isArray(module_permissions)) {
            return res
                .status(400)
                .send(
                    "Invalid request body: module_permissions should be an array"
                );
        }

        const updatePermission = `
            UPDATE active_permissions_tbl
            SET 
                role_id = COALESCE($1, role_id),
                role_type = COALESCE($2, role_type),
                user_id = COALESCE($3, user_id),
                crud_permissions = COALESCE($4::TEXT[], crud_permissions),
                module_permissions = COALESCE($5::JSONB, module_permissions),
                tbs_user_id = COALESCE($6, tbs_user_id),
                "user" = COALESCE($7, "user")
            WHERE permission_id = $8 `;

        const values = [
            role_id,
            role_type,
            user_id,
            crud_permissions, 
            JSON.stringify(module_permissions), 
            tbs_user_id,
            user,
            permission_id,
        ];

        const result = await pool.query(updatePermission, values);

        if (result.rowCount === 0) {
            return res
                .status(404)
                .send(`No permission found with permission_id: ${permission_id}`);
        }

        res.status(200).send("Updated Successfully!");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating permissions");
    }
}

//ROLE VALIDATION
const roleValidation = async (req, res) => {
    const{ role_type } = req.body
try {
    const roleResult = await pool.query(`SELECT * FROM active_permissions_tbl WHERE role_type = $1`, [role_type])

    roleExists = roleResult.rows.length > 0;

    res.json({Role : roleExists})

} catch (error) {
    res.status(404).json({ error: error.message})
}};


//SEARCH PERMISSIONS BY ROLE-TYPE AND DATE
const searchPermissions = async (req, res) => {
    try {
        let query;
        let queryParams = [];

        const { searchTerm, tbs_user_id } = req.params;

        if (searchTerm && typeof searchTerm === 'string') {
            const searchValue = `%${searchTerm.toLowerCase()}%`;

            query = `
                SELECT *
                FROM active_permissions_tbl
                WHERE tbs_user_id = $1 AND LOWER(role_type) LIKE $2
                   OR (TO_CHAR(created_date, 'Mon') || ' ' || TO_CHAR(created_date, 'DD')) ILIKE $2 `;

            queryParams = [tbs_user_id, searchValue];
        } else {
            query = `
                SELECT *
                FROM active_permissions_tbl `;
        }

        const result = await pool.query(query, queryParams);
        res.json(result.rows);
    } catch (err) {
        console.error('Error executing query', err);
        res.status(404).json({ error: 'Error searching records' });
    }
}


module.exports = { getPermission, getPermissionbyId, putPermission, deletePermission, roleValidation, searchPermissions, fetchUserRoles, getCrudPermissionCounts, postPermission, postCrudPermissions, getCrudpermissionsbyPro };
