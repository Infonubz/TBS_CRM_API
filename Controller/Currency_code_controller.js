const pool = require('../config/db');

//GET ALL CURRENCY CODE
const getAllCurrency = async (req, res) => {
    try{
        const getCurrency = `SELECT * FROM public.currency_code`;
        const result = await pool.query(getCurrency);
        res.status(200).send(result.rows);
    } catch(err) {
        console.log(err.message);
        res.status(404).send("Error getting records");
    }
};

//GET CURRENCY CODE BY ID
const getCurrencybyId = async (req, res) => {
    try{
        const { id } = req.params;
        const getCurrency = `SELECT * FROM public.currency_code WHERE id = $1`;
        const result = await pool.query(getCurrency, [id]);
        res.status(200).send(result.rows);
    } catch(err) {
        console.log(err.message);
        res.status(404).send("Error getting records");
    }
};

module.exports = { getAllCurrency, getCurrencybyId }