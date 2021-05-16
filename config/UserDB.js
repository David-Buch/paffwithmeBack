const mysql = require('mysql');


//Connection configuration

var db_config = {
    connectionLimit: '10',
    host: 'eu-cdbr-west-01.cleardb.com',
    user: 'b5357ab4b70e69',
    password: '7e5d2003',
    database: 'heroku_cf88fcb1628b75b',
};

//Create the connection variable
db = mysql.createPool(db_config);

//Establish a new connection
db.getConnection(function (err) {
    if (err) {
        // mysqlErrorHandling(connection, err);
        console.log("\n\t *** Cannot establish a connection with the database. ***");

        db = reconnect(db);
    } else {
        console.log("\n\t *** New connection established with the database. ***")
    }
});

// Reconnection function
function reconnect(connection) {
    console.log("\n New connection tentative...");

    //- Create a new one
    connection = mysql.createPool(db_config);

    //- Try to reconnect
    connection.getConnection(function (err) {
        if (err) {
            //- Try to connect every 2 seconds.
            setTimeout(reconnect(connection), 2000);
        } else {
            console.log("\n\t *** New connection established with the database. ***")
            return connection;
        }
    });
}
//Error listener

db.on('error', function (err) {
    //The server close the connection.
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
        console.log("/!\\ Cannot establish a connection with the database. /!\\ (" + err.code + ")");
        return reconnect(db);
    }

    else if (err.code === "PROTOCOL_ENQUEUE_AFTER_QUIT") {
        console.log("/!\\ Cannot establish a connection with the database. /!\\ (" + err.code + ")");
        return reconnect(db);
    }

    else if (err.code === "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR") {
        console.log("/!\\ Cannot establish a connection with the database. /!\\ (" + err.code + ")");
        return reconnect(db);
    }

    else if (err.code === "PROTOCOL_ENQUEUE_HANDSHAKE_TWICE") {
        console.log("/!\\ Cannot establish a connection with the database. /!\\ (" + err.code + ")");
    }

    else {
        console.log("/!\\ Cannot establish a connection with the database. /!\\ (" + err.code + ")");
        return reconnect(db);
    }

});

module.exports = db;
/*
function handleDisconnect() {

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
*/

