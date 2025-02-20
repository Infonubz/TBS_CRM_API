require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    database: process.env.DATABASE,
    host: process.env.HOST,
    port: process.env.PORT,
    user: process.env.DB_USER,
    password: process.env.PASSWORD,
    max: 200,  
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000
});

module.exports = pool;
