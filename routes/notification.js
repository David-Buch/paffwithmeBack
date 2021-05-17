const { json } = require('express');
const express = require('express');
require('dotenv').config();
const webPush = require('web-push');
const router = express.Router();
const db = require('../config/UserDB');

router.use(express.json());

//VapidKeys
const publicVapidKey = process.env.PUBLIC_VAPID_KEY;
const privateVapidKey = process.env.PRIVATE_VAPID_KEY;

//Tell web push about our application server
webPush.setVapidDetails('https://smokeapipe.netlify.app', publicVapidKey, privateVapidKey);

// Allow clients to subscribe to this application server for notifications
router.post('/subscribe', (req, res) => {
    if (!isValidSaveRequest(req, res)) {
        return;
    }
    console.log(req.body);
    saveSubscriptionToDatabase(req.body, res);
});
const isValidSaveRequest = (req, res) => {
    // Check the request body has at least an endpoint.
    if (!req.body.subscription.endpoint) {
        // Not a valid subscription.
        res.status(400);
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({
            error: {
                id: 'no-endpoint',
                message: 'Subscription must have an endpoint.'
            }
        }));
        return false;
    }
    return true;
};
function saveSubscriptionToDatabase(req, res) {
    const username = req.username;
    //const endpoint = req.endpoint;
    //const auth = req.authKey;
    const subscription = JSON.stringify(req.subscription);
    return db.query("UPDATE userdata SET subscription=? WHERE username=? LIMIT 1", [subscription, username], (err, result) => {
        console.log(result);
        console.log(subscription);
        if (err) { res.send({ error: err, success: false }); }
        if (result.affectedRows != 0) {
            if (result.changedRows != 0) {
                res.send({ success: true });
            }
            else {
                res.send({ success: true, message: 'subcription already set' });
            }
        }
        else {
            console.log('user doesnt exist');
            res.send({ success: false, message: 'user doesnt exist' });
        }
    });
}
//Send a push Notification
router.post('/sendtoAll', (req, res) => {
    const username = req.body.username;
    const payload = JSON.stringify({
        username: username,
        location: req.body.location
    });
    return getSubcriptionsFromDB(username)
        .then(function (subscriptions) {
            let promiseChain = Promise.resolve();
            for (let i = 0; i < subscriptions.length; i++) {
                const subscription = subscriptions[i];
                subObjct = JSON.parse(subscription['subscription'])
                if (subObjct.endPoint != '') {
                    promiseChain = promiseChain.then(() => {
                        return triggerPushMsg(subObjct, payload);
                    });
                }
            }
            return promiseChain;
        }).then(() => {
            res.send({ success: true });
        })
        .catch(function (err) {
            res.status(500);
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({
                error: {
                    id: 'unable-to-send-messages',
                    message: `We were unable to send messages to all subscriptions : ` +
                        `'${err.message}'`
                }
            }));
        });
});
function getSubcriptionsFromDB(username) {
    return new Promise(function (resolve, reject) {
        db.query("SELECT subscription FROM userdata WHERE username!=?", [username], (err, result) => {
            //console.log((JSON.parse(JSON.stringify(result))));
            if (!err) resolve(JSON.parse(JSON.stringify(result)));
            else reject(err);
        });
    });
}
const triggerPushMsg = function (subcription, dataToSend) {

    return webPush.sendNotification(subcription).then(console.log('push send')) //works without payload
        .catch((err) => {
            console.log(err);
            if (err.statusCode === 404 || err.statusCode === 410) {
                console.log('Subscription has expired or is no longer valid: ', err);
                //return deleteSubscriptionFromDatabase(subscription._id);
            } else {
                throw err;
            }
        });
};

module.exports = router;