const {Pool} = require('pg');

const pool = new Pool({
    user : 'sridarsini_BE',
    password : 'NuIndia@6955',
    host : '192.168.90.43',
    port : 5432,
    database : 'TBS_CRM',
    max: 100,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

pool.connect();

module.exports = pool;