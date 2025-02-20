const pool = require('../config/db')

exports.livediscountandpromotion = async(req,res) =>{
    const occupation = req.params.occupation_id;
    try {
      let query;
      let params;
  
      if (occupation == 0) {
        query = `
          SELECT *
          FROM discount_offers
          WHERE status_id = 2 AND (NOW() >= start_date OR NOW() <= expiry_date)
          ORDER BY GREATEST(created_date, updated_date) DESC;
        `;
        params = [];
      } else {
        query = `
          SELECT *
          FROM discount_offers
          WHERE status_id = 2 AND occupation_id = $1 AND (NOW() >= start_date OR NOW() <= expiry_date)
          ORDER BY GREATEST(created_date, updated_date) DESC;
        `;
        params = [occupation];
      }
  
      const result = await pool.query(query, params);
      const discount = result.rows
      const results = await pool.query(
            `SELECT *
             FROM promotions_tbl
             WHERE promo_status_id = 2 AND NOW() >= start_date OR NOW() <= expiry_date
             AND promo_status_id = 2 ORDER BY created_date DESC`
          );
      const promotions = results.rows      
  const data = [...discount, ...promotions]
  const response = data.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  res.status(200).json({message:'Live discount and promotion fetched successfully', response});
    } catch (err) {
      console.error('Error executing query:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
}