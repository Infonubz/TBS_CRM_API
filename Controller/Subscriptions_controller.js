const express = require('express');
const pool = require('../config/db');

//GET DATA FROM OP_DETAILS, OP_TBL AND SUBSCRIPTIONS
const getAllRecords = async (req, res) => {
    try {
        const query = `
                        SELECT 
                                o.profileimg,
                                o.tbs_operator_id, 
                                o.company_name, 
                                o.owner_name, 
                                o.phone, 
                                o.emailid, 
                                o.created_date,
                                od.gstin,
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
                                (
                                    SELECT 
                                        tbs_operator_id, plan_name, plan_type, generate_key,
                                        ROW_NUMBER() OVER(PARTITION BY tbs_operator_id ORDER BY created_date DESC) as row_num
                                    FROM 
                                        subscriptions_tbl
                                ) s 
                            ON 
                                o.tbs_operator_id = s.tbs_operator_id AND s.row_num = 1
                            WHERE 
                                o.user_status_id = 1 
                            ORDER BY 
                                o.created_date DESC; `;  
      
        const { rows } = await pool.query(query);

        if (rows.length === 0) {
            return res.status(201).json(rows);
        }

        res.json(rows);

    } catch (error) {
        console.error('Error executing query', error.stack);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
  
//GET ALL SUBSCRIPTIONS
const getSubscriptions = async (req, res) => {
    try{
        const result = await pool.query('SELECT * FROM subscriptions_tbl ORDER BY created_date DESC');
        res.status(200).send(result.rows);
    } catch(err) {
        console.log(err.message);
        res.status(500).json({ error : "Error getting records" });
    }
}

//GET SUBSCRIPTION BY ID
const getSubscriptionbyId = async (req, res) => {
    try{
        const id = req.params.tbs_operator_id;
        const getSub = `SELECT * FROM subscriptions_tbl WHERE tbs_operator_id = $1`;
        const result = await pool.query(getSub, [id]);
        res.status(200).send(result.rows);
    } catch(err) {
        console.log(err.message);
        res.status(500).json({ error : "Error getting records"});
    }
}

//DELETE SUBSCRIPTION BY ID
const deleteSubscription = async (req,res) => {
    
    try{
    const id = req.params.tbs_operator_id;
    const removeSub = 'DELETE FROM subscriptions_tbl WHERE tbs_operator_id = $1';
    const result = await pool.query(removeSub, [id]);
    res.status(200).send('Deleted successfully!');
    } catch(err) {
        console.log(err);
        res.status(500).json({ error : "Error deleting record" });
    }
}

//POST SUBSCRIPTION 
const postSubscription = async (req, res) => {
    const { end_date, plan_name, plan_type } = req.body;

    if ( !end_date  || !plan_name || !plan_type ) {
        return res.status(400).send("Invalid request body");
    }

    try{
        let insertSub = `INSERT INTO subscriptions_tbl (end_date, plan_name, plan_type) VALUES ($1,$2,$3)`;
        const result = await pool.query(insertSub, [end_date, plan_name, plan_type ]);
        res.status(201).json({ message : "Inserted successfully!" });
    } catch (err){ 
        console.log(err.message);
        res.status(500).json({ error : "Error inserting record" });
    }    
}

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
        WHERE tbs_operator_id = $4`;
        const ID = req.params.tbs_operator_id;
        const values = [end_date, plan_name, plan_type, ID];
        await pool.query(updateSub, values);
        res.status(201).send({ message : "Updated successfully!" });
       
    } catch (err){
        console.log(err.message);
        res.status(500).json({ error : "Error updating records"});
    }         
}

//SEARCH SUBSCRIPTION BY PLAN_NAME, PLAN_TYPE AND DATE 
const searchSubscription = async (req, res) => {
    try {
        const searchTerm = req.params.searchTerm;
        if (!searchTerm || typeof searchTerm !== 'string') {
            return res.status(400).json({ error: 'Invalid search term' });
        }
        const searchValue = `%${searchTerm.toLowerCase()}%`;

        const query = `
            SELECT 
                o.profileimg,
                o.tbs_operator_id, 
                o.company_name, 
                o.owner_name, 
                o.phone, 
                o.emailid, 
                o.created_date,
                od.gstin,
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
                (
                    SELECT 
                        tbs_operator_id, 
                        plan_name, 
                        plan_type, 
                        generate_key,
                        created_date,
                        end_date,
                        ROW_NUMBER() OVER(PARTITION BY tbs_operator_id ORDER BY created_date DESC) AS row_num
                    FROM 
                        subscriptions_tbl
                ) s 
            ON 
                o.tbs_operator_id = s.tbs_operator_id 
                AND s.row_num = 1
            WHERE 
                o.user_status_id = 1
                AND (
                    LOWER(s.plan_name) LIKE $1
                    OR LOWER(s.plan_type) LIKE $1
                    OR LOWER(o.company_name) LIKE $1
                    OR LOWER(o.owner_name) LIKE $1
                    OR (TO_CHAR(s.created_date, 'Mon') || ' ' || TO_CHAR(s.created_date, 'DD')) ILIKE $1
                    OR (TO_CHAR(s.end_date, 'Mon') || ' ' || TO_CHAR(s.end_date, 'DD')) ILIKE $1
                )
            ORDER BY 
                o.created_date DESC;
        `;

        const queryParams = [searchValue];

        const result = await pool.query(query, queryParams);

        if (result.rows.length === 0) {
            return res.json({ message: 'No records found matching the search term.' });
        }

        res.json(result.rows);
    } catch (err) {
        console.error('Error executing query', err);
        res.status(500).json({ error: 'Error searching records' });
    }
}

module.exports = { getAllRecords, getSubscriptions, getSubscriptionbyId, deleteSubscription, postSubscription, putSubscription, searchSubscription }