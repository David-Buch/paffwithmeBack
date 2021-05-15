const mysql = require('mysql');


function handleDisconnect() {
    const db = mysql.createConnection({
        host: 'eu-cdbr-west-01.cleardb.com',
        user: 'b5357ab4b70e69',
        password: '7e5d2003',
        database: 'heroku_cf88fcb1628b75b',
    });
    db.connect(function (err) {              // The server is either down
        if (err) {                                     // or restarting (takes a while sometimes).
            console.log('error when connecting to db:', err);
            setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
        }                                     // to avoid a hot loop, and to allow our node script to
    });                                     // process asynchronous requests in the meantime.
    // If you're also serving http, display a 503 error.
    db.on('error', function (err) {
        console.log('db error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
            handleDisconnect();                         // lost due to either server restart, or a
        } else {                                      // connnection idle timeout (the wait_timeout
            throw err;                                  // server variable configures this)
        }
    });
    return db;
}

module.exports = handleDisconnect();