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
webPush.setVapidDetails('mailto:dbuchi0802@gmail.com', publicVapidKey, privateVapidKey);

// Allow clients to subscribe to this application server for notifications
router.post('/subscribe', (req, res) => {
    if (isValidSaveRequest(req, res)) {
        console.log(req.body);
        saveSubscriptionToDatabase(req.body, res)
    }

});

const isValidSaveRequest = (req, res) => {
    // Check the request body has at least an endpoint.
    if (!req.body || !req.body.endpoint) {
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
    const endpoint = req.endpoint;
    const auth = req.authKey;

    db.query("UPDATE userdata SET endPoint=?, auth=? WHERE username=? LIMIT 1", [endpoint, auth, username], (err, result) => {
        if (err) { res.send({ error: err, success: false }); }
        if (result.affectedRows != 0) {
            if (result.changedRows != 0) {
                console.log('endpoint set worked');
                res.send({ success: true });
            }
            else {
                console.log('endpoint already set');
                res.send({ success: true, message: 'endpoint already set' });
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
    const payload = username + ' smoked a pipe at: ' + req.body.location;
    console.log(payload);

    getSubcriptionsFromDB(username).then(function (pushDatas) {
        let promiseChain = Promise.resolve();
        for (let i = 0; i < pushDatas.length; i++) {
            const pushData = pushDatas[i];
            if (pushData.endPoint != '') {
                promiseChain = promiseChain.then(() => {
                    return triggerPushMsg(pushData, payload);
                });
            }
        }
        console.log(promiseChain);
        return promiseChain;
    }).
        then(() => {
            res.send({ success: true });
        })
        .catch(function (err) {
            console.log(err);
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
        db.query("SELECT endPoint,auth FROM userdata WHERE username!=?", [username], (err, result) => {
            //console.log((JSON.parse(JSON.stringify(result))));
            if (!err) resolve(JSON.parse(JSON.stringify(result)));
            else reject(err);
        });
    });
}
const triggerPushMsg = function (pushData, dataToSend) {
    //"message": "We were unable to send messages to all subscriptions : 
    //'To send a message with a payload, the subscription must have 'auth' and 'p256dh' keys.'"
    const pushSubscription = {
        endpoint: pushData.endPoint,
        keys: {
            p256dh: publicVapidKey,
            auth: pushData.auth
        }
    };

    console.log(pushSubscription);
    return webPush.sendNotification(pushSubscription, dataToSend).then(console.log('push send'))
        .catch((err) => {
            console.log(err);
            if (err.statusCode === 404 || err.statusCode === 410) {
                console.log('Subscription has expired or is no longer valid: ', err);
                //return deleteSubscriptionFromDatabase(subscription._id);
            } else {
                throw new Error(err);
            }
        });
};

module.exports = router;