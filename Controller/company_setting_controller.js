const pool = require('../config/db')

// COMPANY-SETTINGS POST CONTROLLER
const createCompany = async (req, res) => {

  const { company_name, financial_year_end, base_currency, tax_name, tax_rate, user_id } = req.body
  
  if( !company_name || !financial_year_end || !base_currency || !tax_name || !tax_rate || !user_id){

    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {

      const  rows  = await pool.query(
      `INSERT INTO company_settings (company_name, financial_year_end, base_currency, tax_name, tax_rate, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [company_name, financial_year_end, base_currency, tax_name, tax_rate, user_id]
    )
    res.status(201).json(`Company Created Successfully`)

  } catch (err) {

    console.error('Error executing query', err);
    res.status(500).json({ error: 'Internal Server Error' });
    
  }
}

  // COMPANY-SETTING PUT CONTROLLER
  const updateComapny = async (req, res) => {
    const  tbs_company_id = req.params.tbs_company_id
    const { company_name, financial_year_end, base_currency, tax_name, tax_rate, user_id } = req.body
    try {
      const { rows } = await pool.query(
        'UPDATE company_settings SET company_name=$1, financial_year_end=$2, base_currency=$3, tax_name=$4, tax_rate=$5, user_id = $6 WHERE tbs_company_id=$7 RETURNING *',
        [company_name, financial_year_end, base_currency, tax_name, tax_rate, user_id, tbs_company_id]
      )
      if (rows.length === 0) {
        return res.status(201).json({ error: 'Company setting not found' })
      }
      res.json(`company records updated successfully`)
    } catch (err) {
      console.error('Error executing query', err)
      res.status(201).json({ error: 'Internal Server Error' })
    }
  }

  

// COMPANY-SETTINGS DELETE CONTROLLER
const delCompany = async (req, res) => {
    const tbs_company_id = req.params.tbs_company_id
    try {
      const { rows } = await pool.query('DELETE FROM company_settings WHERE tbs_company_id=$1 RETURNING *', [tbs_company_id])
      if (rows.length === 0) {
        return res.status(201).json({ error: 'Company setting not found' })
      }
      res.json('Company setting deleted successfully')
    } catch (err) {
      console.error('Error executing query', err)
      res.status(201).json({ error: 'Internal Server Error' })
    }
  }

  // COMPANY-SETTING GET CONTROLLER
  const fetchCompany = async (req, res) => {
    try {
      const { rows } = await pool.query('SELECT * FROM company_settings')
      res.json(rows)
    } catch (err) {
      console.error('Error executing query', err)
      res.status(201).json({ error: 'Internal Server Error' })
    }
  }
  // COMPANY-SETTING GETByID CONTROLLER
  const fetchCompanyByid = async (req, res) => {
    try {
      const id = req.params.tbs_company_id
      const { rows } = await pool.query('SELECT * FROM company_settings WHERE tbs_company_id = $1', [id])
      res.json(rows)
    } catch (err) {
      console.error('Error executing query', err)
      res.status(201).json({ error: 'Internal Server Error' })
    }
  }

  //COMPANY-SETTING GETByUSERID CONTROLLER
  const getCompanyByUserId = async (req, res) => {
    const user_id = req.params.user_id;
    try {
      const { rows } = await pool.query(
        'SELECT * FROM company_settings WHERE user_id = $1',
        [user_id]
      );
      if (rows.length === 0) {
        return res.status(201).json({ error: 'No company settings found for this user' });
      }
      res.json(rows);
    } catch (err) {
      console.error('Error executing query', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

module.exports = { createCompany, updateComapny, delCompany, fetchCompany, fetchCompanyByid, getCompanyByUserId }