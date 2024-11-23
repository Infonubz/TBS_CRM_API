const pool = require('../config/db')

const getEmailConfig = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM public.config_email_information ORDER BY id ASC');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching config_email_information', err);
        res.status(500).send('Server Error');
    }
}

module.exports = { getEmailConfig }