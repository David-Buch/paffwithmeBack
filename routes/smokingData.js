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
    const color = req.body.color;
    const day = new Date().toLocaleDateString('de-DE');

    const smokingDuration = getDuration(startTime, endTime);
    db.query("SELECT * FROM smokedata WHERE username=? AND startTime=? AND day=? LIMIT 1", [username, startTime, day], (err, result) => {
        if (err) { res.send({ error: err, success: false }); }
        else {
            if (result.length > 0) {
                console.log('Smokedata already exists');
                res.send({ message: 'Smokedata already exists!', success: false })
            }
            else {
                db.query("INSERT INTO smokedata (username,date,color,currentlySmoking,day,startTime,endTime,location) VALUES (?,NOW(),?,?,?,?,?,?)",
                    [username, color, true, day, startTime, endTime, location], (err, result) => {
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

function getDuration(startTime, endTime) {
    var duration =
        (endTime.split(':').reduce((acc, time) => (60 * acc) + +time) * 60) -
        (startTime.split(':').reduce((acc, time) => (60 * acc) + +time) * 60);
    if (duration <= 0) {
        duration =
            (endTime.split(':').reduce((acc, time) => (60 * acc) + +time) * 60) -
            (startTime.split(':').reduce((acc, time) => (60 * acc) + +time) * 60) + (24 * 60 * 60);

    }
    return duration;
}

function deletData() {
    db.query("DELETE FROM smokedata WHERE date < NOW() - INTERVAL 7 DAY", (err, result) => {
        console.log(result);
    })
}
router.post('/get', (req, res) => {
    deletData();
    db.query("SELECT * FROM smokedata WHERE username!=? ORDER BY day,startTime DESC", [req.body.username], (err, result) => {
        if (err) { res.send({ error: err, success: false }); }
        const data = JSON.parse(JSON.stringify(result));
        //console.log(data);
        res.send({ success: true, smokeData: JSON.stringify(result) });
    });

});

module.exports = router;