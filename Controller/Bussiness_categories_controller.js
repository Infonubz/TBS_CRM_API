const pool = require('../config/db');

//GET ALL CURRENCY CODE
const getAllBussiness = async (req, res) => {
    try{
        const getBussiness = `SELECT * FROM public.business_categories`;
        const result = await pool.query(getBussiness);
        res.status(200).send(result.rows);
    } catch(err) {
        console.log(err.message);
        res.status(404).send("Error getting records");
    }
};

//GET CURRENCY CODE BY ID
const getBussinessbyId = async (req, res) => {
    try{
        const { id } = req.params;
        const getBussiness = `SELECT * FROM public.business_categories WHERE id = $1`;
        const result = await pool.query(getBussiness, [id]);
        res.status(200).send(result.rows);
    } catch(err) {
        console.log(err.message);
        res.status(404).send("Error getting records");
    }
};

module.exports = { getAllBussiness, getBussinessbyId }