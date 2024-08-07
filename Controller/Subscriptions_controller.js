
const express = require('express');
const pool = require('../dbconnection.js');

//GET DATA FROM OP_DETAILS, OP_TBL AND SUBSCRIPTIONS
const getAllRecords =  async (req, res) => {
    try {
        const query = `
        SELECT 
          o.tbs_operator_id, 
          o.company_name, 
          o.owner_name, 
          o.phone, 
          o.emailid, 
          o.created_date,
          od.type_of_constitution, 
          od.business_background, 
          s.plan_name, 
          s.plan_type,
          s.generate_key 
        FROM 
          operators_tbl o
        LEFT JOIN 
          operator_details od 
        ON 
          o.tbs_operator_id = od.tbs_operator_id
        LEFT JOIN 
          subscriptions_tbl s 
        ON 
          o.tbs_operator_id = s.tbs_operator_id
        WHERE 
          o.user_status_id = 1
      `;  
      try {
        const { rows } = await pool.query(query);
        res.json(rows);
      } catch (dbError) {
        console.error('Error executing query', dbError.stack);
        res.status(500).json({ error: 'Error executing query' });
      }
    } catch (error) {
      console.error('Unexpected error', error.stack);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  
//GET ALL SUBSCRIPTIONS
const getSubscriptions = async (req, res) => {
    try{
        const result = await pool.query('SELECT * FROM subscriptions_tbl');
        res.status(200).send(result.rows);
    } catch(err) {
        console.log(err.message);
        res.status(500).send("Error getting records");
    }
};


//GET SUBSCRIPTION BY ID
const getSubscriptionbyId = async (req, res) => {
    try{
        const id = req.params.operator_id;
        const getSub = `SELECT * FROM subscriptions_tbl WHERE operator_id = $1`;
        const result = await pool.query(getSub, [id]);
        res.status(200).send(result.rows);
    } catch(err) {
        console.log(err.message);
        res.status(500).send("Error getting records");
    }
};

//DELETE SUBSCRIPTION BY ID
const deleteSubscription = async (req,res) => {
    
    try{
    const id = req.params.operator_id;
    const removeSub = 'DELETE FROM subscriptions_tbl WHERE operator_id = $1';
    const result = await pool.query(removeSub, [id]);
    res.status(200).send('Deleted successfully!');
    } catch(err) {
        console.log(err);
        res.status(500).send('Error deleting record');
    }
};

//POST SUBSCRIPTION 
const postSubscription = async (req, res) => {
    const { end_date, plan_name, plan_type } = req.body;

    if ( !end_date  || !plan_name || !plan_type ) {
        return res.status(400).send("Invalid request body");
    }

    try{
        let insertSub = `INSERT INTO subscriptions_tbl (end_date, plan_name, plan_type) VALUES ($1,$2,$3)`;
        const result = await pool.query(insertSub, [end_date, plan_name, plan_type ]);
        res.status(201).send("Inserted successfully!");
        console.log(result);
    } catch (err){ 
        console.log(err.message);
        res.status(500).send("Error inserting record");
    }    
};

//UPDATE SUBSCRIPTION BY ID
const putSubscription = async (req, res) => {
    const {end_date, plan_name, plan_type} = req.body;

    if (!end_date || !plan_name || !plan_type ) {
        return res.status(400).send("Invalid request body");
    }

    try{
        let updateSub = `UPDATE subscriptions_tbl SET 
        end_date = $1,
        plan_name = $2,
        plan_type = $3
        WHERE operator_id = $4`;
        const ID = req.params.operator_id;
        const values = [end_date, plan_name, plan_type, ID];
        await pool.query(updateSub, values);
        res.status(201).send("Updated successfully!");
       
    } catch (err){
        console.log(err.message);
        res.status(500).send("Error updating records");
    }         
};

//SEARCH SUBSCRIPTION BY PLAN_NAME, PLAN_TYPE AND DATE 
const searchSubscription = async (req, res) => {
    try {
        const searchTerm = req.params.searchTerm;
        if (!searchTerm || typeof searchTerm !== 'string') {
            return res.status(400).json({ error: 'Invalid search term' });
        }
        const searchValue = `%${searchTerm.toLowerCase()}%`;

        const query = `
            SELECT *
            FROM subscriptions_tbl
            WHERE LOWER(plan_name) LIKE $1
                OR LOWER(plan_type) LIKE $1
               OR (TO_CHAR(created_date, 'Mon') || ' ' || TO_CHAR(created_date, 'DD')) ILIKE $1
               OR (TO_CHAR(end_date, 'Mon') || ' ' || TO_CHAR(end_date, 'DD')) ILIKE $1
        `;
        
    
        const queryParams = [searchValue];

        const result = await pool.query(query, queryParams);
        res.json(result.rows);
    } catch (err) {
        console.error('Error executing query', err);
        res.status(500).json({ error: 'Error searching records' });
    }
};


module.exports = {getAllRecords, getSubscriptions, getSubscriptionbyId, deleteSubscription, postSubscription, putSubscription, searchSubscription};