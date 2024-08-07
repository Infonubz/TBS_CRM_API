const pool = require('../config/db');

// Get all product_owner notifications
const notificationGet = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Product_Owner_Notification ORDER BY created_at DESC');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Get product_owner notification by ID
const notificationGetByid = async (req, res) => {
    const { tbs_user_id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM Product_Owner_Notification WHERE tbs_user_id = $1', [tbs_user_id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        res.status(200).json(result.rows[0]); 
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Update product_owner notification status
const notificationPutStatus = async (req, res) => {
    const { tbs_pro_notif_id } = req.params;
    const { read } = req.body;
    try {
        const result = await pool.query('UPDATE Product_Owner_Notification SET read = $1 WHERE tbs_pro_notif_id = $2 RETURNING *', [read, tbs_pro_notif_id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        res.status(200).json({message: `User ${tbs_pro_notif_id} notification readed`})
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = { notificationGet, notificationGetByid, notificationPutStatus };
