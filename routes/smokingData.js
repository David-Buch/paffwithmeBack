const express = require('express');
require('dotenv').config();
const router = express.Router();
const db = require('../config/UserDB');

router.use(express.json());
router.post('/send', (req, res) => {
    const username = req.body.username.toLowerCase();
    const startTime = req.body.startTime;
    const endTime = req.body.endTime;
    const location = req.body.location;
    smokingDuration =
        (endTime.split(':').reduce((acc, time) => (60 * acc) + +time) * 60) -
        (startTime.split(':').reduce((acc, time) => (60 * acc) + +time) * 60);
    if (smokingDuration <= 0) {
        smokingDuration =
            (endTime.split(':').reduce((acc, time) => (60 * acc) + +time) * 60) -
            (startTime.split(':').reduce((acc, time) => (60 * acc) + +time) * 60) + (24 * 60 * 60);

    }
    const day = new Date().toLocaleDateString('en-CA');

    db.query("SELECT * FROM smokedata WHERE username=? AND startTime=? AND day=? LIMIT 1", [username, startTime, day], (err, result) => {
        if (err) { res.send({ error: err, success: false }); }
        else {
            if (result.length > 0) {
                console.log('Smokedata already exists');
                res.send({ message: 'Smokedata already exists!', success: false })
            }
            else {
                db.query("INSERT INTO smokedata (username,currentlySmoking,day,startTime,endTime,location) VALUES (?,?,?,?,?,?)",
                    [username, true, day, startTime, endTime, location], (err, result) => {
                        if (err) { res.send({ error: err, success: false }); }
                        else {
                            res.send({ success: true });
                        }
                    });
                setTimeout(changeDB, smokingDuration * 1000, username, startTime);
            }
        }

    })
    function changeDB(username, startTime) {
        db.query("UPDATE smokedata SET currentlySmoking=? WHERE username=? AND startTime=? LIMIT 1",
            [false, username, startTime], (err, result) => {
                if (err) { console.log(err); }
            });
        console.log('worked');
    }
});

router.post('/get', (req, res) => {
    db.query("SELECT * FROM smokedata", (err, result) => {
        if (err) { res.send({ error: err, success: false }); }
        res.send({ success: true, smokeData: JSON.stringify(result) });
    })
});

module.exports = router;