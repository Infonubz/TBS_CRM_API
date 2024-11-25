const express = require('express')
const pool = require('../config/db')
const xlsx = require('xlsx')


const getData = async (req, res) => {
    try{
        const result = await pool.query('SELECT * FROM import_data')
        res.status(200).send(result.rows)
    } catch(err) {
        console.log(err.message)
        res.status(201).send("Error getting records")
    }
}

const getFields = async (req, res) => {
    try{
        const id = req.params.field_id
        const getFieldsbyId = `SELECT * FROM import_data WHERE field_id = $1`
        const result = await pool.query(getFieldsbyId,[id])
        res.status(200).send(result.rows)
    } catch(err) {
        console.log(err.message)
        res.status(201).send("Error getting records")
    }
}



const deleteData = async (req,res) => {
    
    try{
    const id = req.params.imp_id
    const removeData = 'DELETE FROM import_data WHERE imp_id = $1'
    const result = await pool.query(removeData, [id])
    res.status(200).send('Deleted successfully!')
    } catch(err) {
        console.log(err)
        res.status(201).send('Error deleting record')
    }
}

const sheetUpload = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No files were uploaded.')
        }

        const workbook = xlsx.readFile(req.file.path)
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = xlsx.utils.sheet_to_json(worksheet)

        const query = `
            INSERT INTO import_data (select_fields, upload_files)
            VALUES ($1, $2)
        `

        for (const row of jsonData) {
            const { select_fields, upload_files } = row

            await pool.query(query, [select_fields, upload_files])
        }

        res.send('Data imported successfully!')
    } catch (error) {
        console.error('Error importing data:', error)
        res.status(201).send('Error importing data.')
    }
}

const postData = (req, res) => {
    const { field_id, select_fields } = req.body
    console.log('Request Body:', req.body)

    // Check if file upload exceeded size limit
    if (req.file && req.file.size > 5 * 1024 * 1024) {
        return res.status(400).send('File size exceeded (Max: 5MB)')
    }

    // Check if uploaded file mimetype is allowed
    if (!req.file || !['image/jpeg', 'image/jpg', 'image/png', 'video/mp4', 'application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(req.file.mimetype)) {
        return res.status(400).send('Only .jpeg, .jpg, .png, .mp4, .pdf, .xls, and .xlsx files are allowed')
    }
    
    const uploadFileUrl = `/imp_files/${req.file.filename}`

    if ( !field_id || !select_fields || !uploadFileUrl) {
        return res.status(400).send("Invalid request body")
    }

    const insertData = `INSERT INTO import_data ( field_id, select_fields, upload_files) VALUES ($1, $2, $3)`
    const values = [field_id, select_fields, uploadFileUrl]

    pool.query(insertData, values, (err, result) => {
        if (err) {
            console.error('Error inserting data:', err.message)
            return res.status(201).send("Error inserting data")
        }
        res.send("Inserted Successfully!")
    })
}



const putData = (req, res) => {
    const ID = req.params.imp_id
    const { field_id, select_fields } = req.body
    console.log('Request Body:', req.body)

    if (req.file && req.file.size > 15 * 1024 * 1024) {
        return res.status(400).send('File size exceeded (Max: 15MB)')
    }

    if (!req.file || !['image/jpeg', 'image/jpg', 'image/png', 'video/mp4', 'application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(req.file.mimetype)) {
        return res.status(400).send('Only .jpeg, .jpg, .png, .mp4, .pdf, .xls, and .xlsx files are allowed')
    }
    
    const uploadFileUrl = `/imp_files/${req.file.filename}`

    if (!field_id || !select_fields || !uploadFileUrl) {
        return res.status(400).send("Invalid request body")
    }

    const updateData = `UPDATE import_data 
    SET field_id = $1,
    select_fields = $2,
    upload_files = $3, updated_date = now() 
    WHERE imp_id = $4`
    const values = [field_id, select_fields, uploadFileUrl, ID]

    pool.query(updateData, values, (err, result) => {
        if (err) {
            console.error('Error inserting data:', err.message)
            return res.status(201).send("Error inserting data")
        }
        res.send("updated Successfully!")
    })
}


module.exports = { getData, getFields, deleteData, sheetUpload, postData, putData }
