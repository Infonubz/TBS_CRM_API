require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    database: process.env.DATABASE,
    host: process.env.HOST,
    port: process.env.PORT,
    user: process.env.USER,
    password: process.env.PASSWORD,
    max: 100, 
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
});

module.exports = pool;
