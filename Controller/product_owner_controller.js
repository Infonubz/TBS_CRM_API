const pool = require('../config/db')
const jwt = require('jsonwebtoken')

const Prdct_Owner_Login = async (req, res) => {
    const { email_id, phone, password } = req.body


    try {
        let product_owner

        if (email_id) {
            const emailResult = await pool.query('SELECT * FROM product_owner_tbl WHERE email_id = $1', [email_id])
            product_owner = emailResult.rows[0]
        }

        if (!product_owner && phone) {
            const phoneResult = await pool.query('SELECT * FROM product_owner_tbl WHERE phone = $1', [phone])
            product_owner = phoneResult.rows[0] 
        }

        if (!product_owner) {
            return res.status(201).json({ error: 'No product_owner found with provided email/phone' })
        }

        if (product_owner.password !== password) {
            return res.status(201).json({ error: 'Password incorrect' })
        }

        const product_ownerId = product_owner.owner_id
        const product_Name = product_owner.owner_name

        const typeResult = await pool.query('SELECT type_id, type_name FROM product_owner_tbl')
        const { type_id, type_name } = typeResult.rows[0]

        const token = jwt.sign({ ownerId: product_ownerId }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' })

        res.json({ id: product_ownerId, 
            user_name : product_Name, 
            token: token, type_id : type_id, 
            type_name: type_name })

    } catch (error) {
        res.status(201).json({ error: error.message })
    }
}

const putProductOwner = async (req, res) => {
    const { owner_id } = req.params;
    const { owner_name, phone, password, type_name, type_id, email_id } = req.body;

    try {
        const updateQuery = `
            UPDATE public.product_owner_tbl
            SET
                owner_name = COALESCE($1, owner_name),
                phone = COALESCE($2, phone),
                password = COALESCE($3, password),
                type_name = COALESCE($4, type_name),
                type_id = COALESCE($5, type_id),
                email_id = COALESCE($6, email_id)
            WHERE owner_id = $7
            RETURNING *;
        `;
        const result = await pool.query(updateQuery, [owner_name, phone, password, type_name, type_id, email_id, owner_id]);
        if (result.rows.length === 0) {
            return res.status(200).json({ message: 'Product Owner not found' });
        }
        res.status(200).json({message: "updated successfully"});
    } catch (error) {
        console.error('Error updating product owner:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const getProductOwner = async (req, res) => {
    try {
        const selectQuery = 'SELECT * FROM public.product_owner_tbl;';
        const result = await pool.query(selectQuery);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error retrieving product owners:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const getProductOwnerByID = async (req, res) => {
    const { owner_id } = req.params;
    try {
        const selectQuery = 'SELECT * FROM public.product_owner_tbl WHERE owner_id = $1;';
        const result = await pool.query(selectQuery, [owner_id]);
        if (result.rows.length === 0) {
            return res.status(200).json({ message: 'Product Owner not found' });
        }
        res.status(200).json(result.rows[0])
    } catch (error) {
        console.error('Error retrieving product owners:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = { Prdct_Owner_Login, putProductOwner, getProductOwner, getProductOwnerByID }
