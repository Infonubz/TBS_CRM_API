const pool = require('../config/db')

const getFaqByid = async (req, res) => {
    const  id  = req.params.tbs_faq_id;

    try {
        const result = await pool.query('SELECT general FROM FAQ_tbl WHERE tbs_faq_id = $1', [id]);
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ message: 'FAQ not found' });
        }
    } catch (error) {
        console.error('Error executing query', error.stack);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

const getFaq = async (req, res) => {

    try {
        const result = await pool.query('SELECT general FROM FAQ_tbl',);
        if (result.rows.length > 0) {
            res.json(result.rows);
        } else {
            res.status(404).json({ message: 'FAQ not found' });
        }
    } catch (error) {
        console.error('Error executing query', error.stack);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

module.exports = { getFaqByid, getFaq }