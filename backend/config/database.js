'use strict';

const { Pool } = require('pg');
const config = require('./index');

const poolConfig = config.db.connectionString
    ? { connectionString: config.db.connectionString }
    : {
        host: config.db.host,
        port: config.db.port,
        database: config.db.database,
        user: config.db.user,
        password: config.db.password,
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
    console.error('Unexpected database error:', err.message);
});

module.exports = pool;
