const express = require('express');
require('dotenv').config();
const router = express.Router();
const db = require('../config/UserDB');
const moment = require('moment');


router.use(express.json());
router.post('/send', (req, res) => {
    const username = req.body.username.toLowerCase();
    const startTime = req.body.startTime;
    const endTime = req.body.endTime;
    const location = req.body.location;
    const color = req.body.color;
    const day = new Date().toLocaleDateString('de-DE');

    const now = new Date();// now 
    const start = new Date();
    now.setTime(now.getTime() - now.getTimezoneOffset() * 60 * 1000);
    start.setUTCHours(parseInt(startTime.split(':')[0], 10), parseInt(startTime.split(':')[1], 10));

    const milsUntilStart = getStartDuration(now.getTime(), start.getTime());
    const smokingDuration = getDuration(moment(startTime, 'HH:mm'), moment(endTime, 'HH:mm'));

    db.query("SELECT * FROM smokedata WHERE username=? AND startTime=? AND day=? LIMIT 1", [username, startTime, day], (err, result) => {
        if (err) { res.send({ error: err, success: false }); }
        else {
            if (result.length > 0) {
                console.log('Smokedata already exists');
                res.send({ message: 'Smokedata already exists!', success: false })
            }
            else {
                db.query("INSERT INTO smokedata (username,date,color,currentlySmoking,day,startTime,endTime,location) VALUES (?,NOW(),?,?,?,?,?,?)",
                    [username, color, false, day, startTime, endTime, location], (err, result) => {
                        if (err) { res.send({ error: err, success: false }); }
                        else {
                            res.send({ success: true, untilStart: (milsUntilStart / (1000 * 60)), somikingDuration: (smokingDuration / (1000 * 60)) });
                            setTimeout(function () {
                                changeDB(username, startTime, true);
                                setTimeout(function () {
                                    changeDB(username, startTime, false);
                                }, smokingDuration);
                            }
                                , milsUntilStart);
                        }
                    });
            }
        }

    });
});
function changeDB(username, startTime, value) {
    db.query("UPDATE smokedata SET currentlySmoking=? WHERE username=? AND startTime=? LIMIT 1",
        [value, username, startTime], (err, result) => {
            if (err) { console.log('Error' + err); }
        });
    console.log('worked')
}
function getStartDuration(now, then) {
    var diff = then - now;
    return diff;
}
function getDuration(startTime, endTime) {
    var diff;
    diff = moment.duration(moment(endTime, 'HH:mm').diff(moment(startTime, 'HH:mm')));
    if (diff < 0) {
        diff = moment.duration(moment(startTime, 'HH:mm').diff(moment(endTime, 'HH:mm').add(24, 'hours')));
    }
    return Math.abs(diff);
}
function deletData() {
    db.query("DELETE FROM smokedata WHERE date < NOW() - INTERVAL 7 DAY", (err, result) => {
        console.log(result);
    })
}
router.post('/get', (req, res) => {
    deletData();
    db.query("SELECT * FROM smokedata WHERE username!=? ORDER BY id DESC,startTime DESC", [req.body.username], (err, result) => {
        if (err) { res.send({ error: err, success: false }); }
        const data = JSON.parse(JSON.stringify(result));
        //console.log(data);
        res.send({ success: true, smokeData: JSON.stringify(result) });
    });

});
router.post('/getLive', (req, res) => {
    const username = req.body.username;
    db.query("SELECT currentlySmoking FROM smokedata WHERE username=? ORDER BY id DESC LIMIT 1", [username], (err, result) => {
        if (err) { res.send({ error: err, success: false }); }
        res.send({ success: true, currentlySmoking: result[0].currentlySmoking });
    })
});

module.exports = router;