const pool = require('../config/db')

const counts = async(req, res) =>{
    try {
       const result = await pool.query(`SELECT 
       (SELECT COUNT(*) FROM discount_offers WHERE status_id = 1) AS active_offers_count,
       (SELECT COUNT(*) FROM operators_tbl WHERE user_status_id = 1) AS active_operators_count;` )
      res.status(201).json(result.rows)
    } catch (error) {
        console.log(error);
    }
}

module.exports = { counts }