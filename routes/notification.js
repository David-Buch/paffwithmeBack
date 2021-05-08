const express = require('express');
require('dotenv').config();
const webPush = require('web-push');
const router = express.Router();
const db = require('../config/UserDB');

//VapidKeys
const publicVapidKey = process.env.PUBLIC_VAPID_KEY;
const privateVapidKey = process.env.PRIVATE_VAPID_KEY;

//Tell web push about our application server
webPush.setVapidDetails('mailto:dbuchi0802@gmail.com', publicVapidKey, privateVapidKey);

// Set up CORS and allow any host for now to test things out
// WARNING! Don't use `*` in production unless you intend to allow all hosts
router.use(express.json());
router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    return next();
});

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
    console.log(username, endpoint, auth);
    db.query("UPDATE userdata SET endPoint=?, auth=? WHERE username=? LIMIT 1", [endpoint, auth, username], (err, result) => {
        if (err) { res.send({ error: err, success: false }); }
        else {
            console.log('endpoint set worked');
            res.send({ success: true });
        }
    });
}

router.post('/sendtoAll', (req, res) => {
    //Send a push Notification
    const username = req.body.username;
    getSubcriptionsFromDB(username).then(function (pushDatas) {
        let promiseChain = Promise.resolve();
        for (let i = 0; i < pushDatas.length; i++) {
            const pushData = pushDatas[i];
            promiseChain = promiseChain.then(() => {
                return triggerPushMsg(pushData, req.body, res);
            });
        }
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
const triggerPushMsg = function (pushData, dataToSend, res) {
    const pushSubscription = {
        endpoint: pushData.endPoint,
        keys: {
            p256dh: publicVapidKey,
            auth: pushData.auth
        }
    };
    return webpush.sendNotification(pushSubscription, dataToSend).then(() => {
        res.send(JSON.stringify({ success: true }));
    })
        .catch(function (err) {
            res.send(JSON.stringify({
                success: false,
                error: {
                    id: 'unable-to-send-messages',
                    message: `We were unable to send messages to all subscriptions : ` +
                        `'${err.message}'`
                }
            }));
        })
};

module.exports = router;