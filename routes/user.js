const express = require('express');
const router = express.Router();
const db = require('../config/UserDB');
const bcrypt = require('bcrypt');
const saltRounds = 10;


router.use(express.json());

router.post('/register', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    username.toLowerCase();

    db.query("SELECT * FROM userdata WHERE username=? LIMIT 1",
        [username], (err, result) => {
            if (err) { res.send({ error: err, success: false }); }
            else {
                if (result.length > 0) {
                    console.log('User Exists');
                    res.send({ message: 'User already Exists!', success: false })
                }
                else {
                    bcrypt.hash(password, saltRounds, (err, hash) => {
                        if (err) { res.send({ error: err, success: false }); }
                        else {
                            db.query("INSERT INTO userdata (username,password) VALUES (?,?)",
                                [username, hash], (err, result) => {
                                    if (err) { res.send({ error: err, success: false }); }
                                    else {
                                        console.log('Success');
                                        res.send({ success: true });
                                    }
                                });
                        }
                    })
                }
            }
        });
});

router.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    username.toLowerCase();
    db.query("SELECT * FROM userdata WHERE username=? LIMIT 1",
        [username], (err, result) => {
            if (err) { res.send({ error: err, success: false }); }
            else {
                if (result.length > 0) {
                    bcrypt.compare(password, result[0].password, (error, response) => {
                        if (response) {
                            //req.session.user = result[0].username;
                            //console.log(req.session.user);
                            res.send({ username: result[0].username, success: true });
                        }
                        else {
                            console.log('not worked1');
                            res.send({ message: "Wrong Username/Password combination", success: false });
                        }
                    })
                }
                else {
                    console.log('not worked1');
                    res.send({ message: 'User doesnt exist', success: false });
                }
            }
        });
});

router.get('/login', (req, res) => {
    console.log(req.session.user);
    if (req.session.user) {
        res.send({ success: true, username: req.session.user })
    }
    else {
        res.send({ success: false, message: 'User not logged in!' })
    }
});

router.post('/logout', (req, res) => {
    const username = req.body.username
    if (req.session.user == username) {
        req.session.user = null;
        res.send({ success: true, message: 'User was logged out' })
    }
    else {
        res.send({ success: false, message: 'User loggedIn and User stored do not match!' })
    }
})
module.exports = router;