const mysql = require('mysql');

const db = mysql.createConnection({
    host: 'eu-cdbr-west-01.cleardb.com',
    user: 'b5357ab4b70e69',
    password: '7e5d2003',
    database: 'heroku_cf88fcb1628b75b',
});

module.exports = db;

