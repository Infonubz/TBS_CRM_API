const express = require('express')
const pool = require('../dbconnection.js')

const getOpRoles = async (req, res) => {
    try{
        const result = await pool.query('SELECT * FROM op_roles_tbl')
        res.status(200).send(result.rows)
    } catch(err) {
        console.log(err.message)
        res.status(201).send("Error getting records")
    }
}

const getOpIdName = async (req, res) => {
    try{
        const result = await pool.query('SELECT op_id, op_roles FROM op_roles_tbl')
        res.status(200).send(result.rows)
    } catch(err) {
        console.log(err.message)
        res.status(201).send("Error getting records")
    }
}

const getOpRolesById = async (req, res) => {
    try{
        const id = req.params.op_id
        const getPerm = `SELECT * FROM op_roles_tbl WHERE op_id = $1`
        const result = await pool.query(getPerm, [id])
        res.status(200).send(result.rows)
    } catch(err) {
        console.log(err.message)
        res.status(201).send("Error getting records")
    }
}

const deleteOpRoles = async (req,res) => {
    
    try{
    const id = req.params.op_id
    const removeOpRoles = 'DELETE FROM op_roles_tbl WHERE op_id = $1'
    const result = await pool.query(removeOpRoles, [id])
    res.status(200).send('Deleted successfully!')
    } catch(err) {
        console.log(err)
        res.status(201).send('Error deleting record')
    }
}

 const postOpRoles = async (req, res) => {

 const {op_roles, permissions, description} = req.body
    
    const query = `
        INSERT INTO op_roles_tbl (op_roles, permissions, description)
        VALUES ($1, $2::jsonb, $3)
        RETURNING *
    `
    
    const values = [op_roles, JSON.stringify(permissions), description]
    
    try {
        const result = await pool.query(query, values)
        res.status(201).send('Inserted Successfully!')
    } catch (err) {
        console.error('Error inserting data', err.stack)
        res.status(201).json({ error: 'Database error' })
    }
}

const putOpRoles =  async (req, res) => {
    const id = req.params.op_id
    const {op_roles, permissions, description} = req.body
    
    const query = `
        UPDATE op_roles_tbl
        SET op_roles = $1, permissions = $2::jsonb, description = $3
        WHERE op_id = $4
        RETURNING *
    `
    
    const values = [op_roles, JSON.stringify(permissions), description, id]
    
    try {
        const result = await pool.query(query, values)
        if (result.rows.length > 0) {
            res.status(200).send('Updated Successfully!')
        } else {
            res.status(201).json({ error: 'Record not found' })
        }
    } catch (err) {
        console.error('Error updating data', err.stack)
        res.status(201).json({ error: 'Database error' })
    }
}



module.exports = {getOpRoles, getOpRolesById, deleteOpRoles, postOpRoles, putOpRoles, getOpIdName}